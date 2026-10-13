import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { useState } from 'react';
import { AccessibilityInfo, Animated, Modal, Text } from 'react-native';
import {
  Accordion,
  Alert,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  DataTable,
  Dialog,
  Divider,
  Drawer,
  EmptyState,
  Input,
  PelagicProvider,
  Pagination,
  ProgressBar,
  RadioGroup,
  Segmented,
  Select,
  Skeleton,
  SkeletonCard,
  SkeletonText,
  Spinner,
  Stepper,
  Switch,
  Tabs,
  Tag,
  Textarea,
  Timeline,
  Toast,
  getPageItems,
  getTheme,
  themes,
  usePelagicTheme,
} from '../src';

// The RN jest preset mocks useColorScheme as a jest.fn returning 'light'.
const useColorScheme = jest.requireMock('react-native/Libraries/Utilities/useColorScheme').default as jest.Mock;

afterEach(() => {
  useColorScheme.mockReturnValue('light');
  jest.restoreAllMocks();
});

/** Let pending promise callbacks (AccessibilityInfo queries) settle inside act(). */
const settle = () => act(async () => {});

/** Host (native) elements matching a predicate — for Views that are not accessibility elements. */
const hosts = (pred: (props: Record<string, any>) => boolean) =>
  screen.UNSAFE_root.findAll((n) => typeof n.type === 'string' && pred(n.props));

describe('PelagicProvider / usePelagicTheme', () => {
  function Probe() {
    const t = usePelagicTheme();
    return <Text testID="probe">{JSON.stringify({ primary: t.primary, surface: t.surface })}</Text>;
  }
  const read = () => JSON.parse(String(screen.getByTestId('probe').props.children));

  it.each([
    ['light', 'violet'],
    ['dark', 'rose'],
    ['hc', 'amber'],
    ['light', 'emerald'],
  ] as const)('mode %s with accent %s resolves the token theme', async (mode, accent) => {
    render(
      <PelagicProvider mode={mode} accent={accent}>
        <Probe />
      </PelagicProvider>,
    );
    await settle();
    const expected = getTheme(mode, accent);
    expect(read()).toEqual({ primary: expected.primary, surface: expected.surface });
  });

  it('defaults to the system scheme with the teal accent', async () => {
    useColorScheme.mockReturnValue('dark');
    render(
      <PelagicProvider>
        <Probe />
      </PelagicProvider>,
    );
    await settle();
    expect(read().surface).toBe(themes.dark.teal.surface);
    expect(read().primary).toBe(themes.dark.teal.primary);
  });

  it("'system' switches to high contrast when the OS reports it (Android)", async () => {
    const info = AccessibilityInfo as unknown as { isHighTextContrastEnabled?: () => Promise<boolean> };
    info.isHighTextContrastEnabled = jest.fn(() => Promise.resolve(true));
    try {
      render(
        <PelagicProvider mode="system" accent="indigo">
          <Probe />
        </PelagicProvider>,
      );
      await settle();
      expect(read().primary).toBe(themes.hc.indigo.primary);
    } finally {
      delete info.isHighTextContrastEnabled;
    }
  });

  it('works without a provider (device scheme, default violet)', () => {
    useColorScheme.mockReturnValue('dark');
    render(<Probe />);
    expect(read().surface).toBe(themes.dark.violet.surface);
  });
});

describe('Button', () => {
  it('is a labelled button that fires onPress', () => {
    const onPress = jest.fn();
    render(<Button title="Save" onPress={onPress} />);
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn).toBeEnabled();
    expect(btn).not.toBeBusy();
    fireEvent.press(btn);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('loading is busy + disabled and shows a spinner', () => {
    const onPress = jest.fn();
    render(<Button title="Pay" loading onPress={onPress} />);
    const btn = screen.getByRole('button', { name: 'Pay' });
    expect(btn).toBeBusy();
    expect(btn).toBeDisabled();
    fireEvent.press(btn);
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.UNSAFE_getByType(require('react-native').ActivityIndicator)).toBeTruthy();
  });

  it('disabled reports accessibilityState.disabled', () => {
    render(<Button title="Off" disabled variant="danger" size="lg" block />);
    expect(screen.getByRole('button', { name: 'Off' })).toBeDisabled();
  });
});

