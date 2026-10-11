import { REPORT_MESSAGES } from './report.messages';
import { REPORT_CSS } from './report.styles';
import { REPORT_LOGO } from './report.logo';
import { FONT_WIDTHS } from './report.font-metrics';

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
const finite = (value) => typeof value === 'number' && Number.isFinite(value);
const e = escapeHtml;
// Full strings are retained, including long server notes and account names.
function textLines(value, width, size = 8.5, mono = false) {
  const lines = []; let line = '', used = 0;
  for (const char of Array.from(String(value ?? ''))) {
    // Reserve whole CSS pixels for hinted glyph advances on native WebViews.
    const advance = Math.ceil((mono ? 0.6 : FONT_WIDTHS[char] ?? 1) * size * 4 / 3) * 3 / 4;
    if (char === '\n' || (used + advance > width && line)) {
      lines.push(line); line = ''; used = 0;
      if (char === '\n') continue;
    }
    line += char; used += advance;
  }
  if (line || !lines.length) lines.push(line);
  return lines;
}
export function normalizeReport(data = {}) {
  const guest = data.source === 'saqtau-ios-local-guest' || (!data.account && Array.isArray(data.checkins));
  const account = data.account || {};
  const profile = guest ? data.profile || {} : account.profile_data || {};
  const records = Array.isArray(data.measurements) ? data.measurements : Array.isArray(data.checkins) ? data.checkins : [];
  // Follow the source order, as in the reference export.
  const measurements = records.filter((item) => item && typeof item === 'object').map((item) => ({ ...item }));
  return { guest, account, profile, measurements, exportedAt: data.exported_at };
}

