import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  AutoComplete,
  CascadeSelect,
  ColorPicker,
  contrastRatio,
  formatColor,
  parseColor,
  DatePicker,
  FloatLabel,
  InputMask,
  InputNumber,
  InputOtp,
  Knob,
  Listbox,
  MultiSelect,
  Password,
  Rating,
  SelectButton,
  ToggleButton,
  TreeSelect,
  formatIsoDate,
  keyFilterProps,
  parseIsoDate,
  passwordStrength,
  type FormOption,
} from '../index';

const fruits: FormOption[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Blueberry', value: 'blueberry', disabled: true },
  { label: 'Cherry', value: 'cherry' },
];

describe('AutoComplete', () => {
  it('is a combobox with a listbox popup driven by the keyboard', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<AutoComplete label="Fruit" suggestions={fruits} onSelect={onSelect} />);
    const input = screen.getByRole('combobox', { name: 'Fruit' });
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');

    await user.type(input, 'b');
    expect(input).toHaveAttribute('aria-expanded', 'true');
    const listbox = screen.getByRole('listbox');
    expect(input).toHaveAttribute('aria-controls', listbox.id);
    expect(within(listbox).getAllByRole('option').map((o) => o.textContent)).toEqual(['Banana', 'Blueberry']);
    expect(input).not.toHaveAttribute('aria-activedescendant');

    await user.keyboard('{ArrowDown}');
    const banana = screen.getByRole('option', { name: 'Banana' });
    expect(input).toHaveAttribute('aria-activedescendant', banana.id);
    expect(banana).toHaveAttribute('aria-selected', 'true');
    // Disabled option is skipped.
    await user.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute('aria-activedescendant', banana.id);

    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith(fruits[1]);
    expect(input).toHaveValue('Banana');
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows the empty message, closes on Escape, and supports Home/End', async () => {
    const user = userEvent.setup();
    render(<AutoComplete label="Fruit" suggestions={fruits} />);
    const input = screen.getByRole('combobox', { name: 'Fruit' });
    await user.type(input, 'zzz');
    expect(screen.getByRole('listbox')).toHaveTextContent('No results found');
    expect(screen.getByRole('status')).toHaveTextContent('No results found');
    await user.clear(input);
    await user.type(input, 'e');
    expect(screen.getByRole('status')).toHaveTextContent('3 results available');
    await user.keyboard('{ArrowDown}{End}');
    expect(input).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Cherry' }).id);
    await user.keyboard('{Home}');
    expect(input).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Apple' }).id);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(input).toHaveValue('e');
  });

  it('calls onSearch, shows loading state and supports chips in multiple mode', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    function Async() {
      const [items, setItems] = useState<FormOption[]>([]);
      const [loading, setLoading] = useState(false);
      return (
        <AutoComplete
          label="Tags"
          multiple
          loading={loading}
          suggestions={items}
          onSearch={(q) => {
            onSearch(q);
            setLoading(true);
            setItems(fruits.filter((f) => f.label.toLowerCase().startsWith(q)));
            setTimeout(() => setLoading(false), 0);
          }}
        />
      );
    }
    render(<Async />);
    const input = screen.getByRole('combobox', { name: 'Tags' });
    await user.type(input, 'c');
    expect(onSearch).toHaveBeenCalledWith('c');
    expect(await screen.findByRole('option', { name: 'Cherry' })).toBeInTheDocument();
    await user.keyboard('{ArrowDown}{Enter}');
    expect(input).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Remove Cherry' })).toBeInTheDocument();
    await user.keyboard('{Backspace}');
    expect(screen.queryByRole('button', { name: 'Remove Cherry' })).not.toBeInTheDocument();
  });

  it('wires hint and error with aria-describedby', () => {
    render(<AutoComplete label="Fruit" suggestions={fruits} error="Required" />);
    const input = screen.getByRole('combobox', { name: 'Fruit' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Required');
  });
});

