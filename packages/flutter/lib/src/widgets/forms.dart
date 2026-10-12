import 'package:flutter/material.dart';

import '../foundation/group_focus.dart';
import '../foundation/pressable.dart';
import '../theme/colors.dart';
import '../theme/orca_theme.dart';

bool _reduceMotion(BuildContext context) => MediaQuery.maybeDisableAnimationsOf(context) ?? false;

/// An option of [OrcaSelect], [OrcaRadioGroup] and [OrcaSegmented].
@immutable
class OrcaOption<T> {
  /// Creates an option.
  const OrcaOption({required this.value, required this.label, this.disabled = false});

  /// Value.
  final T value;

  /// Visible label.
  final String label;

  /// Not selectable.
  final bool disabled;
}

/// Label above a field, and hint / error below it. Visual only: the field
/// itself exposes the label, hint and error to screen readers.
class _FieldFrame extends StatelessWidget {
  const _FieldFrame({this.label, this.hint, this.error, this.isRequired = false, required this.child});

  final String? label;
  final String? hint;
  final String? error;
  final bool isRequired;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final OrcaColors c = OrcaTheme.of(context).colors;
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        if (label != null)
          Padding(
            padding: const EdgeInsetsDirectional.only(bottom: OrcaSpace.xs),
            child: ExcludeSemantics(
              child: Text.rich(
                TextSpan(
                  text: label,
                  children: <InlineSpan>[
                    if (isRequired) TextSpan(text: ' *', style: TextStyle(color: c.danger)),
                  ],
                ),
                style: TextStyle(color: c.text, fontSize: OrcaFontSize.sm, fontWeight: FontWeight.w600),
              ),
            ),
          ),
        child,
        if (error != null)
          Padding(
            padding: const EdgeInsetsDirectional.only(top: OrcaSpace.xs),
            child: Semantics(
              liveRegion: true,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  ExcludeSemantics(
                    child: Padding(
                      padding: const EdgeInsetsDirectional.only(end: OrcaSpace.xs, top: 1),
                      child: Icon(Icons.error_outline, size: 16, color: c.danger),
                    ),
                  ),
                  Expanded(child: Text(error!, style: TextStyle(color: c.danger, fontSize: OrcaFontSize.sm))),
                ],
              ),
            ),
          )
        else if (hint != null)
          Padding(
            padding: const EdgeInsetsDirectional.only(top: OrcaSpace.xs),
            child: ExcludeSemantics(
              child: Text(hint!, style: TextStyle(color: c.textMuted, fontSize: OrcaFontSize.sm)),
            ),
          ),
      ],
    );
  }
}

String? _fieldLabel(String? label, bool isRequired) =>
    label == null ? null : (isRequired ? '$label, required' : label);

String? _fieldHint(String? hint, String? error) => error != null ? 'Error: $error' : hint;

/// Text field with label, hint and error.
///
/// Screen readers get the label as the field name and the error (or hint) as
/// its description; a new error is also announced (live region).
class OrcaInput extends StatelessWidget {
  /// Creates a text input.
  const OrcaInput({
    super.key,
    this.label,
    this.hint,
    this.error,
    this.placeholder,
    this.controller,
    this.focusNode,
    this.onChanged,
    this.onSubmitted,
    this.keyboardType,
    this.textInputAction,
    this.autofillHints,
    this.obscureText = false,
    this.enabled = true,
    this.readOnly = false,
    this.autofocus = false,
    this.isRequired = false,
    this.maxLines = 1,
    this.minLines,
    this.maxLength,
    this.prefixIcon,
    this.suffixIcon,
  });

  /// Visible label and accessible name.
  final String? label;

  /// Help text below the field.
  final String? hint;

  /// Error text. Replaces [hint] and turns the border red.
  final String? error;

  /// Placeholder inside the empty field.
  final String? placeholder;

  /// Controller.
  final TextEditingController? controller;

  /// Focus node.
  final FocusNode? focusNode;

  /// Change callback.
  final ValueChanged<String>? onChanged;

