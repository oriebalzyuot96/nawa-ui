import 'package:flutter/material.dart';
import 'package:orca_ui/orca_ui.dart';

void main() => runApp(const GalleryApp());

/// Root: holds the theme settings and passes them to [OrcaApp].
class GalleryApp extends StatefulWidget {
  const GalleryApp({super.key});

  @override
  State<GalleryApp> createState() => _GalleryAppState();
}

class _GalleryAppState extends State<GalleryApp> {
  OrcaThemeMode _mode = OrcaThemeMode.system;
  OrcaAccent _accent = orcaDefaultAccent;
  OrcaShape _shape = orcaDefaultShape;
  bool _rtl = false;

  @override
  Widget build(BuildContext context) {
    return OrcaApp(
      title: 'Orca UI gallery',
      mode: _mode,
      accent: _accent,
      shape: _shape,
      builder: (BuildContext context, Widget? child) => Directionality(
        textDirection: _rtl ? TextDirection.rtl : TextDirection.ltr,
        child: child ?? const SizedBox.shrink(),
      ),
      home: GalleryPage(
        mode: _mode,
        accent: _accent,
        shape: _shape,
        rtl: _rtl,
        onMode: (OrcaThemeMode v) => setState(() => _mode = v),
        onAccent: (OrcaAccent v) => setState(() => _accent = v),
        onShape: (OrcaShape v) => setState(() => _shape = v),
        onRtl: (bool v) => setState(() => _rtl = v),
      ),
    );
  }
}

class GalleryPage extends StatefulWidget {
  const GalleryPage({
    super.key,
    required this.mode,
    required this.accent,
    required this.shape,
    required this.rtl,
    required this.onMode,
    required this.onAccent,
    required this.onShape,
    required this.onRtl,
  });

  final OrcaThemeMode mode;
  final OrcaAccent accent;
  final OrcaShape shape;
  final bool rtl;
  final ValueChanged<OrcaThemeMode> onMode;
  final ValueChanged<OrcaAccent> onAccent;
  final ValueChanged<OrcaShape> onShape;
  final ValueChanged<bool> onRtl;

  @override
  State<GalleryPage> createState() => _GalleryPageState();
}

typedef _Member = ({String name, String role, int commits});

class _GalleryPageState extends State<GalleryPage> {
  bool _saving = false;
  bool _agree = true;
  bool _notifications = false;
  String _plan = 'pro';
  String _view = 'grid';
  String? _country;
  double _volume = 40;
  int _page = 3;
  bool _tableLoading = false;
  final List<String> _tags = <String>['Design', 'Flutter', 'Accessibility'];
  final TextEditingController _email = TextEditingController();
  String? _emailError;

  static const List<_Member> _members = <_Member>[
    (name: 'Lina Haddad', role: 'Design', commits: 128),
    (name: 'Omar Saleh', role: 'Engineering', commits: 342),
    (name: 'Sara Nasser', role: 'Research', commits: 57),
    (name: 'Yousef Karim', role: 'Engineering', commits: 211),
  ];

