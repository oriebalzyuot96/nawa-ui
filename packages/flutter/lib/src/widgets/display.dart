import 'package:flutter/material.dart';

import '../foundation/pressable.dart';
import '../foundation/utils.dart';
import '../theme/colors.dart';
import '../theme/nawa_theme.dart';

/// Semantic color tone shared by badges, alerts, toasts and timelines.
enum NawaTone {
  /// Neutral gray.
  neutral,

  /// Accent color.
  primary,

  /// Informational.
  info,

  /// Success.
  success,

  /// Warning.
  warning,

  /// Danger / error.
  danger,
}

/// Foreground and soft background colors for a [NawaTone].
({Color fg, Color bg}) nawaToneColors(NawaColors c, NawaTone tone) {
  switch (tone) {
    case NawaTone.success:
      return (fg: c.success, bg: c.successSoft);
    case NawaTone.warning:
      return (fg: c.warning, bg: c.warningSoft);
    case NawaTone.danger:
      return (fg: c.danger, bg: c.dangerSoft);
    case NawaTone.info:
      return (fg: c.info, bg: c.infoSoft);
    case NawaTone.primary:
      return (fg: c.primaryInk, bg: c.primarySoft);
    case NawaTone.neutral:
      return (fg: c.text, bg: c.surfaceMuted);
  }
}

IconData _toneIcon(NawaTone tone) {
  switch (tone) {
    case NawaTone.success:
      return Icons.check_circle_outline;
    case NawaTone.warning:
      return Icons.warning_amber_outlined;
    case NawaTone.danger:
      return Icons.error_outline;
    case NawaTone.info:
    case NawaTone.primary:
    case NawaTone.neutral:
      return Icons.info_outline;
  }
}

bool _reduceMotion(BuildContext context) => MediaQuery.maybeDisableAnimationsOf(context) ?? false;

/// Small status label.
class NawaBadge extends StatelessWidget {
  /// Creates a badge.
  const NawaBadge({super.key, required this.label, this.tone = NawaTone.neutral, this.semanticLabel});

  /// Text.
  final String label;

  /// Color tone.
  final NawaTone tone;

  /// Accessible text when [label] alone is not descriptive (e.g. "3 unread").
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final NawaTheme t = NawaTheme.of(context);
    final ({Color fg, Color bg}) c = nawaToneColors(t.colors, tone);
    return Semantics(
      label: semanticLabel,
      excludeSemantics: semanticLabel != null,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: c.bg,
          borderRadius: BorderRadius.circular(NawaRadii.pill),
          border: t.isHighContrast ? Border.all(color: c.fg) : null,
        ),
        child: Padding(
          padding: const EdgeInsetsDirectional.symmetric(horizontal: NawaSpace.sm, vertical: 2),
          child: Text(
            label,
            style: TextStyle(color: c.fg, fontSize: NawaFontSize.xs, fontWeight: FontWeight.w600),
          ),
        ),
      ),
    );
  }
}

class _TagPainter extends CustomPainter {
  _TagPainter({required this.fill, required this.stroke, required this.radius, required this.inset});

  final Color fill;
  final Color stroke;
  final double radius;
  final double inset;

  @override
  void paint(Canvas canvas, Size size) {
    final double dy = (size.height - 2 * inset) < 24 ? 0 : inset;
    final RRect rect = RRect.fromRectAndRadius(
      Rect.fromLTWH(0.5, dy + 0.5, size.width - 1, size.height - 2 * dy - 1),
      Radius.circular(radius),
    );
    canvas.drawRRect(rect, Paint()..color = fill);
    canvas.drawRRect(
      rect,
      Paint()
        ..color = stroke
        ..style = PaintingStyle.stroke,
    );
  }

  @override
  bool shouldRepaint(_TagPainter oldDelegate) =>
      oldDelegate.fill != fill || oldDelegate.stroke != stroke || oldDelegate.radius != radius || oldDelegate.inset != inset;
}

