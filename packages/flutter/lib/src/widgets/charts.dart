import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/colors.dart';
import '../theme/orca_theme.dart';
import 'button.dart';
import 'data_table.dart';

/// One labelled value of a chart.
@immutable
class OrcaChartPoint {
  /// Creates a point.
  const OrcaChartPoint(this.label, this.value);

  /// Category / x label.
  final String label;

  /// Value.
  final double value;
}

String _defaultFormat(double v) {
  if (v == v.roundToDouble()) return v.toInt().toString();
  return v.toStringAsFixed(1);
}

/// "Nice" axis maximum and step for values from 0 to [max].
({double max, double step}) _niceScale(double max, {int ticks = 4}) {
  if (max <= 0 || max.isNaN || max.isInfinite) return (max: 1.0, step: 0.25);
  final double raw = max / ticks;
  final double magnitude = math.pow(10, (math.log(raw) / math.ln10).floor()).toDouble();
  final double residual = raw / magnitude;
  final double nice = residual > 5 ? 10.0 : (residual > 2 ? 5.0 : (residual > 1 ? 2.0 : 1.0));
  final double step = nice * magnitude;
  return (max: (max / step).ceil() * step, step: step);
}

/// Text summary of a series for screen readers, e.g.
/// "Revenue. 6 values. Highest: Jun, 42. Lowest: Jan, 12."
String orcaDescribeSeries(String title, List<OrcaChartPoint> data, String Function(double) format) {
  if (data.isEmpty) return '$title. No data.';
  OrcaChartPoint hi = data.first;
  OrcaChartPoint lo = data.first;
  for (final OrcaChartPoint p in data) {
    if (p.value > hi.value) hi = p;
    if (p.value < lo.value) lo = p;
  }
  return '$title. ${data.length} values. Highest: ${hi.label}, ${format(hi.value)}. '
      'Lowest: ${lo.label}, ${format(lo.value)}.';
}

/// Trend sentence for a line chart: "From Jan 12 to Jun 42, up 250%."
String orcaTrendSummary(List<OrcaChartPoint> data, String Function(double) format) {
  if (data.length < 2) return '';
  final OrcaChartPoint first = data.first;
  final OrcaChartPoint last = data.last;
  final double diff = last.value - first.value;
  final String direction = diff > 0 ? 'up' : (diff < 0 ? 'down' : 'unchanged');
  final String pct = first.value == 0 ? '' : ' ${(diff.abs() / first.value.abs() * 100).round()}%';
  return 'From ${first.label} ${format(first.value)} to ${last.label} ${format(last.value)}, '
      '$direction${diff == 0 ? '' : pct}.';
}

class _ChartColors {
  const _ChartColors({required this.series, required this.soft, required this.grid, required this.label});

  final Color series;
  final Color soft;
  final Color grid;
  final Color label;
}

abstract class _ChartPainter extends CustomPainter {
  _ChartPainter({
    required this.data,
    required this.colors,
    required this.format,
    required this.textDirection,
    required this.textScaler,
  });

  final List<OrcaChartPoint> data;
  final _ChartColors colors;
  final String Function(double) format;
  final TextDirection textDirection;
  final TextScaler textScaler;

  bool get rtl => textDirection == TextDirection.rtl;

  TextPainter label(String text) {
    return TextPainter(
      text: TextSpan(text: text, style: TextStyle(color: colors.label, fontSize: 11)),
      textDirection: textDirection,
      textScaler: textScaler,
      maxLines: 1,
      ellipsis: '…',
    );
  }