describe('Input / Textarea', () => {
  it('labels the field and forwards text changes', () => {
    const onChangeText = jest.fn();
    render(<Input label="Email" hint="Work address" placeholder="you@example.com" onChangeText={onChangeText} />);
    const input = screen.getByLabelText('Email');
    expect(screen.getByText('Work address')).toBeOnTheScreen();
    fireEvent.changeText(input, 'a@b.co');
    expect(onChangeText).toHaveBeenCalledWith('a@b.co');
  });

  it('error replaces the hint and colors the border with the danger token', () => {
    render(
      <PelagicProvider mode="light" accent="violet">
        <Input label="Email" hint="Work address" error="Enter a valid email" />
      </PelagicProvider>,
    );
    expect(screen.getByText('Enter a valid email')).toHaveStyle({ color: themes.light.violet.danger });
    expect(screen.queryByText('Work address')).toBeNull();
    expect(screen.getByLabelText('Email')).toHaveStyle({ borderColor: themes.light.violet.danger });
  });

  it('Textarea is multiline with 4 lines by default', () => {
    render(<Textarea label="Bio" />);
    const ta = screen.getByLabelText('Bio');
    expect(ta).toHaveProp('multiline', true);
    expect(ta).toHaveProp('numberOfLines', 4);
  });
});

