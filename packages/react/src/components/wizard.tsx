// wizard — multi-step Wizard with validation, review, persistence and accessible step changes.
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from 'react';
import { animate, prefersReducedMotion } from '@pelagic-ui/core/motion';
import { cx } from '../utils';

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/** Field id → message (links to `#id` in the error summary), or a plain list of messages. */
export type WizardErrors = Record<string, string> | string[];

export type WizardStepStatus = 'upcoming' | 'current' | 'complete' | 'error' | 'skipped';

export interface WizardContext<D = Record<string, unknown>> {
  /** Shared wizard data (persisted with `persist`). */
  data: D;
  /** Merge a patch into the shared data. */
  setData: (patch: Partial<D>) => void;
  /** Errors of the current step, keyed by field id (list errors use their index). */
  errors: Record<string, string>;
  index: number;
  total: number;
  goTo: (index: number) => void;
  next: () => void;
  back: () => void;
  statuses: WizardStepStatus[];
}

export interface WizardStep<D = Record<string, unknown>> {
  id: string;
  title: ReactNode;
  /** Plain-text title for announcements when `title` is not a string. */
  label?: string;
  description?: ReactNode;
  /** Marker icon (decorative). */
  icon?: ReactNode;
  optional?: boolean;
  content?: ReactNode | ((ctx: WizardContext<D>) => ReactNode);
  /** Return errors to block Next (sync or async). Return nothing / an empty object when valid. */
  validate?: (ctx: WizardContext<D>) => WizardErrors | void | null | undefined | Promise<WizardErrors | void | null | undefined>;
  /** Shown for this step on the review step. */
  summary?: (data: D) => ReactNode;
  /** Marks a review step: without `content` it lists every step's summary with Edit buttons. */
  review?: boolean;
}

export interface WizardLabels {
  next: string;
  back: string;
  finish: string;
  skip: string;
  optional: string;
  edit: string;
  saveDraft: string;
  draftSaved: string;
  checking: string;
  stepsNav: string;
  stepOf: (index: number, total: number) => string;
  status: Record<Exclude<WizardStepStatus, 'current' | 'upcoming'>, string>;
  errorTitle: (count: number) => string;
  announce: (index: number, total: number, title: string) => string;
}

const DEFAULT_LABELS: WizardLabels = {
  next: 'Next',
  back: 'Back',
  finish: 'Finish',
  skip: 'Skip this step',
  optional: 'Optional',
  edit: 'Edit',
  saveDraft: 'Save draft',
  draftSaved: 'Draft saved',
  checking: 'Checking…',
  stepsNav: 'Steps',
  stepOf: (i, n) => `Step ${i} of ${n}`,
  status: { complete: 'completed', error: 'has errors', skipped: 'skipped' },
  errorTitle: (n) => (n === 1 ? 'There is a problem' : `There are ${n} problems`),
  announce: (i, n, t) => `Step ${i} of ${n}: ${t}`,
};

export interface WizardProps<D = Record<string, unknown>> {
  steps: WizardStep<D>[];
  /** Accessible name of the wizard. */
  label: string;
  /** Linear (default): steps unlock in order and Next validates. Free: jump to any step; validated on Finish. */
  linear?: boolean;
  step?: number;
  defaultStep?: number;
  onStepChange?: (index: number) => void;
  data?: D;
  defaultData?: D;
  onDataChange?: (data: D) => void;
  /** Called after the last step validates. May be async; the Finish button shows a busy state. */
  onComplete?: (data: D) => void | Promise<void>;
  /** Shown instead of the steps after onComplete resolves. */
  renderComplete?: (data: D) => ReactNode;
  /** localStorage key: autosaves step, progress and data as a draft and restores it on mount. */
  persist?: string;
  /** Show a "Save draft" button (also calls onSaveDraft). */
  saveDraft?: boolean;
  onSaveDraft?: (data: D, index: number) => void;
  /** 'auto' (horizontal stepper that becomes vertical in narrow containers), 'horizontal' or 'vertical' (side rail). */
  orientation?: 'auto' | 'horizontal' | 'vertical';
  /** Heading level of the step title. Default 2. */
  headingLevel?: 2 | 3 | 4;
  labels?: Partial<WizardLabels>;
  className?: string;
}

function normalizeErrors(errors: WizardErrors | void | null | undefined): Record<string, string> {
  if (!errors) return {};
  if (Array.isArray(errors)) return Object.fromEntries(errors.map((m, i) => [String(i), m]));
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => Boolean(v)));
}

const textOf = (step: { label?: string; title: ReactNode; id: string }) => step.label ?? (typeof step.title === 'string' ? step.title : step.id);

