# pelagic_ui

Accessible, themeable Flutter widgets from the **Pelagic UI** design system.
The colors, tints and radii are generated from the same source as the Pelagic UI
web packages, so a Flutter app and a web app built with Pelagic look the same.

- Every color theme of the core source: light, dark and high contrast x each
  accent (violet, teal, indigo, rose, amber, emerald, slate), plus 3 shapes
  (sharp, standard, round).
- 30+ widgets: buttons, form controls, feedback, navigation, a sortable data
  table, dialogs, drawers, toasts and simple charts.
- Accessible by default: semantics, 48x48 hit areas, keyboard support, reduced
  motion, right-to-left layouts and large text.
- Flutter SDK only, no third-party dependencies.

Docs: https://oriebalzyuot96.github.io/pelagic-ui/

## Install

```sh
flutter pub add pelagic_ui
```

Requires Flutter 3.24 or newer (Dart 3.5).

## Usage

```dart
import 'package:flutter/material.dart';
import 'package:pelagic_ui/pelagic_ui.dart';

void main() => runApp(const PelagicApp(title: 'Demo', home: HomePage()));

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ListView(
        padding: const EdgeInsetsDirectional.all(16),
        children: <Widget>[
          const PelagicInput(label: 'Email', hint: 'We never share it.'),
          const SizedBox(height: 16),
          PelagicButton(
            label: 'Delete',
            variant: PelagicButtonVariant.danger,
            onPressed: () => showPelagicDialog<void>(
              context: context,
              title: 'Delete file?',
              builder: (context) => const Text('This cannot be undone.'),
            ),
          ),
        ],
      ),
    );
  }
}
```

Widgets that use Material pieces (`PelagicInput`, `PelagicSlider`, `PelagicSelect`,
dialogs, drawers and toasts) expect a `MaterialApp` (or `PelagicApp`) above them,
for the navigator, overlay and localizations.

The `example/` app shows every widget with a theme switcher.

## Theming

`PelagicApp` is a `MaterialApp` with Pelagic themes:

```dart
PelagicApp(
  mode: PelagicThemeMode.system, // system | light | dark | hc
  accent: PelagicAccent.indigo,
  shape: PelagicShape.round,
  home: const HomePage(),
);
```

With `PelagicThemeMode.system` (the default) the app follows the platform
brightness and switches to the high-contrast theme when the platform asks for
it (`MediaQuery.highContrastOf`).

You can also use your own `MaterialApp`:

```dart
MaterialApp(
  theme: PelagicThemeData.build(mode: PelagicMode.light, accent: PelagicAccent.teal),
  darkTheme: PelagicThemeData.build(mode: PelagicMode.dark, accent: PelagicAccent.teal),
  highContrastTheme: PelagicThemeData.build(mode: PelagicMode.hc),
  highContrastDarkTheme: PelagicThemeData.build(mode: PelagicMode.hc),
);
```

`PelagicThemeData.build` returns a Material 3 `ThemeData` whose `ColorScheme`,
input decoration, button, checkbox, switch, slider, progress, divider, tooltip
and snack bar themes use the Pelagic tokens, so stock Material widgets match too.
To theme only part of the tree, use `PelagicThemeScope`.

Read tokens in your own widgets:

```dart
final pelagic = PelagicTheme.of(context);
Container(
  color: pelagic.colors.primarySoft,
  child: Text('Hi', style: TextStyle(color: pelagic.colors.primaryInk)),
);
```

`PelagicSpace` and `PelagicFontSize` hold the spacing and type scales;
`pelagic.radii.sm / md / lg` hold the corner radii of the current shape.

### Where the tokens come from

`lib/src/tokens.g.dart` is generated from `packages/core/src/themes.mjs` in the
Pelagic UI monorepo, using the same resolver as the web build (soft tints are an
sRGB mix of the color into the surface, like CSS `color-mix`). The shape the
web calls `default` is `PelagicShape.standard` in Dart, because `default` is a
reserved word. To regenerate after a theme change, from the monorepo root:

```sh
node packages/flutter/tool/generate_tokens.mjs          # write the file
node packages/flutter/tool/generate_tokens.mjs --check  # fail if it is stale
```

## Accessibility

- **Semantics.** Every control has a role, name, state and value: buttons
  expose loading ("Loading") and disabled states, inputs expose their label and
  error or hint, switches and checkboxes their toggled / checked state, tabs and
  pagination their selected item. Decorative icons and skeletons are excluded
  from semantics. Charts have a text summary (count, highest, lowest and trend)
  and a "Show table" button that shows the same data as a table.
- **Announcements.** Toasts and table sort changes are announced with
  `SemanticsService.announce`; alerts and field errors are live regions.
- **Hit areas.** Every interactive widget has a hit area of at least 48x48
  logical pixels.
- **Keyboard.** Every control works with Tab, Enter and Space and shows a focus
  ring for keyboard focus. Tabs, segmented controls and radio groups use arrow
  keys with roving focus (only the selected item is in the Tab order); Home and
  End jump to the first and last item. Pagination supports arrows, Home and
  End. Dialogs and drawers keep focus inside and close with Escape.
- **Reduced motion.** When `MediaQuery.disableAnimationsOf(context)` is true,
  skeleton shimmer, spinners, the indeterminate progress bar, switch and
  accordion animations and the drawer slide are turned off.
- **Right to left.** Layouts use `EdgeInsetsDirectional` and
  `AlignmentDirectional`; arrow keys, drawers, skeleton shimmer and charts
  follow the text direction.
- **Text scaling.** Layouts grow with the user's text size instead of clipping
  (minimum heights, not fixed heights).
- **High contrast.** The `hc` mode uses black text and borders and thicker
  control borders; it meets WCAG 2.2 AA (checked by the core package).

## License

MIT