  /// Draws grid lines and y labels, returns the plot rectangle.
  Rect drawFrame(Canvas canvas, Size size, ({double max, double step}) scale) {
    final List<TextPainter> yLabels = <TextPainter>[];
    for (double v = 0; v <= scale.max + scale.step / 2; v += scale.step) {
      yLabels.add(label(format(v))..layout());
    }
    final double yLabelWidth = yLabels.fold<double>(0, (double w, TextPainter p) => math.max(w, p.width)) + 6;
    final double xLabelHeight = (label('Ag')..layout()).height + 6;
    final double top = yLabels.first.height / 2;
    final Rect plot = rtl
        ? Rect.fromLTRB(0, top, size.width - yLabelWidth, size.height - xLabelHeight)
        : Rect.fromLTRB(yLabelWidth, top, size.width, size.height - xLabelHeight);
    final Paint grid = Paint()
      ..color = colors.grid
      ..strokeWidth = 1;
    for (int i = 0; i < yLabels.length; i++) {
      final double v = i * scale.step;
      final double y = plot.bottom - (v / scale.max) * plot.height;
      canvas.drawLine(Offset(plot.left, y), Offset(plot.right, y), grid);
      final TextPainter p = yLabels[i];
      final double x = rtl ? plot.right + 6 : plot.left - p.width - 6;
      p.paint(canvas, Offset(x, y - p.height / 2));
    }
    return plot;
  }

  void drawXLabel(Canvas canvas, String text, double centerX, double y, double maxWidth) {
    final TextPainter p = label(text)..layout(maxWidth: math.max(0.0, maxWidth));
    p.paint(canvas, Offset(centerX - p.width / 2, y + 4));
  }

  /// X position of item [i] of [n] inside [plot] (mirrored in RTL).
  double slotCenter(Rect plot, int i, int n) {
    final double slot = plot.width / n;
    final int k = rtl ? n - 1 - i : i;
    return plot.left + slot * (k + 0.5);
  }

  @override
  bool shouldRepaint(covariant _ChartPainter oldDelegate) =>
      oldDelegate.data != data ||
      oldDelegate.colors.series != colors.series ||
      oldDelegate.colors.grid != colors.grid ||
      oldDelegate.textDirection != textDirection ||
      oldDelegate.textScaler != textScaler;
}

class _BarPainter extends _ChartPainter {
  _BarPainter({
    required super.data,
    required super.colors,
    required super.format,
    required super.textDirection,
    required super.textScaler,
    required this.radius,
  });

  final double radius;

  @override
  void paint(Canvas canvas, Size size) {
    if (data.isEmpty) return;
    final double maxValue = data.map((OrcaChartPoint p) => p.value).reduce(math.max);
    final ({double max, double step}) scale = _niceScale(maxValue);
    final Rect plot = drawFrame(canvas, size, scale);
    final double slot = plot.width / data.length;
    final double barWidth = math.min(48.0, slot * 0.6);
    final Paint bar = Paint()..color = colors.series;
    for (int i = 0; i < data.length; i++) {
      final double cx = slotCenter(plot, i, data.length);
      final double h = (math.max(0.0, data[i].value) / scale.max) * plot.height;
      final Rect r = Rect.fromLTWH(cx - barWidth / 2, plot.bottom - h, barWidth, h);
      canvas.drawRRect(
        RRect.fromRectAndCorners(r, topLeft: Radius.circular(radius), topRight: Radius.circular(radius)),
        bar,
      );
      drawXLabel(canvas, data[i].label, cx, plot.bottom, slot - 4);
    }
  }
}

