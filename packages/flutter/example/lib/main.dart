import 'package:flutter/material.dart';
import 'package:pelagic_ui/pelagic_ui.dart';

void main() => runApp(const GalleryApp());

/// Root: holds the theme settings and passes them to [PelagicApp].
class GalleryApp extends StatefulWidget {
  const GalleryApp({super.key});

  @override
  State<GalleryApp> createState() => _GalleryAppState();
}

class _GalleryAppState extends State<GalleryApp> {
  PelagicThemeMode _mode = PelagicThemeMode.system;
  PelagicAccent _accent = pelagicDefaultAccent;
  PelagicShape _shape = pelagicDefaultShape;
  bool _rtl = false;

  @override
  Widget build(BuildContext context) {
    return PelagicApp(
      title: 'Pelagic UI gallery',
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
        onMode: (PelagicThemeMode v) => setState(() => _mode = v),
        onAccent: (PelagicAccent v) => setState(() => _accent = v),
        onShape: (PelagicShape v) => setState(() => _shape = v),
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

  final PelagicThemeMode mode;
  final PelagicAccent accent;
  final PelagicShape shape;
  final bool rtl;
  final ValueChanged<PelagicThemeMode> onMode;
  final ValueChanged<PelagicAccent> onAccent;
  final ValueChanged<PelagicShape> onShape;
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

  static const List<PelagicChartPoint> _revenue = <PelagicChartPoint>[
    PelagicChartPoint('Jan', 12),
    PelagicChartPoint('Feb', 18),
    PelagicChartPoint('Mar', 15),
    PelagicChartPoint('Apr', 26),
    PelagicChartPoint('May', 31),
    PelagicChartPoint('Jun', 42),
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
    showPelagicToast(context, title: 'Saved', message: 'Your changes were saved.', tone: PelagicTone.success);
  }

  Future<void> _confirmDelete() async {
    final bool? confirmed = await showPelagicDialog<bool>(
      context: context,
      title: 'Delete project?',
      builder: (BuildContext context) => const Text('This removes the project and its history. It cannot be undone.'),
      actionsBuilder: (BuildContext dialogContext) => <Widget>[
        PelagicButton(
          label: 'Cancel',
          variant: PelagicButtonVariant.secondary,
          onPressed: () => Navigator.of(dialogContext).pop(false),
        ),
        PelagicButton(
          label: 'Delete',
          variant: PelagicButtonVariant.danger,
          onPressed: () => Navigator.of(dialogContext).pop(true),
        ),
      ],
    );
    if (!mounted || confirmed != true) return;
    showPelagicToast(context, message: 'Project deleted.', tone: PelagicTone.danger, actionLabel: 'Undo', onAction: () {});
  }

  void _openDrawer() {
    showPelagicDrawer<void>(
      context: context,
      title: 'Filters',
      builder: (BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          PelagicCheckbox(value: true, onChanged: (bool v) {}, label: 'Open issues'),
          PelagicCheckbox(value: false, onChanged: (bool v) {}, label: 'Closed issues'),
        ],
      ),
      actionsBuilder: (BuildContext dialogContext) => <Widget>[
        PelagicButton(label: 'Apply', onPressed: () => Navigator.of(dialogContext).pop()),
      ],
    );
  }

  Widget _section(String title, List<Widget> children) {
    return Padding(
      padding: const EdgeInsetsDirectional.only(bottom: PelagicSpace.xl),
      child: PelagicCard(
        title: title,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            for (int i = 0; i < children.length; i++) ...<Widget>[
              if (i > 0) const SizedBox(height: PelagicSpace.lg),
              children[i],
            ],
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final PelagicColors c = PelagicTheme.of(context).colors;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pelagic UI'),
        backgroundColor: c.surface,
        foregroundColor: c.text,
        surfaceTintColor: const Color(0x00000000),
        actions: <Widget>[
          PelagicTooltip(
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
              padding: const EdgeInsetsDirectional.all(PelagicSpace.lg),
              children: <Widget>[
                _section('Theme', <Widget>[
                  PelagicSegmented<PelagicThemeMode>(
                    label: 'Mode',
                    value: widget.mode,
                    onChanged: widget.onMode,
                    options: const <PelagicOption<PelagicThemeMode>>[
                      PelagicOption<PelagicThemeMode>(value: PelagicThemeMode.system, label: 'System'),
                      PelagicOption<PelagicThemeMode>(value: PelagicThemeMode.light, label: 'Light'),
                      PelagicOption<PelagicThemeMode>(value: PelagicThemeMode.dark, label: 'Dark'),
                      PelagicOption<PelagicThemeMode>(value: PelagicThemeMode.hc, label: 'High contrast'),
                    ],
                  ),
                  PelagicSelect<PelagicAccent>(
                    label: 'Accent',
                    value: widget.accent,
                    onChanged: widget.onAccent,
                    options: <PelagicOption<PelagicAccent>>[
                      for (final PelagicAccent a in PelagicAccent.values) PelagicOption<PelagicAccent>(value: a, label: a.name),
                    ],
                  ),
                  PelagicSegmented<PelagicShape>(
                    label: 'Shape',
                    value: widget.shape,
                    onChanged: widget.onShape,
                    options: <PelagicOption<PelagicShape>>[
                      for (final PelagicShape s in PelagicShape.values) PelagicOption<PelagicShape>(value: s, label: s.name),
                    ],
                  ),
                  PelagicSwitch(label: 'Right-to-left layout', value: widget.rtl, onChanged: widget.onRtl),
                ]),
                _section('Buttons', <Widget>[
                  Wrap(
                    spacing: PelagicSpace.sm,
                    runSpacing: PelagicSpace.sm,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: <Widget>[
                      PelagicButton(label: 'Save', loading: _saving, onPressed: _save),
                      PelagicButton(label: 'Secondary', variant: PelagicButtonVariant.secondary, onPressed: () {}),
                      PelagicButton(label: 'Outline', variant: PelagicButtonVariant.outline, onPressed: () {}),
                      PelagicButton(label: 'Ghost', variant: PelagicButtonVariant.ghost, onPressed: () {}),
                      PelagicButton(label: 'Delete', variant: PelagicButtonVariant.danger, onPressed: _confirmDelete),
                      const PelagicButton(label: 'Disabled'),
                      PelagicButton(
                        label: 'Small',
                        size: PelagicButtonSize.sm,
                        icon: const Icon(Icons.add),
                        onPressed: () {},
                      ),
                      PelagicButton(label: 'Large', size: PelagicButtonSize.lg, onPressed: () {}),
                    ],
                  ),
                  PelagicButton(label: 'Open drawer', block: true, variant: PelagicButtonVariant.outline, onPressed: _openDrawer),
                ]),
                _section('Forms', <Widget>[
                  PelagicInput(
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
                  const PelagicTextarea(label: 'Message', placeholder: 'Write something…'),
                  PelagicSelect<String>(
                    label: 'Country',
                    value: _country,
                    onChanged: (String v) => setState(() => _country = v),
                    options: const <PelagicOption<String>>[
                      PelagicOption<String>(value: 'jo', label: 'Jordan'),
                      PelagicOption<String>(value: 'ae', label: 'United Arab Emirates'),
                      PelagicOption<String>(value: 'eg', label: 'Egypt'),
                      PelagicOption<String>(value: 'ma', label: 'Morocco'),
                    ],
                  ),
                  PelagicCheckbox(
                    value: _agree,
                    onChanged: (bool v) => setState(() => _agree = v),
                    label: 'I agree to the terms',
                    description: 'You can change this later in settings.',
                  ),
                  PelagicSwitch(
                    label: 'Notifications',
                    description: 'Email me about new comments',
                    value: _notifications,
                    onChanged: (bool v) => setState(() => _notifications = v),
                  ),
                  PelagicRadioGroup<String>(
                    label: 'Plan',
                    value: _plan,
                    onChanged: (String v) => setState(() => _plan = v),
                    options: const <PelagicOption<String>>[
                      PelagicOption<String>(value: 'free', label: 'Free'),
                      PelagicOption<String>(value: 'pro', label: 'Pro'),
                      PelagicOption<String>(value: 'team', label: 'Team (coming soon)', disabled: true),
                    ],
                  ),
                  PelagicSegmented<String>(
                    label: 'View',
                    value: _view,
                    onChanged: (String v) => setState(() => _view = v),
                    options: const <PelagicOption<String>>[
                      PelagicOption<String>(value: 'grid', label: 'Grid'),
                      PelagicOption<String>(value: 'list', label: 'List'),
                      PelagicOption<String>(value: 'board', label: 'Board'),
                    ],
                  ),
                  PelagicSlider(
                    label: 'Volume',
                    value: _volume,
                    divisions: 20,
                    format: (double v) => '${v.round()}%',
                    onChanged: (double v) => setState(() => _volume = v),
                  ),
                ]),
                _section('Display', <Widget>[
                  const Wrap(
                    spacing: PelagicSpace.sm,
                    runSpacing: PelagicSpace.sm,
                    children: <Widget>[
                      PelagicBadge(label: 'Neutral'),
                      PelagicBadge(label: 'New', tone: PelagicTone.primary),
                      PelagicBadge(label: 'Info', tone: PelagicTone.info),
                      PelagicBadge(label: 'Paid', tone: PelagicTone.success),
                      PelagicBadge(label: 'Pending', tone: PelagicTone.warning),
                      PelagicBadge(label: 'Overdue', tone: PelagicTone.danger),
                    ],
                  ),
                  Wrap(
                    spacing: PelagicSpace.sm,
                    runSpacing: PelagicSpace.sm,
                    children: <Widget>[
                      for (final String tag in _tags)
                        PelagicTag(label: tag, onRemove: () => setState(() => _tags.remove(tag))),
                      const PelagicTag(label: 'Read only'),
                    ],
                  ),
                  const Row(
                    children: <Widget>[
                      PelagicAvatar(name: 'Lina Haddad', size: PelagicAvatarSize.sm),
                      SizedBox(width: PelagicSpace.sm),
                      PelagicAvatar(name: 'Omar Saleh'),
                      SizedBox(width: PelagicSpace.sm),
                      PelagicAvatar(name: 'Sara Nasser', size: PelagicAvatarSize.lg),
                      SizedBox(width: PelagicSpace.lg),
                      PelagicSpinner(),
                      SizedBox(width: PelagicSpace.sm),
                      PelagicTooltip(message: 'Shown on hover, focus and long press', child: Icon(Icons.info_outline)),
                    ],
                  ),
                  const PelagicAlert(
                    tone: PelagicTone.success,
                    title: 'Payment received',
                    message: 'We emailed you a receipt.',
                  ),
                  PelagicAlert(
                    tone: PelagicTone.warning,
                    title: 'Storage almost full',
                    message: 'You have used 92% of your storage.',
                    onDismiss: () {},
                  ),
                  const PelagicDivider(label: 'or'),
                  const PelagicProgressBar(value: 64, label: 'Upload', showValue: true),
                  const PelagicProgressBar(label: 'Syncing'),
                  const PelagicStepper(
                    current: 1,
                    steps: <PelagicStep>[
                      PelagicStep(label: 'Account', description: 'Email and password'),
                      PelagicStep(label: 'Profile'),
                      PelagicStep(label: 'Review'),
                    ],
                  ),
                  const PelagicTimeline(
                    items: <PelagicTimelineItem>[
                      PelagicTimelineItem(title: 'Order placed', time: '09:12', tone: PelagicTone.info),
                      PelagicTimelineItem(title: 'Payment confirmed', time: '09:14', tone: PelagicTone.success),
                      PelagicTimelineItem(title: 'Shipped', time: '14:30', description: 'Tracking number sent by email'),
                    ],
                  ),
                  const PelagicSkeletonCard(),
                  const PelagicSkeletonText(lines: 2),
                  const PelagicEmptyState(
                    icon: Icon(Icons.inbox_outlined),
                    title: 'No messages',
                    description: 'New messages will appear here.',
                  ),
                ]),
                _section('Navigation', <Widget>[
                  PelagicBreadcrumb(
                    items: <PelagicBreadcrumbItem>[
                      PelagicBreadcrumbItem(label: 'Home', onPressed: () {}),
                      PelagicBreadcrumbItem(label: 'Projects', onPressed: () {}),
                      const PelagicBreadcrumbItem(label: 'Pelagic UI'),
                    ],
                  ),
                  const PelagicTabs(
                    label: 'Project sections',
                    tabs: <PelagicTabItem>[
                      PelagicTabItem(id: 'overview', label: 'Overview', content: Text('Overview panel')),
                      PelagicTabItem(id: 'activity', label: 'Activity', content: Text('Activity panel')),
                      PelagicTabItem(id: 'archived', label: 'Archived', disabled: true),
                      PelagicTabItem(id: 'settings', label: 'Settings', content: Text('Settings panel')),
                    ],
                  ),
                  const PelagicAccordion(
                    initiallyOpen: <String>{'shipping'},
                    items: <PelagicAccordionItem>[
                      PelagicAccordionItem(id: 'shipping', title: 'Shipping', content: Text('Free shipping over 50 JOD.')),
                      PelagicAccordionItem(id: 'returns', title: 'Returns', content: Text('Return within 30 days.')),
                    ],
                  ),
                  PelagicPagination(page: _page, pageCount: 12, onChanged: (int p) => setState(() => _page = p)),
                ]),
                _section('Data', <Widget>[
                  PelagicSwitch(
                    label: 'Show loading state',
                    value: _tableLoading,
                    onChanged: (bool v) => setState(() => _tableLoading = v),
                  ),
                  PelagicDataTable<_Member>(
                    caption: 'Team members',
                    loading: _tableLoading,
                    rows: _members,
                    initialSort: const PelagicSort('commits', PelagicSortDirection.descending),
                    columns: <PelagicDataColumn<_Member>>[
                      PelagicDataColumn<_Member>(key: 'name', label: 'Name', sortable: true, value: (_Member m) => m.name),
                      PelagicDataColumn<_Member>(key: 'role', label: 'Role', value: (_Member m) => m.role),
                      PelagicDataColumn<_Member>(
                        key: 'commits',
                        label: 'Commits',
                        sortable: true,
                        align: PelagicColumnAlign.end,
                        value: (_Member m) => m.commits,
                      ),
                    ],
                  ),
                  PelagicDataTable<_Member>(
                    rows: const <_Member>[],
                    emptyTitle: 'No members yet',
                    emptyDescription: 'Invite people to see them here.',
                    columns: <PelagicDataColumn<_Member>>[
                      PelagicDataColumn<_Member>(key: 'name', label: 'Name', value: (_Member m) => m.name),
                    ],
                  ),
                ]),
                _section('Charts', const <Widget>[
                  PelagicBarChart(title: 'Revenue', description: 'Thousands of JOD, 2026', data: _revenue),
                  PelagicLineChart(title: 'Active users', data: _revenue, valueLabel: 'Users (k)'),
                ]),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
