import DeviceActivity
import ExpoModulesCore
import FamilyControls
import Foundation
import ManagedSettings
import SwiftUI
import UIKit

public final class SaqtauScreenTimeModule: Module {
  private let center = DeviceActivityCenter()
  private let dailyStore = ManagedSettingsStore(named: SaqtauScreenTimeShared.dailyStoreName)
  private let quietStore = ManagedSettingsStore(named: SaqtauScreenTimeShared.quietStoreName)

  public func definition() -> ModuleDefinition {
    Name("SaqtauScreenTime")

    AsyncFunction("getStatus") {
      return self.statusPayload()
    }

    AsyncFunction("requestAuthorization") { (mode: String, promise: Promise) in
      let member: FamilyControlsMember = mode == "child" ? .child : .individual
      Task { @MainActor in
        do {
          try await AuthorizationCenter.shared.requestAuthorization(for: member)
          SaqtauScreenTimeShared.defaults.set(
            mode,
            forKey: "saqtau.screenTime.authorizationMode"
          )
          promise.resolve(self.statusPayload())
        } catch {
          promise.reject(error)
        }
      }
    }

    AsyncFunction("presentPicker") { (promise: Promise) in
      let status = self.authorizationStatusString()
      guard status.lowercased().contains("approved") else {
        promise.reject(SaqtauScreenTimeError.notAuthorized)
        return
      }

      guard let presenter = self.topViewController() else {
        promise.reject(SaqtauScreenTimeError.noViewController)
        return
      }

      var host: UIViewController?
      let view = SaqtauScreenTimePickerView(
        selection: SaqtauScreenTimeShared.loadSelection(),
        onSave: { selection in
          do {
            try SaqtauScreenTimeShared.saveSelection(selection)
            host?.dismiss(animated: true) {
              promise.resolve(self.statusPayload())
            }
          } catch {
            host?.dismiss(animated: true) {
              promise.reject(error)
            }
          }
        },
        onCancel: {
          host?.dismiss(animated: true) {
            promise.resolve(self.statusPayload())
          }
        }
      )

      let controller = UIHostingController(rootView: view)
      controller.modalPresentationStyle = .pageSheet
      host = controller
      presenter.present(controller, animated: true)
    }.runOnQueue(.main)

    AsyncFunction("configurePolicy") {
      (
        dailyLimitMinutes: Int,
        quietEnabled: Bool,
        quietFrom: String,
        quietTo: String
      ) in
      guard self.authorizationStatusString().lowercased().contains("approved") else {
        throw SaqtauScreenTimeError.notAuthorized
      }

      guard (1...1440).contains(dailyLimitMinutes) else {
        throw SaqtauScreenTimeError.invalidDailyLimit
      }

      let selection = SaqtauScreenTimeShared.loadSelection()
      let summary = SaqtauScreenTimeShared.selectionSummary(selection)
      guard (summary["total"] ?? 0) > 0 else {
        throw SaqtauScreenTimeError.emptySelection
      }

      guard
        let quietStart = self.clockComponents(quietFrom),
        let quietEnd = self.clockComponents(quietTo)
      else {
        throw SaqtauScreenTimeError.invalidQuietHours
      }

      let policy = SaqtauScreenTimePolicy(
        dailyLimitMinutes: dailyLimitMinutes,
        quietEnabled: quietEnabled,
        quietFrom: quietFrom,
        quietTo: quietTo
      )

      self.stopSaqtauMonitoring()
      SaqtauScreenTimeShared.clearShield(self.dailyStore)
      SaqtauScreenTimeShared.clearShield(self.quietStore)

      let dailySchedule = DeviceActivitySchedule(
        intervalStart: DateComponents(hour: 0, minute: 0),
        intervalEnd: DateComponents(hour: 23, minute: 59, second: 59),
        repeats: true
      )
      let dailyEvent = DeviceActivityEvent(
        applications: selection.applicationTokens,
        categories: selection.categoryTokens,
        webDomains: selection.webDomainTokens,
        threshold: DateComponents(minute: dailyLimitMinutes)
      )
      try self.center.startMonitoring(
        .saqtauDaily,
        during: dailySchedule,
        events: [.saqtauDailyLimit: dailyEvent]
      )

      if quietEnabled {
        try self.startQuietHours(from: quietStart, to: quietEnd)
        if self.isNowInsideQuietHours(from: quietStart, to: quietEnd) {
          SaqtauScreenTimeShared.applyShield(to: self.quietStore, selection: selection)
        }
      }

      SaqtauScreenTimeShared.savePolicy(policy)
      return self.statusPayload()
    }

    AsyncFunction("clearPolicy") {
      self.stopSaqtauMonitoring()
      SaqtauScreenTimeShared.clearShield(self.dailyStore)
      SaqtauScreenTimeShared.clearShield(self.quietStore)
      SaqtauScreenTimeShared.clearPolicyStorage()
      return self.statusPayload()
    }

    AsyncFunction("clearSelection") {
      self.stopSaqtauMonitoring()
      SaqtauScreenTimeShared.clearShield(self.dailyStore)
      SaqtauScreenTimeShared.clearShield(self.quietStore)
      SaqtauScreenTimeShared.clearSelection()
      SaqtauScreenTimeShared.clearPolicyStorage()
      return self.statusPayload()
    }
  }

