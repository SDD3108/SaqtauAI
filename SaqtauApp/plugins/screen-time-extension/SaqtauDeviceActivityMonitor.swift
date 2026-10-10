import DeviceActivity
import FamilyControls
import Foundation
import ManagedSettings

private enum SaqtauMonitorShared {
  static let appGroupID = "group.com.sd3108.Saqtau-AI.screentime"
  static let selectionKey = "saqtau.screenTime.selection"
  static let dailyStore = ManagedSettingsStore(named: .init("saqtau.daily-limit"))
  static let quietStore = ManagedSettingsStore(named: .init("saqtau.quiet-hours"))

  static var defaults: UserDefaults {
    UserDefaults(suiteName: appGroupID) ?? .standard
  }

  static func selection() -> FamilyActivitySelection {
    guard
      let data = defaults.data(forKey: selectionKey),
      let value = try? PropertyListDecoder().decode(FamilyActivitySelection.self, from: data)
    else {
      return FamilyActivitySelection()
    }
    return value
  }

  static func apply(_ store: ManagedSettingsStore) {
    let value = selection()

    store.shield.applications = value.applicationTokens.isEmpty
      ? nil
      : value.applicationTokens
    store.shield.webDomains = value.webDomainTokens.isEmpty
      ? nil
      : value.webDomainTokens

    if value.categoryTokens.isEmpty {
      store.shield.applicationCategories = nil
      store.shield.webDomainCategories = nil
    } else {
      store.shield.applicationCategories = .specific(value.categoryTokens)
      store.shield.webDomainCategories = .specific(value.categoryTokens)
    }
  }
}

private extension DeviceActivityName {
  static let saqtauDaily = Self("saqtau.daily")
  static let saqtauQuiet = Self("saqtau.quiet")
}

private extension DeviceActivityEvent.Name {
  static let saqtauDailyLimit = Self("saqtau.daily.limit")
}

final class SaqtauDeviceActivityMonitor: DeviceActivityMonitor {
  override func intervalDidStart(for activity: DeviceActivityName) {
    super.intervalDidStart(for: activity)

    if activity == .saqtauDaily {
      SaqtauMonitorShared.dailyStore.clearAllSettings()
      return
    }

    if activity == .saqtauQuiet {
      SaqtauMonitorShared.apply(SaqtauMonitorShared.quietStore)
    }
  }

  override func intervalDidEnd(for activity: DeviceActivityName) {
    super.intervalDidEnd(for: activity)

    if activity == .saqtauDaily {
      SaqtauMonitorShared.dailyStore.clearAllSettings()
      return
    }

    if activity == .saqtauQuiet {
      SaqtauMonitorShared.quietStore.clearAllSettings()
    }
  }

  override func eventDidReachThreshold(
    _ event: DeviceActivityEvent.Name,
    activity: DeviceActivityName
  ) {
    super.eventDidReachThreshold(event, activity: activity)

    guard activity == .saqtauDaily, event == .saqtauDailyLimit else { return }
    SaqtauMonitorShared.apply(SaqtauMonitorShared.dailyStore)
  }
}
