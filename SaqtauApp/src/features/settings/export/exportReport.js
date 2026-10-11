import { Inter_400Regular } from '@expo-google-fonts/inter';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { buildReportHtml } from './report.html.js';
import { REPORT_MESSAGES } from './report.messages';

let fontPromise;
async function reportFonts() {
  if (!fontPromise) {
    fontPromise = Promise.all([require('@/assets/fonts/report/OpenSans-Regular.ttf'), require('@/assets/fonts/report/OpenSans-SemiBold.ttf'), require('@/assets/fonts/report/OpenSans-Bold.ttf'), Inter_400Regular].map(async (module) => {
      const asset = Asset.fromModule(module);
      await asset.downloadAsync();
      if (!asset.localUri) throw new Error('Font asset is unavailable');
      return FileSystem.readAsStringAsync(asset.localUri, { encoding: FileSystem.EncodingType.Base64 });
    })).then(([regular, semibold, bold, footer]) => ({ regular, semibold, bold, footer })).catch((error) => {
      fontPromise = undefined; // Allow a subsequent export to retry asset loading.
      throw error;
    });
  }
  return fontPromise;
}

/** Both settings screens use the same local PDF export; no additional server upload. */
export async function exportMeasurementReport(data, { language = 'en' } = {}) {
  const t = REPORT_MESSAGES[language] || REPORT_MESSAGES.en;
  if (!(await Sharing.isAvailableAsync())) throw new Error(t.shareUnavailable);
  const fonts = await reportFonts();
  const html = buildReportHtml(data, { language, fonts });
  const result = await Print.printToFileAsync({
    html,
    width: 595.92,
    height: 842.88,
    margins: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  const directory = `${FileSystem.cacheDirectory}saqtau-reports/`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  // Remove only our stale reports. Keep recent files available to share-sheet consumers.
  try {
    const names = await FileSystem.readDirectoryAsync(directory);
    await Promise.all(names.filter((name) => /^SaqtauAI-report-.*\.pdf$/.test(name)).map(async (name) => {
      const uri = `${directory}${name}`;
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists && info.modificationTime && Date.now() / 1000 - info.modificationTime > 86400) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      }
    }));
  } catch { /* Cache cleanup must not interrupt a successful export. */ }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const uri = `${directory}SaqtauAI-report-${stamp}-${Math.random().toString(36).slice(2, 8)}.pdf`;
  await FileSystem.moveAsync({ from: result.uri, to: uri });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: t.title });
  return uri;
}
