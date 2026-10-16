import { mix } from './color.mjs';
import { accents, modes, presets, softMix } from '../src/themes.mjs';

/** Fully resolved color theme (hex values) for one mode × accent. */
export function resolveTheme(mode, accent) {
  return resolveWith(mode, accent, modes[mode], accents[accent][mode]);
}

const PRESET_NEUTRALS = ['surface', 'surfaceAlt', 'surfaceMuted', 'text', 'textMuted', 'border', 'controlBorder', 'success', 'warning', 'danger', 'info', 'onDanger'];

/** Neutrals of a preset in one mode (hc keeps the high-contrast neutrals). */
export function presetModeNeutrals(preset, mode) {
  if (mode === 'hc') return { ...modes.hc };
  return { ...modes[mode], ...Object.fromEntries(PRESET_NEUTRALS.map((k) => [k, presets[preset][mode][k]])) };
}

/** A preset in one mode, with its own accent (default) or a built-in accent. */
export function resolvePresetTheme(preset, mode, accent) {
  const a = accent ? accents[accent][mode] : presets[preset][mode];
  return resolveWith(mode, accent ?? preset, presetModeNeutrals(preset, mode), a);
}

function resolveWith(mode, accent, m, a) {
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
export const presetNames = Object.keys(presets);
