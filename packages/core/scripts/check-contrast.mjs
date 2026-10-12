// Verifies every mode × accent against WCAG 2.2 AA. Exits 1 on any failure.
import { contrast } from './color.mjs';
import { accentNames, modeNames, resolveTheme } from './resolve.mjs';

const TEXT = 4.5; // 1.4.3 normal text
const UI = 3; // 1.4.11 non-text (control borders, focus indicator)

/** [label, foreground key, background key, minimum ratio] */
const pairs = [
  ['body text on surface', 'text', 'surface', TEXT],
  ['body text on surface-alt', 'text', 'surfaceAlt', TEXT],
  ['body text on surface-muted', 'text', 'surfaceMuted', TEXT],
  ['muted text on surface', 'textMuted', 'surface', TEXT],
  ['muted text on surface-alt', 'textMuted', 'surfaceAlt', TEXT],
  ['button text on primary', 'onPrimary', 'primary', TEXT],
  ['button text on primary hover', 'onPrimary', 'primaryHover', TEXT],
  ['accent text on surface', 'primaryInk', 'surface', TEXT],
  ['accent text on surface-alt', 'primaryInk', 'surfaceAlt', TEXT],
  ['accent text on primary-soft (badge)', 'primaryInk', 'primarySoft', TEXT],
  ['danger button text', 'onDanger', 'danger', TEXT],
  ['success text on surface', 'success', 'surface', TEXT],
  ['warning text on surface', 'warning', 'surface', TEXT],
  ['danger text on surface', 'danger', 'surface', TEXT],
  ['info text on surface', 'info', 'surface', TEXT],
  ['success badge', 'success', 'successSoft', TEXT],
  ['warning badge', 'warning', 'warningSoft', TEXT],
  ['danger badge', 'danger', 'dangerSoft', TEXT],
  ['info badge', 'info', 'infoSoft', TEXT],
  ['text in alerts (success)', 'text', 'successSoft', TEXT],
  ['text in alerts (danger)', 'text', 'dangerSoft', TEXT],
  ['control border on surface', 'controlBorder', 'surface', UI],
  ['focus ring on surface', 'focus', 'surface', UI],
  ['focus ring on surface-alt', 'focus', 'surfaceAlt', UI],
  ['selected tab underline on surface', 'primary', 'surface', UI],
];

let failures = 0;
let checks = 0;
for (const mode of modeNames) {
  for (const accent of accentNames) {
    const t = resolveTheme(mode, accent);
    for (const [label, fg, bg, min] of pairs) {
      checks += 1;
      const ratio = contrast(t[fg], t[bg]);
      if (ratio < min) {
        failures += 1;
        console.error(`FAIL ${mode}/${accent}: ${label} — ${t[fg]} on ${t[bg]} = ${ratio.toFixed(2)} (needs ${min})`);
      }
    }
  }
}

if (failures) {
  console.error(`\n${failures} of ${checks} contrast checks failed.`);
  process.exit(1);
}
console.log(`All ${checks} contrast checks pass (${modeNames.length} modes × ${accentNames.length} accents × ${pairs.length} pairs).`);
