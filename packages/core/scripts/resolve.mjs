import { mix } from './color.mjs';
import { accents, modes, softMix } from '../src/themes.mjs';

/** Fully resolved color theme (hex values) for one mode × accent. */
export function resolveTheme(mode, accent) {
  const m = modes[mode];
  const a = accents[accent][mode];
  return {
    mode,
    accent,
    primary: a.primary,
    primaryHover: a.primaryHover,
    primaryInk: a.primaryInk,
    onPrimary: a.onPrimary,
    primarySoft: mix(a.primary, m.surface, softMix.primary),
    focus: a.primary,
    surface: m.surface,
    surfaceAlt: m.surfaceAlt,
    surfaceMuted: m.surfaceMuted,
    text: m.text,
    textMuted: m.textMuted,
    border: m.border,
    controlBorder: m.controlBorder,
    success: m.success,
    warning: m.warning,
    danger: m.danger,
    info: m.info,
    onDanger: m.onDanger,
    successSoft: mix(m.success, m.surface, softMix.status),
    warningSoft: mix(m.warning, m.surface, softMix.status),
    dangerSoft: mix(m.danger, m.surface, softMix.status),
    infoSoft: mix(m.info, m.surface, softMix.status),
    overlay: m.overlay,
  };
}

export const modeNames = Object.keys(modes);
export const accentNames = Object.keys(accents);