  /// Submit callback.
  final ValueChanged<String>? onSubmitted;

  /// Keyboard type.
  final TextInputType? keyboardType;

  /// Keyboard action button.
  final TextInputAction? textInputAction;

  /// Autofill hints.
  final Iterable<String>? autofillHints;

  /// Hide the text (passwords).
  final bool obscureText;

  /// Enabled.
  final bool enabled;

  /// Read only.
  final bool readOnly;

  /// Autofocus.
  final bool autofocus;

  /// Marks the field as required (visible asterisk, announced "required").
  final bool isRequired;

  /// Max lines (null grows without limit).
  final int? maxLines;

  /// Min lines.
  final int? minLines;

  /// Max characters.
  final int? maxLength;

  /// Leading icon.
  final Widget? prefixIcon;

  /// Trailing icon.
  final Widget? suffixIcon;

  @override
  Widget build(BuildContext context) {
    final OrcaTheme t = OrcaTheme.of(context);
    final OrcaColors c = t.colors;
    final bool hasError = error != null;
    OutlineInputBorder border(Color color, double width) => OutlineInputBorder(
          borderRadius: BorderRadius.circular(t.radii.md),
          borderSide: BorderSide(color: color, width: width),
        );
    final bool multiline = maxLines == null || maxLines! > 1;
    return _FieldFrame(
      label: label,
      hint: hint,
      error: error,
      isRequired: isRequired,
      child: Semantics(
        container: true,
        label: _fieldLabel(label, isRequired),
        hint: _fieldHint(hint, error),
        child: Material(
          type: MaterialType.transparency,
          child: TextField(
            controller: controller,
            focusNode: focusNode,
            onChanged: onChanged,
            onSubmitted: onSubmitted,
            keyboardType: keyboardType ?? (multiline ? TextInputType.multiline : null),
            textInputAction: textInputAction,
            autofillHints: autofillHints,
            obscureText: obscureText,
            enabled: enabled,
            readOnly: readOnly,
            autofocus: autofocus,
            maxLines: obscureText ? 1 : maxLines,
            minLines: minLines,
            maxLength: maxLength,
            style: TextStyle(color: c.text, fontSize: OrcaFontSize.md),
            cursorColor: c.primary,
            decoration: InputDecoration(
              hintText: placeholder,
              hintStyle: TextStyle(color: c.textMuted),
              filled: true,
              fillColor: enabled ? c.surface : c.surfaceAlt,
              isDense: false,
              constraints: const BoxConstraints(minHeight: orcaMinTapTarget),
              contentPadding: const EdgeInsetsDirectional.symmetric(horizontal: OrcaSpace.md, vertical: OrcaSpace.md),
              prefixIcon: prefixIcon == null ? null : ExcludeSemantics(child: prefixIcon),
              suffixIcon: suffixIcon,
              border: border(c.controlBorder, t.borderWidth),
              enabledBorder: border(hasError ? c.danger : c.controlBorder, hasError ? 2 : t.borderWidth),
              focusedBorder: border(hasError ? c.danger : c.focus, 2),
              disabledBorder: border(c.border, 1),
            ),
          ),
        ),
      ),
    );
  }
}

/// Multi-line [OrcaInput].
class OrcaTextarea extends StatelessWidget {
  /// Creates a textarea.
  const OrcaTextarea({
    super.key,
    this.label,
    this.hint,
    this.error,
    this.placeholder,
    this.controller,
    this.focusNode,
    this.onChanged,
    this.enabled = true,
    this.isRequired = false,
    this.minLines = 3,
    this.maxLines = 8,
    this.maxLength,
  });

  /// See [OrcaInput.label].
  final String? label;

  /// See [OrcaInput.hint].
  final String? hint;

  /// See [OrcaInput.error].
  final String? error;

  /// See [OrcaInput.placeholder].
  final String? placeholder;

  /// Controller.
  final TextEditingController? controller;

  /// Focus node.
  final FocusNode? focusNode;

  /// Change callback.
  final ValueChanged<String>? onChanged;