describe('MultiSelect', () => {
  it('opens with the keyboard and toggles options with Space', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MultiSelect label="Fruits" options={fruits} onChange={onChange} />);
    const trigger = screen.getByRole('combobox', { name: 'Fruits' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    act(() => trigger.focus());
    await user.keyboard('{ArrowDown}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const listbox = screen.getByRole('listbox', { name: 'Fruits' });
    expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
    const apple = screen.getByRole('option', { name: 'Apple' });
    expect(trigger).toHaveAttribute('aria-activedescendant', apple.id);

    await user.keyboard(' ');
    expect(onChange).toHaveBeenLastCalledWith(['apple']);
    expect(apple).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowDown} ');
    expect(onChange).toHaveBeenLastCalledWith(['apple', 'banana']);
    expect(trigger).toHaveTextContent('Apple, Banana');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('filters, selects all and collapses labels past maxSelectedLabels', async () => {
    const user = userEvent.setup();
    const options = ['A', 'B', 'C', 'D'].map((l) => ({ label: `Item ${l}`, value: l }));
    render(<MultiSelect label="Items" options={options} filter maxSelectedLabels={2} showClear />);
    const trigger = screen.getByRole('combobox', { name: 'Items' });
    await user.click(trigger);
    const filter = screen.getByRole('textbox', { name: 'Filter options' });
    expect(filter).toHaveFocus();
    await user.click(screen.getByRole('checkbox', { name: 'Select all' }));
    expect(trigger).toHaveTextContent('4 items selected');
    await user.type(filter, 'item c');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    await user.keyboard('{Enter}');
    expect(trigger).toHaveTextContent('3 items selected');
    await user.click(document.body);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(trigger).toHaveTextContent('Select');
  });
});

describe('Listbox', () => {
  it('supports single selection, arrows and typeahead', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Listbox label="Fruit" options={fruits} onChange={onChange} />);
    const list = screen.getByRole('listbox', { name: 'Fruit' });
    act(() => list.focus());
    expect(list).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Apple' }).id);
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('banana');
    await user.keyboard('c');
    expect(list).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Cherry' }).id);
    await user.keyboard(' ');
    expect(onChange).toHaveBeenLastCalledWith('cherry');
    expect(screen.getByRole('option', { name: 'Cherry' })).toHaveAttribute('aria-selected', 'true');
  });

  it('multiple: Shift+Arrow extends and Ctrl+A selects all enabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Listbox ariaLabel="Fruit" multiple options={fruits} onChange={onChange} />);
    const list = screen.getByRole('listbox', { name: 'Fruit' });
    expect(list).toHaveAttribute('aria-multiselectable', 'true');
    act(() => list.focus());
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}');
    expect(onChange).toHaveBeenLastCalledWith(['banana']);
    await user.keyboard('{Control>}a{/Control}');
    expect(onChange).toHaveBeenLastCalledWith(['apple', 'banana', 'cherry']);
  });
});

describe('CascadeSelect', () => {
  const places = [
    { label: 'Australia', children: [{ label: 'Sydney', value: 'syd' }, { label: 'Perth', value: 'per' }] },
    { label: 'Canada', children: [{ label: 'Toronto', value: 'tor' }] },
  ];

  it('opens groups with ArrowRight and goes back with ArrowLeft', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CascadeSelect label="City" options={places} onChange={onChange} />);
    const trigger = screen.getByRole('combobox', { name: 'City' });
    act(() => trigger.focus());
    await user.keyboard('{Enter}');
    const australia = screen.getByRole('treeitem', { name: 'Australia' });
    expect(australia).toHaveFocus();
    expect(australia).toHaveAttribute('aria-expanded', 'false');
    await user.keyboard('{ArrowRight}');
    expect(australia).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('treeitem', { name: 'Sydney' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(australia).toHaveFocus();
    await user.keyboard('{ArrowDown}{ArrowRight}{Enter}');
    expect(onChange).toHaveBeenCalledWith('tor', expect.objectContaining({ label: 'Toronto' }));
    expect(trigger).toHaveTextContent('Toronto');
    expect(trigger).toHaveFocus();
  });
});