describe('Checkbox / Switch / RadioGroup', () => {
  function CheckboxHarness({ disabled }: { disabled?: boolean }) {
    const [on, setOn] = useState(false);
    return <Checkbox label="Accept terms" checked={on} onChange={setOn} disabled={disabled} />;
  }

  it('Checkbox exposes role + checked state and toggles', () => {
    render(<CheckboxHarness />);
    const box = screen.getByRole('checkbox', { name: 'Accept terms' });
    expect(box).not.toBeChecked();
    fireEvent.press(box);
    expect(screen.getByRole('checkbox', { name: 'Accept terms' })).toBeChecked();
    expect(screen.getByText('✓')).toBeOnTheScreen();
  });

  it('disabled Checkbox does not toggle', () => {
    render(<CheckboxHarness disabled />);
    const box = screen.getByRole('checkbox', { name: 'Accept terms' });
    expect(box).toBeDisabled();
    fireEvent.press(box);
    expect(box).not.toBeChecked();
  });

  it('Switch is a labelled switch wired to onChange', () => {
    const onChange = jest.fn();
    render(<Switch label="Wi-Fi" checked={false} onChange={onChange} />);
    const sw = screen.getByRole('switch', { name: 'Wi-Fi' });
    expect(sw).toHaveProp('value', false);
    fireEvent(sw, 'valueChange', true);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('disabled Switch reports disabled', () => {
    render(<Switch label="Locked" checked onChange={jest.fn()} disabled />);
    // RN's Switch forwards `disabled` to the native control (announced as dimmed/disabled by the OS).
    expect(screen.getByRole('switch', { name: 'Locked' })).toHaveProp('disabled', true);
  });

  it('RadioGroup exposes radios with checked/disabled state', () => {
    const onChange = jest.fn();
    render(
      <RadioGroup
        label="Size"
        value="m"
        onChange={onChange}
        options={[
          { label: 'Small', value: 's' },
          { label: 'Medium', value: 'm' },
          { label: 'Large', value: 'l', disabled: true },
        ]}
      />,
    );
    expect(screen.getByLabelText('Size')).toHaveProp('accessibilityRole', 'radiogroup');
    expect(screen.getByRole('radio', { name: 'Medium' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Small' })).not.toBeChecked();
    const large = screen.getByRole('radio', { name: 'Large' });
    expect(large).toBeDisabled();
    fireEvent.press(large);
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.press(screen.getByRole('radio', { name: 'Small' }));
    expect(onChange).toHaveBeenCalledWith('s');
  });
});

describe('Segmented', () => {
  it('is a radiogroup with one checked segment', () => {
    function Harness() {
      const [v, setV] = useState('list');
      return <Segmented label="View" value={v} onChange={setV} options={[{ label: 'List', value: 'list' }, { label: 'Grid', value: 'grid' }]} />;
    }
    render(<Harness />);
    expect(screen.getByLabelText('View')).toHaveProp('accessibilityRole', 'radiogroup');
    expect(screen.getByRole('radio', { name: 'List' })).toBeChecked();
    fireEvent.press(screen.getByRole('radio', { name: 'Grid' }));
    expect(screen.getByRole('radio', { name: 'Grid' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'List' })).not.toBeChecked();
  });
});

describe('Select (bottom sheet)', () => {
  function Harness() {
    const [v, setV] = useState<string | undefined>();
    return <Select label="Country" value={v} onChange={setV} options={[{ label: 'Jordan', value: 'jo' }, { label: 'Oman', value: 'om' }]} />;
  }

  it('opens a sheet of menu items, selects one and closes', () => {
    render(<Harness />);
    const combo = screen.getByRole('combobox', { name: 'Country' });
    expect(within(combo).getByText('Select…')).toBeOnTheScreen();
    expect(screen.queryByRole('menuitem')).toBeNull();
    fireEvent.press(combo);
    const items = screen.getAllByRole('menuitem');
    expect(items).toHaveLength(2);
    expect(items[0]).not.toBeSelected();
    fireEvent.press(screen.getByRole('menuitem', { name: 'Oman' }));
    expect(screen.queryByRole('menuitem')).toBeNull();
    expect(within(screen.getByRole('combobox', { name: 'Country' })).getByText('Oman')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('combobox', { name: 'Country' }));
    expect(screen.getByRole('menuitem', { name: 'Oman' })).toBeSelected();
  });

  it('Android back (onRequestClose) and backdrop close the sheet', () => {
    render(<Harness />);
    fireEvent.press(screen.getByRole('combobox', { name: 'Country' }));
    fireEvent(screen.UNSAFE_getByType(Modal), 'requestClose');
    expect(screen.queryByRole('menuitem')).toBeNull();
  });

  it('uses the placeholder as the name when there is no label', () => {
    render(<Select placeholder="Pick a size" options={[]} onChange={jest.fn()} />);
    expect(screen.getByRole('combobox', { name: 'Pick a size' })).toBeOnTheScreen();
  });
});

describe('Tabs', () => {
  it('marks the selected tab and swaps content (uncontrolled)', () => {
    const onChange = jest.fn();
    render(
      <Tabs
        onChange={onChange}
        tabs={[
          { key: 'a', label: 'Account', content: <Text>Account panel</Text> },
          { key: 'b', label: 'Billing', content: <Text>Billing panel</Text> },
          { key: 'c', label: 'Closed', disabled: true, content: <Text>Never</Text> },
        ]}
      />,
    );
    expect(screen.getByRole('tab', { name: 'Account' })).toBeSelected();
    expect(screen.getByText('Account panel')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('tab', { name: 'Billing' }));
    expect(screen.getByRole('tab', { name: 'Billing' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Account' })).not.toBeSelected();
    expect(screen.getByText('Billing panel')).toBeOnTheScreen();
    expect(onChange).toHaveBeenCalledWith('b');
    const closed = screen.getByRole('tab', { name: 'Closed' });
    expect(closed).toBeDisabled();
    fireEvent.press(closed);
    expect(screen.queryByText('Never')).toBeNull();
  });

  it('controlled value wins over presses', () => {
    const onChange = jest.fn();
    render(<Tabs value="a" onChange={onChange} tabs={[{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }]} />);
    fireEvent.press(screen.getByRole('tab', { name: 'B' }));
    expect(onChange).toHaveBeenCalledWith('b');
    expect(screen.getByRole('tab', { name: 'A' })).toBeSelected();
  });
});

describe('Pagination', () => {
  it('labels page buttons, marks the current page and disables edges', () => {
    expect(getPageItems(5, 10)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]);
    const onChange = jest.fn();
    render(<Pagination value={1} pageCount={10} onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'Page 2' })).not.toBeSelected();
    expect(screen.getByText('…')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Next page' }));
    expect(onChange).toHaveBeenLastCalledWith(2);
    fireEvent.press(screen.getByRole('button', { name: 'Page 10' }));
    expect(onChange).toHaveBeenLastCalledWith(10);
    fireEvent.press(screen.getByRole('button', { name: 'Previous page' }));
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('disables Next on the last page', () => {
    render(<Pagination value={3} pageCount={3} onChange={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled();
  });
});

describe('Accordion', () => {
  const items = [
    { key: 'a', title: 'Shipping', content: <Text>Ships in 2 days</Text> },
    { key: 'b', title: 'Returns', content: <Text>30 day returns</Text> },
  ];

  it('toggles expanded state; single mode closes the others', () => {
    render(<Accordion items={items} defaultOpen={['a']} />);
    expect(screen.getByRole('button', { name: /Shipping/ })).toBeExpanded();
    expect(screen.getByText('Ships in 2 days')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: /Returns/ }));
    expect(screen.getByRole('button', { name: /Returns/ })).toBeExpanded();
    expect(screen.getByRole('button', { name: /Shipping/ })).toBeCollapsed();
    expect(screen.queryByText('Ships in 2 days')).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: /Returns/ }));
    expect(screen.queryByText('30 day returns')).toBeNull();
  });

  it('multiple keeps several open', () => {
    render(<Accordion items={items} multiple defaultOpen={['a']} />);
    fireEvent.press(screen.getByRole('button', { name: /Returns/ }));
    expect(screen.getByText('Ships in 2 days')).toBeOnTheScreen();
    expect(screen.getByText('30 day returns')).toBeOnTheScreen();
  });
});

describe('DataTable', () => {
  type Row = { id: number; name: string; age: number | null };
  const rows: Row[] = [
    { id: 1, name: 'Charlie', age: 30 },
    { id: 2, name: 'alice', age: 4 },
    { id: 3, name: 'Bob', age: null },
  ];
  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'age', label: 'Age', sortable: true, align: 'end' as const },
    { key: 'id', label: 'ID' },
  ];
  const names = () => screen.getAllByText(/^(Charlie|alice|Bob)$/).map((t) => t.props.children);

  it('sorts by a column and reports the sort state', () => {
    const onSortChange = jest.fn();
    render(<DataTable<Row> rows={rows} columns={columns} onSortChange={onSortChange} />);
    expect(names()).toEqual(['Charlie', 'alice', 'Bob']);
    const nameHeader = screen.getByRole('button', { name: 'Name' });
    expect(nameHeader).not.toBeSelected();
    fireEvent.press(nameHeader);
    expect(screen.getByRole('button', { name: 'Name' })).toBeSelected();
    expect(names()).toEqual(['alice', 'Bob', 'Charlie']);
    expect(onSortChange).toHaveBeenLastCalledWith({ key: 'name', direction: 'asc' });
    fireEvent.press(screen.getByRole('button', { name: 'Name' }));
    expect(names()).toEqual(['Charlie', 'Bob', 'alice']);
    fireEvent.press(screen.getByRole('button', { name: 'Age' }));
    expect(names()).toEqual(['alice', 'Charlie', 'Bob']); // numeric, nulls last
    expect(screen.getByRole('button', { name: 'Name' })).not.toBeSelected();
  });

  it('non-sortable headers are not buttons', () => {
    render(<DataTable<Row> rows={rows} columns={columns} />);
    expect(screen.queryByRole('button', { name: 'ID' })).toBeNull();
    expect(screen.getByLabelText('ID')).toHaveProp('accessibilityRole', 'text');
  });

  it('remote keeps server order and defaultSort applies', () => {
    const { rerender } = render(<DataTable<Row> rows={rows} columns={columns} remote defaultSort={{ key: 'name', direction: 'asc' }} />);
    expect(names()).toEqual(['Charlie', 'alice', 'Bob']);
    rerender(<DataTable<Row> rows={rows} columns={columns} defaultSort={{ key: 'name', direction: 'desc' }} />);
    // sort state is kept from the first mount (name asc); turning remote off applies it locally
    expect(names()).toEqual(['alice', 'Bob', 'Charlie']);
  });

  it('loading shows a busy progressbar of hidden skeleton rows', () => {
    render(<DataTable<Row> rows={rows} columns={columns} loading loadingRows={2} />);
    const loading = screen.getByRole('progressbar', { name: 'Loading rows' });
    expect(loading).toBeOnTheScreen();
    expect(screen.queryByText('Charlie')).toBeNull();
    const skeletons = screen.UNSAFE_getAllByType(Skeleton);
    expect(skeletons).toHaveLength(2 * 3);
  });

  it('shows the empty message', () => {
    render(<DataTable<Row> rows={[]} columns={columns} emptyMessage="Nobody yet" />);
    expect(screen.getByText('Nobody yet')).toBeOnTheScreen();
  });
});

describe('Dialog / Drawer', () => {
  it.each([
    ['Dialog', Dialog],
    ['Drawer', Drawer],
  ] as const)('%s: header, close button, Android back and visibility', (_name, Overlay) => {
    const onClose = jest.fn();
    const { rerender } = render(
      <Overlay visible title="Edit profile" onClose={onClose} footer={<Text>Footer</Text>}>
        <Text>Body</Text>
      </Overlay>,
    );
    expect(screen.getByRole('header')).toHaveTextContent('Edit profile');
    expect(screen.getByText('Footer')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent(screen.UNSAFE_getByType(Modal), 'requestClose');
    expect(onClose).toHaveBeenCalledTimes(2);
    fireEvent.press(screen.getByText('Body')); // content presses do not close
    expect(onClose).toHaveBeenCalledTimes(2);
    rerender(
      <Overlay visible={false} title="Edit profile" onClose={onClose}>
        <Text>Body</Text>
      </Overlay>,
    );
    expect(screen.queryByText('Body')).toBeNull();
  });

  it('Dialog backdrop closes unless closeOnBackdrop is false', () => {
    const onClose = jest.fn();
    const { rerender } = render(
      <Dialog visible title="T" onClose={onClose}>
        <Text>x</Text>
      </Dialog>,
    );
    fireEvent.press(screen.getByLabelText('Dismiss dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
    rerender(
      <Dialog visible title="T" onClose={onClose} closeOnBackdrop={false}>
        <Text>x</Text>
      </Dialog>,
    );
    fireEvent.press(screen.getByLabelText('Dismiss dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('Toast', () => {
  it('is a polite live region and dismisses by id', () => {
    const onDismiss = jest.fn();
    render(
      <Toast
        onDismiss={onDismiss}
        items={[
          { id: 1, title: 'Saved', message: 'Profile updated', variant: 'success' },
          { id: 'x', message: 'Heads up' },
        ]}
      />,
    );
    expect(screen.getByText('Saved')).toBeOnTheScreen();
    expect(hosts((p) => p.accessibilityLiveRegion === 'polite')).toHaveLength(1);
    const dismiss = screen.getAllByRole('button', { name: 'Dismiss' });
    expect(dismiss).toHaveLength(2);
    fireEvent.press(dismiss[1]);
    expect(onDismiss).toHaveBeenCalledWith('x');
  });

  it('renders nothing for an empty stack', () => {
    render(<Toast items={[]} onDismiss={jest.fn()} />);
    expect(screen.toJSON()).toBeNull();
  });
});

describe('Skeleton (reduced motion)', () => {
  function mockLoop() {
    const stop = jest.fn();
    const start = jest.fn();
    const loop = jest.spyOn(Animated, 'loop').mockImplementation(() => ({ start, stop, reset: jest.fn() }) as unknown as Animated.CompositeAnimation);
    return { loop, start, stop };
  }

  it('pulses when motion is allowed', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    const { loop, start, stop } = mockLoop();
    render(<Skeleton width={100} />);
    await settle();
    expect(loop).toHaveBeenCalledTimes(1);
    expect(start).toHaveBeenCalledTimes(1);
    expect(stop).not.toHaveBeenCalled();
  });

  it('stops pulsing (and never restarts) when the OS asks to reduce motion', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const { loop, stop } = mockLoop();
    render(<Skeleton width={100} />);
    await settle();
    expect(stop).toHaveBeenCalled();
    expect(loop).toHaveBeenCalledTimes(1);
  });

  it('reacts to the reduceMotionChanged event and unsubscribes on unmount', async () => {
    let listener: ((v: boolean) => void) | undefined;
    const remove = jest.fn();
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation(((_: string, fn: (v: boolean) => void) => {
      listener = fn;
      return { remove };
    }) as never);
    const { stop } = mockLoop();
    const { unmount } = render(<Skeleton />);
    await settle();
    act(() => listener!(true));
    expect(stop).toHaveBeenCalled();
    unmount();
    expect(remove).toHaveBeenCalled();
  });

  it('is hidden from screen readers; circle uses its height as width', () => {
    render(<Skeleton circle height={40} width={300} />);
    const [view] = hosts((p) => p.importantForAccessibility === 'no-hide-descendants');
    expect(view.props.accessibilityElementsHidden).toBe(true);
    expect(view).toHaveStyle({ width: 40, height: 40, borderRadius: 20 });
  });

  it('SkeletonText / SkeletonCard announce a single busy progressbar', () => {
    render(
      <>
        <SkeletonText lines={4} label="Loading article" />
        <SkeletonCard label="Loading card" />
      </>,
    );
    const text = screen.getByRole('progressbar', { name: 'Loading article' });
    expect(text).toBeBusy();
    expect(within(text).UNSAFE_getAllByType(Skeleton)).toHaveLength(4);
    expect(screen.getByRole('progressbar', { name: 'Loading card' })).toBeBusy();
  });
});

describe('display components: render + accessibility props', () => {
  it('Alert has role alert and an optional Dismiss button', () => {
    const onClose = jest.fn();
    render(
      <Alert variant="danger" title="Payment failed" onClose={onClose}>
        Card declined
      </Alert>,
    );
    const [alert] = hosts((p) => p.accessibilityRole === 'alert');
    expect(within(alert).getByText('Card declined')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('Avatar carries the name as its label and renders initials', () => {
    render(<Avatar name="Ada Lovelace" />);
    const avatar = screen.getByLabelText('Ada Lovelace');
    expect(avatar).toHaveProp('accessibilityRole', 'image');
    expect(screen.getByText('AL')).toBeOnTheScreen();
  });

  it('Avatar with src renders an image instead of initials', () => {
    render(<Avatar name="Ada Lovelace" src="https://example.test/a.png" size="lg" />);
    expect(screen.queryByText('AL')).toBeNull();
  });

  it('ProgressBar exposes min/max/now and clamps', () => {
    render(<ProgressBar value={140} label="Upload" />);
    const bar = screen.getByLabelText('Upload');
    expect(bar).toHaveProp('accessibilityRole', 'progressbar');
    expect(bar).toHaveProp('accessibilityValue', { min: 0, max: 100, now: 100 });
  });

  it('indeterminate ProgressBar has no value', () => {
    render(<ProgressBar />);
    expect(screen.getByLabelText('Progress').props.accessibilityValue).toBeUndefined();
  });

  it('Stepper announces "Step n of m"', () => {
    render(<Stepper current={1} steps={[{ label: 'Cart' }, { label: 'Pay', description: 'Card' }, { label: 'Done' }]} />);
    expect(screen.getByLabelText('Step 2 of 3')).toHaveProp('accessibilityRole', 'progressbar');
    expect(screen.getByText('Card')).toBeOnTheScreen();
  });

  it('Spinner is labelled Loading', () => {
    render(<Spinner size="lg" />);
    expect(screen.getByLabelText('Loading')).toBeOnTheScreen();
  });

  it('Tag remove button is labelled', () => {
    const onRemove = jest.fn();
    render(
      <Tag removable onRemove={onRemove}>
        design
      </Tag>,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Remove' }));
    expect(onRemove).toHaveBeenCalled();
  });

  it('Badge, Card, EmptyState, Timeline, Divider and Breadcrumb render', () => {
    const onHome = jest.fn();
    render(
      <>
        <Badge variant="primary">New</Badge>
        <Card title="Plan" footer={<Text>Foot</Text>}>
          <Text>Body</Text>
        </Card>
        <EmptyState title="Nothing" description="Add one">
          <Button title="Create" />
        </EmptyState>
        <Timeline items={[{ title: 'Created', time: '9:00', variant: 'success' }, { title: 'Shipped', description: 'DHL' }]} />
        <Divider />
        <Breadcrumb items={[{ label: 'Home', onPress: onHome }, { label: 'Docs' }]} />
      </>,
    );
    for (const t of ['New', 'Plan', 'Body', 'Foot', 'Nothing', 'Add one', 'Created', '9:00', 'DHL']) expect(screen.getByText(t)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Create' })).toBeOnTheScreen();
    fireEvent.press(screen.getByText('Home'));
    expect(onHome).toHaveBeenCalled();
    expect(screen.getByText('Docs').parent).toBeTruthy();
  });
});

describe('EmptyState (illustrated)', () => {
  it('exposes the title as a header and hides the illustration from assistive tech', () => {
    render(
      <EmptyState
        title="No results"
        description="Try another search"
        illustration={<Text testID="art">ART</Text>}
        primaryAction={<Button title="Clear" />}
        secondaryAction={<Button title="Help" />}
      >
        <Button title="Legacy" />
      </EmptyState>,
    );
    expect(screen.getByRole('header', { name: 'No results' })).toBeOnTheScreen();
    expect(screen.getByText('Try another search')).toBeOnTheScreen();
    expect(screen.queryByText('ART')).toBeNull();
    expect(screen.getByTestId('art', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getAllByRole('button').map((b) => b.props.accessibilityLabel ?? within(b).queryByText(/.+/)?.props.children)).toEqual(['Clear', 'Help', 'Legacy']);
  });

  it('drops the header role when headingLevel is false and supports sizes and alignment', () => {
    render(<EmptyState title="Inline" headingLevel={false} size="compact" align="start" tone="danger" testID="empty" />);
    expect(screen.queryByRole('header')).toBeNull();
    expect(screen.getByText('Inline')).toHaveStyle({ textAlign: 'left' });
    expect(screen.getByTestId('empty')).toHaveStyle({ alignItems: 'flex-start' });
  });

  it('switches to a row when layout="split" is wide enough', () => {
    render(<EmptyState title="Inbox zero" layout="split" illustration={<Text>ART</Text>} testID="empty" />);
    fireEvent(screen.getByTestId('empty'), 'layout', { nativeEvent: { layout: { width: 800, height: 300, x: 0, y: 0 } } });
    expect(screen.getByText('Inbox zero')).toHaveStyle({ textAlign: 'left' });
  });
});

describe('accessibility semantics', () => {
  test('ProgressBar is exposed as one accessibility element', () => {
    render(<ProgressBar value={40} label="Upload" />);
    expect(screen.getByRole('progressbar', { name: 'Upload' })).toBeOnTheScreen();
  });

  test('Avatar is exposed as one image named after the person', () => {
    render(<Avatar name="Ada Lovelace" />);
    expect(screen.getByRole('image', { name: 'Ada Lovelace' })).toBeOnTheScreen();
  });

  test('Stepper is exposed as one accessibility element', () => {
    render(<Stepper current={0} steps={[{ label: 'A' }, { label: 'B' }]} />);
    expect(screen.getByRole('progressbar', { name: 'Step 1 of 2' })).toBeOnTheScreen();
  });

  test('Input exposes its error on the TextInput', () => {
    render(<Input label="Email" error="Enter a valid email" />);
    const input = screen.getByLabelText('Email');
    expect(String(input.props.accessibilityHint ?? input.props['aria-describedby'] ?? '')).toContain('Enter a valid email');
  });
});
