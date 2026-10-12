## 0.1.0

Initial release.

- Design tokens generated from the Orca UI core theme source: every color
  theme (light, dark and high contrast x violet, teal, indigo, rose, amber,
  emerald, slate) and 3 shapes (sharp, standard, round), identical to the web
  CSS.
- `OrcaTheme` theme extension, `OrcaThemeData.build` (Material 3 `ThemeData`),
  `OrcaApp` and `OrcaThemeScope`, with a `system` mode that follows the platform
  brightness and high-contrast setting.
- Widgets: `OrcaButton`, `OrcaInput`, `OrcaTextarea`, `OrcaSelect`,
  `OrcaCheckbox`, `OrcaSwitch`, `OrcaRadioGroup`, `OrcaSegmented`, `OrcaSlider`,
  `OrcaBadge`, `OrcaTag`, `OrcaAvatar`, `OrcaCard`, `OrcaAlert`,
  `OrcaEmptyState`, `OrcaDivider`, `OrcaSpinner`, `OrcaSkeleton`,
  `OrcaSkeletonText`, `OrcaSkeletonCard`, `OrcaProgressBar`, `OrcaStepper`,
  `OrcaTimeline`, `OrcaTooltip`, `OrcaTabs`, `OrcaAccordion`, `OrcaBreadcrumb`,
  `OrcaPagination`, `OrcaDataTable`, `OrcaDialog` / `showOrcaDialog`,
  `OrcaDrawer` / `showOrcaDrawer`, `showOrcaToast`, `OrcaBarChart`,
  `OrcaLineChart`.
- Accessibility: semantics on every widget, 48x48 minimum hit areas, keyboard
  support (Enter / Space, arrow keys, Home / End), screen reader announcements,
  reduced motion, RTL and text scaling.