describe('TreeSelect', () => {
  const nodes = [
    { key: 'docs', label: 'Documents', children: [{ key: 'cv', label: 'CV.pdf' }, { key: 'tax', label: 'Tax.pdf' }] },
    { key: 'pics', label: 'Pictures' },
  ];

  it('navigates the tree per APG and selects a node', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TreeSelect label="File" nodes={nodes} onChange={onChange} />);
    const trigger = screen.getByRole('combobox', { name: 'File' });
    act(() => trigger.focus());
    await user.keyboard('{ArrowDown}');
    const docs = screen.getByRole('treeitem', { name: /Documents/ });
    expect(docs).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(docs).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('treeitem', { name: 'CV.pdf' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(docs).toHaveFocus();
    await user.keyboard('{End}{Enter}');
    expect(onChange).toHaveBeenCalledWith('pics');
    expect(trigger).toHaveTextContent('Pictures');
  });

  it('checkbox mode checks all leaves of a parent and shows mixed state', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TreeSelect label="Files" selectionMode="checkbox" nodes={nodes} defaultExpandedKeys={['docs']} onChange={onChange} />);
    await user.click(screen.getByRole('combobox', { name: 'Files' }));
    await user.click(screen.getByRole('treeitem', { name: 'CV.pdf' }));
    expect(onChange).toHaveBeenLastCalledWith(['cv']);
    expect(screen.getByRole('treeitem', { name: /Documents/ })).toHaveAttribute('aria-checked', 'mixed');
    await user.click(screen.getByRole('treeitem', { name: /Documents/ }));
    expect(onChange).toHaveBeenLastCalledWith(['cv', 'tax']);
  });
});

describe('InputNumber', () => {
  it('exposes spinbutton semantics and steps with arrows within bounds', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<InputNumber label="Quantity" defaultValue={9} min={0} max={10} showButtons onChange={onChange} locale="en-US" />);
    const input = screen.getByRole('spinbutton', { name: 'Quantity' });
    expect(input).toHaveAttribute('aria-valuenow', '9');
    expect(input).toHaveAttribute('aria-valuemin', '0');
    expect(input).toHaveAttribute('aria-valuemax', '10');
    act(() => input.focus());
    await user.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith(10);
    await user.keyboard('{ArrowUp}');
    expect(input).toHaveAttribute('aria-valuenow', '10');
    expect(screen.getByRole('button', { name: 'Increment' })).toBeDisabled();
    await user.keyboard('{Home}');
    expect(input).toHaveAttribute('aria-valuenow', '0');
    await user.click(screen.getByRole('button', { name: 'Increment' }));
    expect(input).toHaveAttribute('aria-valuenow', '1');
  });

  it('formats currency per locale and parses typed text, clamping on blur', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<InputNumber label="Price" mode="currency" currency="EUR" locale="de-DE" max={5000} onChange={onChange} />);
    const input = screen.getByRole('spinbutton', { name: 'Price' });
    await user.type(input, '1234,5');
    expect(onChange).toHaveBeenLastCalledWith(1234.5);
    await user.tab();
    expect(input).toHaveValue(new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(1234.5));
    expect(input).toHaveAttribute('aria-valuetext', input.getAttribute('value'));
    await user.clear(input);
    await user.type(input, '9999');
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith(5000);
  });

  it('percent mode stores fractions', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<InputNumber label="Rate" mode="percent" locale="en-US" onChange={onChange} />);
    await user.type(screen.getByRole('spinbutton', { name: 'Rate' }), '25');
    expect(onChange).toHaveBeenLastCalledWith(0.25);
  });
});

describe('InputMask', () => {
  it('applies the mask and reports the unmasked value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<InputMask label="Phone" mask="(999) 999-9999" onChange={onChange} />);
    const input = screen.getByRole('textbox', { name: 'Phone' });
    await user.type(input, '5551234567');
    expect(input).toHaveValue('(555) 123-4567');
    expect(onChange).toHaveBeenLastCalledWith('5551234567', { masked: '(555) 123-4567', complete: true });
    await user.keyboard('{Backspace}');
    expect(input).toHaveValue('(555) 123-456_');
  });

  it('rejects characters that do not fit the slot', async () => {
    const user = userEvent.setup();
    render(<InputMask label="Date" mask="99/99/9999" />);
    const input = screen.getByRole('textbox', { name: 'Date' });
    await user.type(input, '1x2');
    expect(input).toHaveValue('12/__/____');
  });
});

