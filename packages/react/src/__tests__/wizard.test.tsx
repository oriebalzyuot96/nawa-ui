import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Input, Wizard, wizardField, type WizardStep } from '../index';

type Data = { email?: string; plan?: string; notes?: string };

function steps(overrides: Partial<Record<string, Partial<WizardStep<Data>>>> = {}): WizardStep<Data>[] {
  return [
    {
      id: 'account',
      title: 'Account',
      description: 'Your login',
      content: (ctx) => <Input label="Email" {...wizardField(ctx, 'email')} />,
      validate: ({ data }) => (data.email?.includes('@') ? undefined : { email: 'Enter a valid email address' }),
      summary: (d) => d.email,
      ...overrides.account,
    },
    {
      id: 'notes',
      title: 'Notes',
      optional: true,
      content: (ctx) => <Input label="Notes" {...wizardField(ctx, 'notes')} />,
      summary: (d) => d.notes || '—',
      ...overrides.notes,
    },
    { id: 'review', title: 'Review', review: true, ...overrides.review },
  ];
}

beforeEach(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({ matches: query.includes('reduce'), media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe('Wizard', () => {
  it('renders a labelled wizard with a step list and the current step heading', () => {
    render(<Wizard<Data> label="Sign up" steps={steps()} />);
    expect(screen.getByRole('region', { name: 'Sign up' })).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Steps' });
    const items = within(nav).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(within(items[0]).getByText(/Step 1 of 3/).closest('[aria-current]')).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('heading', { level: 2, name: /Step 1 of 3\s*Account/ })).toBeInTheDocument();
    // Linear: later steps are not clickable yet.
    expect(within(items[2]).queryByRole('button')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
  });

  it('blocks Next on validation errors and focuses a summary linking to the field', async () => {
    const user = userEvent.setup();
    render(<Wizard<Data> label="Sign up" steps={steps()} />);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(screen.getByText('There is a problem').parentElement).toHaveFocus());
    const link = screen.getByRole('link', { name: 'Enter a valid email address' });
    expect(link).toHaveAttribute('href', '#email');
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('heading', { name: /Account/ })).toBeInTheDocument();
    expect(document.querySelector('.pl-wizard__step[data-state="error"]')).not.toBeNull();
    await user.click(link);
    expect(screen.getByLabelText('Email')).toHaveFocus();
  });

  it('moves focus to the new step heading, announces it, and supports skip, back and review', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<Wizard<Data> label="Sign up" steps={steps()} onComplete={onComplete} renderComplete={() => <h2>All done</h2>} />);
    await user.type(screen.getByLabelText('Email'), 'ada@example.com{Enter}');
    const heading = screen.getByRole('heading', { name: /Step 2 of 3.*Notes/ });
    expect(heading).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Step 2 of 3: Notes');
    expect(screen.getByRole('button', { name: /Step 1 of 3: Account\s*,\s*completed/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Skip this step' }));
    expect(screen.getByRole('heading', { name: /Review/ })).toHaveFocus();
    expect(screen.getByRole('button', { name: /Notes\s*,\s*skipped/ })).toBeInTheDocument();
    const review = document.querySelector('.pl-wizard__review')!;
    expect(review).toHaveTextContent('ada@example.com');
    await user.click(within(review as HTMLElement).getByRole('button', { name: 'Edit Account' }));
    expect(screen.getByRole('heading', { name: /Account/ })).toHaveFocus();
    expect(screen.getByLabelText('Email')).toHaveValue('ada@example.com');

    await user.click(screen.getByRole('button', { name: /Step 3 of 3: Review/ }));
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('heading', { name: /Notes/ })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Finish' }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith({ email: 'ada@example.com' }));
    expect(screen.getByRole('heading', { name: 'All done' }).parentElement).toHaveFocus();
  }, 30000);

  it('shows a busy state while async validation runs', async () => {
    const user = userEvent.setup();
    let release!: () => void;
    const validate = vi.fn(() => new Promise<undefined>((r) => (release = () => r(undefined))));
    render(<Wizard<Data> label="Sign up" steps={steps({ account: { validate } })} />);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    const busy = screen.getByRole('button', { name: 'Checking…' });
    expect(busy).toHaveAttribute('aria-busy', 'true');
    release();
    await waitFor(() => expect(screen.getByRole('heading', { name: /Notes/ })).toHaveFocus());
  });

  it('lets free navigation jump ahead and validates everything on Finish', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<Wizard<Data> label="Sign up" linear={false} steps={steps()} onComplete={onComplete} />);
    await user.click(screen.getByRole('button', { name: /Step 3 of 3: Review/ }));
    expect(screen.getByRole('heading', { name: /Review/ })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Finish' }));
    // Account is invalid: the wizard returns there with the error summary.
    await waitFor(() => expect(screen.getByRole('heading', { name: /Account/ })).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('There is a problem')).toBeInTheDocument());
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('persists a draft and restores it', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Wizard<Data> label="Sign up" persist="signup-draft" saveDraft steps={steps()} />);
    await user.type(screen.getByLabelText('Email'), 'grace@example.com');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Save draft' }));
    expect(screen.getByRole('status')).toHaveTextContent('Draft saved');
    const saved = JSON.parse(window.localStorage.getItem('signup-draft')!);
    expect(saved).toMatchObject({ index: 1, data: { email: 'grace@example.com' } });
    unmount();
    render(<Wizard<Data> label="Sign up" persist="signup-draft" steps={steps()} />);
    await waitFor(() => expect(screen.getByRole('heading', { name: /Notes/ })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByLabelText('Email')).toHaveValue('grace@example.com');
  });

  it('mirrors the arrow icons in RTL but keeps DOM order', () => {
    render(
      <div dir="rtl">
        <Wizard<Data> label="تسجيل" steps={steps()} defaultStep={1} labels={{ next: 'التالي', back: 'السابق' }} />
      </div>,
    );
    const footer = document.querySelector('.pl-wizard__footer')!;
    const buttons = within(footer as HTMLElement).getAllByRole('button');
    expect(buttons[0]).toHaveAccessibleName('السابق');
    expect(buttons[buttons.length - 1]).toHaveAccessibleName('التالي');
  });
});
