import type { CategoryDoc } from './types';
import { snippets } from '../snippets';

export const feedback: CategoryDoc = {
  slug: 'feedback',
  nav: 'Feedback',
  icon: '🔔',
  title: 'Feedback components — alerts, toasts, swal dialogs, loaders, skeletons, progress',
  h1: 'Feedback: alerts, toasts & loaders',
  description:
    'Accessible feedback components with live demos: Alert, Message, SweetAlert-style swal dialogs with illustrations and presets, optional UI sounds, Toaster and toast(), Toast, 15 Loader types, LoaderOverlay, PageLoader, TopProgressBar, Skeleton, Spinner and ProgressBar.',
  intro:
    'Tell people what happened and what is happening. Messages use polite live regions (errors use assertive ones), loaders announce their label once, and every animation respects prefers-reduced-motion.',
  entries: [
    {
      id: 'alert',
      name: 'Alert',
      description: 'An inline message with four severities and an optional close button.',
      props: [
        ['variant', "'info' | 'success' | 'warning' | 'danger'", 'Severity.'],
        ['title', 'ReactNode', 'Bold heading.'],
        ['onClose', '() => void', 'Adds a close button.'],
      ],
      a11y: 'Danger and warning use role="alert"; info and success use role="status" so they do not interrupt.',
      code: {
        react: `<Alert variant="warning" title="Storage almost full">You have used 92% of your space.</Alert>`,
        vue: `<Alert variant="warning" title="Storage almost full">You have used 92%.</Alert>`,
        svelte: `<Alert variant="warning" title="Storage almost full">You have used 92%.</Alert>`,
        astro: `<Alert variant="warning" title="Storage almost full">You have used 92%.</Alert>`,
        rn: `<Alert variant="warning" title="Storage almost full">You have used 92%.</Alert>`,
      },
    },
    {
      id: 'message',
      name: 'Message',
      description: 'A compact, optionally closable inline message — handy next to form fields.',
      props: [
        ['severity', "'info' | 'success' | 'warn' | 'error'", 'Severity.'],
        ['text / children', 'ReactNode', 'Content.'],
        ['icon', 'ReactNode | false', 'Custom or no icon.'],
        ['closable / onClose', 'boolean / () => void', 'Close button.'],
      ],
      code: {
        react: `<Message severity="error" text="Card number is incomplete." />
<Message severity="success" closable>Saved.</Message>`,
      },
    },
    {
      id: 'swal',
      name: 'swal (alert dialogs)',
      description: 'SweetAlert-style promise-based dialogs: confirm, prompt with validation, timers and toast mode.',
      props: [
        ['<SwalHost />', 'component', 'Render once near the app root.'],
        ['swal.fire(options)', 'Promise<SwalResult>', '{ isConfirmed, isDenied, isDismissed, value, dismiss }.'],
        ['swal.success / error / warning / info / question', '(title, text?, options?)', 'Shortcuts (pass { illustration: true } for a scene).'],
        ['illustration / layout / locale', '…', 'See “Illustrated swal & presets” below.'],
        ['icon / title / text / html', '…', 'Content.'],
        ['showCancelButton / showDenyButton', 'boolean', 'Extra buttons.'],
        ['input / inputValidator / preConfirm', '…', 'Prompts with validation and async confirm.'],
        ['timer / timerProgressBar / toast / position', '…', 'Auto-close and toast mode.'],
      ],
      keys: [
        ['Tab / Shift + Tab', 'Cycle focus inside the dialog'],
        ['Enter', 'Confirm (when the confirm button is focused)'],
        ['Escape', 'Dismiss (unless allowEscapeKey is false)'],
      ],
      a11y: 'Modal dialogs trap focus and restore it to the opener; the timer pauses on hover and focus and has a pause label.',
      code: {
        react: `<SwalHost />

const r = await swal.fire({
  icon: 'warning', title: 'Delete file?', text: 'You can’t undo this.',
  showCancelButton: true, confirmButtonText: 'Delete',
});
if (r.isConfirmed) swal.success('Deleted!');

const { value: email } = await swal.fire({
  title: 'Your email', input: 'email', inputLabel: 'Email address',
  inputValidator: (v) => (!v ? 'Email is required' : undefined),
});`,
      },
    },
    {
      id: 'swal-illustrated',
      name: 'Illustrated swal & presets',
      description:
        'Dialogs with themeable scenes from @orca-ui/illustrations: an illustration layout with a status badge, a full-bleed hero band, tone-tinted backdrops, and ready presets with English and Arabic copy.',
      props: [
        ['illustration', "IllustrationName | ReactElement | true", 'A scene name (e.g. "offline"), any node, or true to pick one from the icon type.'],
        ['layout', "'icon' | 'illustration' | 'hero'", 'Icon = animated glyph; illustration = scene + status badge; hero = large scene on a tinted band.'],
        ['locale / labels', "'en' | 'ar' / Partial<SwalLabels>", 'Built-in copy language (sets lang and dir) and per-string overrides.'],
        ['confirmButtonVariant', "'primary' | 'danger'", 'Danger for destructive confirms.'],
        ['sheet', 'boolean', 'Bottom sheet under 640px (default true).'],
        ['sound', 'UiSoundName | false', 'Sound requested on open (needs SoundProvider); false keeps the dialog silent.'],
        ['swal.confirmDelete(item?, options?)', 'Promise<SwalResult>', 'Cancel focused; isConfirmed = delete.'],
        ['swal.unsavedChanges(options?)', 'Promise<SwalResult>', 'isConfirmed = save, isDenied = discard, dismissed = stay.'],
        ['swal.sessionExpired / offline / permissionDenied / serverError', '(options?) => Promise<SwalResult>', 'Hero presets with consistent copy.'],
        ['swal.configure(defaults)', 'void', "App-wide defaults, e.g. { locale: 'ar', illustration: true }."],
      ],
      a11y:
        'Roles, focus trap, Escape and focus return are unchanged. Scenes are decorative (aria-hidden): the title and text carry the meaning, and the status keeps a visible badge plus a screen-reader prefix. The entrance animation is removed under prefers-reduced-motion; forced colors get plain outlines.',
      code: {
        react: `<SwalHost />

await swal.success('All done!', 'Your project is live.', { illustration: true });
await swal.fire({ icon: 'info', title: 'Welcome', illustration: 'welcome', layout: 'hero' });

const r = await swal.confirmDelete('Q3 report.pdf');
if (r.isConfirmed) remove();

const choice = await swal.unsavedChanges({ locale: 'ar' });
if (choice.isConfirmed) save(); else if (choice.isDenied) discard();

swal.configure({ locale: 'ar', illustration: true }); // app-wide defaults`,
      },
    },
    {
      id: 'sound',
      name: 'Sound (SoundProvider, useSound)',
      description:
        'Optional UI sounds synthesized with the Web Audio API — no audio files. Off by default, never before a user gesture, silent in hidden tabs, with four themes, master volume and a reduced mode. Swal, toasts and loaders request sounds through emitUiSound.',
      props: [
        ['<SoundProvider>', 'enabled theme volume allowed reduced', 'enabled/theme/volume are defaults for users without a saved choice; allowed=false silences the whole app.'],
        ['useSound()', 'UseSound', '{ enabled, theme, volume, reduced, unlocked, supported, play, setEnabled, toggle, setTheme, setVolume, setReduced }. User changes persist to localStorage ("oc-sound").'],
        ['UiSoundName', '18 sounds', 'click · toggle-on · toggle-off · select · success · error · warning · info · notification · delete · send · pop · swipe · open · close · drag-start · drop · typing.'],
        ['themes', "'soft' | 'crisp' | 'playful' | 'minimal'", 'Timbre presets.'],
        ['emitUiSound(name)', '@orca-ui/core/sound', 'Request a sound from any code without depending on the engine.'],
        ['createSoundEngine(options)', '@orca-ui/core/sound', 'Framework-agnostic engine (play, setEnabled, setVolume, setTheme, isEnabled, subscribe, destroy).'],
        ['<html data-sound="off | reduced">', 'attribute', 'Page-level mute or reduced mode (e.g. from an accessibility panel).'],
      ],
      a11y:
        'Sound is never the only signal: every component keeps its visual state and live-region announcement. Users can turn sound off, lower it, or keep only status sounds; the choice is remembered.',
      code: {
        react: `<SoundProvider theme="soft">
  <App />
</SoundProvider>

function SoundToggle() {
  const sound = useSound();
  return <Switch label="UI sounds" checked={sound.enabled} onChange={sound.setEnabled} />;
}

// Anywhere, framework-agnostic:
import { emitUiSound } from '@orca-ui/core/sound';
emitUiSound('send');`,
      },
    },
    {
      id: 'toaster',
      name: 'Toaster & toast()',
      description: 'Stacked, swipeable notifications with types, actions, promise states and updates.',
      props: [
        ['<Toaster />', 'component', 'Render once; position, richColors, closeButton, expand, visibleToasts, duration.'],
        ['toast(message, options?)', 'ToastId', 'Default toast.'],
        ['toast.success / error / warning / info / loading', 'ToastId', 'Typed toasts.'],
        ['toast.promise(p, { loading, success, error })', 'ToastId', 'Follows a promise.'],
        ['toast.update(id, opts) / toast.dismiss(id?)', 'void', 'Change or close.'],
        ['options', '{ description, action, cancel, duration, icon }', 'Per toast.'],
      ],
      keys: [
        ['Alt + T', 'Move focus to the notifications (configurable hotkey)'],
        ['Escape', 'Dismiss the focused toast'],
        ['Tab', 'Reach toast actions'],
      ],
      a11y: 'A labelled live region; timers pause on hover, focus and when the page is hidden.',
      code: {
        react: `<Toaster position="bottom-end" richColors closeButton />

toast.success('Saved', { description: 'Your changes are live.' });
toast('Message archived', { action: { label: 'Undo', onClick: undo } });
toast.promise(save(), { loading: 'Saving…', success: 'Saved', error: 'Could not save' });`,
      },
    },
    {
      id: 'toast',
      name: 'Toast (controlled)',
      description: 'A simple controlled toast stack — the cross-framework core component.',
      props: [
        ['items', '{ id, title?, message, variant? }[]', 'Toasts to show.'],
        ['onDismiss', '(id) => void', 'Remove one.'],
      ],
      a11y: 'Rendered in a polite live region.',
      code: snippets.toast!,
    },
    {
      id: 'loader',
      name: 'Loader',
      description: '15 animated loader types — ring, dots, bars, wave, orbit, infinity, progress ring and more.',
      props: [
        ['type', 'LoaderType', "'ring' | 'dual-ring' | 'dots' | 'bounce' | 'pulse' | 'bars' | 'wave' | 'orbit' | 'grid' | 'infinity' | 'square-spin' | 'ripple' | 'typing' | 'hourglass' | 'progress-ring'."],
        ['size', "'xs' | 'sm' | 'md' | 'lg' | 'xl' | number", 'Size.'],
        ['tone', "'primary' | 'current' | 'muted' | 'success' | …", 'Colour.'],
        ['label / showLabel', 'string / boolean', 'Accessible (and optionally visible) label.'],
        ['value', 'number', 'Determinate progress for progress-ring.'],
      ],
      a11y: 'role="status" with the label; under reduced motion the animation slows to a gentle fade instead of spinning.',
      code: {
        react: `<Loader type="orbit" label="Loading projects" />
<Loader type="progress-ring" value={64} showLabel label="Uploading" />`,
      },
    },
    {
      id: 'loaderoverlay',
      name: 'LoaderOverlay',
      description: 'Covers a region with a loader while it refreshes.',
      props: [
        ['active', 'boolean', 'Show the overlay.'],
        ['blur', 'boolean', 'Blur the content underneath.'],
        ['type / label', 'LoaderType / string', 'Loader settings.'],
      ],
      a11y: 'The covered content is aria-busy and inert while active.',
      code: {
        react: `<LoaderOverlay active={refreshing} label="Refreshing stats">
  <StatsCard />
</LoaderOverlay>`,
      },
    },
    {
      id: 'pageloader',
      name: 'PageLoader',
      description: 'A full-page splash loader with your brand that fades out when ready.',
      props: [
        ['active', 'boolean', 'Visible while true.'],
        ['brand', 'ReactNode', 'Logo or name.'],
        ['exitDuration', 'number', 'Fade-out length (ms).'],
        ['type / label / showLabel', '…', 'Loader settings.'],
      ],
      code: {
        react: `<PageLoader active={!ready} brand={<Logo />} label="Loading dashboard" />`,
      },
    },
    {
      id: 'topprogress',
      name: 'TopProgressBar',
      description: 'A slim progress bar at the top of the window for route changes and long requests.',
      props: [
        ['<TopProgressBar />', 'component', 'Render once.'],
        ['topProgress.start() / done()', 'void', 'Trickles until done.'],
        ['topProgress.set(n) / inc(n?)', 'void', 'Manual control (0–1).'],
      ],
      a11y: 'role="progressbar" with a label; hidden from view when idle.',
      code: {
        react: `<TopProgressBar />

router.on('start', () => topProgress.start());
router.on('end', () => topProgress.done());`,
      },
    },
    {
      id: 'useasyncaction',
      name: 'useAsyncAction',
      description: 'A hook that tracks loading and error state for any async action — pair it with Button loading.',
      props: [
        ['useAsyncAction(fn)', '{ run, loading, error, reset }', 'Wraps fn; ignores stale results and unmounted components.'],
      ],
      code: {
        react: `const save = useAsyncAction(api.save);
<Button loading={save.loading} onClick={() => save.run(form)}>Save</Button>
{save.error && <Message severity="error" text="Could not save" />}`,
      },
    },
    {
      id: 'emptystate',
      name: 'EmptyState',
      description: 'Explains why a view is empty and offers the next step.',
      props: [
        ['icon', 'ReactNode', 'Decorative icon.'],
        ['title / description', 'ReactNode', 'Text.'],
        ['children', 'ReactNode', 'Actions.'],
      ],
      code: {
        react: `<EmptyState icon="📁" title="No projects yet" description="Create your first project.">
  <Button>New project</Button>
</EmptyState>`,
        vue: `<EmptyState icon="📁" title="No projects yet"><Button>New project</Button></EmptyState>`,
        svelte: `<EmptyState icon="📁" title="No projects yet"><Button>New project</Button></EmptyState>`,
        astro: `<EmptyState title="No projects yet"><span slot="icon">📁</span><Button slot="action">New</Button></EmptyState>`,
        rn: `<EmptyState icon="📁" title="No projects yet"><Button title="New project" /></EmptyState>`,
      },
    },
    {
      id: 'spinner',
      name: 'Spinner',
      description: 'A minimal indeterminate spinner.',
      props: [
        ['size', "'md' | 'lg'", 'Size.'],
        ['label', 'string', 'Accessible label. Default “Loading”.'],
      ],
      code: {
        react: `<Spinner label="Loading results" />`,
        vue: `<Spinner />`,
        svelte: `<Spinner />`,
        astro: `<Spinner />`,
        rn: `<Spinner />`,
      },
    },
    {
      id: 'progressbar',
      name: 'ProgressBar',
      description: 'Determinate or indeterminate progress.',
      props: [
        ['value', 'number (0–100)', 'Omit for indeterminate.'],
        ['label', 'string', 'Accessible name.'],
      ],
      a11y: 'role="progressbar" with aria-valuenow when determinate.',
      code: {
        react: `<ProgressBar value={64} label="Upload progress" />
<ProgressBar label="Processing" />`,
        vue: `<ProgressBar :value="64" label="Upload progress" />`,
        svelte: `<ProgressBar value={64} label="Upload progress" />`,
        astro: `<ProgressBar value={64} label="Upload progress" />`,
        rn: `<ProgressBar value={64} label="Upload progress" />`,
      },
    },
    {
      id: 'skeleton',
      name: 'Skeleton',
      description: 'Placeholder shapes for text, cards and tables while content loads.',
      props: [
        ['Skeleton width / height / circle', 'number | string / boolean', 'A single shape.'],
        ['SkeletonText lines', 'number', 'Paragraph placeholder.'],
        ['SkeletonCard lines', 'number', 'Card placeholder.'],
        ['label', 'string', 'Announced once (“Loading…”).'],
      ],
      a11y: 'Announced once as a status; the shapes themselves are hidden from screen readers and the shimmer stops under reduced motion.',
      code: snippets.skeleton!,
    },
  ],
};
