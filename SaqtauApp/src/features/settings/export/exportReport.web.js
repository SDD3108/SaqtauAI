import { Asset } from 'expo-asset';
import { Inter_400Regular } from '@expo-google-fonts/inter';
import { buildReportHtml } from './report.html.js';

/** Browser fallback: the system print dialog offers Save as PDF. */
export async function exportMeasurementReport(data, { language = 'en' } = {}) {
  const assets = [require('@/assets/fonts/report/OpenSans-Regular.ttf'), require('@/assets/fonts/report/OpenSans-SemiBold.ttf'), require('@/assets/fonts/report/OpenSans-Bold.ttf'), Inter_400Regular];
  const encoded = await Promise.all(assets.map(async (module) => {
    const response = await fetch(Asset.fromModule(module).uri);
    if (!response.ok) throw new Error('Report font is unavailable');
    const bytes = new Uint8Array(await response.arrayBuffer());
    return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''));
  }));
  const [regular, semibold, bold, footer] = encoded;
  const fonts = { regular, semibold, bold, footer };
  const frame = document.createElement('iframe');
  frame.title = 'SaqtauAI PDF';
  frame.style.cssText = 'position:fixed;width:1px;height:1px;left:-9999px;border:0';
  document.body.appendChild(frame);
  const cleanup = () => frame.remove();
  try {
    const target = frame.contentDocument;
    target.open();
    target.write(buildReportHtml(data, { language, fonts }));
    target.close();
    await target.fonts.ready;
    frame.contentWindow.addEventListener('afterprint', cleanup, { once: true });
    frame.contentWindow.focus();
    frame.contentWindow.print();
    // Do not tear down while the print dialog is still consuming the document.
    setTimeout(cleanup, 300000);
  } catch (error) {
    cleanup();
    throw error;
  }
}