  private func statusPayload() -> [String: Any] {
    let selection = SaqtauScreenTimeShared.loadSelection()
    let activities = center.activities.map(\.rawValue)
    let policy = SaqtauScreenTimeShared.loadPolicy()

    var payload: [String: Any] = [
      "available": true,
      "authorizationStatus": authorizationStatusString(),
      "monitoring": !activities.isEmpty,
      "activities": activities,
      "selection": SaqtauScreenTimeShared.selectionSummary(selection),
    ]

    if let mode = SaqtauScreenTimeShared.defaults.string(
      forKey: "saqtau.screenTime.authorizationMode"
    ) {
      payload["authorizationMode"] = mode
    } else {
      payload["authorizationMode"] = NSNull()
    }

    if let policy {
      payload["policy"] = policy.dictionary
    } else {
      payload["policy"] = NSNull()
    }

    return payload
  }

  private func authorizationStatusString() -> String {
    switch AuthorizationCenter.shared.authorizationStatus {
    case .notDetermined:
      return "notDetermined"
    case .denied:
      return "denied"
    case .approved:
      return "approved"
    @unknown default:
      return String(describing: AuthorizationCenter.shared.authorizationStatus)
    }
  }

  private func startQuietHours(
    from start: DateComponents,
    to end: DateComponents
  ) throws {
    guard let startMinutes = minutesSinceMidnight(start),
          let endMinutes = minutesSinceMidnight(end),
          startMinutes != endMinutes
    else {
      throw SaqtauScreenTimeError.invalidQuietHours
    }

    let duration = endMinutes > startMinutes
      ? endMinutes - startMinutes
      : (24 * 60 - startMinutes) + endMinutes
    guard duration >= 15 else {
      throw SaqtauScreenTimeError.quietHoursTooShort
    }

    let schedule = DeviceActivitySchedule(
      intervalStart: start,
      intervalEnd: end,
      repeats: true
    )
    try center.startMonitoring(.saqtauQuiet, during: schedule)
  }

  private func stopSaqtauMonitoring() {
    center.stopMonitoring([.saqtauDaily, .saqtauQuiet])
  }

  private func clockComponents(_ value: String) -> DateComponents? {
    let parts = value.split(separator: ":")
    guard parts.count == 2,
          let hour = Int(parts[0]),
          let minute = Int(parts[1]),
          (0...23).contains(hour),
          (0...59).contains(minute)
    else {
      return nil
    }
    return DateComponents(hour: hour, minute: minute)
  }

  private func minutesSinceMidnight(_ components: DateComponents) -> Int? {
    guard let hour = components.hour, let minute = components.minute else { return nil }
    return hour * 60 + minute
  }

  private func isNowInsideQuietHours(
    from start: DateComponents,
    to end: DateComponents
  ) -> Bool {
    guard let startMinutes = minutesSinceMidnight(start),
          let endMinutes = minutesSinceMidnight(end)
    else {
      return false
    }

    let now = Calendar.current.dateComponents([.hour, .minute], from: Date())
    guard let nowMinutes = minutesSinceMidnight(now) else { return false }

    if startMinutes < endMinutes {
      return nowMinutes >= startMinutes && nowMinutes < endMinutes
    }
    return nowMinutes >= startMinutes || nowMinutes < endMinutes
  }

  private func topViewController(
    base: UIViewController? = UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap { $0.windows }
      .first { $0.isKeyWindow }?
      .rootViewController
  ) -> UIViewController? {
    if let navigation = base as? UINavigationController {
      return topViewController(base: navigation.visibleViewController)
    }
    if let tab = base as? UITabBarController,
       let selected = tab.selectedViewController {
      return topViewController(base: selected)
    }
    if let presented = base?.presentedViewController {
      return topViewController(base: presented)
    }
    return base
  }
}

enum SaqtauScreenTimeError: Error, LocalizedError {
  case notAuthorized
  case invalidDailyLimit
  case emptySelection
  case invalidQuietHours
  case quietHoursTooShort
  case noViewController

  var errorDescription: String? {
    switch self {
    case .notAuthorized:
      return "Apple Screen Time is not authorized."
    case .invalidDailyLimit:
      return "Daily limit must be between 1 and 1440 minutes."
    case .emptySelection:
      return "Choose at least one app, category or website first."
    case .invalidQuietHours:
      return "Quiet hours must use valid, different HH:mm times."
    case .quietHoursTooShort:
      return "Apple Device Activity schedules must be at least 15 minutes long."
    case .noViewController:
      return "Could not present the Apple Family Activity picker."
    }
  }
}