describe('InputOtp', () => {
  it('labels cells, auto-advances, moves back on Backspace and fills on paste', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onComplete = vi.fn();
    render(<InputOtp label="Code" length={6} integerOnly onChange={onChange} onComplete={onComplete} />);
    expect(screen.getByRole('group', { name: 'Code' })).toBeInTheDocument();
    const cells = screen.getAllByRole('textbox');
    expect(cells).toHaveLength(6);
    expect(cells[0]).toHaveAccessibleName('Digit 1 of 6');
    expect(cells[0]).toHaveAttribute('inputmode', 'numeric');

    await user.click(cells[0]);
    await user.keyboard('1a2');
    expect(onChange).toHaveBeenLastCalledWith('12');
    expect(cells[2]).toHaveFocus();
    await user.keyboard('{Backspace}');
    expect(cells[1]).toHaveFocus();
    expect(onChange).toHaveBeenLastCalledWith('1');

    await user.click(cells[0]);
    await user.paste('98-76-54');
    expect(onChange).toHaveBeenLastCalledWith('987654');
    expect(onComplete).toHaveBeenCalledWith('987654');
    expect(cells[5]).toHaveFocus();
    expect(cells.map((c) => (c as HTMLInputElement).value).join('')).toBe('987654');
  });

  it('masks cells as passwords', () => {
    render(<InputOtp label="PIN" mask />);
    expect(screen.getByLabelText('Digit 1 of 4')).toHaveAttribute('type', 'password');
  });
});