  static const List<OrcaChartPoint> _revenue = <OrcaChartPoint>[
    OrcaChartPoint('Jan', 12),
    OrcaChartPoint('Feb', 18),
    OrcaChartPoint('Mar', 15),
    OrcaChartPoint('Apr', 26),
    OrcaChartPoint('May', 31),
    OrcaChartPoint('Jun', 42),
  ];

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    await Future<void>.delayed(const Duration(seconds: 2));
    if (!mounted) return;
    setState(() => _saving = false);
    showOrcaToast(context, title: 'Saved', message: 'Your changes were saved.', tone: OrcaTone.success);
  }

  Future<void> _confirmDelete() async {
    final bool? confirmed = await showOrcaDialog<bool>(
      context: context,
      title: 'Delete project?',
      builder: (BuildContext context) => const Text('This removes the project and its history. It cannot be undone.'),
      actionsBuilder: (BuildContext dialogContext) => <Widget>[
        OrcaButton(
          label: 'Cancel',
          variant: OrcaButtonVariant.secondary,
          onPressed: () => Navigator.of(dialogContext).pop(false),
        ),
        OrcaButton(
          label: 'Delete',
          variant: OrcaButtonVariant.danger,
          onPressed: () => Navigator.of(dialogContext).pop(true),
        ),
      ],
    );
    if (!mounted || confirmed != true) return;
    showOrcaToast(context, message: 'Project deleted.', tone: OrcaTone.danger, actionLabel: 'Undo', onAction: () {});
  }

  void _openDrawer() {
    showOrcaDrawer<void>(
      context: context,
      title: 'Filters',
      builder: (BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          OrcaCheckbox(value: true, onChanged: (bool v) {}, label: 'Open issues'),
          OrcaCheckbox(value: false, onChanged: (bool v) {}, label: 'Closed issues'),
        ],
      ),
      actionsBuilder: (BuildContext dialogContext) => <Widget>[
        OrcaButton(label: 'Apply', onPressed: () => Navigator.of(dialogContext).pop()),
      ],
    );
  }

  Widget _section(String title, List<Widget> children) {
    return Padding(
      padding: const EdgeInsetsDirectional.only(bottom: OrcaSpace.xl),
      child: OrcaCard(
        title: title,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            for (int i = 0; i < children.length; i++) ...<Widget>[
              if (i > 0) const SizedBox(height: OrcaSpace.lg),
              children[i],
            ],
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final OrcaColors c = OrcaTheme.of(context).colors;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Orca UI'),
        backgroundColor: c.surface,
        foregroundColor: c.text,
        surfaceTintColor: const Color(0x00000000),
        actions: <Widget>[
          OrcaTooltip(
            message: 'Filters',
            child: IconButton(
              icon: const Icon(Icons.tune),
              onPressed: _openDrawer,
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 820),
            child: ListView(
              padding: const EdgeInsetsDirectional.all(OrcaSpace.lg),
              children: <Widget>[
                _section('Theme', <Widget>[
                  OrcaSegmented<OrcaThemeMode>(
                    label: 'Mode',
                    value: widget.mode,
                    onChanged: widget.onMode,
                    options: const <OrcaOption<OrcaThemeMode>>[
                      OrcaOption<OrcaThemeMode>(value: OrcaThemeMode.system, label: 'System'),
                      OrcaOption<OrcaThemeMode>(value: OrcaThemeMode.light, label: 'Light'),
                      OrcaOption<OrcaThemeMode>(value: OrcaThemeMode.dark, label: 'Dark'),
                      OrcaOption<OrcaThemeMode>(value: OrcaThemeMode.hc, label: 'High contrast'),
                    ],
                  ),
                  OrcaSelect<OrcaAccent>(
                    label: 'Accent',
                    value: widget.accent,
                    onChanged: widget.onAccent,
                    options: <OrcaOption<OrcaAccent>>[
                      for (final OrcaAccent a in OrcaAccent.values) OrcaOption<OrcaAccent>(value: a, label: a.name),
                    ],
                  ),
                  OrcaSegmented<OrcaShape>(
                    label: 'Shape',
                    value: widget.shape,
                    onChanged: widget.onShape,
                    options: <OrcaOption<OrcaShape>>[
                      for (final OrcaShape s in OrcaShape.values) OrcaOption<OrcaShape>(value: s, label: s.name),
                    ],
                  ),
                  OrcaSwitch(label: 'Right-to-left layout', value: widget.rtl, onChanged: widget.onRtl),
                ]),
                _section('Buttons', <Widget>[
                  Wrap(
                    spacing: OrcaSpace.sm,
                    runSpacing: OrcaSpace.sm,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: <Widget>[
                      OrcaButton(label: 'Save', loading: _saving, onPressed: _save),
                      OrcaButton(label: 'Secondary', variant: OrcaButtonVariant.secondary, onPressed: () {}),
                      OrcaButton(label: 'Outline', variant: OrcaButtonVariant.outline, onPressed: () {}),
                      OrcaButton(label: 'Ghost', variant: OrcaButtonVariant.ghost, onPressed: () {}),
                      OrcaButton(label: 'Delete', variant: OrcaButtonVariant.danger, onPressed: _confirmDelete),
                      const OrcaButton(label: 'Disabled'),
                      OrcaButton(
                        label: 'Small',
                        size: OrcaButtonSize.sm,
                        icon: const Icon(Icons.add),
                        onPressed: () {},
                      ),
                      OrcaButton(label: 'Large', size: OrcaButtonSize.lg, onPressed: () {}),
                    ],
                  ),
                  OrcaButton(label: 'Open drawer', block: true, variant: OrcaButtonVariant.outline, onPressed: _openDrawer),
                ]),
                _section('Forms', <Widget>[
                  OrcaInput(
                    label: 'Email',
                    placeholder: 'you@example.com',
                    hint: 'We never share your email.',
                    error: _emailError,
                    isRequired: true,
                    controller: _email,
                    keyboardType: TextInputType.emailAddress,
                    autofillHints: const <String>[AutofillHints.email],
                    onChanged: (String v) => setState(() {
                      _emailError = v.isEmpty || v.contains('@') ? null : 'Enter a valid email address.';
                    }),
                  ),
                  const OrcaTextarea(label: 'Message', placeholder: 'Write something…'),
                  OrcaSelect<String>(
                    label: 'Country',
                    value: _country,
                    onChanged: (String v) => setState(() => _country = v),
                    options: const <OrcaOption<String>>[
                      OrcaOption<String>(value: 'jo', label: 'Jordan'),
                      OrcaOption<String>(value: 'ae', label: 'United Arab Emirates'),
                      OrcaOption<String>(value: 'eg', label: 'Egypt'),
                      OrcaOption<String>(value: 'ma', label: 'Morocco'),
                    ],
                  ),
                  OrcaCheckbox(
                    value: _agree,
                    onChanged: (bool v) => setState(() => _agree = v),
                    label: 'I agree to the terms',
                    description: 'You can change this later in settings.',
                  ),
                  OrcaSwitch(
                    label: 'Notifications',
                    description: 'Email me about new comments',
                    value: _notifications,
                    onChanged: (bool v) => setState(() => _notifications = v),
                  ),
                  OrcaRadioGroup<String>(
                    label: 'Plan',
                    value: _plan,
                    onChanged: (String v) => setState(() => _plan = v),
                    options: const <OrcaOption<String>>[
                      OrcaOption<String>(value: 'free', label: 'Free'),
                      OrcaOption<String>(value: 'pro', label: 'Pro'),
                      OrcaOption<String>(value: 'team', label: 'Team (coming soon)', disabled: true),
                    ],
                  ),
                  OrcaSegmented<String>(
                    label: 'View',
                    value: _view,
                    onChanged: (String v) => setState(() => _view = v),
                    options: const <OrcaOption<String>>[
                      OrcaOption<String>(value: 'grid', label: 'Grid'),
                      OrcaOption<String>(value: 'list', label: 'List'),
                      OrcaOption<String>(value: 'board', label: 'Board'),
                    ],
                  ),
                  OrcaSlider(
                    label: 'Volume',
                    value: _volume,
                    divisions: 20,
                    format: (double v) => '${v.round()}%',
                    onChanged: (double v) => setState(() => _volume = v),
                  ),
                ]),
                _section('Display', <Widget>[
                  const Wrap(
                    spacing: OrcaSpace.sm,
                    runSpacing: OrcaSpace.sm,
                    children: <Widget>[
                      OrcaBadge(label: 'Neutral'),
                      OrcaBadge(label: 'New', tone: OrcaTone.primary),
                      OrcaBadge(label: 'Info', tone: OrcaTone.info),
                      OrcaBadge(label: 'Paid', tone: OrcaTone.success),
                      OrcaBadge(label: 'Pending', tone: OrcaTone.warning),
                      OrcaBadge(label: 'Overdue', tone: OrcaTone.danger),
                    ],
                  ),
                  Wrap(
                    spacing: OrcaSpace.sm,
                    runSpacing: OrcaSpace.sm,
                    children: <Widget>[
                      for (final String tag in _tags)
                        OrcaTag(label: tag, onRemove: () => setState(() => _tags.remove(tag))),
                      const OrcaTag(label: 'Read only'),
                    ],
                  ),
                  const Row(
                    children: <Widget>[
                      OrcaAvatar(name: 'Lina Haddad', size: OrcaAvatarSize.sm),
                      SizedBox(width: OrcaSpace.sm),
                      OrcaAvatar(name: 'Omar Saleh'),
                      SizedBox(width: OrcaSpace.sm),
                      OrcaAvatar(name: 'Sara Nasser', size: OrcaAvatarSize.lg),
                      SizedBox(width: OrcaSpace.lg),
                      OrcaSpinner(),
                      SizedBox(width: OrcaSpace.sm),
                      OrcaTooltip(message: 'Shown on hover, focus and long press', child: Icon(Icons.info_outline)),
                    ],
                  ),
                  const OrcaAlert(
                    tone: OrcaTone.success,
                    title: 'Payment received',
                    message: 'We emailed you a receipt.',
                  ),
                  OrcaAlert(
                    tone: OrcaTone.warning,
                    title: 'Storage almost full',
                    message: 'You have used 92% of your storage.',
                    onDismiss: () {},
                  ),
                  const OrcaDivider(label: 'or'),
                  const OrcaProgressBar(value: 64, label: 'Upload', showValue: true),
                  const OrcaProgressBar(label: 'Syncing'),
                  const OrcaStepper(
                    current: 1,
                    steps: <OrcaStep>[
                      OrcaStep(label: 'Account', description: 'Email and password'),
                      OrcaStep(label: 'Profile'),
                      OrcaStep(label: 'Review'),
                    ],
                  ),
                  const OrcaTimeline(
                    items: <OrcaTimelineItem>[
                      OrcaTimelineItem(title: 'Order placed', time: '09:12', tone: OrcaTone.info),
                      OrcaTimelineItem(title: 'Payment confirmed', time: '09:14', tone: OrcaTone.success),
                      OrcaTimelineItem(title: 'Shipped', time: '14:30', description: 'Tracking number sent by email'),
                    ],
                  ),
                  const OrcaSkeletonCard(),
                  const OrcaSkeletonText(lines: 2),
                  const OrcaEmptyState(
                    icon: Icon(Icons.inbox_outlined),
                    title: 'No messages',
                    description: 'New messages will appear here.',
                  ),
                ]),
                _section('Navigation', <Widget>[
                  OrcaBreadcrumb(
                    items: <OrcaBreadcrumbItem>[
                      OrcaBreadcrumbItem(label: 'Home', onPressed: () {}),
                      OrcaBreadcrumbItem(label: 'Projects', onPressed: () {}),
                      const OrcaBreadcrumbItem(label: 'Orca UI'),
                    ],
                  ),
                  const OrcaTabs(
                    label: 'Project sections',
                    tabs: <OrcaTabItem>[
                      OrcaTabItem(id: 'overview', label: 'Overview', content: Text('Overview panel')),
                      OrcaTabItem(id: 'activity', label: 'Activity', content: Text('Activity panel')),
                      OrcaTabItem(id: 'archived', label: 'Archived', disabled: true),
                      OrcaTabItem(id: 'settings', label: 'Settings', content: Text('Settings panel')),
                    ],
                  ),
                  const OrcaAccordion(
                    initiallyOpen: <String>{'shipping'},
                    items: <OrcaAccordionItem>[
                      OrcaAccordionItem(id: 'shipping', title: 'Shipping', content: Text('Free shipping over 50 JOD.')),
                      OrcaAccordionItem(id: 'returns', title: 'Returns', content: Text('Return within 30 days.')),
                    ],
                  ),
                  OrcaPagination(page: _page, pageCount: 12, onChanged: (int p) => setState(() => _page = p)),
                ]),
                _section('Data', <Widget>[
                  OrcaSwitch(
                    label: 'Show loading state',
                    value: _tableLoading,
                    onChanged: (bool v) => setState(() => _tableLoading = v),
                  ),
                  OrcaDataTable<_Member>(
                    caption: 'Team members',
                    loading: _tableLoading,
                    rows: _members,
                    initialSort: const OrcaSort('commits', OrcaSortDirection.descending),
                    columns: <OrcaDataColumn<_Member>>[
                      OrcaDataColumn<_Member>(key: 'name', label: 'Name', sortable: true, value: (_Member m) => m.name),
                      OrcaDataColumn<_Member>(key: 'role', label: 'Role', value: (_Member m) => m.role),
                      OrcaDataColumn<_Member>(
                        key: 'commits',
                        label: 'Commits',
                        sortable: true,
                        align: OrcaColumnAlign.end,
                        value: (_Member m) => m.commits,
                      ),
                    ],
                  ),
                  OrcaDataTable<_Member>(
                    rows: const <_Member>[],
                    emptyTitle: 'No members yet',
                    emptyDescription: 'Invite people to see them here.',
                    columns: <OrcaDataColumn<_Member>>[
                      OrcaDataColumn<_Member>(key: 'name', label: 'Name', value: (_Member m) => m.name),
                    ],
                  ),
                ]),
                _section('Charts', const <Widget>[
                  OrcaBarChart(title: 'Revenue', description: 'Thousands of JOD, 2026', data: _revenue),
                  OrcaLineChart(title: 'Active users', data: _revenue, valueLabel: 'Users (k)'),
                ]),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