  /// Enabled.
  final bool enabled;

  /// Required.
  final bool isRequired;

  /// Minimum visible lines.
  final int minLines;

  /// Maximum visible lines before scrolling (null grows without limit).
  final int? maxLines;

  /// Max characters.
  final int? maxLength;

  @override
  Widget build(BuildContext context) {
    return OrcaInput(
      label: label,
      hint: hint,
      error: error,
      placeholder: placeholder,
      controller: controller,
      focusNode: focusNode,
      onChanged: onChanged,
      enabled: enabled,
      isRequired: isRequired,
      minLines: minLines,
      maxLines: maxLines,
      maxLength: maxLength,
      keyboardType: TextInputType.multiline,
      textInputAction: TextInputAction.newline,
    );
  }
}

/// Picker that opens a bottom sheet of options (the mobile pattern for a dropdown).
class OrcaSelect<T> extends StatelessWidget {
  /// Creates a select.
  const OrcaSelect({
    super.key,
    required this.options,
    required this.onChanged,
    this.value,
    this.label,
    this.hint,
    this.error,
    this.placeholder = 'Select…',
    this.isRequired = false,
    this.enabled = true,
  });

  /// Options.
  final List<OrcaOption<T>> options;

  /// Selection callback.
  final ValueChanged<T> onChanged;

  /// Selected value.
  final T? value;

  /// Label (also the sheet title).
  final String? label;

  /// Hint.
  final String? hint;

  /// Error.
  final String? error;

  /// Shown when nothing is selected.
  final String placeholder;

  /// Required.
  final bool isRequired;

  /// Enabled.
  final bool enabled;

  OrcaOption<T>? get _selected {
    for (final OrcaOption<T> o in options) {
      if (o.value == value) return o;
    }
    return null;
  }

  Future<void> _open(BuildContext context) async {
    final OrcaColors c = OrcaTheme.of(context).colors;
    final T? result = await showModalBottomSheet<T>(
      context: context,
      backgroundColor: c.surface,
      barrierColor: c.overlay,
      showDragHandle: true,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (BuildContext sheetContext) => _SelectSheet<T>(
        title: label ?? placeholder,
        options: options,
        value: value,
      ),
    );
    if (result != null) onChanged(result);
  }

  @override
  Widget build(BuildContext context) {
    final OrcaTheme t = OrcaTheme.of(context);
    final OrcaColors c = t.colors;
    final OrcaOption<T>? selected = _selected;
    final bool hasError = error != null;
    return _FieldFrame(
      label: label,
      hint: hint,
      error: error,
      isRequired: isRequired,
      child: OrcaPressable(
        onPressed: enabled ? () => _open(context) : null,
        borderRadius: BorderRadius.circular(t.radii.md),
        semanticLabel: _fieldLabel(label ?? placeholder, isRequired),
        semanticValue: selected?.label ?? 'Nothing selected',
        semanticHint: _fieldHint(hint, error),
        excludeChildSemantics: true,
        child: Container(
          constraints: const BoxConstraints(minHeight: orcaMinTapTarget),
          padding: const EdgeInsetsDirectional.only(start: OrcaSpace.md, end: OrcaSpace.sm),
          decoration: BoxDecoration(
            color: enabled ? c.surface : c.surfaceAlt,
            borderRadius: BorderRadius.circular(t.radii.md),
            border: Border.all(
              color: hasError ? c.danger : (enabled ? c.controlBorder : c.border),
              width: hasError ? 2 : t.borderWidth,
            ),
          ),
          child: Row(
            children: <Widget>[
              Expanded(
                child: Text(
                  selected?.label ?? placeholder,
                  style: TextStyle(color: selected == null ? c.textMuted : c.text, fontSize: OrcaFontSize.md),
                ),
              ),
              Icon(Icons.expand_more, color: c.textMuted),
            ],
          ),
        ),
      ),
    );
  }
}

class _SelectSheet<T> extends StatelessWidget {
  const _SelectSheet({required this.title, required this.options, required this.value});

