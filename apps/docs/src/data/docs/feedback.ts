import type { CategoryDoc } from './types';
import { snippets } from '../snippets';

export const feedback: CategoryDoc = {
  slug: 'feedback',
  nav: 'Feedback',
  icon: '🔔',
  title: 'Feedback components — alerts, toasts, swal dialogs, loaders, skeletons, progress',
  h1: 'Feedback: alerts, toasts & loaders',
  description:
    'Accessible feedback components with live demos: Alert, Message, SweetAlert-style swal dialogs, Toaster and toast(), Toast, 15 Loader types, LoaderOverlay, PageLoader, TopProgressBar, Skeleton, Spinner and ProgressBar.',
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
        ['swal.success / error / warning / info / question', '(title, text?, options?)', 'Shortcuts.'],
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
