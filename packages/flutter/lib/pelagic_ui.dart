/// Pelagic UI for Flutter: accessible, themeable widgets with the same design
/// tokens as the Pelagic UI web packages (light, dark and high contrast x every accent).
///
/// ```dart
/// void main() => runApp(const PelagicApp(home: MyHome()));
/// ```
library;

export 'src/foundation/pressable.dart' show PelagicArrowKeys, PelagicPressable;
export 'src/foundation/utils.dart' show PelagicPageItem, pelagicAnnounce, pelagicCompareValues, pelagicInitials, pelagicPageItems;
export 'src/theme/colors.dart';
export 'src/theme/pelagic_theme.dart';
export 'src/tokens.g.dart';
export 'src/widgets/button.dart';
export 'src/widgets/charts.dart';
export 'src/widgets/data_table.dart';
export 'src/widgets/display.dart';
export 'src/widgets/forms.dart';
export 'src/widgets/navigation.dart';
export 'src/widgets/overlay.dart';
