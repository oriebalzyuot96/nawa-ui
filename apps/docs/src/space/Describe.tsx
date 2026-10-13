/** "Describe what you need": Describe → Review chips → Generate. Fully offline (see engine.ts / recipes.ts). */
import { forwardRef, useId, useState } from 'react';
import { Button, Segmented, Textarea } from '@pelagic-ui/react';
import { generate, understand, type BlockMention, type Understanding } from './engine';
import { BLOCKS, type BlockId } from './blocks';
import { EXAMPLES, PAGE_RECIPES } from './recipes';
import { Icon } from './icons';
import { ACCENTS, type SpaceDoc } from './types';
import { flatten } from './tree';

function MiniSelect({ label, value, options, onChange }: { label: string; value: string; options: { label: string; value: string }[]; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <span className="sp-mini">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </span>
  );
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export const Describe = forwardRef<HTMLTextAreaElement, { onGenerate: (doc: SpaceDoc, mode: 'replace' | 'append') => void }>(function Describe({ onGenerate }, ref) {
  const [text, setText] = useState('');
  const [step, setStep] = useState(0);
  const [u, setU] = useState<Understanding | null>(null);
  const [mode, setMode] = useState<'replace' | 'append'>('replace');
  const [result, setResult] = useState('');
  const [addBlock, setAddBlock] = useState<BlockId>('faq');
  const headingId = useId();

  const run = (value = text) => {
    if (!value.trim()) return;
    setU(understand(value));
    setStep(1);
  };

  const patch = (p: Partial<Understanding>) => setU((prev) => (prev ? { ...prev, ...p } : prev));
  const patchBlock = (i: number, p: Partial<BlockMention>) => setU((prev) => (prev ? { ...prev, blocks: prev.blocks.map((b, k) => (k === i ? { ...b, ...p } : b)) } : prev));

  const doGenerate = () => {
    if (!u) return;
    const doc = generate(u);
    onGenerate(doc, mode);
    const count = flatten(doc.nodes).length;
    setResult(`${mode === 'replace' ? 'Generated' : 'Added'} “${doc.name}” with ${count} components. Keep editing with drag and drop, the layers panel or the keyboard.`);
    setStep(2);
  };

  const recipe = PAGE_RECIPES.find((r) => r.id === u?.page);

  return (
    <section className="sp-describe" aria-labelledby={headingId}>
      <div className="sp-describe__head">
        <h2 id={headingId} className="sp-describe__title">
          <Icon name="sparkle" /> Describe what you need
        </h2>
        <ol className="sp-steps" aria-label="Progress">
          {['Describe', 'Review chips', 'Generate'].map((label, i) => (
            <li key={label} className="sp-steps__item" data-state={i < step ? 'done' : i === step ? 'current' : 'todo'} aria-current={i === step ? 'step' : undefined}>
              <span className="sp-steps__num" aria-hidden="true">
                {i < step ? '✓' : i + 1}
              </span>
              {label}
            </li>
          ))}
        </ol>
      </div>

      {step === 0 && (
        <div className="sp-describe__body">
          <div className="sp-describe__input">
          <Textarea
            ref={ref}
            label="Page description (English or Arabic)"
            hint="For example: “sales dashboard with 4 KPIs, revenue chart and orders table”. Press Ctrl+Enter to continue."
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                run();
              }
            }}
          />
            <Button size="lg" onClick={() => run()} disabled={!text.trim()}>
              Understand <span aria-hidden="true">→</span>
            </Button>
          </div>
          <div className="sp-describe__row">
            <span className="sp-describe__try" aria-hidden="true">Try</span>
            <ul className="sp-examples" aria-label="Example descriptions">
              {EXAMPLES.map((ex) => (
                <li key={ex}>
                  <button
                    type="button"
                    className="sp-example"
                    lang={/[؀-ۿ]/.test(ex) ? 'ar' : undefined}
                    dir={/[؀-ۿ]/.test(ex) ? 'rtl' : undefined}
                    onClick={() => {
                      setText(ex);
                      run(ex);
                    }}
                  >
                    {ex}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {step === 1 && u && (
        <div className="sp-describe__body">
          <p className="sp-describe__lead" role="status">
            {u.fallback ? (
              <>I could not recognise a page type, so I started from a landing page. Adjust the chips below.</>
            ) : (
              <>
                Here is what I understood from <q>{text}</q>. Change anything, then generate.
              </>
            )}
          </p>
          <ul className="sp-chips" aria-label="Understood requirements">
            <li className="sp-chip sp-chip--page">
              <MiniSelect
                label="Page"
                value={u.page ?? ''}
                onChange={(v) => patch({ page: v || null })}
                options={[{ label: 'Sections only', value: '' }, ...PAGE_RECIPES.map((r) => ({ label: r.label, value: r.id }))]}
              />
              {u.topic && <span className="sp-chip__meta">topic: {u.topic}</span>}
            </li>
            {u.blocks.map((b, i) => {
              const def = BLOCKS[b.block];
              return (
                <li key={`${b.block}-${i}`} className="sp-chip">
                  <Icon name={def.icon} size={15} />
                  <span>
                    {def.label}
                    {b.subject ? ` · ${b.subject}` : ''}
                    {b.chartKind ? ` · ${b.chartKind}` : ''}
                  </span>
                  {def.countable && (
                    <span className="sp-mini sp-mini--num">
                      <label htmlFor={`${headingId}-c${i}`}>{def.countable.noun}</label>
                      <input
                        id={`${headingId}-c${i}`}
                        type="number"
                        min={def.countable.min}
                        max={def.countable.max}
                        value={b.count ?? def.countable.default}
                        onChange={(e) => patchBlock(i, { count: Math.min(def.countable!.max, Math.max(def.countable!.min, Number(e.target.value) || def.countable!.default)) })}
                      />
                    </span>
                  )}
                  <button type="button" className="sp-chip__x" aria-label={`Remove ${def.label}`} onClick={() => patch({ blocks: u.blocks.filter((_, k) => k !== i) })}>
                    <Icon name="x" size={13} />
                  </button>
                </li>
              );
            })}
            <li className="sp-chip sp-chip--add">
              <MiniSelect label="Add section" value={addBlock} onChange={(v) => setAddBlock(v as BlockId)} options={Object.values(BLOCKS).map((b) => ({ label: b.label, value: b.id }))} />
              <button type="button" className="sp-chip__add" aria-label="Add this section" onClick={() => patch({ blocks: [...u.blocks, { block: addBlock }] })}>
                <Icon name="plus" size={14} />
              </button>
            </li>
            <li className="sp-chip">
              <MiniSelect label="Mode" value={u.mode ?? 'page'} onChange={(v) => patch({ mode: v === 'page' ? undefined : (v as Understanding['mode']) })} options={[{ label: 'Follow site', value: 'page' }, { label: 'Light', value: 'light' }, { label: 'Dark', value: 'dark' }, { label: 'High contrast', value: 'hc' }]} />
            </li>
            <li className="sp-chip">
              <MiniSelect label="Accent" value={u.accent ?? 'violet'} onChange={(v) => patch({ accent: v as Understanding['accent'] })} options={ACCENTS.map((a) => ({ label: cap(a), value: a }))} />
            </li>
            <li className="sp-chip">
              <MiniSelect label="Shape" value={u.shape ?? 'default'} onChange={(v) => patch({ shape: v === 'default' ? undefined : (v as Understanding['shape']) })} options={[{ label: 'Default', value: 'default' }, { label: 'Round', value: 'round' }, { label: 'Sharp', value: 'sharp' }]} />
            </li>
            <li className="sp-chip">
              <MiniSelect label="Density" value={u.density ?? 'comfortable'} onChange={(v) => patch({ density: v === 'compact' ? 'compact' : undefined })} options={[{ label: 'Comfortable', value: 'comfortable' }, { label: 'Compact', value: 'compact' }]} />
            </li>
            <li className="sp-chip">
              <MiniSelect label="Language" value={u.lang} onChange={(v) => patch({ lang: v === 'ar' ? 'ar' : 'en', rtl: v === 'ar' ? true : u.rtl })} options={[{ label: 'English', value: 'en' }, { label: 'العربية', value: 'ar' }]} />
            </li>
            <li className="sp-chip">
              <label className="sp-chip__check">
                <input type="checkbox" checked={u.rtl} onChange={(e) => patch({ rtl: e.target.checked })} /> RTL
              </label>
            </li>
            <li className="sp-chip">
              <label className="sp-chip__check">
                <input type="checkbox" checked={u.captcha} onChange={(e) => patch({ captcha: e.target.checked })} /> Captcha
              </label>
            </li>
          </ul>
          <p className="sp-help">
            {recipe ? `${recipe.label}: ` : 'Sections: '}
            {[...(recipe ? recipe.items.flatMap((it) => ('row' in it ? it.row.map((r) => r.block) : [it.block])) : []), ...u.blocks.map((b) => b.block)]
              .filter((b, i, a) => a.indexOf(b) === i)
              .map((b) => BLOCKS[b].label)
              .join(' → ')}
          </p>
          <div className="sp-describe__row sp-describe__row--end">
            <Button variant="ghost" onClick={() => setStep(0)}>
              Back
            </Button>
            <Segmented
              label="When generating"
              value={mode}
              onChange={(v) => setMode(v as 'replace' | 'append')}
              options={[
                { label: 'Replace canvas', value: 'replace' },
                { label: 'Add to canvas', value: 'append' },
              ]}
            />
            <Button onClick={doGenerate}>
              <Icon name="sparkle" size={16} /> Generate page
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="sp-describe__body sp-describe__done">
          <p role="status">
            <Icon name="check" size={16} /> {result}
          </p>
          <div className="sp-describe__row">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Tweak chips
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setText('');
                setStep(0);
              }}
            >
              Describe another page
            </Button>
          </div>
        </div>
      )}
    </section>
  );
});