class _LinePainter extends _ChartPainter {
  _LinePainter({
    required super.data,
    required super.colors,
    required super.format,
    required super.textDirection,
    required super.textScaler,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (data.isEmpty) return;
    final double maxValue = data.map((OrcaChartPoint p) => p.value).reduce(math.max);
    final ({double max, double step}) scale = _niceScale(maxValue);
    final Rect plot = drawFrame(canvas, size, scale);
    final List<Offset> points = <Offset>[
      for (int i = 0; i < data.length; i++)
        Offset(
          slotCenter(plot, i, data.length),
          plot.bottom - (math.max(0.0, data[i].value) / scale.max) * plot.height,
        ),
    ];
    final Path line = Path()..moveTo(points.first.dx, points.first.dy);
    for (final Offset p in points.skip(1)) {
      line.lineTo(p.dx, p.dy);
    }
    final Path area = Path.from(line)
      ..lineTo(points.last.dx, plot.bottom)
      ..lineTo(points.first.dx, plot.bottom)
      ..close();
    canvas.drawPath(area, Paint()..color = colors.soft);
    canvas.drawPath(
      line,
      Paint()
        ..color = colors.series
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.5
        ..strokeJoin = StrokeJoin.round
        ..strokeCap = StrokeCap.round,
    );
    final double slot = plot.width / data.length;
    for (int i = 0; i < points.length; i++) {
      canvas.drawCircle(points[i], 4, Paint()..color = colors.series);
      canvas.drawCircle(points[i], 2, Paint()..color = colors.soft);
      drawXLabel(canvas, data[i].label, points[i].dx, plot.bottom, slot - 4);
    }
  }
}

/// Shared frame of the charts: title, summarized canvas, and a data table
/// alternative behind a toggle button.
class _ChartFrame extends StatefulWidget {
  const _ChartFrame({
    required this.title,
    required this.description,
    required this.summary,
    required this.data,
    required this.height,
    required this.format,
    required this.valueLabel,
    required this.showTableLabel,
    required this.hideTableLabel,
    required this.initiallyShowTable,
    required this.painter,
  });

  final String title;
  final String? description;
  final String summary;
  final List<OrcaChartPoint> data;
  final double height;
  final String Function(double) format;
  final String valueLabel;
  final String showTableLabel;
  final String hideTableLabel;
  final bool initiallyShowTable;
  final CustomPainter Function(BuildContext context) painter;

  @override
  State<_ChartFrame> createState() => _ChartFrameState();
}

class _ChartFrameState extends State<_ChartFrame> {
  late bool _table = widget.initiallyShowTable;

