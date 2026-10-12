## 0.1.0

Initial release.

- Design tokens generated from the Nawa UI core theme source: every color
  theme (light, dark and high contrast x violet, teal, indigo, rose, amber,
  emerald, slate) and 3 shapes (sharp, standard, round), identical to the web
  CSS.
- `NawaTheme` theme extension, `NawaThemeData.build` (Material 3 `ThemeData`),
  `NawaApp` and `NawaThemeScope`, with a `system` mode that follows the platform
  brightness and high-contrast setting.
- Widgets: `NawaButton`, `NawaInput`, `NawaTextarea`, `NawaSelect`,
  `NawaCheckbox`, `NawaSwitch`, `NawaRadioGroup`, `NawaSegmented`, `NawaSlider`,
  `NawaBadge`, `NawaTag`, `NawaAvatar`, `NawaCard`, `NawaAlert`,
  `NawaEmptyState`, `NawaDivider`, `NawaSpinner`, `NawaSkeleton`,
  `NawaSkeletonText`, `NawaSkeletonCard`, `NawaProgressBar`, `NawaStepper`,
  `NawaTimeline`, `NawaTooltip`, `NawaTabs`, `NawaAccordion`, `NawaBreadcrumb`,
  `NawaPagination`, `NawaDataTable`, `NawaDialog` / `showNawaDialog`,
  `NawaDrawer` / `showNawaDrawer`, `showNawaToast`, `NawaBarChart`,
  `NawaLineChart`.
- Accessibility: semantics on every widget, 48x48 minimum hit areas, keyboard
  support (Enter / Space, arrow keys, Home / End), screen reader announcements,
  reduced motion, RTL and text scaling.
