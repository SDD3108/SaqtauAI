const { withAndroidManifest } = require('expo/config-plugins');

// Android-only: this app uses audio while open, not a background media service.
// Keep this plugin LAST so expo-audio cannot re-add its media service afterward.
const blockedPermissions = [
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
  'android.permission.ACTIVITY_RECOGNITION',
];
const audioService = 'expo.modules.audio.service.AudioControlsService';

module.exports = function withSaqtauAndroidPermissions(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    manifest.$ = manifest.$ || {};
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    manifest['uses-permission'] = [
      ...(manifest['uses-permission'] || []).filter(
        (entry) => !blockedPermissions.includes(entry.$?.['android:name']),
      ),
      ...blockedPermissions.map((name) => ({
        $: { 'android:name': name, 'tools:node': 'remove' },
      })),
    ];

    for (const app of manifest.application || []) {
      app.service = [
        ...(app.service || []).filter(
          (entry) => entry.$?.['android:name'] !== audioService,
        ),
        { $: { 'android:name': audioService, 'tools:node': 'remove' } },
      ];
    }
    return config;
  });
};