  @override
  Widget build(BuildContext context) {
    final OrcaColors c = OrcaTheme.of(context).colors;
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Semantics(
                    header: true,
                    child: Text(
                      widget.title,
                      style: TextStyle(color: c.text, fontWeight: FontWeight.w700, fontSize: OrcaFontSize.md),
                    ),
                  ),
                  if (widget.description != null)
                    Text(widget.description!, style: TextStyle(color: c.textMuted, fontSize: OrcaFontSize.sm)),
                ],
              ),
            ),
            OrcaButton(
              label: _table ? widget.hideTableLabel : widget.showTableLabel,
              variant: OrcaButtonVariant.ghost,
              size: OrcaButtonSize.sm,
              onPressed: () => setState(() => _table = !_table),
            ),
          ],
        ),
        const SizedBox(height: OrcaSpace.sm),
        Semantics(
          container: true,
          image: true,
          label: widget.summary,
          child: ExcludeSemantics(
            child: SizedBox(
              height: widget.height,
              child: CustomPaint(painter: widget.painter(context), size: Size.infinite),
            ),
          ),
        ),
        if (_table) ...<Widget>[
          const SizedBox(height: OrcaSpace.md),
          OrcaDataTable<OrcaChartPoint>(
            caption: widget.title,
            rows: widget.data,
            columns: <OrcaDataColumn<OrcaChartPoint>>[
              OrcaDataColumn<OrcaChartPoint>(
                key: 'label',
                label: widget.title,
                value: (OrcaChartPoint p) => p.label,
              ),
              OrcaDataColumn<OrcaChartPoint>(
                key: 'value',
                label: widget.valueLabel,
                align: OrcaColumnAlign.end,
                value: (OrcaChartPoint p) => p.value,
                cellBuilder: (BuildContext context, OrcaChartPoint p) => Text(
                  widget.format(p.value),
                  style: TextStyle(color: c.text, fontSize: OrcaFontSize.sm),
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}

_ChartColors _chartColors(BuildContext context, Color? color) {
  final OrcaColors c = OrcaTheme.of(context).colors;
  final Color series = color ?? c.primary;
  return _ChartColors(
    series: series,
    soft: Color.alphaBlend(series.withAlpha(0x2E), c.surface),
    grid: c.border,
    label: c.textMuted,
  );
}

/// Bar chart drawn with a [CustomPainter].
///
/// Screen readers get a text summary (count, highest, lowest). A button shows
/// the same data as a table.
class OrcaBarChart extends StatelessWidget {
  /// Creates a bar chart.
  const OrcaBarChart({
    super.key,
    required this.title,
    required this.data,
    this.description,
    this.height = 220,
    this.color,
    this.format = _defaultFormat,
    this.valueLabel = 'Value',
    this.showTableLabel = 'Show table',
    this.hideTableLabel = 'Hide table',
    this.initiallyShowTable = false,
    this.semanticSummary,
  });

  /// Title (heading and accessible name).
  final String title;

  /// Points.
  final List<OrcaChartPoint> data;

  /// Subtitle.
  final String? description;

  /// Plot height.
  final double height;

  /// Bar color. Defaults to the accent.
  final Color? color;

  /// Value formatter for axis, summary and table.
  final String Function(double value) format;

  /// Header of the value column in the table.
  final String valueLabel;

  /// Text of the show-table button.
  final String showTableLabel;

  /// Text of the hide-table button.
  final String hideTableLabel;

  /// Start with the table visible.
  final bool initiallyShowTable;

  /// Overrides the generated summary.
  final String? semanticSummary;

  @override
  Widget build(BuildContext context) {
    final OrcaTheme t = OrcaTheme.of(context);
    return _ChartFrame(
      title: title,
      description: description,
      summary: semanticSummary ?? 'Bar chart. ${orcaDescribeSeries(title, data, format)}',
      data: data,
      height: height,
      format: format,
      valueLabel: valueLabel,
      showTableLabel: showTableLabel,
      hideTableLabel: hideTableLabel,
      initiallyShowTable: initiallyShowTable,
      painter: (BuildContext context) => _BarPainter(
        data: data,
        colors: _chartColors(context, color),
        format: format,
        textDirection: Directionality.of(context),
        textScaler: MediaQuery.textScalerOf(context).clamp(maxScaleFactor: 1.6),
        radius: math.min(t.radii.sm, 6.0),
      ),
    );
  }
}

/// Line chart drawn with a [CustomPainter].
///
/// Screen readers get a summary with the trend. A button shows the same data
/// as a table.
class OrcaLineChart extends StatelessWidget {
  /// Creates a line chart.
  const OrcaLineChart({
    super.key,
    required this.title,
    required this.data,
    this.description,
    this.height = 220,
    this.color,
    this.format = _defaultFormat,
    this.valueLabel = 'Value',
    this.showTableLabel = 'Show table',
    this.hideTableLabel = 'Hide table',
    this.initiallyShowTable = false,
    this.semanticSummary,
  });

  /// Title (heading and accessible name).
  final String title;

  /// Points in order.
  final List<OrcaChartPoint> data;

  /// Subtitle.
  final String? description;

  /// Plot height.
  final double height;

  /// Line color. Defaults to the accent.
  final Color? color;

  /// Value formatter.
  final String Function(double value) format;

  /// Header of the value column in the table.
  final String valueLabel;

  /// Text of the show-table button.
  final String showTableLabel;

  /// Text of the hide-table button.
  final String hideTableLabel;

  /// Start with the table visible.
  final bool initiallyShowTable;

  /// Overrides the generated summary.
  final String? semanticSummary;

  @override
  Widget build(BuildContext context) {
    return _ChartFrame(
      title: title,
      description: description,
      summary: semanticSummary ??
          'Line chart. ${orcaDescribeSeries(title, data, format)} ${orcaTrendSummary(data, format)}'.trim(),
      data: data,
      height: height,
      format: format,
      valueLabel: valueLabel,
      showTableLabel: showTableLabel,
      hideTableLabel: hideTableLabel,
      initiallyShowTable: initiallyShowTable,
      painter: (BuildContext context) => _LinePainter(
        data: data,
        colors: _chartColors(context, color),
        format: format,
        textDirection: Directionality.of(context),
        textScaler: MediaQuery.textScalerOf(context).clamp(maxScaleFactor: 1.6),
      ),
    );
  }
}