export function buildReportHtml(data, { language = 'en', now = new Date(), fonts = {} } = {}) {
  const lang = REPORT_MESSAGES[language] ? language : 'en';
  const t = REPORT_MESSAGES[lang];
  const { account, profile, measurements, guest, exportedAt: rawDate } = normalizeReport(data);
  const exportedAt = Number.isFinite(Date.parse(rawDate)) ? new Date(rawDate) : new Date(now);
  const number = (value, digits = 1) => finite(value) ? String(Number(value.toFixed(digits))) : t.noData;
  const unit = (value, suffix, digits = 1) => finite(value) ? `${number(value, digits)} ${suffix}` : t.noData;
  const percent = (value) => finite(value) ? `${number(value * 100, 0)}%` : t.noData;
  const date = (value, time = false) => {
    if (!value || !Number.isFinite(Date.parse(value))) return t.noData;
    const d = new Date(value), pad = (v) => String(v).padStart(2, '0');
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}${time ? ` ${pad(d.getHours())}:${pad(d.getMinutes())}` : ''}`;
  };
  const birthParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(profile.dateOfBirth || '');
  const birth = birthParts ? new Date(+birthParts[1], +birthParts[2] - 1, +birthParts[3], 12) : null;
  const validBirth = birth && birth.getFullYear() === +birthParts[1] && birth.getMonth() === +birthParts[2] - 1 && birth.getDate() === +birthParts[3] && birth <= exportedAt;
  let age = validBirth ? exportedAt.getFullYear() - birth.getFullYear() : null;
  if (validBirth && (exportedAt.getMonth() < birth.getMonth() || (exportedAt.getMonth() === birth.getMonth() && exportedAt.getDate() < birth.getDate()))) age -= 1;
  const level = (value) => ({ low: t.low, medium: t.medium, moderate: t.medium, high: t.high })[value] || t.noData;
  const status = (value) => ({ completed: t.completed, failed: t.failed, error: t.failed, pending: t.pending, processing: t.pending })[value] || value || t.noData;

  // The reference uses continuous flow. Paginate that flow in points, with
  // repeated table headers and fixed page numbers; no browser JS is required.
  const pages = [{ blocks: [], cursor: 40.5 }];
  const bottom = 797.25;
  const current = () => pages[pages.length - 1];
  const nextPage = () => pages.push({ blocks: [], cursor: 40.5 });
  const add = (html, height, gap = 0, keepNext = 0) => {
    if (current().cursor + gap + height + keepNext > bottom && current().blocks.length) { nextPage(); gap = 0; }
    const top = current().cursor + gap;
    current().blocks.push({ html, top, height });
    current().cursor = top + height;
  };
  const heading = (label, small = false, gap = 0, keepNext = 0) => add(`<${small ? 'h3' : 'h2'}>${e(label)}</${small ? 'h3' : 'h2'}>`, small ? 14 : 18, gap, keepNext);
  const tableFlow = (rows, kind, headers = null, columns = null) => {
    const width = kind === 'profile' ? [201, 327] : [246.576, 281.424];
    const expanded = rows.flatMap(([key, value, mono = false]) => {
      const left = textLines(key, width[0] - 12);
      const right = textLines(value ?? t.noData, width[1] - 12, mono ? 7.5 : 8.5, mono);
      return Array.from({ length: Math.max(left.length, right.length) }, (_, i) => ({ key: left[i] || (i ? '…' : ''), value: right[i] || '', mono, height: 19.125 }));
    });
    let offset = 0;
    while (offset < expanded.length) {
      const headerHeight = headers ? 19.5 : 0;
      if (current().cursor + headerHeight + 19.125 > bottom) nextPage();
      const count = Math.max(1, Math.floor((bottom - current().cursor - headerHeight) / 19.125));
      const items = expanded.slice(offset, offset + count);
      const html = `<table class="${kind}">${columns || (kind === 'technical' ? '<colgroup><col style="width:46%"><col style="width:54%"></colgroup>' : '')}${headers ? `<thead><tr>${headers.map((label) => `<th>${e(label)}</th>`).join('')}</tr></thead>` : ''}<tbody>${items.map((row) => `<tr style="height:${row.height}pt"><td>${e(row.key)}</td><td${row.mono ? ' class="mono"' : ''}>${e(row.value)}</td></tr>`).join('')}</tbody></table>`;
      add(html, headerHeight + items.length * 19.125);
      offset += items.length;
      if (offset < expanded.length) nextPage();
    }
  };
  const valueHtml = (value, suffix = '', digits = 1) => finite(value) ? `${e(number(value, digits))}${suffix ? `<small>${e(suffix)}</small>` : ''}` : e(t.noData);
  const card = (label, value, help = '', color = '') => `<div class="card ${color}"><div class="label">${e(label)}</div><div class="value">${value}</div>${help ? `<div class="help">${help}</div>` : ''}</div>`;

  add(`<header><div class="brand">${REPORT_LOGO}<span>SaqtauAI</span></div><p class="brand-subtitle">${e(t.brandSubtitle)}</p><div class="header-right"><b>${e(t.title)}</b><p>${e(t.generated)}: ${e(date(exportedAt.toISOString(), true))}</p></div></header>`, 50.25);
  heading(t.profile, false, 13.5, 25);
  current().cursor += 6;
  tableFlow([[t.name, account.display_name || profile.display_name || profile.name || (guest ? t.guest : t.noData)], [t.email, account.email || t.noData], [t.birthday, validBirth ? date(birth.toISOString()) : t.noData], [t.age, finite(age) ? `${age} ${t.years}` : t.noData], [t.height, unit(profile.heightCm, t.cm)], [t.weight, unit(profile.weightKg, t.kg)], [t.created, date(account.created_at)]], 'profile');
  heading(t.summary, false, 13.5, 51.75);
  const pulses = measurements.filter((m) => m.status === 'completed' && finite(m.bpm)).map((m) => m.bpm);
  const dates = measurements.map((m) => m.created_at).filter((v) => Number.isFinite(Date.parse(v))).sort((a, b) => Date.parse(a) - Date.parse(b));
  const period = dates.length ? `${date(dates[0])} — ${date(dates[dates.length - 1])}` : t.noData;
  add(`<div class="summary-cards" style="height:45.75pt">${card(t.count, e(measurements.length), '', 'blue')}${card(t.average, valueHtml(pulses.length ? pulses.reduce((a, b) => a + b, 0) / pulses.length : null, t.bpm), '', 'pink')}${card(t.period, e(period), '', 'period')}</div>`, 45.75, 6);
  const summaryHeaders = ['№', t.date, `${t.pulse}, ${t.bpm}`, `RMSSD, ${t.ms}`, `SDNN, ${t.ms}`, t.breathing, t.stress, lang === 'ru' ? 'Качество' : t.quality];
  const colWidths = [21, 96.75, 93, 70.5, 64.5, 64.5, 52.5, 65.25];
  const summaryRows = measurements.map((m, i) => {
    const raw = [i + 1, date(m.created_at, true), number(m.bpm), number(m.hrv_rmssd_ms), number(m.hrv_sdnn_ms), number(m.breathing_rate_bpm), level(m.stress_level), percent(m.signal_quality)];
    const cells = raw.map((value, column) => textLines(value, colWidths[column] - 12.5));
    return { cells, height: Math.max(19.125, 12 * Math.max(...cells.map((parts) => parts.length)) + 7.125) };
  });
  let summaryOffset = 0;
  if (!measurements.length) add(`<p class="empty">${e(t.none)}</p>`, 18, 9);
  while (summaryOffset < summaryRows.length) {
    const headerHeight = lang === 'ru' ? 20.25 : 30.75;
    if (current().cursor + 3 + headerHeight + summaryRows[summaryOffset].height > bottom) nextPage();
    const items = []; let used = headerHeight;
    while (summaryOffset + items.length < summaryRows.length) {
      const row = summaryRows[summaryOffset + items.length];
      if (current().cursor + 3 + used + row.height > bottom) break;
      items.push(row); used += row.height;
    }
    add(`<table class="summary-table"><colgroup>${colWidths.map((w) => `<col style="width:${w}pt">`).join('')}</colgroup><thead><tr style="height:${headerHeight}pt">${summaryHeaders.map((label) => `<th>${e(label)}</th>`).join('')}</tr></thead><tbody>${items.map((row) => `<tr style="height:${row.height}pt">${row.cells.map((parts) => `<td>${e(parts.join('\n'))}</td>`).join('')}</tr>`).join('')}</tbody></table>`, used, 3);
    summaryOffset += items.length;
    if (summaryOffset < summaryRows.length) nextPage();
  }
  measurements.forEach((m, index) => {
    const firstRow = `<div class="metric-row" style="height:57.75pt">${card(t.pulse, valueHtml(m.bpm, t.bpm), e(t.pulseHelp))}${card(t.rmssd, valueHtml(m.hrv_rmssd_ms, t.ms), e(t.rmssdHelp))}${card(t.sdnn, valueHtml(m.hrv_sdnn_ms, t.ms), e(t.sdnnHelp))}</div>`;
    const stressHelp = `${e(t.index)} ${e(number(m.stress_index, 0))}<br>${e(t.stressHelp)}`;
    const qualityHelp = `${e(t.faceCoverage)} ${e(percent(m.face_coverage))}<br>${e(t.qualityHelp)}`;
    const secondRow = `<div class="metric-row" style="height:69pt;margin-top:6pt">${card(t.breathing, valueHtml(m.breathing_rate_bpm, t.breaths), e(t.breathingHelp))}${card(t.stress, e(level(m.stress_level)), stressHelp)}${card(t.quality, e(percent(m.signal_quality)), qualityHelp)}</div>`;
    const title = `<div class="measurement-heading"><span>${e(t.details)} ${index + 1} ${e(t.of)} ${measurements.length}</span><time>${e(date(m.created_at, true))}</time></div>`;
    add(`${index ? '<div class="separator"></div>' : ''}${title}<div style="margin-top:6pt">${firstRow}${secondRow}</div>`, 156.75 + (index ? 10.5 : 0), index ? 12 : 21.75);
    const waveform = Array.isArray(m.waveform) ? m.waveform.filter(finite) : [];
    let chart = `<div class="chart-empty">${e(t.noWaveform)}</div>`;
    if (waveform.length > 1) {
      const stride = Math.max(1, Math.ceil(waveform.length / 1500));
      const values = waveform.filter((_, i) => i % stride === 0);
      const min = Math.min(...values), max = Math.max(...values), range = max - min;
      const points = values.map((v, i) => `${(i / (values.length - 1) * 513).toFixed(3)},${(range ? 3 + (max - v) / range * 78 : 43.875).toFixed(3)}`).join(' ');
      chart = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 513 87.75" aria-label="${e(t.waveform)}"><polyline points="${points}" stroke="#c2407e" stroke-width=".75" fill="none"/></svg>`;
    }
    add(`<h3>${e(t.waveform)}</h3><div class="chart" style="margin-top:4.75pt">${chart}</div><p class="caption">${e(t.waveformHelp)}</p>`, 135, 9.75);
    const warningItems = Array.isArray(m.warnings) ? m.warnings : [];
    const noteItems = Array.isArray(m.notes) ? m.notes : [];
    const notes = [...warningItems.map((v) => t.warningLabels[v] || (typeof v === 'object' ? JSON.stringify(v) : String(v))), ...noteItems.map((v) => typeof v === 'object' ? JSON.stringify(v) : String(v)), ...(m.failure_code ? [String(m.failure_code)] : []), ...(m.failure_detail ? [String(m.failure_detail)] : [])];
    if (notes.length) {
      heading(t.warnings, true, 9.75, 18.25);
      current().cursor += 2.5;
      notes.forEach((note) => textLines(note, 514, 9.5).forEach((line) => add(`<div class="note">${e(line)}</div>`, 15.75)));
    }
    const d = m.diagnostics && typeof m.diagnostics === 'object' ? m.diagnostics : {};
    const label = t.diagnosticLabels;
    const technical = [[t.status, status(m.status)], [t.source, m.source_type === 'camera_rppg' ? t.sourceCamera : m.source_type], [t.algorithm, m.algorithm], [t.version, m.algorithm_version, true], [label.pipeline_version, d.pipeline_version, true], [t.duration, unit(m.duration_seconds, t.seconds, 0)], [t.fps, number(m.effective_fps)], [t.frames, number(m.analyzed_frames, 0)], [label.detected_beats, number(d.detected_beats, 0)], [label.accepted_rr_intervals, number(d.accepted_rr_intervals, 0)], [label.interval_quality, percent(d.interval_quality)], [label.pulse_rate_from_intervals_bpm, unit(d.pulse_rate_from_intervals_bpm, t.bpm)], [label.spectral_quality, number(d.spectral_quality, 3)], [label.peak_frequency_hz, unit(d.peak_frequency_hz, t.hz, 3)], [label.motion_score, number(d.motion_score, 6)], [label.exposure_score, number(d.exposure_score, 3)], [label.roi_quality_score, number(d.roi_quality_score, 3)], [label.mean_luminance, number(d.mean_luminance)], [label.selected_method, d.selected_method ? String(d.selected_method).toUpperCase() : t.noData], [label.pos_bpm, unit(d.pos_bpm, t.bpm)], [label.chrom_bpm, unit(d.chrom_bpm, t.bpm)], [label.method_agreement_bpm, unit(d.method_agreement_bpm, t.bpm, 2)], [label.selected_snr_db, unit(d.selected_snr_db, t.db, 2)], [t.measured, date(m.created_at, true)], [t.processed, date(m.processed_at, true)]];
    heading(t.technical, true, 6.75, 42.375);
    current().cursor += 4.75;
    tableFlow(technical, 'technical', [t.parameter, t.value]);
  });
  const disclaimerLines = textLines(t.disclaimer, 507, 8.5);
  const noticeHeight = 16.5 + 13.5 + 3 + disclaimerLines.length * 12;
  add(`<div class="notice"><b>${e(t.important)}</b><p>${e(t.disclaimer)}</p></div>`, noticeHeight, 14.625, 16);
  add(`<p class="formed-by">${e(t.formedBy)}</p>`, 11, 5);
  const fontCss = [['regular', 'Report', 400], ['semibold', 'Report', 600], ['bold', 'Report', 700], ['footer', 'Inter', 400]].filter(([key]) => /^[A-Za-z0-9+/=]+$/.test(fonts[key] || '')).map(([key, family, weight]) => `@font-face{font-family:${family};src:url(data:font/ttf;base64,${fonts[key]}) format('truetype');font-weight:${weight};}`).join('');
  return `<!DOCTYPE html><html lang="${lang}"><head><meta charset="utf-8"><title>SaqtauAI</title><style>${fontCss}${REPORT_CSS}</style></head><body>${pages.map((page, i) => `<article class="page">${page.blocks.map((block) => `<section class="block" style="top:${block.top}pt;min-height:${block.height}pt" data-height="${block.height}">${block.html}</section>`).join('')}<footer><span>SaqtauAI</span><span>${e(t.page)} ${i + 1}/${pages.length}</span></footer></article>`).join('')}</body></html>`;
}
