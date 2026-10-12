import 'package:flutter/material.dart';
import 'package:nawa_ui/nawa_ui.dart';

void main() => runApp(const GalleryApp());

/// Root: holds the theme settings and passes them to [NawaApp].
class GalleryApp extends StatefulWidget {
  const GalleryApp({super.key});

  @override
  State<GalleryApp> createState() => _GalleryAppState();
}

class _GalleryAppState extends State<GalleryApp> {
  NawaThemeMode _mode = NawaThemeMode.system;
  NawaAccent _accent = nawaDefaultAccent;
  NawaShape _shape = nawaDefaultShape;
  bool _rtl = false;

  @override
  Widget build(BuildContext context) {
    return NawaApp(
      title: 'Nawa UI gallery',
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
        onMode: (NawaThemeMode v) => setState(() => _mode = v),
        onAccent: (NawaAccent v) => setState(() => _accent = v),
        onShape: (NawaShape v) => setState(() => _shape = v),
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

  final NawaThemeMode mode;
  final NawaAccent accent;
  final NawaShape shape;
  final bool rtl;
  final ValueChanged<NawaThemeMode> onMode;
  final ValueChanged<NawaAccent> onAccent;
  final ValueChanged<NawaShape> onShape;
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

  static const List<NawaChartPoint> _revenue = <NawaChartPoint>[
    NawaChartPoint('Jan', 12),
    NawaChartPoint('Feb', 18),
    NawaChartPoint('Mar', 15),
    NawaChartPoint('Apr', 26),
    NawaChartPoint('May', 31),
    NawaChartPoint('Jun', 42),
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
    showNawaToast(context, title: 'Saved', message: 'Your changes were saved.', tone: NawaTone.success);
  }

  Future<void> _confirmDelete() async {
    final bool? confirmed = await showNawaDialog<bool>(
      context: context,
      title: 'Delete project?',
      builder: (BuildContext context) => const Text('This removes the project and its history. It cannot be undone.'),
      actionsBuilder: (BuildContext dialogContext) => <Widget>[
        NawaButton(
          label: 'Cancel',
          variant: NawaButtonVariant.secondary,
          onPressed: () => Navigator.of(dialogContext).pop(false),
        ),
        NawaButton(
          label: 'Delete',
          variant: NawaButtonVariant.danger,
          onPressed: () => Navigator.of(dialogContext).pop(true),
        ),
      ],
    );
    if (!mounted || confirmed != true) return;
    showNawaToast(context, message: 'Project deleted.', tone: NawaTone.danger, actionLabel: 'Undo', onAction: () {});
  }

  void _openDrawer() {
    showNawaDrawer<void>(
      context: context,
      title: 'Filters',
      builder: (BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          NawaCheckbox(value: true, onChanged: (bool v) {}, label: 'Open issues'),
          NawaCheckbox(value: false, onChanged: (bool v) {}, label: 'Closed issues'),
        ],
      ),
      actionsBuilder: (BuildContext dialogContext) => <Widget>[
        NawaButton(label: 'Apply', onPressed: () => Navigator.of(dialogContext).pop()),
      ],
    );
  }

  Widget _section(String title, List<Widget> children) {
    return Padding(
      padding: const EdgeInsetsDirectional.only(bottom: NawaSpace.xl),
      child: NawaCard(
        title: title,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            for (int i = 0; i < children.length; i++) ...<Widget>[
              if (i > 0) const SizedBox(height: NawaSpace.lg),
              children[i],
            ],
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final NawaColors c = NawaTheme.of(context).colors;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Nawa UI'),
        backgroundColor: c.surface,
        foregroundColor: c.text,
        surfaceTintColor: const Color(0x00000000),
        actions: <Widget>[
          NawaTooltip(
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
              padding: const EdgeInsetsDirectional.all(NawaSpace.lg),
              children: <Widget>[
                _section('Theme', <Widget>[
                  NawaSegmented<NawaThemeMode>(
                    label: 'Mode',
                    value: widget.mode,
                    onChanged: widget.onMode,
                    options: const <NawaOption<NawaThemeMode>>[
                      NawaOption<NawaThemeMode>(value: NawaThemeMode.system, label: 'System'),
                      NawaOption<NawaThemeMode>(value: NawaThemeMode.light, label: 'Light'),
                      NawaOption<NawaThemeMode>(value: NawaThemeMode.dark, label: 'Dark'),
                      NawaOption<NawaThemeMode>(value: NawaThemeMode.hc, label: 'High contrast'),
                    ],
                  ),
                  NawaSelect<NawaAccent>(
                    label: 'Accent',
                    value: widget.accent,
                    onChanged: widget.onAccent,
                    options: <NawaOption<NawaAccent>>[
                      for (final NawaAccent a in NawaAccent.values) NawaOption<NawaAccent>(value: a, label: a.name),
                    ],
                  ),
                  NawaSegmented<NawaShape>(
                    label: 'Shape',
                    value: widget.shape,
                    onChanged: widget.onShape,
                    options: <NawaOption<NawaShape>>[
                      for (final NawaShape s in NawaShape.values) NawaOption<NawaShape>(value: s, label: s.name),
                    ],
                  ),
                  NawaSwitch(label: 'Right-to-left layout', value: widget.rtl, onChanged: widget.onRtl),
                ]),
                _section('Buttons', <Widget>[
                  Wrap(
                    spacing: NawaSpace.sm,
                    runSpacing: NawaSpace.sm,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: <Widget>[
                      NawaButton(label: 'Save', loading: _saving, onPressed: _save),
                      NawaButton(label: 'Secondary', variant: NawaButtonVariant.secondary, onPressed: () {}),
                      NawaButton(label: 'Outline', variant: NawaButtonVariant.outline, onPressed: () {}),
                      NawaButton(label: 'Ghost', variant: NawaButtonVariant.ghost, onPressed: () {}),
                      NawaButton(label: 'Delete', variant: NawaButtonVariant.danger, onPressed: _confirmDelete),
                      const NawaButton(label: 'Disabled'),
                      NawaButton(
                        label: 'Small',
                        size: NawaButtonSize.sm,
                        icon: const Icon(Icons.add),
                        onPressed: () {},
                      ),
                      NawaButton(label: 'Large', size: NawaButtonSize.lg, onPressed: () {}),
                    ],
                  ),
                  NawaButton(label: 'Open drawer', block: true, variant: NawaButtonVariant.outline, onPressed: _openDrawer),
                ]),
                _section('Forms', <Widget>[
                  NawaInput(
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
                  const NawaTextarea(label: 'Message', placeholder: 'Write something…'),
                  NawaSelect<String>(
                    label: 'Country',
                    value: _country,
                    onChanged: (String v) => setState(() => _country = v),
                    options: const <NawaOption<String>>[
                      NawaOption<String>(value: 'jo', label: 'Jordan'),
                      NawaOption<String>(value: 'ae', label: 'United Arab Emirates'),
                      NawaOption<String>(value: 'eg', label: 'Egypt'),
                      NawaOption<String>(value: 'ma', label: 'Morocco'),
                    ],
                  ),
                  NawaCheckbox(
                    value: _agree,
                    onChanged: (bool v) => setState(() => _agree = v),
                    label: 'I agree to the terms',
                    description: 'You can change this later in settings.',
                  ),
                  NawaSwitch(
                    label: 'Notifications',
                    description: 'Email me about new comments',
                    value: _notifications,
                    onChanged: (bool v) => setState(() => _notifications = v),
                  ),
                  NawaRadioGroup<String>(
                    label: 'Plan',
                    value: _plan,
                    onChanged: (String v) => setState(() => _plan = v),
                    options: const <NawaOption<String>>[
                      NawaOption<String>(value: 'free', label: 'Free'),
                      NawaOption<String>(value: 'pro', label: 'Pro'),
                      NawaOption<String>(value: 'team', label: 'Team (coming soon)', disabled: true),
                    ],
                  ),
                  NawaSegmented<String>(
                    label: 'View',
                    value: _view,
                    onChanged: (String v) => setState(() => _view = v),
                    options: const <NawaOption<String>>[
                      NawaOption<String>(value: 'grid', label: 'Grid'),
                      NawaOption<String>(value: 'list', label: 'List'),
                      NawaOption<String>(value: 'board', label: 'Board'),
                    ],
                  ),
                  NawaSlider(
                    label: 'Volume',
                    value: _volume,
                    divisions: 20,
                    format: (double v) => '${v.round()}%',
                    onChanged: (double v) => setState(() => _volume = v),
                  ),
                ]),
                _section('Display', <Widget>[
                  const Wrap(
                    spacing: NawaSpace.sm,
                    runSpacing: NawaSpace.sm,
                    children: <Widget>[
                      NawaBadge(label: 'Neutral'),
                      NawaBadge(label: 'New', tone: NawaTone.primary),
                      NawaBadge(label: 'Info', tone: NawaTone.info),
                      NawaBadge(label: 'Paid', tone: NawaTone.success),
                      NawaBadge(label: 'Pending', tone: NawaTone.warning),
                      NawaBadge(label: 'Overdue', tone: NawaTone.danger),
                    ],
                  ),
                  Wrap(
                    spacing: NawaSpace.sm,
                    runSpacing: NawaSpace.sm,
                    children: <Widget>[
                      for (final String tag in _tags)
                        NawaTag(label: tag, onRemove: () => setState(() => _tags.remove(tag))),
                      const NawaTag(label: 'Read only'),
                    ],
                  ),
                  const Row(
                    children: <Widget>[
                      NawaAvatar(name: 'Lina Haddad', size: NawaAvatarSize.sm),
                      SizedBox(width: NawaSpace.sm),
                      NawaAvatar(name: 'Omar Saleh'),
                      SizedBox(width: NawaSpace.sm),
                      NawaAvatar(name: 'Sara Nasser', size: NawaAvatarSize.lg),
                      SizedBox(width: NawaSpace.lg),
                      NawaSpinner(),
                      SizedBox(width: NawaSpace.sm),
                      NawaTooltip(message: 'Shown on hover, focus and long press', child: Icon(Icons.info_outline)),
                    ],
                  ),
                  const NawaAlert(
                    tone: NawaTone.success,
                    title: 'Payment received',
                    message: 'We emailed you a receipt.',
                  ),
                  NawaAlert(
                    tone: NawaTone.warning,
                    title: 'Storage almost full',
                    message: 'You have used 92% of your storage.',
                    onDismiss: () {},
                  ),
                  const NawaDivider(label: 'or'),
                  const NawaProgressBar(value: 64, label: 'Upload', showValue: true),
                  const NawaProgressBar(label: 'Syncing'),
                  const NawaStepper(
                    current: 1,
                    steps: <NawaStep>[
                      NawaStep(label: 'Account', description: 'Email and password'),
                      NawaStep(label: 'Profile'),
                      NawaStep(label: 'Review'),
                    ],
                  ),
                  const NawaTimeline(
                    items: <NawaTimelineItem>[
                      NawaTimelineItem(title: 'Order placed', time: '09:12', tone: NawaTone.info),
                      NawaTimelineItem(title: 'Payment confirmed', time: '09:14', tone: NawaTone.success),
                      NawaTimelineItem(title: 'Shipped', time: '14:30', description: 'Tracking number sent by email'),
                    ],
                  ),
                  const NawaSkeletonCard(),
                  const NawaSkeletonText(lines: 2),
                  const NawaEmptyState(
                    icon: Icon(Icons.inbox_outlined),
                    title: 'No messages',
                    description: 'New messages will appear here.',
                  ),
                ]),
                _section('Navigation', <Widget>[
                  NawaBreadcrumb(
                    items: <NawaBreadcrumbItem>[
                      NawaBreadcrumbItem(label: 'Home', onPressed: () {}),
                      NawaBreadcrumbItem(label: 'Projects', onPressed: () {}),
                      const NawaBreadcrumbItem(label: 'Nawa UI'),
                    ],
                  ),
                  const NawaTabs(
                    label: 'Project sections',
                    tabs: <NawaTabItem>[
                      NawaTabItem(id: 'overview', label: 'Overview', content: Text('Overview panel')),
                      NawaTabItem(id: 'activity', label: 'Activity', content: Text('Activity panel')),
                      NawaTabItem(id: 'archived', label: 'Archived', disabled: true),
                      NawaTabItem(id: 'settings', label: 'Settings', content: Text('Settings panel')),
                    ],
                  ),
                  const NawaAccordion(
                    initiallyOpen: <String>{'shipping'},
                    items: <NawaAccordionItem>[
                      NawaAccordionItem(id: 'shipping', title: 'Shipping', content: Text('Free shipping over 50 JOD.')),
                      NawaAccordionItem(id: 'returns', title: 'Returns', content: Text('Return within 30 days.')),
                    ],
                  ),
                  NawaPagination(page: _page, pageCount: 12, onChanged: (int p) => setState(() => _page = p)),
                ]),
                _section('Data', <Widget>[
                  NawaSwitch(
                    label: 'Show loading state',
                    value: _tableLoading,
                    onChanged: (bool v) => setState(() => _tableLoading = v),
                  ),
                  NawaDataTable<_Member>(
                    caption: 'Team members',
                    loading: _tableLoading,
                    rows: _members,
                    initialSort: const NawaSort('commits', NawaSortDirection.descending),
                    columns: <NawaDataColumn<_Member>>[
                      NawaDataColumn<_Member>(key: 'name', label: 'Name', sortable: true, value: (_Member m) => m.name),
                      NawaDataColumn<_Member>(key: 'role', label: 'Role', value: (_Member m) => m.role),
                      NawaDataColumn<_Member>(
                        key: 'commits',
                        label: 'Commits',
                        sortable: true,
                        align: NawaColumnAlign.end,
                        value: (_Member m) => m.commits,
                      ),
                    ],
                  ),
                  NawaDataTable<_Member>(
                    rows: const <_Member>[],
                    emptyTitle: 'No members yet',
                    emptyDescription: 'Invite people to see them here.',
                    columns: <NawaDataColumn<_Member>>[
                      NawaDataColumn<_Member>(key: 'name', label: 'Name', value: (_Member m) => m.name),
                    ],
                  ),
                ]),
                _section('Charts', const <Widget>[
                  NawaBarChart(title: 'Revenue', description: 'Thousands of JOD, 2026', data: _revenue),
                  NawaLineChart(title: 'Active users', data: _revenue, valueLabel: 'Users (k)'),
                ]),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
