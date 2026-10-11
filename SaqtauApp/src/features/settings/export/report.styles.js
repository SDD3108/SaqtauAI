// Dimensions, type scale and colours measured from the supplied PDF.
export const REPORT_CSS = `
@page { size: 595.92pt 842.88pt; margin: 0; }
* { box-sizing: border-box; }
body { margin: 0; color: #1a1a2e; font-family: Report, 'Open Sans', Arial, sans-serif; font-size: 8.5pt; line-height: 12pt; }
.page { width: 595.92pt; height: 842.88pt; position: relative; break-after: page; page-break-after: always; }
.page:last-child { break-after: auto; page-break-after: auto; }
.block { position: absolute; left: 34.5pt; width: 528pt; }
h2, h3, p { margin: 0; }
h2 { font-size: 12.5pt; font-weight: 700; line-height: 18pt; }
h3 { font-size: 10pt; font-weight: 700; line-height: 14pt; }
header { height: 50.25pt; position: relative; border-bottom: 1.5pt solid #1a1a2e; }
.brand { position: absolute; top: 2pt; left: 0; color: #2e3a87; font-size: 19pt; font-weight: 700; line-height: 26pt; display: flex; align-items: center; gap: 6.75pt; }
.brand svg { width: 16.5pt; height: 16.5pt; }
.brand-subtitle { position: absolute; top: 30pt; left: 0; color: #8a8a99; line-height: 12pt; }
.header-right { position: absolute; right: 0; top: 0; text-align: right; }
.header-right b { font-size: 13pt; line-height: 18pt; }
.header-right p { color: #8a8a99; margin-top: 3pt; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
td, th { text-align: left; padding: 3pt 6pt; vertical-align: top; line-height: 12pt; overflow-wrap: anywhere; word-break:break-all; white-space: pre-wrap; }
th { word-break:normal; white-space:normal; font-weight: 700; background: #ececee; border-bottom: .75pt solid #dcdce4; }
td { border-bottom: .75pt solid #dcdce4; }
tr:last-child td { border-bottom: 0; }
.profile td:first-child { width: 38.07%; color: #8a8a99; }
.profile td { padding-top: 3pt; }
.summary-cards, .metric-row { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 6pt; }
.card { border-radius: 7.5pt; background: #ececee; padding: 6pt 8.25pt; }
.label { font-size: 8pt; line-height: 11.25pt; color: #8a8a99; }
.value { height:23pt; font-size: 17pt; line-height: 23pt; font-weight: 700; white-space: nowrap; }
.value small { font-size: 9pt; font-weight: 600; line-height: 12pt; color: #8a8a99; margin-left: 2pt; }
.summary-cards .value { height:21pt; line-height:21pt; margin-top: 1.5pt; }
.blue .value { color: #2e3a87; }.pink .value { color: #c2407e; }
.period .value { height:15pt; color: #1f8a84; font-size: 9.5pt; font-weight: 600; line-height: 15pt; margin-top: 7.5pt; }
.help { color: #8a8a99; font-size: 7.5pt; line-height: 10.5pt; }
.metric-row .value { margin-top: 0; }.metric-row .help { margin-top: 1pt; }
.summary-table { font-size: 8.5pt; }
.summary-table td { padding: 3pt 6pt; }
.summary-table th { padding: 3pt 6pt; }
.summary-table td:first-child, .summary-table th:first-child { color: #8a8a99; }
.measurement-heading { font-size: 12pt; line-height: 18pt; font-weight: 700; display: flex; justify-content: space-between; height:18pt; align-items: center; }
.measurement-heading time { font-size: 9pt; line-height:12pt; font-weight: 400; color: #8a8a99; }
.separator { height: 10.5pt; border-top: .75pt solid #dcdce4; }
.chart { height: 102.75pt; border-radius: 7.5pt; padding: 7.5pt; background: #ececee; }
.chart svg { width: 100%; height: 100%; display: block; }
.chart-empty { color: #8a8a99; height: 87.75pt; display: flex; align-items: center; justify-content: center; }
.caption { font-size: 7.5pt; line-height: 10.5pt; color: #8a8a99; margin-top: 3pt; }
.note { font-size: 9.5pt; line-height: 15.75pt; padding-left: 11.25pt; position: relative; overflow-wrap: anywhere; word-break:break-all; white-space: pre-wrap; }
.note::before { content: '•'; position: absolute; left: 0; }
.technical td:first-child { width: 46.7%; color: #8a8a99; }
.technical th { height: 19.5pt; }
.mono { font-family: monospace; font-size: 7.5pt; }
.notice { border-radius: 7.5pt; background: #1a1a2e; color: white; padding: 8.25pt 10.5pt; }
.notice b { font-size: 9.5pt; line-height: 13.5pt; }
.notice p { font-size: 8.5pt; line-height: 12pt; margin-top: 3pt; }
.formed-by { color: #8a8a99; font-size: 7.5pt; text-align: center; line-height: 11pt; }
.empty { color: #8a8a99; line-height: 18pt; }
footer { position: absolute; left: 34.5pt; right: 34.5pt; bottom: 14pt; font-family: Inter, Arial, sans-serif; font-size: 7pt; line-height: 9pt; display: flex; justify-content: space-between; color: #1a1a2e; }
`;
