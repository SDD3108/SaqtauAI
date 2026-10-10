import DeviceActivity
import FamilyControls
import Foundation
import ManagedSettings

struct SaqtauScreenTimePolicy {
  let dailyLimitMinutes: Int
  let quietEnabled: Bool
  let quietFrom: String
  let quietTo: String

  var dictionary: [String: Any] {
    [
      "dailyLimitMinutes": dailyLimitMinutes,
      "quietHours": [
        "enabled": quietEnabled,
        "from": quietFrom,
        "to": quietTo,
      ],
    ]
  }
}

enum SaqtauScreenTimeShared {
  static let appGroupID = "group.com.sd3108.Saqtau-AI.screentime"
  static let selectionKey = "saqtau.screenTime.selection"
  static let dailyLimitKey = "saqtau.screenTime.dailyLimitMinutes"
  static let quietEnabledKey = "saqtau.screenTime.quietEnabled"
  static let quietFromKey = "saqtau.screenTime.quietFrom"
  static let quietToKey = "saqtau.screenTime.quietTo"

  static let dailyStoreName = ManagedSettingsStore.Name("saqtau.daily-limit")
  static let quietStoreName = ManagedSettingsStore.Name("saqtau.quiet-hours")

  static var defaults: UserDefaults {
    UserDefaults(suiteName: appGroupID) ?? .standard
  }

  static func saveSelection(_ selection: FamilyActivitySelection) throws {
    let data = try PropertyListEncoder().encode(selection)
    defaults.set(data, forKey: selectionKey)
  }

  static func loadSelection() -> FamilyActivitySelection {
    guard
      let data = defaults.data(forKey: selectionKey),
      let selection = try? PropertyListDecoder().decode(FamilyActivitySelection.self, from: data)
    else {
      return FamilyActivitySelection()
    }
    return selection
  }

  static func clearSelection() {
    defaults.removeObject(forKey: selectionKey)
  }

  static func selectionSummary(_ selection: FamilyActivitySelection? = nil) -> [String: Int] {
    let value = selection ?? loadSelection()
    let applications = value.applicationTokens.count
    let categories = value.categoryTokens.count
    let webDomains = value.webDomainTokens.count

    return [
      "applications": applications,
      "categories": categories,
      "webDomains": webDomains,
      "total": applications + categories + webDomains,
    ]
  }

  static func savePolicy(_ policy: SaqtauScreenTimePolicy) {
    defaults.set(policy.dailyLimitMinutes, forKey: dailyLimitKey)
    defaults.set(policy.quietEnabled, forKey: quietEnabledKey)
    defaults.set(policy.quietFrom, forKey: quietFromKey)
    defaults.set(policy.quietTo, forKey: quietToKey)
  }

  static func loadPolicy() -> SaqtauScreenTimePolicy? {
    let limit = defaults.integer(forKey: dailyLimitKey)
    guard limit > 0 else { return nil }

    return SaqtauScreenTimePolicy(
      dailyLimitMinutes: limit,
      quietEnabled: defaults.bool(forKey: quietEnabledKey),
      quietFrom: defaults.string(forKey: quietFromKey) ?? "22:00",
      quietTo: defaults.string(forKey: quietToKey) ?? "07:00"
    )
  }

  static func clearPolicyStorage() {
    defaults.removeObject(forKey: dailyLimitKey)
    defaults.removeObject(forKey: quietEnabledKey)
    defaults.removeObject(forKey: quietFromKey)
    defaults.removeObject(forKey: quietToKey)
  }

  static func applyShield(
    to store: ManagedSettingsStore,
    selection: FamilyActivitySelection? = nil
  ) {
    let value = selection ?? loadSelection()

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

  static func clearShield(_ store: ManagedSettingsStore) {
    store.clearAllSettings()
  }
}

extension DeviceActivityName {
  static let saqtauDaily = Self("saqtau.daily")
  static let saqtauQuiet = Self("saqtau.quiet")
}

extension DeviceActivityEvent.Name {
  static let saqtauDailyLimit = Self("saqtau.daily.limit")
}
