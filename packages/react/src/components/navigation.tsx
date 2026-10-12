import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cx, getPageItems } from '../utils';

export interface TabItem {
  key: string;
  label: ReactNode;
  disabled?: boolean;
  content?: ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  /** Controlled selected key. */
  value?: string;
  /** Initial key when uncontrolled. */
  defaultValue?: string;
  onChange?: (key: string) => void;
  className?: string;
}

export function Tabs({ tabs, value, defaultValue, onChange, className }: TabsProps) {
  const [inner, setInner] = useState(defaultValue ?? tabs[0]?.key);
  const active = value ?? inner;
  const baseId = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const select = (key: string) => {
    if (value === undefined) setInner(key);
    onChange?.(key);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const enabled = tabs.map((t, i) => (t.disabled ? -1 : i)).filter((i) => i >= 0);
    if (!enabled.length) return;
    const pos = enabled.indexOf(index);
    let next: number | undefined;
    if (e.key === 'ArrowRight') next = enabled[(pos + 1) % enabled.length];
    else if (e.key === 'ArrowLeft') next = enabled[(pos - 1 + enabled.length) % enabled.length];
    else if (e.key === 'Home') next = enabled[0];
    else if (e.key === 'End') next = enabled[enabled.length - 1];
    if (next === undefined) return;
    e.preventDefault();
    refs.current[next]?.focus();
    select(tabs[next].key);
  };

  const activeTab = tabs.find((t) => t.key === active);

  return (
    <div className={cx('oc-tabs', className)}>
      <div role="tablist" className="oc-tabs__list">
        {tabs.map((t, i) => {
          const selected = t.key === active;
          return (
            <button
              key={t.key}
              ref={(el) => {
                refs.current[i] = el;
              }}
              id={`${baseId}-tab-${t.key}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${t.key}`}
              tabIndex={selected ? 0 : -1}
              disabled={t.disabled}
              className="oc-tabs__tab"
              onClick={() => select(t.key)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {activeTab && (
        <div role="tabpanel" id={`${baseId}-panel-${active}`} aria-labelledby={`${baseId}-tab-${active}`} className="oc-tabs__panel">
          {activeTab.content}
        </div>
      )}
    </div>
  );
}

export interface BreadcrumbItem {
  label: ReactNode;
  href?: string;
}

/** `label` names the navigation landmark; give each landmark on a page a unique name. */
export function Breadcrumb({ items, label = 'Breadcrumb', className }: { items: BreadcrumbItem[]; label?: string; className?: string }) {
  return (
    <nav aria-label={label}>
      <ol className={cx('oc-breadcrumb', className)}>
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="oc-breadcrumb__item" aria-current={last ? 'page' : undefined}>
              {item.href && !last ? <a href={item.href}>{item.label}</a> : item.label}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export interface PaginationProps {
  /** 1-based current page. */
  value: number;
  pageCount: number;
  onChange: (page: number) => void;
  /** Name of the navigation landmark; must be unique when a page has several. */
  label?: string;
  className?: string;
}

export function Pagination({ value, pageCount, onChange, label = 'Pagination', className }: PaginationProps) {
  return (
    <nav aria-label={label} className={cx('oc-pagination', className)}>
      <button type="button" className="oc-pagination__btn" aria-label="Previous page" disabled={value <= 1} onClick={() => onChange(value - 1)}>
        ‹
      </button>
      {getPageItems(value, pageCount).map((item, i) =>
        item === 'ellipsis' ? (
          <span key={`e${i}`} className="oc-pagination__ellipsis" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            className="oc-pagination__btn"
            aria-current={item === value ? 'page' : undefined}
            aria-label={`Page ${item}`}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        ),
      )}
      <button type="button" className="oc-pagination__btn" aria-label="Next page" disabled={value >= pageCount} onClick={() => onChange(value + 1)}>
        ›
      </button>
    </nav>
  );
}

export interface AccordionItem {
  key: string;
  title: ReactNode;
  content: ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** Allow more than one panel open at once. */
  multiple?: boolean;
  defaultOpen?: string[];
  className?: string;
}

export function Accordion({ items, multiple = false, defaultOpen = [], className }: AccordionProps) {
  const [open, setOpen] = useState<string[]>(defaultOpen);
  const baseId = useId();
  const toggle = (key: string) =>
    setOpen((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      return multiple ? [...prev, key] : [key];
    });

  return (
    <div className={cx('oc-accordion', className)}>
      {items.map((item) => {
        const expanded = open.includes(item.key);
        const panelId = `${baseId}-${item.key}-panel`;
        return (
          <div key={item.key} className="oc-accordion__item">
            <h3 style={{ margin: 0 }}>
              <button
                type="button"
                className="oc-accordion__trigger"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => toggle(item.key)}
              >
                {item.title}
                <span className="oc-accordion__icon" aria-hidden="true">
                  ▾
                </span>
              </button>
            </h3>
            {expanded && (
              <div id={panelId} role="region" className="oc-accordion__panel">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