/// Label chip, optionally removable. The remove button has a 48x48 hit area.
class NawaTag extends StatelessWidget {
  /// Creates a tag.
  const NawaTag({super.key, required this.label, this.onRemove, this.removeLabel});

  /// Text.
  final String label;

  /// Shows a remove button when set.
  final VoidCallback? onRemove;

  /// Accessible name of the remove button. Defaults to "Remove <label>".
  final String? removeLabel;

  @override
  Widget build(BuildContext context) {
    final NawaTheme t = NawaTheme.of(context);
    final bool removable = onRemove != null;
    return CustomPaint(
      painter: _TagPainter(
        fill: t.colors.surfaceAlt,
        stroke: t.isHighContrast ? t.colors.controlBorder : t.colors.border,
        radius: t.radii.sm,
        inset: removable ? 8 : 0,
      ),
      child: Padding(
        padding: EdgeInsetsDirectional.only(
          start: NawaSpace.sm + 2,
          end: removable ? 0 : NawaSpace.sm + 2,
          top: removable ? 0 : NawaSpace.xs,
          bottom: removable ? 0 : NawaSpace.xs,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Flexible(
              child: Text(label, style: TextStyle(color: t.colors.text, fontSize: NawaFontSize.sm)),
            ),
            if (removable)
              NawaPressable(
                onPressed: onRemove,
                semanticLabel: removeLabel ?? 'Remove $label',
                excludeChildSemantics: true,
                borderRadius: BorderRadius.circular(t.radii.sm),
                child: Center(
                  widthFactor: 1,
                  heightFactor: 1,
                  child: Icon(Icons.close, size: 16, color: t.colors.textMuted),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Avatar size.
enum NawaAvatarSize {
  /// 32
  sm,

  /// 40
  md,

  /// 56
  lg,
}

/// Round avatar showing an image, or the initials of [name].
class NawaAvatar extends StatelessWidget {
  /// Creates an avatar.
  const NawaAvatar({super.key, required this.name, this.image, this.size = NawaAvatarSize.md});

  /// Person or entity name (also the accessible label).
  final String name;

  /// Optional image.
  final ImageProvider<Object>? image;

  /// Size.
  final NawaAvatarSize size;

  @override
  Widget build(BuildContext context) {
    final NawaColors c = NawaTheme.of(context).colors;
    final double dim = switch (size) {
      NawaAvatarSize.sm => 32.0,
      NawaAvatarSize.md => 40.0,
      NawaAvatarSize.lg => 56.0,
    };
    final Widget initials = Center(
      child: Padding(
        padding: EdgeInsets.all(dim * 0.18),
        child: FittedBox(
          child: Text(
            nawaInitials(name),
            style: TextStyle(color: c.primaryInk, fontWeight: FontWeight.w600, fontSize: dim * 0.38),
          ),
        ),
      ),
    );
    return Semantics(
      image: true,
      label: name,
      excludeSemantics: true,
      child: SizedBox.square(
        dimension: dim,
        child: ClipOval(
          child: ColoredBox(
            color: c.primarySoft,
            child: image == null
                ? initials
                : Image(
                    image: image!,
                    width: dim,
                    height: dim,
                    fit: BoxFit.cover,
                    errorBuilder: (BuildContext context, Object error, StackTrace? stack) => initials,
                  ),
          ),
        ),
      ),
    );
  }
}

/// Bordered container with optional title and footer.
class NawaCard extends StatelessWidget {
  /// Creates a card.
  const NawaCard({
    super.key,
    this.title,
    this.trailing,
    this.child,
    this.footer,
    this.padding = const EdgeInsetsDirectional.all(NawaSpace.lg),
  });

  /// Title, exposed as a heading.
  final String? title;

  /// Widget at the end of the title row.
  final Widget? trailing;

  /// Body.
  final Widget? child;

  /// Footer (actions).
  final Widget? footer;

  /// Body padding.
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    final NawaTheme t = NawaTheme.of(context);
    final NawaColors c = t.colors;
    final BorderSide side = BorderSide(color: t.isHighContrast ? c.controlBorder : c.border, width: t.borderWidth);
    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(t.radii.lg),
        border: Border.fromBorderSide(side),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          if (title != null)
            DecoratedBox(
              decoration: BoxDecoration(border: Border(bottom: BorderSide(color: c.border))),
              child: Padding(
                padding: const EdgeInsetsDirectional.all(NawaSpace.lg),
                child: Row(
                  children: <Widget>[
                    Expanded(
                      child: Semantics(
                        header: true,
                        child: Text(
                          title!,
                          style: TextStyle(color: c.text, fontWeight: FontWeight.w700, fontSize: NawaFontSize.md),
                        ),
                      ),
                    ),
                    if (trailing != null) trailing!,
                  ],
                ),
              ),
            ),
          if (child != null) Padding(padding: padding, child: child),
          if (footer != null)
            DecoratedBox(
              decoration: BoxDecoration(
                color: c.surfaceAlt,
                border: Border(top: BorderSide(color: c.border)),
              ),
              child: Padding(padding: const EdgeInsetsDirectional.all(NawaSpace.md), child: footer),
            ),
        ],
      ),
    );
  }
}

/// Inline status message. Announced by screen readers when it appears.
class NawaAlert extends StatelessWidget {
  /// Creates an alert.
  const NawaAlert({
    super.key,
    this.tone = NawaTone.info,
    this.title,
    this.message,
    this.child,
    this.onDismiss,
    this.dismissLabel = 'Dismiss',
  });

  /// Tone (info, success, warning, danger).
  final NawaTone tone;

  /// Bold title.
  final String? title;

  /// Body text.
  final String? message;

  /// Extra content below the message.
  final Widget? child;

  /// Shows a dismiss button when set.
  final VoidCallback? onDismiss;

  /// Accessible name of the dismiss button.
  final String dismissLabel;

  @override
  Widget build(BuildContext context) {
    final NawaTheme t = NawaTheme.of(context);
    final NawaColors c = t.colors;
    final ({Color fg, Color bg}) tc = nawaToneColors(c, tone);
    return Semantics(
      container: true,
      liveRegion: true,
      child: Container(
        decoration: BoxDecoration(
          color: tc.bg,
          borderRadius: BorderRadius.circular(t.radii.md),
          border: Border.all(color: tc.fg, width: t.borderWidth),
        ),
        padding: EdgeInsetsDirectional.only(
          start: NawaSpace.md,
          top: NawaSpace.md,
          bottom: NawaSpace.md,
          end: onDismiss == null ? NawaSpace.md : 0,
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            ExcludeSemantics(
              child: Padding(
                padding: const EdgeInsetsDirectional.only(end: NawaSpace.md, top: 1),
                child: Icon(_toneIcon(tone), color: tc.fg, size: 20),
              ),
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  if (title != null)
                    Text(
                      title!,
                      style: TextStyle(color: c.text, fontWeight: FontWeight.w700, fontSize: NawaFontSize.md),
                    ),
                  if (message != null)
                    Padding(
                      padding: EdgeInsetsDirectional.only(top: title == null ? 0 : 2),
                      child: Text(message!, style: TextStyle(color: c.text, fontSize: NawaFontSize.sm)),
                    ),
                  if (child != null)
                    Padding(padding: const EdgeInsetsDirectional.only(top: NawaSpace.sm), child: child),
                ],
              ),
            ),
            if (onDismiss != null)
              Transform.translate(
                offset: const Offset(0, -NawaSpace.md),
                child: NawaPressable(
                  onPressed: onDismiss,
                  semanticLabel: dismissLabel,
                  excludeChildSemantics: true,
                  borderRadius: BorderRadius.circular(t.radii.md),
                  child: Center(
                    widthFactor: 1,
                    heightFactor: 1,
                    child: Icon(Icons.close, size: 18, color: c.textMuted),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Placeholder for empty lists and search results.
class NawaEmptyState extends StatelessWidget {
  /// Creates an empty state.
  const NawaEmptyState({super.key, required this.title, this.description, this.icon, this.action});

  /// Heading.
  final String title;

  /// Supporting text.
  final String? description;

  /// Decorative icon (hidden from screen readers).
  final Widget? icon;

  /// Call to action.
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final NawaColors c = NawaTheme.of(context).colors;
    return Padding(
      padding: const EdgeInsetsDirectional.all(NawaSpace.xl),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          if (icon != null)
            ExcludeSemantics(
              child: IconTheme.merge(
                data: IconThemeData(color: c.textMuted, size: 40),
                child: icon!,
              ),
            ),
          if (icon != null) const SizedBox(height: NawaSpace.sm),
          Semantics(
            header: true,
            child: Text(
              title,
              textAlign: TextAlign.center,
              style: TextStyle(color: c.text, fontWeight: FontWeight.w700, fontSize: NawaFontSize.lg),
            ),
          ),
          if (description != null) ...<Widget>[
            const SizedBox(height: NawaSpace.xs),
            Text(
              description!,
              textAlign: TextAlign.center,
              style: TextStyle(color: c.textMuted, fontSize: NawaFontSize.sm),
            ),
          ],
          if (action != null) ...<Widget>[
            const SizedBox(height: NawaSpace.md),
            action!,
          ],
        ],
      ),
    );
  }
}

/// Decorative separator line, optionally with a centered label ("or").
class NawaDivider extends StatelessWidget {
  /// Creates a divider.
  const NawaDivider({super.key, this.vertical = false, this.label});

  /// Vertical line (needs a bounded height).
  final bool vertical;

  /// Optional label in the middle.
  final String? label;

  @override
  Widget build(BuildContext context) {
    final NawaTheme t = NawaTheme.of(context);
    final Color color = t.isHighContrast ? t.colors.controlBorder : t.colors.border;
    if (vertical) {
      return ExcludeSemantics(child: SizedBox(width: 1, height: double.infinity, child: ColoredBox(color: color)));
    }
    final Widget line = SizedBox(height: 1, width: double.infinity, child: ColoredBox(color: color));
    if (label == null) return ExcludeSemantics(child: line);
    return Row(
      children: <Widget>[
        Expanded(child: ExcludeSemantics(child: line)),
        Padding(
          padding: const EdgeInsetsDirectional.symmetric(horizontal: NawaSpace.md),
          child: Text(label!, style: TextStyle(color: t.colors.textMuted, fontSize: NawaFontSize.sm)),
        ),
        Expanded(child: ExcludeSemantics(child: line)),
      ],
    );
  }
}

/// Spinner size.
enum NawaSpinnerSize {
  /// 16
  sm,

  /// 24
  md,

  /// 36
  lg,
}

/// Indeterminate loading indicator. Static when animations are disabled.
class NawaSpinner extends StatelessWidget {
  /// Creates a spinner.
  const NawaSpinner({super.key, this.size = NawaSpinnerSize.md, this.color, this.label = 'Loading'});

  /// Size.
  final NawaSpinnerSize size;

  /// Color. Defaults to the accent.
  final Color? color;

  /// Accessible label. Pass null when a parent already announces loading.
  final String? label;

  @override
  Widget build(BuildContext context) {
    final NawaColors c = NawaTheme.of(context).colors;
    final double dim = switch (size) {
      NawaSpinnerSize.sm => 16.0,
      NawaSpinnerSize.md => 24.0,
      NawaSpinnerSize.lg => 36.0,
    };
    final Widget indicator = SizedBox.square(
      dimension: dim,
      child: CircularProgressIndicator(
        value: _reduceMotion(context) ? 0.3 : null,
        strokeWidth: dim / 8,
        color: color ?? c.primary,
        backgroundColor: (color ?? c.primary).withAlpha(0x33),
      ),
    );
    if (label == null) return ExcludeSemantics(child: indicator);
    return Semantics(label: label, container: true, child: ExcludeSemantics(child: indicator));
  }
}

/// Loading placeholder block with a shimmer.
///
/// The shimmer stops (and the block is static) when
/// `MediaQuery.disableAnimationsOf(context)` is true. Hidden from screen readers;
/// wrap groups in [NawaSkeletonText] / [NawaSkeletonCard] or label them yourself.
class NawaSkeleton extends StatefulWidget {
  /// Creates a skeleton block.
  const NawaSkeleton({super.key, this.width = double.infinity, this.height = 14, this.circle = false, this.borderRadius});

  /// Width (defaults to the available width).
  final double width;

  /// Height.
  final double height;

  /// Draw a circle of diameter [height].
  final bool circle;

  /// Corner radius. Defaults to the theme's small radius.
  final BorderRadiusGeometry? borderRadius;

  @override
  State<NawaSkeleton> createState() => _NawaSkeletonState();
}

class _NawaSkeletonState extends State<NawaSkeleton> with SingleTickerProviderStateMixin {
  late final AnimationController _controller =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 1400));

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_reduceMotion(context)) {
      _controller
        ..stop()
        ..value = 0;
    } else if (!_controller.isAnimating) {
      _controller.repeat();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final NawaTheme t = NawaTheme.of(context);
    final NawaColors c = t.colors;
    final bool reduce = _reduceMotion(context);
    final BorderRadiusGeometry radius = widget.circle
        ? BorderRadius.circular(widget.height / 2)
        : (widget.borderRadius ?? BorderRadius.circular(t.radii.sm));
    final bool rtl = Directionality.of(context) == TextDirection.rtl;
    return ExcludeSemantics(
      child: SizedBox(
        width: widget.circle ? widget.height : widget.width,
        height: widget.height,
        child: reduce
            ? DecoratedBox(decoration: BoxDecoration(color: c.surfaceMuted, borderRadius: radius))
            : AnimatedBuilder(
                animation: _controller,
                builder: (BuildContext context, Widget? child) {
                  final double p = _controller.value * 3 - 1; // -1 .. 2
                  final double x = rtl ? 1 - p : p;
                  return DecoratedBox(
                    decoration: BoxDecoration(
                      borderRadius: radius,
                      gradient: LinearGradient(
                        begin: Alignment(-1 + 2 * (x - 0.5), 0),
                        end: Alignment(-1 + 2 * (x + 0.5), 0),
                        colors: <Color>[c.surfaceMuted, c.surfaceAlt, c.surfaceMuted],
                      ),
                    ),
                  );
                },
              ),
      ),
    );
  }
}

Widget _skeletonLines(int lines) {
  return Column(
    mainAxisSize: MainAxisSize.min,
    crossAxisAlignment: CrossAxisAlignment.start,
    children: <Widget>[
      for (int i = 0; i < lines; i++) ...<Widget>[
        if (i > 0) const SizedBox(height: NawaSpace.sm),
        FractionallySizedBox(
          alignment: AlignmentDirectional.centerStart,
          widthFactor: i == lines - 1 && lines > 1 ? 0.6 : 1,
          child: const NawaSkeleton(height: 12),
        ),
      ],
    ],
  );
}

/// Paragraph placeholder, announced once as [label]. The last line is shorter.
class NawaSkeletonText extends StatelessWidget {
  /// Creates a text skeleton.
  const NawaSkeletonText({super.key, this.lines = 3, this.label = 'Loading'});

  /// Number of lines.
  final int lines;

  /// Accessible label.
  final String label;

  @override
  Widget build(BuildContext context) {
    return Semantics(container: true, label: label, child: _skeletonLines(lines));
  }
}

/// Card placeholder: avatar, title lines and a body paragraph.
class NawaSkeletonCard extends StatelessWidget {
  /// Creates a card skeleton.
  const NawaSkeletonCard({super.key, this.lines = 3, this.label = 'Loading'});

  /// Number of body lines.
  final int lines;

  /// Accessible label.
  final String label;

  @override
  Widget build(BuildContext context) {
    final NawaTheme t = NawaTheme.of(context);
    return Semantics(
      container: true,
      label: label,
      child: Container(
        padding: const EdgeInsetsDirectional.all(NawaSpace.lg),
        decoration: BoxDecoration(
          color: t.colors.surface,
          borderRadius: BorderRadius.circular(t.radii.lg),
          border: Border.all(color: t.colors.border),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            const Row(
              children: <Widget>[
                NawaSkeleton(circle: true, height: 40),
                SizedBox(width: NawaSpace.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      FractionallySizedBox(
                        alignment: AlignmentDirectional.centerStart,
                        widthFactor: 0.5,
                        child: NawaSkeleton(height: 12),
                      ),
                      SizedBox(height: NawaSpace.sm),
                      FractionallySizedBox(
                        alignment: AlignmentDirectional.centerStart,
                        widthFactor: 0.3,
                        child: NawaSkeleton(height: 10),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: NawaSpace.lg),
            _skeletonLines(lines),
          ],
        ),
      ),
    );
  }
}

/// Linear progress. [value] is a percentage (0-100); null is indeterminate.
class NawaProgressBar extends StatelessWidget {
  /// Creates a progress bar.
  const NawaProgressBar({super.key, this.value, this.label = 'Progress', this.showValue = false});

  /// Percentage 0-100, or null for indeterminate.
  final double? value;

  /// Accessible label (also shown above the bar when [showValue] is true).
  final String label;

  /// Show the label and percentage above the bar.
  final bool showValue;

  @override
  Widget build(BuildContext context) {
    final NawaTheme t = NawaTheme.of(context);
    final double? pct = value?.clamp(0, 100).toDouble();
    final bool reduce = _reduceMotion(context);
    final String? semanticValue = pct == null ? null : '${pct.round()}%';
    final Widget bar = ClipRRect(
      borderRadius: BorderRadius.circular(NawaRadii.pill),
      child: LinearProgressIndicator(
        value: pct == null ? (reduce ? 0.4 : null) : pct / 100,
        minHeight: 8,
        color: t.colors.primary,
        backgroundColor: t.colors.surfaceMuted,
      ),
    );
    return Semantics(
      container: true,
      label: label,
      value: semanticValue,
      hint: pct == null ? 'In progress' : null,
      child: ExcludeSemantics(
        child: showValue
            ? Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: <Widget>[
                  Row(
                    children: <Widget>[
                      Expanded(
                        child: Text(label, style: TextStyle(color: t.colors.text, fontSize: NawaFontSize.sm)),
                      ),
                      if (semanticValue != null)
                        Text(semanticValue, style: TextStyle(color: t.colors.textMuted, fontSize: NawaFontSize.sm)),
                    ],
                  ),
                  const SizedBox(height: NawaSpace.xs),
                  bar,
                ],
              )
            : bar,
      ),
    );
  }
}

/// One step of a [NawaStepper].
@immutable
class NawaStep {
  /// Creates a step.
  const NawaStep({required this.label, this.description});

  /// Step name.
  final String label;

  /// Optional detail.
  final String? description;
}

/// Horizontal progress through a sequence of steps. [current] is 0-based.
class NawaStepper extends StatelessWidget {
  /// Creates a stepper.
  const NawaStepper({super.key, required this.steps, required this.current});

  /// Steps.
  final List<NawaStep> steps;

  /// Index of the current step.
  final int current;

  @override
  Widget build(BuildContext context) {
    final NawaColors c = NawaTheme.of(context).colors;
    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: 'Step ${current + 1} of ${steps.length}',
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          for (int i = 0; i < steps.length; i++) ...<Widget>[
            if (i > 0) const SizedBox(width: NawaSpace.sm),
            Expanded(
              child: MergeSemantics(
                child: Semantics(
                  selected: i == current,
                  value: i < current ? 'Completed' : (i == current ? 'Current step' : 'Not started'),
                  child: Container(
                    padding: const EdgeInsetsDirectional.only(top: NawaSpace.sm),
                    decoration: BoxDecoration(
                      border: Border(top: BorderSide(color: i <= current ? c.primary : c.border, width: 3)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text(
                          steps[i].label,
                          style: TextStyle(
                            color: i == current ? c.primaryInk : (i < current ? c.text : c.textMuted),
                            fontWeight: i == current ? FontWeight.w700 : FontWeight.w500,
                            fontSize: NawaFontSize.sm,
                          ),
                        ),
                        if (steps[i].description != null)
                          Text(steps[i].description!, style: TextStyle(color: c.textMuted, fontSize: NawaFontSize.xs)),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// One entry of a [NawaTimeline].
@immutable
class NawaTimelineItem {
  /// Creates an entry.
  const NawaTimelineItem({required this.title, this.description, this.time, this.tone = NawaTone.primary});

  /// Title.
  final String title;

  /// Detail.
  final String? description;

  /// Time label.
  final String? time;

  /// Dot color.
  final NawaTone tone;
}

/// Vertical list of events.
class NawaTimeline extends StatelessWidget {
  /// Creates a timeline.
  const NawaTimeline({super.key, required this.items});

  /// Entries, oldest or newest first as you prefer.
  final List<NawaTimelineItem> items;

  @override
  Widget build(BuildContext context) {
    final NawaColors c = NawaTheme.of(context).colors;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        for (int i = 0; i < items.length; i++)
          MergeSemantics(
            child: IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: <Widget>[
                  ExcludeSemantics(
                    child: SizedBox(
                      width: 12,
                      child: Column(
                        children: <Widget>[
                          const SizedBox(height: 5),
                          Container(
                            width: 10,
                            height: 10,
                            decoration: BoxDecoration(
                              color: nawaToneColors(c, items[i].tone).fg,
                              shape: BoxShape.circle,
                            ),
                          ),
                          Expanded(
                            child: i == items.length - 1
                                ? const SizedBox.shrink()
                                : Container(width: 2, color: c.border),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: NawaSpace.md),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsetsDirectional.only(bottom: NawaSpace.lg),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          if (items[i].time != null)
                            Text(items[i].time!, style: TextStyle(color: c.textMuted, fontSize: NawaFontSize.xs)),
                          Text(
                            items[i].title,
                            style: TextStyle(color: c.text, fontWeight: FontWeight.w600, fontSize: NawaFontSize.md),
                          ),
                          if (items[i].description != null)
                            Text(
                              items[i].description!,
                              style: TextStyle(color: c.textMuted, fontSize: NawaFontSize.sm),
                            ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

/// Tooltip on hover, long press and keyboard focus. Escape dismisses it.
class NawaTooltip extends StatelessWidget {
  /// Creates a tooltip.
  const NawaTooltip({super.key, required this.message, required this.child, this.preferBelow = false});

  /// Text.
  final String message;

  /// Trigger.
  final Widget child;

  /// Show below the trigger instead of above.
  final bool preferBelow;

  @override
  Widget build(BuildContext context) {
    final NawaTheme t = NawaTheme.of(context);
    return Tooltip(
      message: message,
      preferBelow: preferBelow,
      decoration: BoxDecoration(color: t.colors.text, borderRadius: BorderRadius.circular(t.radii.sm)),
      textStyle: TextStyle(color: t.colors.surface, fontSize: NawaFontSize.sm),
      padding: const EdgeInsetsDirectional.symmetric(horizontal: NawaSpace.sm, vertical: NawaSpace.xs),
      waitDuration: const Duration(milliseconds: 400),
      child: child,
    );
  }
}