describe('Password', () => {
  it('toggles visibility with a pressed button', async () => {
    const user = userEvent.setup();
    render(<Password label="Password" />);
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');
    const toggle = screen.getByRole('button', { name: 'Show password' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(input).toHaveAttribute('type', 'text');
  });

  it('describes strength in text and tracks requirements', async () => {
    const user = userEvent.setup();
    render(<Password label="Password" requirements />);
    const input = screen.getByLabelText('Password');
    await user.type(input, 'abc');
    expect(input).toHaveAccessibleDescription(expect.stringContaining('Strength: Weak'));
    expect(screen.getByText('A lowercase letter').closest('li')).toHaveClass('is-met');
    expect(screen.getByText('At least 8 characters').closest('li')).toHaveTextContent('(not met)');
    await user.type(input, 'DEF1');
    expect(screen.getByText('Strength: Medium')).toBeInTheDocument();
    await user.type(input, 'gh');
    expect(screen.getByText('Strength: Strong')).toBeInTheDocument();
    expect(screen.getByText('At least 8 characters').closest('li')).toHaveTextContent('(met)');
  });

  it('computes strength', () => {
    expect(passwordStrength('')).toBeNull();
    expect(passwordStrength('aaaa')).toBe('weak');
    expect(passwordStrength('abc123')).toBe('medium');
    expect(passwordStrength('Abcdef12')).toBe('strong');
  });
});

describe('Rating', () => {
  it('is a radio group with roving focus and arrow keys', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Rating label="Quality" defaultValue={2} onChange={onChange} />);
    expect(screen.getByRole('radiogroup', { name: 'Quality' })).toBeInTheDocument();
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(5);
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');
    expect(radios.map((r) => r.tabIndex)).toEqual([-1, 0, -1, -1, -1]);
    act(() => radios[1].focus());
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith(3);
    expect(screen.getByRole('radio', { name: '3 stars' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(onChange).toHaveBeenLastCalledWith(5);
    await user.keyboard('{Home}');
    expect(onChange).toHaveBeenLastCalledWith(1);
    await user.click(screen.getByRole('button', { name: 'Clear rating' }));
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it('reverses Left/Right in RTL and renders read-only as an image', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { unmount } = render(
      <div dir="rtl">
        <Rating defaultValue={3} onChange={onChange} />
      </div>,
    );
    act(() => screen.getByRole('radio', { name: '3 stars' }).focus());
    await user.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenLastCalledWith(4);
    unmount();
    render(<Rating readOnly value={4} />);
    expect(screen.getByRole('img', { name: 'Rating: 4 out of 5' })).toBeInTheDocument();
  });
});

describe('Knob', () => {
  it('is a slider operable with keys', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Knob label="Volume" defaultValue={50} valueTemplate="{value}%" onChange={onChange} />);
    const knob = screen.getByRole('slider', { name: 'Volume' });
    expect(knob).toHaveAttribute('aria-valuenow', '50');
    expect(knob).toHaveAttribute('aria-valuetext', '50%');
    act(() => knob.focus());
    await user.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith(51);
    await user.keyboard('{PageDown}');
    expect(onChange).toHaveBeenLastCalledWith(41);
    await user.keyboard('{End}');
    expect(knob).toHaveAttribute('aria-valuenow', '100');
  });
});

describe('ColorPicker', () => {
  it('syncs presets and the hex text field', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorPicker label="Brand" presets={[{ value: '#ff0000', label: 'Red' }, '#00F']} onChange={onChange} />);
    expect(screen.getByRole('group', { name: 'Brand' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Red' }));
    expect(onChange).toHaveBeenLastCalledWith('#ff0000');
    expect(screen.getByRole('button', { name: 'Red' })).toHaveAttribute('aria-pressed', 'true');
    const hex = screen.getByRole('textbox', { name: 'Hex value' });
    await user.clear(hex);
    await user.type(hex, 'zz');
    expect(hex).toHaveAttribute('aria-invalid', 'true');
    await user.clear(hex);
    await user.type(hex, '#00f');
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith('#0000ff');
    expect(hex).toHaveValue('#0000ff');
    expect(screen.getByRole('button', { name: 'Pick a color' })).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('DatePicker', () => {
  const march15 = new Date(2024, 2, 15);

  it('opens a dialog grid, navigates with arrow/Home/End/Page keys and selects', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DatePicker label="Start" defaultValue={march15} locale="en-US" firstDayOfWeek={0} onChange={onChange} />);
    const input = screen.getByRole('textbox', { name: 'Start' });
    expect(input).toHaveValue('2024-03-15');
    const button = screen.getByRole('button', { name: 'Choose date' });
    await user.click(button);
    const dialog = screen.getByRole('dialog', { name: 'Choose date' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    const grid = within(dialog).getByRole('grid', { name: 'March 2024' });
    const focused = () => document.activeElement as HTMLElement;
    expect(focused()).toHaveAccessibleName('Friday, March 15, 2024');
    expect(focused()).toHaveAttribute('aria-selected', 'true');
    expect(within(grid).getAllByRole('columnheader')[0]).toHaveTextContent('Sun');

    await user.keyboard('{ArrowRight}');
    expect(focused()).toHaveAccessibleName('Saturday, March 16, 2024');
    await user.keyboard('{ArrowDown}');
    expect(focused()).toHaveAccessibleName('Saturday, March 23, 2024');
    await user.keyboard('{Home}');
    expect(focused()).toHaveAccessibleName('Sunday, March 17, 2024');
    await user.keyboard('{End}');
    expect(focused()).toHaveAccessibleName('Saturday, March 23, 2024');
    await user.keyboard('{PageDown}');
    expect(focused()).toHaveAccessibleName('Tuesday, April 23, 2024');
    expect(screen.getByRole('grid', { name: 'April 2024' })).toBeInTheDocument();
    await user.keyboard('{Shift>}{PageUp}{/Shift}');
    expect(focused()).toHaveAccessibleName('Sunday, April 23, 2023');
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(new Date(2023, 3, 23));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(button).toHaveFocus();
    expect(input).toHaveValue('2023-04-23');
  });

  it('closes on Escape and returns focus; respects min/max and disabled dates', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DatePicker
        label="Day"
        defaultValue={march15}
        locale="en-US"
        firstDayOfWeek={1}
        minDate={new Date(2024, 2, 10)}
        maxDate={new Date(2024, 2, 20)}
        disabledDates={[new Date(2024, 2, 16)]}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Choose date' }));
    expect(screen.getAllByRole('columnheader')[0]).toHaveTextContent('Mon');
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
    const sat16 = screen.getByRole('gridcell', { name: 'Saturday, March 16, 2024' });
    expect(sat16).toHaveAttribute('aria-disabled', 'true');
    await user.keyboard('{ArrowRight}{Enter}');
    expect(onChange).not.toHaveBeenCalled();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(document.activeElement).toHaveAccessibleName('Wednesday, March 20, 2024');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choose date' })).toHaveFocus();
  });

  it('range and multiple modes', async () => {
    const user = userEvent.setup();
    const onRange = vi.fn();
    const { unmount } = render(<DatePicker label="Trip" selectionMode="range" inline locale="en-US" firstDayOfWeek={0} defaultValue={[]} onChange={onRange} />);
    // Inline: no dialog; pick 2 dates out of order.
    const view = screen.getByRole('group', { name: 'Trip' });
    const month = within(view).getByRole('combobox', { name: 'Month' }) as HTMLSelectElement;
    const year = within(view).getByRole('combobox', { name: 'Year' }) as HTMLSelectElement;
    await user.selectOptions(year, '2024');
    await user.selectOptions(month, '2');
    await user.click(screen.getByRole('gridcell', { name: 'Wednesday, March 20, 2024' }));
    await user.click(screen.getByRole('gridcell', { name: 'Sunday, March 10, 2024' }));
    expect(onRange).toHaveBeenLastCalledWith([new Date(2024, 2, 10), new Date(2024, 2, 20)]);
    expect(screen.getByRole('gridcell', { name: 'Friday, March 15, 2024' })).toHaveAttribute('aria-selected', 'true');
    unmount();

    const onMulti = vi.fn();
    render(<DatePicker label="Days" selectionMode="multiple" defaultValue={[march15]} locale="en-US" onChange={onMulti} />);
    await user.click(screen.getByRole('button', { name: 'Choose date' }));
    await user.keyboard('{ArrowRight}{Enter}{ArrowLeft} ');
    expect(onMulti).toHaveBeenLastCalledWith([new Date(2024, 2, 16)]);
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getByRole('textbox', { name: 'Days' })).toHaveValue('2024-03-16');
  });

  it('accepts typed ISO dates and flags invalid input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DatePicker label="Due" onChange={onChange} />);
    const input = screen.getByRole('textbox', { name: 'Due' });
    expect(input).toHaveAccessibleDescription('Format: YYYY-MM-DD');
    await user.type(input, '2025-02-30{Enter}');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(onChange).not.toHaveBeenCalled();
    await user.clear(input);
    await user.type(input, '2025-02-28{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(new Date(2025, 1, 28));
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('ISO helpers round-trip', () => {
    expect(formatIsoDate(new Date(2024, 0, 5, 9, 7), true)).toBe('2024-01-05 09:07');
    expect(parseIsoDate('2024-01-05 09:07')).toEqual(new Date(2024, 0, 5, 9, 7));
    expect(parseIsoDate('2024-13-01')).toBeNull();
  });
});

describe('ToggleButton / SelectButton', () => {
  it('ToggleButton exposes aria-pressed and swaps labels', async () => {
    const user = userEvent.setup();
    render(<ToggleButton onLabel="Following" offLabel="Follow" />);
    const btn = screen.getByRole('button', { name: 'Follow' });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    await user.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    expect(btn).toHaveTextContent('Following');
  });

  it('SelectButton handles single (allowEmpty) and multiple', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const opts = [
      { label: 'Day', value: 'd' },
      { label: 'Week', value: 'w' },
    ];
    const { unmount } = render(<SelectButton label="Range" options={opts} defaultValue="d" onChange={onChange} />);
    expect(screen.getByRole('group', { name: 'Range' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Week' }));
    expect(onChange).toHaveBeenLastCalledWith('w');
    await user.click(screen.getByRole('button', { name: 'Week' }));
    expect(onChange).toHaveBeenLastCalledWith(null);
    unmount();
    render(<SelectButton label="Days" multiple options={opts} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Week' }));
    await user.click(screen.getByRole('button', { name: 'Day' }));
    expect(onChange).toHaveBeenLastCalledWith(['d', 'w']);
    expect(screen.getByRole('button', { name: 'Day' })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('FloatLabel', () => {
  it('labels its child and adds a blank placeholder for :placeholder-shown', () => {
    render(
      <FloatLabel label="Email">
        <input className="pl-input" />
      </FloatLabel>,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAttribute('placeholder', ' ');
  });
});

describe('KeyFilter', () => {
  it('blocks disallowed keys and strips pasted characters', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<input aria-label="Qty" {...keyFilterProps('pint')} onChange={(e) => onChange(e.target.value)} />);
    const input = screen.getByRole('textbox', { name: 'Qty' });
    await user.type(input, '1a2-3');
    expect(input).toHaveValue('123');
    await user.paste('x4y5');
    expect(input).toHaveValue('12345');
    expect(onChange).toHaveBeenLastCalledWith('12345');
    // Named keys always pass.
    await user.type(input, '{Backspace}');
    expect(input).toHaveValue('1234');
  });

  it('accepts Arabic-Indic digits for int and a custom (global) RegExp', async () => {
    const user = userEvent.setup();
    render(
      <>
        <input aria-label="Count" {...keyFilterProps('int')} />
        <input aria-label="Hex" {...keyFilterProps(/[a-f0-9]/gi)} />
      </>,
    );
    const count = screen.getByRole('textbox', { name: 'Count' });
    await user.type(count, '-١٢x3');
    expect(count).toHaveValue('-١٢3');
    const hex = screen.getByRole('textbox', { name: 'Hex' });
    await user.type(hex, 'fgA0z9');
    expect(hex).toHaveValue('fA09');
  });
});

describe('ColorPicker (custom picker)', () => {
  it('converts between formats and checks contrast', () => {
    expect(parseColor('#f00')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    expect(parseColor('rgb(0 128 255 / 50%)')).toEqual({ r: 0, g: 128, b: 255, a: 0.5 });
    expect(formatColor(parseColor('hsl(120, 100%, 50%)')!, 'hex')).toBe('#00ff00');
    expect(formatColor({ r: 255, g: 0, b: 0, a: 1 }, 'hsl')).toBe('hsl(0 100% 50%)');
    expect(formatColor({ r: 255, g: 255, b: 255, a: 1 }, 'oklch')).toBe('oklch(100% 0 0)');
    expect(formatColor(parseColor('oklch(62.8% 0.2577 29.23)')!, 'hex')).toBe('#ff0000');
    expect(contrastRatio('#000', '#fff')).toBeCloseTo(21, 5);
    expect(parseColor('nope')).toBeNull();
  });

  it('opens a popover whose 2D area and hue slider work from the keyboard', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorPicker label="Accent" defaultValue="#ff0000" onChange={onChange} />);
    const trigger = screen.getByRole('button', { name: 'Pick a color' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const dialog = screen.getByRole('dialog', { name: 'Pick a color' });
    const area = within(dialog).getByRole('slider', { name: 'Saturation and brightness' });
    expect(area).toHaveFocus();
    expect(area).toHaveAttribute('aria-valuetext', 'Saturation 100%, Brightness 100%');
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}');
    expect(area).toHaveAttribute('aria-valuetext', 'Saturation 100%, Brightness 90%');
    expect(onChange).toHaveBeenLastCalledWith('#e60000');
    await user.keyboard('{ArrowLeft}{Home}');
    expect(area).toHaveAttribute('aria-valuetext', 'Saturation 0%, Brightness 90%');

    const hue = within(dialog).getByRole('slider', { name: 'Hue' });
    expect(hue).toHaveAttribute('aria-valuetext', '0 degrees, red');
    await user.keyboard('{End}');
    hue.focus();
    await user.keyboard('{Shift>}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{/Shift}');
    expect(hue).toHaveAttribute('aria-valuenow', '120');
    expect(hue).toHaveAttribute('aria-valuetext', '120 degrees, green');

    await user.keyboard('{Escape}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
  });

  it('switches text formats, accepts any CSS colour and remembers recent colours', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorPicker label="Accent" mode="inline" defaultValue="#ff0000" onChange={onChange} />);
    expect(screen.getByRole('group', { name: 'Pick a color' })).toBeVisible();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Color format' }), 'rgb');
    const field = screen.getByRole('textbox', { name: 'RGB value' });
    expect(field).toHaveValue('rgb(255 0 0)');
    await user.clear(field);
    await user.type(field, 'hsl(240 100% 50%){Enter}');
    expect(onChange).toHaveBeenLastCalledWith('#0000ff');
    await user.tab();
    expect(field).toHaveValue('rgb(0 0 255)');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Color format' }), 'oklch');
    expect(screen.getByRole('textbox', { name: 'OKLCH value' })).toHaveValue('oklch(45.2% 0.313 264.1)');
    expect(within(screen.getByRole('group', { name: 'Recent colors' })).getByRole('button', { name: '#0000ff' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('supports opacity and a WCAG contrast readout', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorPicker label="Text" mode="inline" alpha defaultValue="#ff0000" contrastWith="#ffffff" onChange={onChange} />);
    expect(screen.getByText('Contrast 4.00:1 on #ffffff')).toBeInTheDocument();
    const grades = document.querySelectorAll('.pl-colorpicker__grade');
    expect(grades[0]).toHaveTextContent('AA fail');
    expect(grades[1]).toHaveTextContent('AA Large pass');
    const alpha = screen.getByRole('slider', { name: 'Opacity' });
    alpha.focus();
    await user.keyboard('{Shift>}{ArrowLeft}{/Shift}');
    expect(alpha).toHaveAttribute('aria-valuetext', '90%');
    expect(onChange).toHaveBeenLastCalledWith('#ff0000e6');
  });
});

describe('InputOtp (premium)', () => {
  it('groups cells with a decorative separator, keeps digits LTR in RTL and fills from SMS autofill', () => {
    const onComplete = vi.fn();
    const { container } = render(
      <div dir="rtl">
        <InputOtp label="Code" length={6} groups={[3, 3]} integerOnly onComplete={onComplete} />
      </div>,
    );
    const group = screen.getByRole('group', { name: 'Code' });
    expect(group).toHaveAttribute('dir', 'ltr');
    expect(container.querySelector('.pl-otp__sep')).toHaveAttribute('aria-hidden', 'true');
    const cells = screen.getAllByRole('textbox');
    expect(cells).toHaveLength(6);
    expect(cells[0]).toHaveAttribute('autocomplete', 'one-time-code');
    expect(cells[0]).toHaveAttribute('pattern', '[0-9]*');
    fireEvent.change(cells[0], { target: { value: '482913' } });
    expect(onComplete).toHaveBeenCalledWith('482913');
    expect(cells.map((c) => (c as HTMLInputElement).value).join('')).toBe('482913');
  });

  it('masks with a reveal toggle and shows error and success states', async () => {
    const { rerender } = render(<InputOtp label="PIN" mask revealable defaultValue="12" error="Wrong code" />);
    expect(screen.getByLabelText('Digit 1 of 4')).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Show code' }));
    expect(screen.getByRole('button', { name: 'Hide code' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Digit 1 of 4')).toHaveAttribute('type', 'text');
    const group = screen.getByRole('group', { name: 'PIN' });
    expect(group).toHaveAttribute('data-state', 'error');
    expect(group).toHaveAttribute('data-shake');
    expect(screen.getByRole('alert')).toHaveTextContent('Wrong code');
    expect(group).toHaveAccessibleDescription('Wrong code');
    rerender(<InputOtp label="PIN" mask revealable defaultValue="1234" success="Verified" />);
    expect(group).toHaveAttribute('data-state', 'success');
    expect(screen.getByRole('status')).toHaveTextContent('Verified');
  });

  it('counts down before allowing a resend', () => {
    vi.useFakeTimers();
    const onResend = vi.fn();
    render(<InputOtp label="Code" resendAfter={3} onResend={onResend} />);
    expect(screen.getByText('Resend code in 0:03')).toBeInTheDocument();
    for (let i = 0; i < 3; i++) act(() => vi.advanceTimersByTime(1000));
    act(() => screen.getByRole('button', { name: 'Resend code' }).click());
    expect(onResend).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Resend code in 0:03')).toBeInTheDocument();
    vi.useRealTimers();
  });
});
