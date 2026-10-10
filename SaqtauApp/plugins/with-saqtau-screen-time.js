const {
  createRunOncePlugin,
  withDangerousMod,
  withEntitlementsPlist,
  withXcodeProject,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PLUGIN_NAME = 'with-saqtau-screen-time';
const PLUGIN_VERSION = '1.0.0';
const TARGET_NAME = 'SaqtauScreenTimeMonitor';
const BUNDLE_ID = 'com.sd3108.Saqtau-AI.ScreenTimeMonitor';
const APP_GROUP = 'group.com.sd3108.Saqtau-AI.screentime';

function stripQuotes(value) {
  return String(value || '').replace(/^"|"$/g, '');
}

function hasNativeTarget(project, name) {
  const section = project.pbxNativeTargetSection();
  return Object.entries(section).some(([key, value]) => {
    if (key.endsWith('_comment') || !value || typeof value !== 'object') return false;
    return stripQuotes(value.name) === name || stripQuotes(value.productName) === name;
  });
}

function mergeAppExtensionDeclaration(config) {
  config.extra = config.extra || {};
  config.extra.eas = config.extra.eas || {};
  config.extra.eas.build = config.extra.eas.build || {};
  config.extra.eas.build.experimental = config.extra.eas.build.experimental || {};
  config.extra.eas.build.experimental.ios =
    config.extra.eas.build.experimental.ios || {};

  const ios = config.extra.eas.build.experimental.ios;
  const current = Array.isArray(ios.appExtensions) ? ios.appExtensions : [];
  const extension = {
    targetName: TARGET_NAME,
    bundleIdentifier: BUNDLE_ID,
    entitlements: {
      'com.apple.developer.family-controls': true,
      'com.apple.security.application-groups': [APP_GROUP],
    },
  };

  ios.appExtensions = [
    ...current.filter((item) => item?.targetName !== TARGET_NAME),
    extension,
  ];

  return config;
}

function withMainEntitlements(config) {
  return withEntitlementsPlist(config, (cfg) => {
    cfg.modResults['com.apple.developer.family-controls'] = true;

    const groups = Array.isArray(
      cfg.modResults['com.apple.security.application-groups'],
    )
      ? cfg.modResults['com.apple.security.application-groups']
      : [];

    cfg.modResults['com.apple.security.application-groups'] = Array.from(
      new Set([...groups, APP_GROUP]),
    );

    return cfg;
  });
}

function withExtensionFiles(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const iosRoot = cfg.modRequest.platformProjectRoot;
      const destination = path.join(iosRoot, TARGET_NAME);
      const source = path.join(__dirname, 'screen-time-extension');

      fs.mkdirSync(destination, { recursive: true });
      for (const filename of [
        'SaqtauDeviceActivityMonitor.swift',
        'Info.plist',
        'SaqtauScreenTimeMonitor.entitlements',
      ]) {
        fs.copyFileSync(path.join(source, filename), path.join(destination, filename));
      }

      return cfg;
    },
  ]);
}

function withExtensionTarget(config) {
  return withXcodeProject(config, (cfg) => {
    const project = cfg.modResults;

    if (hasNativeTarget(project, TARGET_NAME)) {
      return cfg;
    }

    project.hash.project.objects.PBXTargetDependency =
      project.hash.project.objects.PBXTargetDependency || {};
    project.hash.project.objects.PBXContainerItemProxy =
      project.hash.project.objects.PBXContainerItemProxy || {};

    const target = project.addTarget(TARGET_NAME, 'app_extension', TARGET_NAME);
    project.addBuildPhase([], 'PBXSourcesBuildPhase', 'Sources', target.uuid);

    const groupKey = project.pbxCreateGroup(TARGET_NAME, TARGET_NAME);
    project.addFile(`${TARGET_NAME}/Info.plist`, groupKey);
    project.addFile(`${TARGET_NAME}/SaqtauScreenTimeMonitor.entitlements`, groupKey);
    project.addSourceFile(
      `${TARGET_NAME}/SaqtauDeviceActivityMonitor.swift`,
      { target: target.uuid },
      groupKey,
    );

    const configurations = project.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      const buildSettings = configurations[key]?.buildSettings;
      if (!buildSettings) continue;

      if (stripQuotes(buildSettings.PRODUCT_NAME) === TARGET_NAME) {
        buildSettings.APPLICATION_EXTENSION_API_ONLY = 'YES';
        buildSettings.CLANG_ENABLE_MODULES = 'YES';
        buildSettings.CODE_SIGN_ENTITLEMENTS = `"${TARGET_NAME}/SaqtauScreenTimeMonitor.entitlements"`;
        buildSettings.CODE_SIGN_STYLE = 'Automatic';
        buildSettings.CURRENT_PROJECT_VERSION = `"${cfg.ios?.buildNumber || '1'}"`;
        buildSettings.GENERATE_INFOPLIST_FILE = 'NO';
        buildSettings.INFOPLIST_FILE = `"${TARGET_NAME}/Info.plist"`;
        buildSettings.IPHONEOS_DEPLOYMENT_TARGET = '18.0';
        buildSettings.MARKETING_VERSION = `"${cfg.version || '1.0.0'}"`;
        buildSettings.PRODUCT_BUNDLE_IDENTIFIER = `"${BUNDLE_ID}"`;
        buildSettings.SKIP_INSTALL = 'YES';
        buildSettings.SWIFT_VERSION = '5.0';
        buildSettings.TARGETED_DEVICE_FAMILY = '"1,2"';

        if (cfg.ios?.appleTeamId) {
          buildSettings.DEVELOPMENT_TEAM = `"${cfg.ios.appleTeamId}"`;
        }
      }
    }

    return cfg;
  });
}

function withSaqtauScreenTime(config) {
  config = mergeAppExtensionDeclaration(config);
  config = withMainEntitlements(config);
  config = withExtensionFiles(config);
  config = withExtensionTarget(config);
  return config;
}

module.exports = createRunOncePlugin(
  withSaqtauScreenTime,
  PLUGIN_NAME,
  PLUGIN_VERSION,
);
