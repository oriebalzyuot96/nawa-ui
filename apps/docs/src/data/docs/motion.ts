import type { CategoryDoc } from './types';

const reducedNote =
  'Respects prefers-reduced-motion and <html data-a11y-motion="off">: it renders its end state with no movement.';

export const motion: CategoryDoc = {
  slug: 'motion',
  nav: 'Motion & flows',
  icon: '✨',
  title: 'Motion — accessible animation primitives, animated components and Wizard',
  h1: 'Motion & flows',
  description:
    'Dependency-free motion for Pelagic UI: springs, timelines, staggers, FLIP layout, scroll progress, Presence enter/exit, Reorder, Marquee, NumberTicker, TextReveal, SpotlightCard, AnimatedTabs and a multi-step Wizard.',
  intro:
    'A small animation engine (@pelagic-ui/core/motion) and React components built on it. Motion is always optional: with reduced motion everything snaps to its end state, decorative layers are hidden from assistive tech, anything that keeps moving has a pause button, and nothing flashes.',
  callout: 'Try the RTL switch on each demo, and set your OS to reduce motion: every demo still works, without the movement.',
  entries: [
    {
      id: 'engine',
      name: 'Motion engine',
      description: 'animate(), spring(), timeline(), stagger(), drawPath(), tween(), animateLayout(), scrollProgress() and inView() — WAAPI with a requestAnimationFrame fallback.',
      props: [
        ['animate(targets, keyframes, options)', 'AnimationControls', 'CSS properties plus x, y, scale, rotate. Options: duration, easing, spring, delay, stagger, repeat.'],
        ['spring({ stiffness, damping, mass })', '{ duration, easing, css }', 'Analytic damped spring; `css` is a linear() timing function.'],
        ['timeline().add(el, kf, opts, at)', 'Timeline', "at: ms, '+=100', '-=100', '<' (with previous) or '<+50'."],
        ['stagger(each, { from })', '(i, n) => ms', "from: 'first' | 'last' | 'center' | index."],
        ['animateLayout(container, mutate)', 'AnimationControls', 'FLIP: measure, mutate the DOM, animate to the new layout.'],
        ['scrollProgress(el, cb) / inView(el, cb)', '() => void', 'Scroll-linked progress (0–1) and visibility; both return a cleanup.'],
        ['drawPath(path) / tween(from, to, cb)', 'AnimationControls', 'SVG stroke drawing and number tweens.'],
      ],
      a11y: `Global reduced-motion switch: ${reducedNote} Promises still resolve, so code that awaits an animation keeps working.`,
      code: {
        react: `import { animate, timeline, stagger, drawPath } from '@pelagic-ui/react'; // or '@pelagic-ui/core/motion'

timeline()
  .add('.card', { opacity: [0, 1], y: [24, 0] }, { spring: { stiffness: 260, damping: 22 }, stagger: stagger(60) })
  .add('.check path', { strokeDashoffset: [1, 0] }, { duration: 500 }, '-=200')
  .play();`,
      },
    },
    {
      id: 'motion',
      name: 'Motion & Presence',
      description: 'Declarative enter, update and exit animations; Presence keeps removed children mounted until their exit finishes.',
      props: [
        ['as', 'ElementType', "Element to render. Default 'div'."],
        ['initial / animate / exit', 'MotionStyle', 'CSS properties plus x, y, scale, rotate. Changing `animate` retargets from the current position.'],
        ['transition', 'AnimationOptions', 'duration, easing or spring, delay.'],
        ['layout', 'boolean', 'Animate position changes between renders (FLIP).'],
        ['inView', 'boolean | InViewOptions', 'Play the entrance when scrolled into view.'],
        ['<Presence mode initial>', "'sync' | 'wait'", 'Wraps keyed children; `wait` enters after exits finish.'],
      ],
      a11y: `Exiting elements become aria-hidden and inert immediately, so assistive tech never reads content that is leaving. ${reducedNote}`,
      code: {
        react: `<Presence>
  {toasts.map((t) => (
    <Motion key={t.id} layout initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }} transition={{ spring: { stiffness: 320, damping: 28 } }}>
      {t.text}
    </Motion>
  ))}
</Presence>`,
      },
    },
    {
      id: 'reorder',
      name: 'Reorder',
      description: 'A sortable list: drag the handle with a mouse, pen or finger, or use the keyboard. Neighbours glide into place.',
      props: [
        ['label', 'string', 'Accessible name of the list (required).'],
        ['items / onReorder', 'T[]', 'Controlled order.'],
        ['getKey / getLabel', '(item) => string', 'Identity and the name used in announcements.'],
        ['renderItem', '(item, state) => ReactNode', 'Row content; state has index, grabbed, dragging.'],
        ['axis', "'y' | 'x'", 'Vertical list or horizontal row.'],
        ['messages', 'Partial<ReorderMessages>', 'Localised announcements.'],
      ],
      keys: [
        ['Space / Enter', 'Pick up or drop the item'],
        ['Arrow Up / Arrow Down', 'Move the picked-up item (Left / Right for axis="x", mirrored in RTL)'],
        ['Home / End', 'Move to the first / last position'],
        ['Escape', 'Cancel and restore the original order'],
        ['Alt + Arrow', 'Move one step without picking up'],
      ],
      a11y: 'Handles are toggle buttons (aria-pressed while grabbed) with instructions in aria-describedby; every pick-up, move, drop and cancel is announced in a live region, and focus stays on the moved item.',
      code: {
        react: `<Reorder label="Priorities" items={tasks} onReorder={setTasks}
  getKey={(t) => t.id} getLabel={(t) => t.title}
  renderItem={(t) => <span>{t.title}</span>} />`,
      },
    },
    {
      id: 'reveal',
      name: 'Stagger, Reveal & TextReveal',
      description: 'Reveal content as it scrolls into view: fades, blur-ins, staggered lists and word-by-word text.',
      props: [
        ['effect', "'fade' | 'fade-up' | 'blur-in' | 'scale' | 'slide-start' | 'slide-end'", 'Reveal style (BlurIn and FadeUp are presets).'],
        ['each', 'number', 'Stagger: ms between children.'],
        ['once / amount', 'boolean / number', 'Reveal once (default) and how much must be visible.'],
        ['TextReveal by', "'word' | 'char'", 'Arabic always splits by word so letters stay joined.'],
      ],
      a11y: `Content is in the page from the start (visible without JavaScript). TextReveal reads the whole sentence once from visually hidden text; the animated words are aria-hidden. ${reducedNote}`,
      code: {
        react: `<Stagger as="ul" each={80} effect="fade-up">
  <li>Accessible</li><li>Themeable</li><li>Fast</li>
</Stagger>
<TextReveal as="h3" text="Motion that respects people" />`,
      },
    },
    {
      id: 'animatedtabs',
      name: 'AnimatedTabs',
      description: 'Tabs with a selection pill (or underline) that slides between tabs.',
      props: [
        ['tabs', '{ value, label, content, icon?, disabled? }[]', 'Tabs and panels.'],
        ['value / onChange', 'string', 'Selected tab.'],
        ['label', 'string', 'Accessible name of the tab list.'],
        ['variant', "'pill' | 'underline'", 'Indicator style.'],
      ],
      keys: [
        ['Arrow Left / Arrow Right', 'Previous / next tab (mirrored in RTL, skips disabled)'],
        ['Home / End', 'First / last tab'],
      ],
      a11y: 'APG tabs with automatic activation and roving tabindex. The indicator is decorative; selection is also shown by text colour and aria-selected.',
      code: {
        react: `<AnimatedTabs label="Plan" tabs={[
  { value: 'monthly', label: 'Monthly', content: <Pricing period="month" /> },
  { value: 'yearly', label: 'Yearly', content: <Pricing period="year" /> },
]} />`,
      },
    },
    {
      id: 'marquee',
      name: 'Marquee',
      description: 'An endless scrolling row or column — logos, testimonials, tickers.',
      props: [
        ['label', 'string', 'Names the region.'],
        ['direction', "'left' | 'right' | 'up' | 'down'", 'Mirrored in RTL.'],
        ['speed', 'number', 'Pixels per second. Default 40.'],
        ['pauseOnHover / fade / gap', 'boolean / boolean / string', 'Behaviour and look.'],
      ],
      keys: [['Tab', 'Focusing an item pauses the marquee']],
      a11y: 'A visible pause button (WCAG 2.2.2) and pause on hover and focus. Duplicate copies are aria-hidden and inert. Under reduced motion it becomes a static, keyboard-scrollable row.',
      code: {
        react: `<Marquee label="Customers" speed={50}>
  {logos.map((l) => <img key={l.name} src={l.src} alt={l.name} />)}
</Marquee>`,
      },
    },
    {
      id: 'numberticker',
      name: 'NumberTicker',
      description: 'Counts up to a value when it scrolls into view; formatted with Intl.NumberFormat. Also exported as AnimatedCounter.',
      props: [
        ['value / from', 'number', 'Target and start.'],
        ['duration / delay', 'number', 'ms.'],
        ['locale / format / decimals', 'string / NumberFormatOptions / number', 'Formatting (currency, compact…).'],
        ['prefix / suffix', 'ReactNode', 'Units.'],
        ['live', 'boolean', 'Announce the final value politely when it changes.'],
      ],
      a11y: 'Screen readers only ever get the final value, never the counting frames. Without JavaScript or with reduced motion the final number shows at once.',
      code: {
        react: `<NumberTicker value={12840} locale="en-US" prefix="$" />`,
      },
    },
    {
      id: 'typingtext',
      name: 'TypingText & MorphingText',
      description: 'Typewriter text with a caret, and phrases that morph into each other.',
      props: [
        ['text / words', 'string / string[]', 'Type once, or cycle phrases.'],
        ['speed / deleteSpeed / hold', 'number', 'ms per character / pause.'],
        ['loop', 'boolean', 'Cycle forever (adds a pause button).'],
        ['MorphingText texts / interval', 'string[] / number', 'Phrases and ms each.'],
      ],
      a11y: 'The full text is static, visually hidden content; the animation is aria-hidden. The caret blinks about once a second (well under the 3-flashes limit). Cycling text always has a pause button.',
      code: {
        react: `<h3>Build <TypingText words={['dashboards', 'forms', 'docs']} loop /></h3>
<MorphingText texts={['Accessible', 'Themeable', 'Bilingual']} />`,
      },
    },
    {
      id: 'spotlight',
      name: 'SpotlightCard, AnimatedBorder & ShimmerButton',
      description: 'Premium surfaces: a pointer-following spotlight, a light beam travelling the border, and a button with a soft sheen.',
      props: [
        ['SpotlightCard size / color', 'number / string', 'Spotlight diameter and colour.'],
        ['BorderBeam duration / size / colorFrom / colorTo', 'number / number / string', 'Place inside any positioned element.'],
        ['AnimatedBorder variant', "'beam' | 'gradient'", 'Wrapper with an animated border.'],
        ['ShimmerButton variant / size', "'primary' | 'secondary'", 'A real <button>.'],
      ],
      a11y: 'All effects are decorative (aria-hidden pseudo-layers) and disappear in forced-colours mode. The spotlight also lights up on keyboard focus within the card.',
      code: {
        react: `<SpotlightCard>
  <h3>Analytics</h3>
  <p>Realtime dashboards.</p>
</SpotlightCard>
<AnimatedBorder>Pro plan</AnimatedBorder>
<ShimmerButton>Get started</ShimmerButton>`,
      },
    },
    {
      id: 'backgrounds',
      name: 'Backgrounds',
      description: 'AuroraBackground, GridPattern, DotPattern, Meteors, Particles and RippleRings for hero sections.',
      props: [
        ['AuroraBackground intensity', 'number', '0–1.'],
        ['GridPattern size / squares / fade', "number / [x, y][] / 'radial' | 'top' | 'bottom' | 'none'", 'SVG grid with highlighted cells.'],
        ['DotPattern size / radius', 'number', 'Dot matrix.'],
        ['Meteors count / Particles count', 'number', 'Decorative motion.'],
        ['RippleRings count / size', 'number', 'Concentric pulses.'],
      ],
      a11y: 'Every background is aria-hidden. Meteors are not rendered with reduced motion; Particles draw one still frame and pause when off-screen; the aurora and ripples hold still.',
      code: {
        react: `<AuroraBackground>
  <GridPattern squares={[[2, 1], [5, 3]]} />
  <h2>Ship accessible UI</h2>
</AuroraBackground>`,
      },
    },
    {
      id: 'animatedlist',
      name: 'AnimatedList',
      description: 'New items slide in, removed ones fade out, the rest glide into place.',
      props: [
        ['items / getKey / renderItem', 'T[] / fn / fn', 'Data and rendering.'],
        ['label', 'string', 'Accessible name of the list.'],
        ['announce', '(item) => string', 'Politely announce added items (e.g. notifications).'],
      ],
      a11y: 'A real list; additions can be announced through a polite live region. Built from Presence + Motion with layout.',
      code: {
        react: `<AnimatedList label="Activity" items={events} getKey={(e) => e.id}
  renderItem={(e) => <EventRow event={e} />} announce={(e) => \`New: \${e.title}\`} />`,
      },
    },
    {
      id: 'scroll',
      name: 'ScrollProgressBar & Parallax',
      description: 'Reading progress for the page or a scroll container, and sections whose background drifts as you scroll.',
      props: [
        ['ScrollProgressBar target', 'RefObject<HTMLElement>', 'Track a container instead of the page.'],
        ['ScrollProgressBar position / label', "'fixed' | 'static' / string", 'With a label it is a real progressbar.'],
        ['Parallax background / speed', 'ReactNode / number', 'Decorative layer and travel (−1…1).'],
        ['useScrollProgress(ref?)', 'number', 'Hook version (0–1).'],
      ],
      a11y: 'The bar is decorative unless labelled. Parallax backgrounds are aria-hidden and static under reduced motion.',
      code: {
        react: `<ScrollProgressBar />
<Parallax background={<img src="/hero.jpg" alt="" />} speed={0.3}>
  <h2>Chapter one</h2>
</Parallax>`,
      },
    },
    {
      id: 'wizard',
      name: 'Wizard',
      description: 'A multi-step flow with validation, optional steps, a review step, draft saving and a stepper that turns vertical in narrow containers.',
      props: [
        ['steps', 'WizardStep[]', '{ id, title, description?, icon?, optional?, content, validate?, summary?, review? }.'],
        ['label', 'string', 'Accessible name of the wizard.'],
        ['linear', 'boolean', 'Steps unlock in order (default) or free navigation validated on Finish.'],
        ['validate', '(ctx) => errors | Promise<errors>', 'Return { fieldId: message } to block Next; async shows a busy state.'],
        ['data / onDataChange', 'Record<string, unknown>', 'Shared data; wizardField(ctx, name) binds an Input.'],
        ['persist / saveDraft', 'string / boolean', 'localStorage key for autosave, and a "Save draft" button.'],
        ['orientation', "'auto' | 'horizontal' | 'vertical'", 'Vertical puts the steps in a side rail.'],
        ['onComplete / renderComplete', 'fn', 'Finish handler and success view.'],
      ],
      keys: [
        ['Enter', 'Submit the current step (Next)'],
        ['Tab', 'Steps, fields, then Back / Skip / Next'],
      ],
      a11y: 'Each step change moves focus to the step heading ("Step 2 of 4, Plan") and is announced. Failed validation focuses an error summary whose links jump to the fields. Step buttons say whether a step is completed, skipped or has errors. Content is a <form>, so Enter submits.',
      code: {
        react: `<Wizard label="Create workspace" persist="ws-draft" saveDraft steps={[
  { id: 'account', title: 'Account', content: (ctx) => <Input label="Email" {...wizardField(ctx, 'email')} />,
    validate: ({ data }) => (data.email ? undefined : { email: 'Enter your email' }) },
  { id: 'plan', title: 'Plan', optional: true, content: <PlanPicker /> },
  { id: 'review', title: 'Review', review: true },
]} onComplete={save} />`,
      },
    },
  ],
};
