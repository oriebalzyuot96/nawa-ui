import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Timeline, relativeTimeLabel, type TimelineItem } from '../index';

const now = new Date(2026, 9, 13, 16, 0);
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600_000);

describe('Timeline', () => {
  it('keeps the original vertical markup', () => {
    const { container } = render(<Timeline items={[{ title: 'Created', time: '9:00' }, { title: 'Shipped', variant: 'success' }]} />);
    const list = container.querySelector('ol.oc-timeline')!;
    expect(list).not.toBeNull();
    expect(within(list as HTMLElement).getAllByRole('listitem')).toHaveLength(2);
    expect(container.querySelector('.oc-timeline__dot--success')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('9:00')).toHaveClass('oc-timeline__time');
  });

  it('shows relative times with the absolute time for tooltips and screen readers', () => {
    expect(relativeTimeLabel(hoursAgo(2), now, 'en')).toBe('2h ago');
    expect(relativeTimeLabel(hoursAgo(26), now, 'en')).toBe('yesterday');
    const { container } = render(<Timeline relative now={now} locale="en" items={[{ title: 'Deployed', date: hoursAgo(2) }]} />);
    const time = container.querySelector('time')!;
    expect(time).toHaveTextContent('2h ago');
    expect(time).toHaveAttribute('dateTime', hoursAgo(2).toISOString());
    expect(time.getAttribute('title')).toMatch(/Oct 13, 2026/);
    expect(container.querySelector('.oc-timeline__time .oc-sr-only')).toHaveTextContent(/Oct 13, 2026/);
  });

  it('groups by day under headings that label each list', () => {
    const items: TimelineItem[] = [
      { id: '1', title: 'Merged', date: hoursAgo(1) },
      { id: '2', title: 'Reviewed', date: hoursAgo(3) },
      { id: '3', title: 'Opened', date: hoursAgo(30) },
    ];
    render(<Timeline items={items} groupBy="day" now={now} locale="en" label="Pull request activity" />);
    expect(screen.getByRole('group', { name: 'Pull request activity' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Today' })).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: 'Today' })).getAllByRole('listitem')).toHaveLength(2);
    expect(within(screen.getByRole('list', { name: 'Yesterday' })).getAllByRole('listitem')).toHaveLength(1);
  });

  it('exposes status, avatars and expandable details', async () => {
    const { container } = render(
      <Timeline
        items={[
          { title: 'Ordered', status: 'complete', icon: '✓' },
          { title: 'Shipped', status: 'current', avatar: { name: 'Lina Haddad' }, details: <p>Tracking 1Z999</p> },
          { title: 'Delivered', status: 'upcoming' },
        ]}
      />,
    );
    expect(container.querySelector('.oc-timeline')).toHaveClass('oc-timeline--media');
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Ordered (completed)');
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[1]).toHaveTextContent('Lina Haddad: Shipped');
    const toggle = screen.getByRole('button', { name: 'Show details' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Tracking 1Z999')).not.toBeVisible();
    await userEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Hide details' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Tracking 1Z999')).toBeVisible();
  });

  it('renders horizontal / alternate layouts in a container and a loading skeleton', () => {
    const { container, rerender } = render(<Timeline layout="alternate" label="Roadmap" items={[{ title: 'Q1' }, { title: 'Q2' }]} />);
    expect(container.querySelector('.oc-timeline-wrap > ol.oc-timeline--alternate')).not.toBeNull();
    expect(screen.getByRole('list', { name: 'Roadmap' })).toBeInTheDocument();
    const sides = Array.from(container.querySelectorAll('.oc-timeline__item')).map((li) => li.getAttribute('data-side'));
    expect(sides).toEqual(['end', 'start']);
    rerender(<Timeline layout="horizontal" items={[{ title: 'Q1' }]} />);
    expect(container.querySelector('ol.oc-timeline--horizontal')).not.toBeNull();
    rerender(<Timeline loading items={[]} />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveTextContent('Loading timeline…');
  });
});
