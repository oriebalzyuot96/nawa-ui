import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  AnimatedBorder,
  AnimatedList,
  AnimatedTabs,
  AuroraBackground,
  Badge,
  BorderBeam,
  Button,
  DotPattern,
  drawPath,
  GridPattern,
  Input,
  Marquee,
  Meteors,
  MorphingText,
  Motion,
  NumberTicker,
  Parallax,
  Particles,
  Presence,
  Reorder,
  RippleRings,
  ScrollProgressBar,
  ShimmerButton,
  SpotlightCard,
  spring,
  Stagger,
  stagger,
  TextReveal,
  timeline,
  TypingText,
  useReducedMotion,
  Wizard,
  wizardField,
  type WizardStep,
} from '@orca-ui/react';
import { createDemoIsland, Output } from './shared';

const card: CSSProperties = {
  padding: '1rem',
  border: '1px solid var(--oc-border-subtle)',
  borderRadius: 'var(--oc-radius-lg)',
  background: 'var(--oc-surface)',
  boxShadow: 'var(--oc-elev-1)',
};

/* ------------------------------------------------------------ engine */

function EngineDemo() {
  const barsRef = useRef<HTMLDivElement>(null);
  const checkRef = useRef<SVGSVGElement>(null);
  const [last, setLast] = useState('—');
  const reduced = useReducedMotion();
  const s = spring({ stiffness: 260, damping: 18 });

  const play = () => {
    const bars = barsRef.current?.querySelectorAll('.engine-bar');
    const paths = checkRef.current?.querySelectorAll('path');
    if (!bars || !paths) return;
    setLast('playing…');
    timeline()
      .add(bars, { scaleY: [0.15, 1], opacity: [0.3, 1] }, { spring: { stiffness: 260, damping: 18 }, stagger: stagger(55, { from: 'center' }) })
      .call(() => void drawPath(paths, { duration: 650, easing: 'out', stagger: 120 }), '-=500')
      .play()
      .finished.then(() => setLast('finished'));
  };

  return (
    <div className="demo-col">
      <div style={{ ...card, display: 'flex', alignItems: 'flex-end', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div ref={barsRef} style={{ display: 'flex', alignItems: 'flex-end', gap: '0.375rem', height: '6rem' }} aria-hidden="true">
          {[40, 65, 85, 100, 85, 65, 40].map((h, i) => (
            <span
              key={i}
              className="engine-bar"
              style={{ width: '0.875rem', height: `${h}%`, borderRadius: '0.375rem', background: 'linear-gradient(var(--oc-primary), color-mix(in srgb, var(--oc-primary) 45%, var(--oc-info)))', transformOrigin: 'bottom' }}
            />
          ))}
        </div>
        <svg ref={checkRef} viewBox="0 0 64 64" width="72" height="72" aria-hidden="true">
          <path d="M32 4a28 28 0 1 1 0 56a28 28 0 1 1 0-56" fill="none" stroke="var(--oc-success)" strokeWidth="4" strokeLinecap="round" />
          <path d="M20 33l8 8 16-17" fill="none" stroke="var(--oc-success)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <Button onClick={play}>Play timeline</Button>
          <span className="muted" style={{ fontSize: 'var(--oc-text-xs)' }}>
            spring(260, 18) settles in {s.duration} ms
          </span>
        </div>
      </div>
      <Output label="Timeline">{reduced ? `${last} (reduced motion: instant)` : last}</Output>
    </div>
  );
}

/* ------------------------------------------------------------ Motion & Presence */

type Toast = { id: number; text: string; tone: 'success' | 'info' | 'warning' };
const TOASTS: Omit<Toast, 'id'>[] = [
  { text: 'Changes saved', tone: 'success' },
  { text: 'Invite sent to Lina', tone: 'info' },
  { text: 'Storage 80% full', tone: 'warning' },
];

function MotionDemo() {
  const [pos, setPos] = useState<'start' | 'center' | 'end'>('start');
  const [toasts, setToasts] = useState<Toast[]>([{ id: 1, ...TOASTS[0] }]);
  const next = useRef(2);
  const x = { start: 0, center: 1, end: 2 }[pos];
  return (
    <div className="demo-col">
      <div style={{ ...card, display: 'grid', gap: '0.75rem' }}>
        <div role="group" aria-label="Move the box" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(['start', 'center', 'end'] as const).map((p) => (
            <Button key={p} size="sm" variant={pos === p ? 'primary' : 'secondary'} aria-pressed={pos === p} onClick={() => setPos(p)}>
              {p[0].toUpperCase() + p.slice(1)}
            </Button>
          ))}
        </div>
        <div style={{ position: 'relative', height: '3.5rem', borderRadius: 'var(--oc-radius)', background: 'var(--oc-canvas)', overflow: 'hidden' }}>
          <Motion
            aria-hidden="true"
            animate={{ insetInlineStart: `calc(${x} * (100% - 3rem) / 2)`, rotate: x * 90 }}
            transition={{ spring: { stiffness: 220, damping: 16 } }}
            style={{ position: 'absolute', top: '0.25rem', width: '3rem', height: '3rem', borderRadius: '0.875rem', background: 'var(--oc-primary)', boxShadow: 'var(--oc-shadow-md)' }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Button size="sm" onClick={() => setToasts((l) => [{ id: next.current, ...TOASTS[next.current++ % TOASTS.length] }, ...l].slice(0, 4))}>
          Add notification
        </Button>
        <Button size="sm" variant="secondary" disabled={!toasts.length} onClick={() => setToasts((l) => l.slice(0, -1))}>
          Dismiss oldest
        </Button>
      </div>
      <ul aria-label="Notifications" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.5rem' }}>
        <Presence>
          {toasts.map((t) => (
            <Motion
              as="li"
              key={t.id}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ spring: { stiffness: 320, damping: 28 } }}
              exitTransition={{ duration: 220, easing: 'out' }}
              style={{ ...card, display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem' }}
            >
              <Badge variant={t.tone}>{t.tone}</Badge>
              {t.text}
            </Motion>
          ))}
        </Presence>
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------ Reorder */

const TASKS = [
  { id: 'a11y', title: 'Audit with a screen reader', tag: 'A11y' },
  { id: 'rtl', title: 'Check the Arabic layout', tag: 'RTL' },
  { id: 'dark', title: 'Review dark mode contrast', tag: 'Theme' },
  { id: 'ship', title: 'Publish release notes', tag: 'Docs' },
];

function ReorderDemo() {
  const [tasks, setTasks] = useState(TASKS);
  return (
    <div className="demo-col" style={{ maxWidth: '30rem' }}>
      <Reorder
        label="Release checklist"
        items={tasks}
        onReorder={setTasks}
        getKey={(t) => t.id}
        getLabel={(t) => t.title}
        renderItem={(t, { index }) => (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', justifyContent: 'space-between' }}>
            <span>
              <span className="muted" style={{ fontVariantNumeric: 'tabular-nums', marginInlineEnd: '0.5rem' }}>
                {index + 1}.
              </span>
              {t.title}
            </span>
            <Badge>{t.tag}</Badge>
          </span>
        )}
      />
      <Output label="Order">{tasks.map((t) => t.tag).join(' → ')}</Output>
    </div>
  );
}

/* ------------------------------------------------------------ Reveal */

function RevealDemo() {
  const [run, setRun] = useState(0);
  return (
    <div className="demo-col">
      <div key={run} style={{ display: 'grid', gap: '1rem' }}>
        <TextReveal as="h3" text="Motion that respects people, in every language." style={{ margin: 0, fontSize: 'var(--oc-text-2xl)' }} />
        <Stagger as="ul" each={90} effect="fade-up" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(9rem, 1fr))', gap: '0.75rem' }}>
          {['Accessible', 'Themeable', 'Bilingual', 'Fast'].map((w) => (
            <li key={w} style={card}>
              <strong>{w}</strong>
              <p className="muted" style={{ margin: '0.25rem 0 0', fontSize: 'var(--oc-text-sm)' }}>
                Revealed with a stagger.
              </p>
            </li>
          ))}
        </Stagger>
      </div>
      <div>
        <Button size="sm" variant="secondary" onClick={() => setRun((r) => r + 1)}>
          Replay
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ AnimatedTabs */

function TabsDemo() {
  const [tab, setTab] = useState('overview');
  const panel = (title: string, text: string) => (
    <div style={card}>
      <strong>{title}</strong>
      <p className="muted" style={{ margin: '0.25rem 0 0' }}>
        {text}
      </p>
    </div>
  );
  return (
    <div className="demo-col">
      <AnimatedTabs
        label="Product details"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'overview', label: 'Overview', content: panel('Overview', 'A sliding pill follows the selected tab.') },
          { value: 'specs', label: 'Specs', content: panel('Specs', 'Arrow keys move and select; Home and End jump.') },
          { value: 'reviews', label: 'Reviews', content: panel('Reviews', '4.9 out of 5 from 1,284 teams.') },
          { value: 'faq', label: 'FAQ', disabled: true, content: null },
        ]}
      />
      <AnimatedTabs
        label="Billing period"
        variant="underline"
        tabs={[
          { value: 'm', label: 'Monthly', content: <p style={{ margin: 0 }}>$29 / month</p> },
          { value: 'y', label: 'Yearly', content: <p style={{ margin: 0 }}>$290 / year — two months free</p> },
        ]}
      />
    </div>
  );
}

/* ------------------------------------------------------------ Marquee */

const LOGOS = ['Nawa Bank', 'Petra Air', 'Wadi Labs', 'Sahra Health', 'Qamar Studio', 'Aqaba Ports', 'Zaytoun Foods'];

function MarqueeDemo() {
  return (
    <div className="demo-col">
      <Marquee label="Teams using Orca" speed={45}>
        {LOGOS.map((l) => (
          <span key={l} style={{ ...card, padding: '0.625rem 1rem', whiteSpace: 'nowrap', fontWeight: 600 }}>
            {l}
          </span>
        ))}
      </Marquee>
      <Marquee label="Testimonials" direction="right" speed={30}>
        {['“Our audit passed first try.”', '“RTL just worked.”', '“Dark mode in an afternoon.”', '“Screen reader users noticed.”'].map((q) => (
          <figure key={q} style={{ ...card, margin: 0, padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
            {q}
          </figure>
        ))}
      </Marquee>
    </div>
  );
}

/* ------------------------------------------------------------ NumberTicker */

function TickerDemo() {
  const [n, setN] = useState(12840);
  const stat = (label: string, node: ReactNode) => (
    <div style={{ ...card, minWidth: '9rem' }}>
      <div className="muted" style={{ fontSize: 'var(--oc-text-xs)', fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: 'var(--oc-text-2xl)', fontWeight: 700 }}>{node}</div>
    </div>
  );
  return (
    <div className="demo-col">
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {stat('Revenue', <NumberTicker value={n} locale="en-US" prefix="$" live />)}
        {stat('Uptime', <NumberTicker value={99.98} suffix="%" />)}
        {stat('Users', <NumberTicker value={1_250_000} format={{ notation: 'compact' }} locale="en-US" />)}
        {stat('المستخدمون', <NumberTicker value={4821} locale="ar-EG" />)}
      </div>
      <div>
        <Button size="sm" variant="secondary" onClick={() => setN((v) => v + Math.round(Math.random() * 4000 + 500))}>
          Add a sale
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Typing / Morphing */

function TypingDemo() {
  return (
    <div className="demo-col">
      <p style={{ margin: 0, fontSize: 'var(--oc-text-xl)', fontWeight: 600 }}>
        Build <TypingText words={['dashboards', 'checkout flows', 'design systems']} loop />
      </p>
      <p style={{ margin: 0, fontSize: 'var(--oc-text-xl)', fontWeight: 600 }}>
        Orca is <MorphingText texts={['accessible', 'themeable', 'bilingual', 'fast']} />
      </p>
      <p dir="rtl" lang="ar" style={{ margin: 0, fontSize: 'var(--oc-text-lg)' }}>
        <TypingText text="واجهات سهلة الوصول للجميع" />
      </p>
    </div>
  );
}

/* ------------------------------------------------------------ Spotlight / borders / shimmer */

function SpotlightDemo() {
  return (
    <div className="demo-col">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(13rem, 1fr))', gap: '0.875rem' }}>
        <SpotlightCard>
          <Badge variant="primary">New</Badge>
          <h3 style={{ margin: '0.625rem 0 0.25rem' }}>Spotlight</h3>
          <p className="muted" style={{ margin: 0 }}>
            Move the pointer — or tab to the link. <a href="#spotlight">Learn more</a>
          </p>
        </SpotlightCard>
        <AnimatedBorder>
          <h3 style={{ margin: '0 0 0.25rem' }}>Pro plan</h3>
          <p className="muted" style={{ margin: 0 }}>A light beam travels the border.</p>
        </AnimatedBorder>
        <AnimatedBorder variant="gradient" duration={8}>
          <h3 style={{ margin: '0 0 0.25rem' }}>Team plan</h3>
          <p className="muted" style={{ margin: 0 }}>Rotating gradient ring.</p>
        </AnimatedBorder>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <ShimmerButton>Get started</ShimmerButton>
        <ShimmerButton variant="secondary">Book a demo</ShimmerButton>
        <span style={{ position: 'relative', padding: '0.5rem 0.875rem', borderRadius: '999px', border: '1px solid var(--oc-border-subtle)', fontSize: 'var(--oc-text-sm)' }}>
          <BorderBeam duration={5} size={90} />
          v1.0 is out
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Backgrounds */

function BackgroundsDemo() {
  const tile: CSSProperties = { position: 'relative', overflow: 'hidden', minHeight: '9rem', display: 'grid', placeItems: 'center', ...card, padding: 0 };
  return (
    <div className="demo-col">
      <AuroraBackground intensity={0.8} style={{ padding: '2.5rem 1.5rem', border: '1px solid var(--oc-border-subtle)' }}>
        <DotPattern size={22} />
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <p className="eyebrow">Hero</p>
          <h3 style={{ margin: 0, fontSize: 'var(--oc-text-2xl)' }}>Ship accessible UI</h3>
        </div>
      </AuroraBackground>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))', gap: '0.75rem' }}>
        <div style={tile}>
          <GridPattern size={24} squares={[[1, 1], [4, 2], [6, 1]]} />
          <strong style={{ position: 'relative' }}>GridPattern</strong>
        </div>
        <div style={{ ...tile, background: '#0f1426', color: '#f1f4ff', borderColor: '#0f1426' }}>
          <Meteors count={12} />
          <strong style={{ position: 'relative' }}>Meteors</strong>
        </div>
        <div style={tile}>
          <Particles count={50} />
          <strong style={{ position: 'relative' }}>Particles</strong>
        </div>
        <div style={tile}>
          <RippleRings count={5} size={70} />
          <strong style={{ position: 'relative' }}>RippleRings</strong>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ AnimatedList */

const EVENTS = ['Build #482 passed', 'Lina approved the design', 'Deployed to staging', 'New sign-up from Amman', 'Invoice paid'];

function ListDemo() {
  const [items, setItems] = useState([{ id: 0, text: 'Workspace created', at: 'now' }]);
  const n = useRef(1);
  return (
    <div className="demo-col" style={{ maxWidth: '28rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Button size="sm" onClick={() => setItems((l) => [{ id: n.current, text: EVENTS[n.current++ % EVENTS.length], at: 'now' }, ...l].slice(0, 5))}>
          New event
        </Button>
        <Button size="sm" variant="secondary" disabled={items.length < 2} onClick={() => setItems((l) => l.filter((_, i) => i !== 1))}>
          Remove second
        </Button>
      </div>
      <AnimatedList
        label="Activity"
        items={items}
        getKey={(i) => String(i.id)}
        announce={(i) => `New activity: ${i.text}`}
        renderItem={(i) => (
          <div style={{ ...card, display: 'flex', justifyContent: 'space-between', gap: '0.75rem', padding: '0.75rem 1rem' }}>
            <span>{i.text}</span>
            <span className="muted" style={{ fontSize: 'var(--oc-text-xs)' }}>
              {i.at}
            </span>
          </div>
        )}
      />
    </div>
  );
}

/* ------------------------------------------------------------ Scroll */

function ScrollDemo() {
  const boxRef = useRef<HTMLDivElement>(null);
  return (
    <div className="demo-col">
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <ScrollProgressBar target={boxRef} position="static" label="Article progress" />
        <div ref={boxRef} tabIndex={0} role="region" aria-label="Article" style={{ maxHeight: '12rem', overflow: 'auto', padding: '1rem' }}>
          {Array.from({ length: 6 }, (_, i) => (
            <p key={i} style={{ marginTop: 0 }}>
              Paragraph {i + 1}. Scroll this article — the bar above tracks how far you have read, and it is exposed as a labelled progressbar.
            </p>
          ))}
        </div>
      </div>
      <Parallax
        speed={0.4}
        style={{ border: '1px solid var(--oc-border-subtle)' }}
        background={
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--oc-primary) 40%, transparent), transparent 60%), radial-gradient(circle at 75% 70%, color-mix(in srgb, var(--oc-info) 35%, transparent), transparent 55%), var(--oc-canvas)' }}>
            <GridPattern size={28} fade="none" />
          </div>
        }
      >
        <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
          <p className="eyebrow">Parallax</p>
          <h3 style={{ margin: 0, fontSize: 'var(--oc-text-2xl)' }}>The background drifts as you scroll the page</h3>
        </div>
      </Parallax>
    </div>
  );
}

/* ------------------------------------------------------------ Wizard */

type Signup = { email?: string; name?: string; team?: string; plan?: string };

function WizardDemo() {
  const [done, setDone] = useState<Signup | null>(null);
  const steps: WizardStep<Signup>[] = [
    {
      id: 'account',
      title: 'Account',
      description: 'Email and name',
      content: (ctx) => (
        <>
          <Input label="Email" type="email" autoComplete="email" hint="Try “taken@orca.dev” to see an async error" {...wizardField(ctx, 'email')} />
          <Input label="Full name" autoComplete="name" {...wizardField(ctx, 'name')} />
        </>
      ),
      validate: async ({ data }) => {
        const errors: Record<string, string> = {};
        if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email)) errors.email = 'Enter an email address like name@example.com';
        if (!data.name?.trim()) errors.name = 'Enter your full name';
        if (!errors.email && data.email === 'taken@orca.dev') {
          await new Promise((r) => setTimeout(r, 600));
          errors.email = 'That email already has an account';
        }
        return errors;
      },
      summary: (d) => `${d.name} · ${d.email}`,
    },
    {
      id: 'team',
      title: 'Team',
      description: 'Invite teammates',
      optional: true,
      content: (ctx) => <Input label="Team name" {...wizardField(ctx, 'team')} />,
      summary: (d) => d.team || 'Skipped',
    },
    {
      id: 'plan',
      title: 'Plan',
      description: 'Pick a plan',
      content: (ctx) => (
        <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
          <legend className="oc-label" style={{ marginBottom: '0.5rem' }}>
            Plan
          </legend>
          {['Starter', 'Pro', 'Enterprise'].map((p) => (
            <label key={p} className="oc-check">
              <input type="radio" name="plan" id={p === 'Starter' ? 'plan' : undefined} checked={ctx.data.plan === p} onChange={() => ctx.setData({ plan: p })} />
              {p}
            </label>
          ))}
          {ctx.errors.plan && <span className="oc-error-text">{ctx.errors.plan}</span>}
        </fieldset>
      ),
      validate: ({ data }) => (data.plan ? undefined : { plan: 'Choose a plan' }),
      summary: (d) => d.plan,
    },
    { id: 'review', title: 'Review', description: 'Check and finish', review: true },
  ];
  if (done) {
    return (
      <div className="demo-col">
        <p style={{ margin: 0 }}>
          Welcome, <strong>{done.name}</strong> — {done.plan} plan.
        </p>
        <div>
          <Button size="sm" variant="secondary" onClick={() => setDone(null)}>
            Start again
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="demo-col">
      <Wizard<Signup> label="Create your workspace" steps={steps} persist="orca-docs-wizard" saveDraft onComplete={(d) => setDone(d)} />
    </div>
  );
}

export default createDemoIsland(
  {
    engine: EngineDemo,
    motion: MotionDemo,
    reorder: ReorderDemo,
    reveal: RevealDemo,
    animatedtabs: TabsDemo,
    marquee: MarqueeDemo,
    numberticker: TickerDemo,
    typingtext: TypingDemo,
    spotlight: SpotlightDemo,
    backgrounds: BackgroundsDemo,
    animatedlist: ListDemo,
    scroll: ScrollDemo,
    wizard: WizardDemo,
  },
  ['engine', 'motion', 'reorder', 'reveal', 'animatedtabs', 'marquee', 'numberticker', 'typingtext', 'spotlight', 'backgrounds', 'animatedlist', 'scroll', 'wizard'],
);
