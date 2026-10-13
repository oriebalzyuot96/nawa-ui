## 0.1.0

Initial release.

- Design tokens generated from the Pelagic UI core theme source: every color
  theme (light, dark and high contrast x violet, teal, indigo, rose, amber,
  emerald, slate) and 3 shapes (sharp, standard, round), identical to the web
  CSS.
- `PelagicTheme` theme extension, `PelagicThemeData.build` (Material 3 `ThemeData`),
  `PelagicApp` and `PelagicThemeScope`, with a `system` mode that follows the platform
  brightness and high-contrast setting.
- Widgets: `PelagicButton`, `PelagicInput`, `PelagicTextarea`, `PelagicSelect`,
  `PelagicCheckbox`, `PelagicSwitch`, `PelagicRadioGroup`, `PelagicSegmented`, `PelagicSlider`,
  `PelagicBadge`, `PelagicTag`, `PelagicAvatar`, `PelagicCard`, `PelagicAlert`,
  `PelagicEmptyState`, `PelagicDivider`, `PelagicSpinner`, `PelagicSkeleton`,
  `PelagicSkeletonText`, `PelagicSkeletonCard`, `PelagicProgressBar`, `PelagicStepper`,
  `PelagicTimeline`, `PelagicTooltip`, `PelagicTabs`, `PelagicAccordion`, `PelagicBreadcrumb`,
  `PelagicPagination`, `PelagicDataTable`, `PelagicDialog` / `showPelagicDialog`,
  `PelagicDrawer` / `showPelagicDrawer`, `showPelagicToast`, `PelagicBarChart`,
  `PelagicLineChart`.
- Accessibility: semantics on every widget, 48x48 minimum hit areas, keyboard
  support (Enter / Space, arrow keys, Home / End), screen reader announcements,
  reduced motion, RTL and text scaling.