  final String title;
  final List<OrcaOption<T>> options;
  final T? value;

  @override
  Widget build(BuildContext context) {
    final OrcaColors c = OrcaTheme.of(context).colors;
    final int selectedIndex = options.indexWhere((OrcaOption<T> o) => o.value == value);
    return Semantics(
      scopesRoute: true,
      namesRoute: true,
      explicitChildNodes: true,
      label: title,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.7),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Padding(
              padding: const EdgeInsetsDirectional.fromSTEB(OrcaSpace.lg, 0, OrcaSpace.lg, OrcaSpace.sm),
              child: Semantics(
                header: true,
                child: Text(title, style: TextStyle(color: c.text, fontWeight: FontWeight.w700, fontSize: OrcaFontSize.lg)),
              ),
            ),
            Flexible(
              child: ListView.builder(
                shrinkWrap: true,
                padding: const EdgeInsetsDirectional.only(bottom: OrcaSpace.lg),
                itemCount: options.length,
                itemBuilder: (BuildContext context, int i) {
                  final OrcaOption<T> o = options[i];
                  final bool selected = i == selectedIndex;
                  return OrcaPressable(
                    autofocus: selected || (selectedIndex < 0 && i == 0),
                    onPressed: o.disabled ? null : () => Navigator.of(context).pop<T>(o.value),
                    selected: selected,
                    inMutuallyExclusiveGroup: true,
                    semanticHint: 'Item ${i + 1} of ${options.length}',
                    child: Container(
                      color: selected ? c.primarySoft : null,
                      padding: const EdgeInsetsDirectional.symmetric(horizontal: OrcaSpace.lg, vertical: OrcaSpace.md),
                      child: Row(
                        children: <Widget>[
                          Expanded(
                            child: Text(
                              o.label,
                              style: TextStyle(
                                color: o.disabled ? c.textMuted : (selected ? c.primaryInk : c.text),
                                fontWeight: selected ? FontWeight.w700 : FontWeight.w400,
                                fontSize: OrcaFontSize.md,
                              ),
                            ),
                          ),
                          if (selected) ExcludeSemantics(child: Icon(Icons.check, color: c.primaryInk)),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Checkbox with a label. The whole row is the hit target.
class OrcaCheckbox extends StatelessWidget {
  /// Creates a checkbox.
  const OrcaCheckbox({super.key, required this.value, required this.onChanged, this.label, this.description, this.semanticLabel});

  /// Checked state. Null shows the indeterminate (mixed) state.
  final bool? value;

  /// Called with the new value. Null disables the checkbox.
  final ValueChanged<bool>? onChanged;

  /// Visible label.
  final String? label;

  /// Supporting text under the label.
  final String? description;

  /// Accessible name when there is no visible label.
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final OrcaTheme t = OrcaTheme.of(context);
    final OrcaColors c = t.colors;
    final bool on = value ?? false;
    final bool filled = value != false;
    final bool enabled = onChanged != null;
    return OrcaPressable(
      button: false,
      checked: value ?? false,
      onPressed: enabled ? () => onChanged!(!on) : null,
      borderRadius: BorderRadius.circular(t.radii.sm),
      semanticLabel: semanticLabel,
      semanticValue: value == null ? 'Mixed' : null,
      child: Opacity(
        opacity: enabled ? 1 : 0.55,
        child: Padding(
          padding: const EdgeInsetsDirectional.symmetric(horizontal: OrcaSpace.xs, vertical: OrcaSpace.sm),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              ExcludeSemantics(
                child: Container(
                  width: 22,
                  height: 22,
                  margin: const EdgeInsetsDirectional.only(top: 1),
                  decoration: BoxDecoration(
                    color: filled ? c.primary : c.surface,
                    borderRadius: BorderRadius.circular(t.radii.sm > 6 ? 6 : t.radii.sm),
                    border: Border.all(color: filled ? c.primary : c.controlBorder, width: t.borderWidth + 0.5),
                  ),
                  child: filled
                      ? Icon(value == null ? Icons.remove : Icons.check, size: 16, color: c.onPrimary)
                      : null,
                ),
              ),
              if (label != null || description != null) const SizedBox(width: OrcaSpace.sm),
              if (label != null || description != null)
                Flexible(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      if (label != null) Text(label!, style: TextStyle(color: c.text, fontSize: OrcaFontSize.md)),
                      if (description != null)
                        Text(description!, style: TextStyle(color: c.textMuted, fontSize: OrcaFontSize.sm)),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// On/off switch with a label. The whole row toggles.
class OrcaSwitch extends StatelessWidget {
  /// Creates a switch.
  const OrcaSwitch({super.key, required this.value, required this.onChanged, required this.label, this.description});

  /// On.
  final bool value;

  /// Called with the new value. Null disables the switch.
  final ValueChanged<bool>? onChanged;

  /// Label (accessible name).
  final String label;

  /// Supporting text.
  final String? description;

  @override
  Widget build(BuildContext context) {
    final OrcaTheme t = OrcaTheme.of(context);
    final OrcaColors c = t.colors;
    final bool enabled = onChanged != null;
    final Duration duration = _reduceMotion(context) ? Duration.zero : const Duration(milliseconds: 160);
    return OrcaPressable(
      button: false,
      toggled: value,
      onPressed: enabled ? () => onChanged!(!value) : null,
      borderRadius: BorderRadius.circular(t.radii.sm),
      child: Opacity(
        opacity: enabled ? 1 : 0.55,
        child: Padding(
          padding: const EdgeInsetsDirectional.symmetric(horizontal: OrcaSpace.xs, vertical: OrcaSpace.sm),
          child: Row(
            children: <Widget>[
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(label, style: TextStyle(color: c.text, fontSize: OrcaFontSize.md)),
                    if (description != null)
                      Text(description!, style: TextStyle(color: c.textMuted, fontSize: OrcaFontSize.sm)),
                  ],
                ),
              ),
              const SizedBox(width: OrcaSpace.md),
              ExcludeSemantics(
                child: AnimatedContainer(
                  duration: duration,
                  width: 44,
                  height: 26,
                  padding: const EdgeInsets.all(3),
                  decoration: BoxDecoration(
                    color: value ? c.primary : c.surfaceMuted,
                    borderRadius: BorderRadius.circular(13),
                    border: Border.all(color: value ? c.primary : c.controlBorder, width: t.borderWidth),
                  ),
                  child: AnimatedAlign(
                    duration: duration,
                    alignment: value ? AlignmentDirectional.centerEnd : AlignmentDirectional.centerStart,
                    child: Container(
                      width: 18,
                      height: 18,
                      decoration: BoxDecoration(
                        color: value ? c.onPrimary : c.controlBorder,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Group of radio buttons. Arrow keys move the selection (like the web).
class OrcaRadioGroup<T> extends StatefulWidget {
  /// Creates a radio group.
  const OrcaRadioGroup({super.key, required this.options, required this.value, required this.onChanged, this.label});

  /// Options.
  final List<OrcaOption<T>> options;

  /// Selected value.
  final T? value;

  /// Selection callback. Null disables the group.
  final ValueChanged<T>? onChanged;

  /// Group label.
  final String? label;

  @override
  State<OrcaRadioGroup<T>> createState() => _OrcaRadioGroupState<T>();
}

class _OrcaRadioGroupState<T> extends State<OrcaRadioGroup<T>> {
  final OrcaGroupFocus _focus = OrcaGroupFocus('OrcaRadio');

  @override
  void dispose() {
    _focus.dispose();
    super.dispose();
  }

  bool _enabled(int i) => widget.onChanged != null && !widget.options[i].disabled;

  void _select(int i) {
    if (i < 0 || !_enabled(i)) return;
    widget.onChanged!(widget.options[i].value);
    _focus[i].requestFocus();
  }

  @override
  Widget build(BuildContext context) {
    final OrcaTheme t = OrcaTheme.of(context);
    final OrcaColors c = t.colors;
    final int selectedIndex = widget.options.indexWhere((OrcaOption<T> o) => o.value == widget.value);
    final int tabStop = selectedIndex >= 0 ? selectedIndex : orcaEdgeEnabled(false, widget.options.length, _enabled);
    final int length = widget.options.length;
    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: widget.label,
      child: OrcaArrowKeys(
        vertical: true,
        onMove: (int delta) {
          final int from = _focus.focusedIndex >= 0 ? _focus.focusedIndex : tabStop;
          _select(orcaNextEnabled(from, delta, length, _enabled));
        },
        onEdge: (bool last) => _select(orcaEdgeEnabled(last, length, _enabled)),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            if (widget.label != null)
              Padding(
                padding: const EdgeInsetsDirectional.only(bottom: OrcaSpace.xs),
                child: ExcludeSemantics(
                  child: Text(
                    widget.label!,
                    style: TextStyle(color: c.text, fontSize: OrcaFontSize.sm, fontWeight: FontWeight.w600),
                  ),
                ),
              ),
            for (int i = 0; i < length; i++)
              Builder(builder: (BuildContext context) {
                final OrcaOption<T> o = widget.options[i];
                final bool selected = i == selectedIndex;
                final FocusNode node = _focus[i]..skipTraversal = i != tabStop;
                return OrcaPressable(
                  button: false,
                  focusNode: node,
                  checked: selected,
                  inMutuallyExclusiveGroup: true,
                  semanticHint: '${i + 1} of $length',
                  onPressed: _enabled(i) ? () => _select(i) : null,
                  borderRadius: BorderRadius.circular(t.radii.sm),
                  child: Opacity(
                    opacity: _enabled(i) ? 1 : 0.55,
                    child: Padding(
                      padding: const EdgeInsetsDirectional.symmetric(horizontal: OrcaSpace.xs, vertical: OrcaSpace.sm),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: <Widget>[
                          ExcludeSemantics(
                            child: Container(
                              width: 22,
                              height: 22,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: selected ? c.primary : c.controlBorder,
                                  width: t.borderWidth + 0.5,
                                ),
                              ),
                              child: selected
                                  ? Container(
                                      width: 11,
                                      height: 11,
                                      decoration: BoxDecoration(color: c.primary, shape: BoxShape.circle),
                                    )
                                  : null,
                            ),
                          ),
                          const SizedBox(width: OrcaSpace.sm),
                          Flexible(child: Text(o.label, style: TextStyle(color: c.text, fontSize: OrcaFontSize.md))),
                        ],
                      ),
                    ),
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
}

/// Segmented control: a compact single choice. Arrow keys move the selection.
class OrcaSegmented<T> extends StatefulWidget {
  /// Creates a segmented control.
  const OrcaSegmented({super.key, required this.options, required this.value, required this.onChanged, this.label});

  /// Options.
  final List<OrcaOption<T>> options;

  /// Selected value.
  final T value;

  /// Selection callback.
  final ValueChanged<T> onChanged;

  /// Group label.
  final String? label;

  @override
  State<OrcaSegmented<T>> createState() => _OrcaSegmentedState<T>();
}

class _OrcaSegmentedState<T> extends State<OrcaSegmented<T>> {
  final OrcaGroupFocus _focus = OrcaGroupFocus('OrcaSegment');

  @override
  void dispose() {
    _focus.dispose();
    super.dispose();
  }

  bool _enabled(int i) => !widget.options[i].disabled;

  void _select(int i) {
    if (i < 0 || !_enabled(i)) return;
    widget.onChanged(widget.options[i].value);
    _focus[i].requestFocus();
  }

  @override
  Widget build(BuildContext context) {
    final OrcaTheme t = OrcaTheme.of(context);
    final OrcaColors c = t.colors;
    final int length = widget.options.length;
    final int selectedIndex = widget.options.indexWhere((OrcaOption<T> o) => o.value == widget.value);
    final int tabStop = selectedIndex >= 0 ? selectedIndex : orcaEdgeEnabled(false, length, _enabled);
    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: widget.label,
      child: OrcaArrowKeys(
        onMove: (int delta) {
          final int from = _focus.focusedIndex >= 0 ? _focus.focusedIndex : tabStop;
          _select(orcaNextEnabled(from, delta, length, _enabled));
        },
        onEdge: (bool last) => _select(orcaEdgeEnabled(last, length, _enabled)),
        child: Container(
          decoration: BoxDecoration(
            color: c.surfaceMuted,
            borderRadius: BorderRadius.circular(t.radii.md),
            border: t.isHighContrast ? Border.all(color: c.controlBorder) : null,
          ),
          child: Row(
            children: <Widget>[
              for (int i = 0; i < length; i++)
                Expanded(
                  child: OrcaPressable(
                    focusNode: _focus[i]..skipTraversal = i != tabStop,
                    requestFocusOnTap: true,
                    selected: i == selectedIndex,
                    inMutuallyExclusiveGroup: true,
                    semanticHint: '${i + 1} of $length',
                    onPressed: _enabled(i) ? () => _select(i) : null,
                    borderRadius: BorderRadius.circular(t.radii.sm),
                    child: Container(
                      alignment: Alignment.center,
                      margin: const EdgeInsets.all(3),
                      padding: const EdgeInsetsDirectional.symmetric(horizontal: OrcaSpace.sm, vertical: OrcaSpace.xs),
                      decoration: BoxDecoration(
                        color: i == selectedIndex ? c.surface : null,
                        borderRadius: BorderRadius.circular(t.radii.sm),
                        border: i == selectedIndex && t.isHighContrast ? Border.all(color: c.controlBorder, width: 2) : null,
                      ),
                      child: Text(
                        widget.options[i].label,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: i == selectedIndex ? c.text : (_enabled(i) ? c.textMuted : c.border),
                          fontWeight: FontWeight.w600,
                          fontSize: OrcaFontSize.sm,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Slider with a visible label and value.
class OrcaSlider extends StatelessWidget {
  /// Creates a slider.
  const OrcaSlider({
    super.key,
    required this.value,
    required this.onChanged,
    required this.label,
    this.min = 0,
    this.max = 100,
    this.divisions,
    this.format,
    this.showValue = true,
  });

  /// Current value.
  final double value;

  /// Change callback. Null disables the slider.
  final ValueChanged<double>? onChanged;

  /// Label (accessible name).
  final String label;

  /// Minimum.
  final double min;

  /// Maximum.
  final double max;

  /// Number of discrete steps.
  final int? divisions;

  /// Formats the value for display and screen readers.
  final String Function(double value)? format;

  /// Show the value next to the label.
  final bool showValue;

  String _format(double v) =>
      format?.call(v) ?? (v == v.roundToDouble() ? v.toInt().toString() : v.toStringAsFixed(1));

  @override
  Widget build(BuildContext context) {
    final OrcaTheme t = OrcaTheme.of(context);
    final OrcaColors c = t.colors;
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        ExcludeSemantics(
          child: Row(
            children: <Widget>[
              Expanded(
                child: Text(label, style: TextStyle(color: c.text, fontSize: OrcaFontSize.sm, fontWeight: FontWeight.w600)),
              ),
              if (showValue) Text(_format(value), style: TextStyle(color: c.textMuted, fontSize: OrcaFontSize.sm)),
            ],
          ),
        ),
        Semantics(
          container: true,
          label: label,
          child: Material(
            type: MaterialType.transparency,
            child: SliderTheme(
              data: SliderTheme.of(context).copyWith(
                activeTrackColor: c.primary,
                inactiveTrackColor: c.surfaceMuted,
                thumbColor: c.primary,
                overlayColor: c.primary.withAlpha(0x29),
              ),
              child: Slider(
                value: value.clamp(min, max).toDouble(),
                min: min,
                max: max,
                divisions: divisions,
                onChanged: onChanged,
                semanticFormatterCallback: _format,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