interface Draft<D> {
  index: number;
  max: number;
  statuses: WizardStepStatus[];
  data: D;
  savedAt: number;
}

const CheckIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
    <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Arrow = ({ back }: { back?: boolean }) => (
  <svg className={cx('pl-wizard__arrow', back && 'pl-wizard__arrow--back')} viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
    <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Multi-step flow. Each step change moves focus to the step heading and is announced; Next runs
 * the step's validation and, on failure, focuses an error summary that links to the fields.
 * Content is wrapped in a <form>, so Enter in a field submits the step.
 */
export function Wizard<D extends Record<string, unknown> = Record<string, unknown>>({
  steps,
  label,
  linear = true,
  step,
  defaultStep = 0,
  onStepChange,
  data,
  defaultData,
  onDataChange,
  onComplete,
  renderComplete,
  persist,
  saveDraft,
  onSaveDraft,
  orientation = 'auto',
  headingLevel = 2,
  labels: labelOverrides,
  className,
}: WizardProps<D>) {
  const L = { ...DEFAULT_LABELS, ...labelOverrides, status: { ...DEFAULT_LABELS.status, ...labelOverrides?.status } };
  const id = useId();
  const total = steps.length;
  const [innerIndex, setInnerIndex] = useState(defaultStep);
  const index = Math.min(Math.max(step ?? innerIndex, 0), Math.max(0, total - 1));
  const [innerData, setInnerData] = useState<D>(defaultData ?? ({} as D));
  const values = data ?? innerData;
  const [statuses, setStatuses] = useState<WizardStepStatus[]>(() => steps.map(() => 'upcoming'));
  const [max, setMax] = useState(defaultStep);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<false | 'next' | 'finish'>(false);
  const [done, setDone] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const moved = useRef<0 | 1 | -1>(0);
  const restored = useRef(false);
  const latest = useRef({ values, index });
  latest.current = { values, index };

  const setIndex = useCallback(
    (next: number) => {
      if (step === undefined) setInnerIndex(next);
      onStepChange?.(next);
    },
    [step, onStepChange],
  );

  const setData = useCallback(
    (patch: Partial<D>) => {
      const next = { ...latest.current.values, ...patch } as D;
      latest.current.values = next;
      if (data === undefined) setInnerData(next);
      onDataChange?.(next);
    },
    [data, onDataChange],
  );

  // Restore a saved draft once, after mount (keeps SSR markup stable).
  useEffect(() => {
    if (!persist || restored.current) return;
    restored.current = true;
    try {
      const raw = window.localStorage.getItem(persist);
      if (!raw) return;
      const draft = JSON.parse(raw) as Draft<D>;
      if (draft.data) setData(draft.data);
      if (Array.isArray(draft.statuses) && draft.statuses.length === total) setStatuses(draft.statuses);
      if (typeof draft.max === 'number') setMax(Math.min(draft.max, total - 1));
      if (typeof draft.index === 'number') setIndex(Math.min(draft.index, total - 1));
      if (draft.savedAt) setSavedAt(draft.savedAt);
    } catch {
      /* ignore corrupt drafts */
    }
  }, [persist, total, setData, setIndex]);

  const writeDraft = useCallback(() => {
    if (!persist) return null;
    const at = Date.now();
    try {
      window.localStorage.setItem(persist, JSON.stringify({ index, max, statuses, data: values, savedAt: at } satisfies Draft<D>));
    } catch {
      return null;
    }
    return at;
  }, [persist, index, max, statuses, values]);

  // Autosave silently.
  useEffect(() => {
    if (!persist || !restored.current || done) return;
    writeDraft();
  }, [persist, writeDraft, done]);

  const current = steps[index];
  const viewStatuses = statuses.map((s, i) => (i === index && s !== 'error' ? 'current' : s));

  const goTo = useCallback(
    (to: number) => {
      if (to === latest.current.index || to < 0 || to >= total) return;
      moved.current = to > latest.current.index ? 1 : -1;
      setErrors({});
      setIndex(to);
      setMax((m) => Math.max(m, to));
    },
    [total, setIndex],
  );

  const ctxBase = {
    data: values,
    setData,
    errors,
    index,
    total,
    goTo,
    statuses: viewStatuses,
  };

  const runValidate = async (i: number): Promise<Record<string, string>> => {
    const s = steps[i];
    if (!s.validate) return {};
    const result = await s.validate({ ...ctxBase, index: i, next: noop, back: noop, errors: {} } as WizardContext<D>);
    return normalizeErrors(result);
  };

  const setStatus = (i: number, s: WizardStepStatus) => setStatuses((list) => list.map((v, j) => (j === i ? s : v)));

  const showErrors = (errs: Record<string, string>) => {
    setErrors(errs);
    moved.current = 0;
    requestAnimationFrame(() => summaryRef.current?.focus());
  };

  const next = async () => {
    if (busy) return;
    const last = index === total - 1;
    setBusy(last ? 'finish' : 'next');
    try {
      const errs = await runValidate(index);
      if (Object.keys(errs).length) {
        setStatus(index, 'error');
        showErrors(errs);
        return;
      }
      setStatus(index, 'complete');
      if (!last) {
        goTo(index + 1);
        return;
      }
      // Finish: in free mode every required step must be valid.
      if (!linear) {
        for (let i = 0; i < total - 1; i++) {
          if (statuses[i] === 'skipped' && steps[i].optional) continue;
          const e = await runValidate(i);
          if (Object.keys(e).length) {
            setStatus(i, 'error');
            goTo(i);
            requestAnimationFrame(() => showErrors(e));
            return;
          }
          setStatus(i, 'complete');
        }
      }
      await onComplete?.(latest.current.values);
      if (persist) {
        try {
          window.localStorage.removeItem(persist);
        } catch {
          /* ignore */
        }
      }
      if (renderComplete) {
        setDone(true);
        moved.current = 1;
      }
    } finally {
      setBusy(false);
    }
  };

  const back = () => {
    if (index > 0) goTo(index - 1);
  };

  const skip = () => {
    setStatus(index, 'skipped');
    goTo(index + 1);
  };

  const leaveFree = async (to: number) => {
    // Free navigation never blocks, but records whether the step we leave is valid.
    const from = index;
    goTo(to);
    const errs = await runValidate(from);
    setStatus(from, Object.keys(errs).length ? 'error' : statuses[from] === 'skipped' ? 'skipped' : 'complete');
  };

  const ctx: WizardContext<D> = { ...ctxBase, next: () => void next(), back };

  // Focus + announcement + slide on step change.
  useIsoLayoutEffect(() => {
    const dir = moved.current;
    if (!dir) return;
    moved.current = 0;
    if (done) {
      doneRef.current?.focus();
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.closest('.pl-wizard')?.scrollIntoView?.({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    setAnnouncement(L.announce(index + 1, total, textOf(current)));
    const panel = panelRef.current;
    if (panel && !prefersReducedMotion()) {
      const rtl = panel.closest('[dir]')?.getAttribute('dir') === 'rtl';
      const x = 28 * dir * (rtl ? -1 : 1);
      animate(panel, [{ opacity: 0, transform: `translateX(${x}px)` }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'expoOut', commit: false });
    }
  }, [index, done]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void next();
  };

  const saveNow = () => {
    const at = writeDraft();
    onSaveDraft?.(values, index);
    setSavedAt(at ?? Date.now());
    setAnnouncement(L.draftSaved);
  };

  const errorList = Object.entries(errors);
  const H = `h${headingLevel}` as 'h2';
  const progress = total > 1 ? index / (total - 1) : 1;
  const content = current?.review && current.content === undefined ? (
    <dl className="pl-wizard__review">
      {steps.map((s, i) =>
        i === index || !s.summary ? null : (
          <div key={s.id} className="pl-wizard__review-row">
            <dt>{s.title}</dt>
            <dd>
              <div className="pl-wizard__review-value">{s.summary(values)}</div>
              <button type="button" className="pl-btn pl-btn--ghost pl-btn--sm" onClick={() => goTo(i)}>
                {L.edit}
                <span className="pl-sr-only"> {textOf(s)}</span>
              </button>
            </dd>
          </div>
        ),
      )}
    </dl>
  ) : typeof current?.content === 'function' ? (
    current.content(ctx)
  ) : (
    current?.content
  );

  if (done && renderComplete) {
    return (
      <section className={cx('pl-wizard', className)} aria-label={label} data-orientation={orientation}>
        <div ref={doneRef} tabIndex={-1} className="pl-wizard__done">
          {renderComplete(values)}
        </div>
      </section>
    );
  }

  return (
    <section className={cx('pl-wizard', className)} aria-label={label} data-orientation={orientation} style={{ '--pl-wizard-progress': progress } as CSSProperties}>
      <nav className="pl-wizard__nav" aria-label={L.stepsNav}>
        <ol className="pl-wizard__steps">
          {steps.map((s, i) => {
            const st = viewStatuses[i];
            const reachable = linear ? i <= max : true;
            const isCurrent = i === index;
            const statusText = st === 'complete' || st === 'error' || st === 'skipped' ? L.status[st] : '';
            const inner = (
              <>
                <span className="pl-wizard__marker" aria-hidden="true">
                  {st === 'complete' ? <CheckIcon /> : st === 'error' ? '!' : s.icon ?? i + 1}
                </span>
                <span className="pl-wizard__step-text">
                  <span className="pl-wizard__step-title">
                    <span className="pl-sr-only">{L.stepOf(i + 1, total)}: </span>
                    {s.title}
                    {statusText && <span className="pl-sr-only">, {statusText}</span>}
                  </span>
                  {(s.description || s.optional) && ' '}
                  {(s.description || s.optional) && (
                    <span className="pl-wizard__step-desc">
                      {s.description}
                      {s.optional && <span className="pl-wizard__optional">{L.optional}</span>}
                    </span>
                  )}
                </span>
              </>
            );
            return (
              <li key={s.id} className="pl-wizard__step" data-state={st} data-current={isCurrent ? '' : undefined}>
                {reachable && !isCurrent ? (
                  <button type="button" className="pl-wizard__step-btn" onClick={() => (linear ? goTo(i) : void leaveFree(i))}>
                    {inner}
                  </button>
                ) : (
                  <span className="pl-wizard__step-btn" aria-current={isCurrent ? 'step' : undefined} aria-disabled={!isCurrent || undefined}>
                    {inner}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
        <div className="pl-wizard__bar" aria-hidden="true">
          <span className="pl-wizard__bar-fill" />
        </div>
      </nav>

      <form className="pl-wizard__body" noValidate onSubmit={onSubmit} aria-labelledby={`${id}-title`}>
        <header className="pl-wizard__header">
          <H ref={headingRef} id={`${id}-title`} tabIndex={-1} className="pl-wizard__title">
            <span className="pl-wizard__eyebrow">
              {L.stepOf(index + 1, total)}
              {current?.optional && <> · {L.optional}</>}
            </span>
            {current?.title}
          </H>
          {current?.description && <p className="pl-wizard__desc">{current.description}</p>}
        </header>

        {errorList.length > 0 && (
          <div ref={summaryRef} className="pl-wizard__errors" tabIndex={-1} aria-labelledby={`${id}-errors`}>
            <p id={`${id}-errors`} className="pl-wizard__errors-title">
              {L.errorTitle(errorList.length)}
            </p>
            <ul>
              {errorList.map(([field, message]) => (
                <li key={field}>
                  {/^\d+$/.test(field) ? (
                    message
                  ) : (
                    <a
                      href={`#${field}`}
                      onClick={(e) => {
                        const target = document.getElementById(field);
                        if (target) {
                          e.preventDefault();
                          target.focus();
                          target.scrollIntoView?.({ block: 'center' });
                        }
                      }}
                    >
                      {message}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div ref={panelRef} className="pl-wizard__panel">
          {content}
        </div>

        <footer className="pl-wizard__footer">
          {index > 0 && (
            <button type="button" className="pl-btn pl-btn--secondary" onClick={back} disabled={Boolean(busy)}>
              <Arrow back />
              {L.back}
            </button>
          )}
          <span className="pl-wizard__spacer" />
          {saveDraft && (
            <span className="pl-wizard__draft">
              {savedAt && (
                <span className="pl-wizard__saved" aria-hidden="true">
                  {L.draftSaved}
                </span>
              )}
              <button type="button" className="pl-btn pl-btn--ghost" onClick={saveNow}>
                {L.saveDraft}
              </button>
            </span>
          )}
          {current?.optional && index < total - 1 && (
            <button type="button" className="pl-btn pl-btn--ghost" onClick={skip} disabled={Boolean(busy)}>
              {L.skip}
            </button>
          )}
          <button type="submit" className="pl-btn pl-btn--primary" aria-busy={busy ? true : undefined} aria-disabled={busy ? true : undefined}>
            {busy ? (
              <>
                <span className="pl-spinner pl-wizard__spinner" aria-hidden="true" />
                {L.checking}
              </>
            ) : index === total - 1 ? (
              L.finish
            ) : (
              <>
                {L.next}
                <Arrow />
              </>
            )}
          </button>
        </footer>
      </form>
      <div className="pl-sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </section>
  );
}

function noop() {}

/** Props for a Pelagic Input bound to data[name] inside a step: id (the error-summary link target), value, error, onChange. */
export function wizardField<D extends Record<string, unknown>>(ctx: WizardContext<D>, name: keyof D & string) {
  return {
    id: name,
    name,
    value: (ctx.data[name] as string | undefined) ?? '',
    error: ctx.errors[name],
    onChange: (e: { target: { value: string } }) => ctx.setData({ [name]: e.target.value } as Partial<D>),
  };
}
