import type { CategoryDoc } from './types';

const listKeys: [string, string][] = [
  ['Arrow Down / Arrow Up', 'Move the active option'],
  ['Home / End', 'First / last option'],
  ['Enter', 'Select the active option'],
  ['Escape', 'Close the list and return focus'],
];

export const advancedForms: CategoryDoc = {
  slug: 'advanced-forms',
  nav: 'Advanced inputs',
  icon: '🎛️',
  title: 'Advanced form inputs — AutoComplete, MultiSelect, DatePicker, InputOtp, ColorPicker',
  h1: 'Advanced form inputs',
  description:
    'Accessible React inputs with live demos: AutoComplete, MultiSelect, Listbox, CascadeSelect, TreeSelect, InputNumber, InputMask, InputOtp, Password, Rating, Knob, ColorPicker, DatePicker and more.',
  intro:
    'Rich inputs that follow the WAI-ARIA combobox, listbox, slider and grid patterns. They accept the same label, hint and error props as the core fields, so validation looks and sounds the same everywhere.',
  entries: [
    {
      id: 'autocomplete',
      name: 'AutoComplete',
      description: 'A combobox that suggests matches as you type, with single or multiple (chip) selection.',
      props: [
        ['suggestions', 'FormOption[]', 'Options; filtered locally unless you handle onSearch.'],
        ['onSearch', '(query) => void', 'Fetch remote suggestions.'],
        ['multiple', 'boolean', 'Pick several values shown as removable chips.'],
        ['onSelect', '(option) => void', 'Called when an option is chosen.'],
        ['loading / minLength', 'boolean / number', 'Loading message and minimum query length.'],
      ],
      keys: [...listKeys, ['Backspace', 'Removes the last chip when the input is empty (multiple)']],
      a11y: 'role="combobox" with aria-expanded and aria-activedescendant; the result count is announced in a live region.',
      code: {
        react: `const countries = [{ label: 'Jordan', value: 'jo' }, { label: 'Japan', value: 'jp' }];

<AutoComplete label="Country" suggestions={countries}
  onSelect={(o) => setCountry(o.value)} placeholder="Start typing…" />

<AutoComplete label="Skills" multiple suggestions={skills}
  selected={picked} onSelectionChange={setPicked} />`,
      },
    },
    {
      id: 'multiselect',
      name: 'MultiSelect',
      description: 'A dropdown of checkable options with filter, select-all and chip display.',
      props: [
        ['options', 'FormOption[]', 'Choices.'],
        ['value / onChange', 'string[]', 'Selected values.'],
        ['filter', 'boolean', 'Adds a search box to the panel.'],
        ['display', "'comma' | 'chip'", 'How the selection is summarised.'],
        ['showSelectAll / maxSelectedLabels', 'boolean / number', 'Bulk selection and summary threshold.'],
      ],
      keys: [...listKeys, ['Space', 'Toggle the active option']],
      a11y: 'The panel is a multi-select listbox (aria-multiselectable) and the trigger reports how many items are selected.',
      code: {
        react: `<MultiSelect label="Cities" options={cities} value={value} onChange={setValue}
  filter display="chip" showSelectAll maxSelectedLabels={3} />`,
      },
    },
    {
      id: 'listbox',
      name: 'Listbox',
      description: 'An always-visible list of options with single or multiple selection and filtering.',
      props: [
        ['options', 'FormOption[]', 'Choices.'],
        ['multiple', 'boolean', 'Allow several values.'],
        ['value / onChange', 'string | string[] | null', 'Selection.'],
        ['filter', 'boolean', 'Adds a search box.'],
        ['ariaLabel', 'string', 'Accessible name when there is no label.'],
      ],
      keys: [
        ['Arrow Down / Arrow Up', 'Move focus'],
        ['Home / End', 'First / last option'],
        ['Space / Enter', 'Select the focused option'],
      ],
      code: {
        react: `<Listbox label="Timezone" options={zones} value={zone} onChange={setZone} filter />`,
      },
    },
    {
      id: 'cascadeselect',
      name: 'CascadeSelect',
      description: 'Pick a leaf from nested groups — e.g. country, then state, then city.',
      props: [
        ['options', 'CascadeOption[]', 'Nested { label, value?, children? }.'],
        ['value / onChange', 'string | null', 'Selected leaf value.'],
        ['placeholder', 'string', 'Trigger text when empty.'],
      ],
      keys: [...listKeys, ['Arrow Right / Arrow Left', 'Open / close a sub-group (mirrored in RTL)']],
      code: {
        react: `<CascadeSelect label="Office" options={[
  { label: 'Jordan', children: [{ label: 'Amman', value: 'amm' }, { label: 'Irbid', value: 'irb' }] },
  { label: 'UAE', children: [{ label: 'Dubai', value: 'dxb' }] },
]} value={office} onChange={setOffice} />`,
      },
    },
    {
      id: 'treeselect',
      name: 'TreeSelect',
      description: 'A dropdown containing a tree, for single or checkbox selection of hierarchical data.',
      props: [
        ['nodes', 'TreeSelectNode[]', '{ key, label, children? } tree.'],
        ['selectionMode', "'single' | 'checkbox'", 'Single pick or multiple with tri-state parents.'],
        ['value / onChange', 'string | string[] | null', 'Selected keys.'],
        ['defaultExpandedKeys', 'string[]', 'Initially expanded branches.'],
      ],
      keys: [...listKeys, ['Arrow Right / Arrow Left', 'Expand / collapse a branch']],
      code: {
        react: `<TreeSelect label="Folders" nodes={folders} selectionMode="checkbox"
  value={keys} onChange={setKeys} defaultExpandedKeys={['docs']} />`,
      },
    },
    {
      id: 'inputnumber',
      name: 'InputNumber',
      description: 'Locale-aware numeric input with currency, percent, min/max and spin buttons.',
      props: [
        ['value / onChange', 'number | null', 'Numeric value.'],
        ['mode', "'decimal' | 'currency' | 'percent'", 'Formatting style.'],
        ['currency / locale', 'string', 'e.g. "USD", "ar-JO".'],
        ['min / max / step', 'number', 'Bounds and increment.'],
        ['showButtons', 'boolean', 'Adds increment / decrement buttons.'],
      ],
      keys: [
        ['Arrow Up / Arrow Down', 'Increment / decrement by step'],
        ['Page Up / Page Down', 'Larger steps'],
        ['Home / End', 'Jump to min / max'],
      ],
      a11y: 'role="spinbutton" with aria-valuenow, aria-valuemin and aria-valuemax; the formatted value is exposed as aria-valuetext.',
      code: {
        react: `<InputNumber label="Price" mode="currency" currency="USD" value={price}
  onChange={setPrice} min={0} showButtons />
<InputNumber label="Discount" mode="percent" value={0.15} maxFractionDigits={1} />`,
      },
    },
    {
      id: 'inputmask',
      name: 'InputMask',
      description: 'Typed input that follows a pattern such as a phone number or card expiry.',
      props: [
        ['mask', 'string', '9 = digit, a = letter, * = either. e.g. "(999) 999-9999".'],
        ['value / onChange', '(value, { masked, complete })', 'Raw and masked value.'],
        ['onComplete', '(value) => void', 'Called when every slot is filled.'],
        ['slotChar', 'string', 'Placeholder for empty slots. Default "_".'],
      ],
      keys: [['Backspace / Delete', 'Clear the previous / next slot, skipping literals']],
      code: {
        react: `<InputMask label="Phone" mask="(999) 999-9999" value={phone}
  onChange={(raw, { complete }) => { setPhone(raw); setDone(complete); }} />`,
      },
    },
    {
      id: 'inputotp',
      name: 'InputOtp',
      description: 'One-time-code entry: one cell per character with an animated caret, grouping, SMS autofill, masking with reveal, a resend countdown and error / success states.',
      props: [
        ['length', 'number', 'Number of cells. Default 4.'],
        ['value / onChange / onComplete', 'string', 'The code; onComplete fires when every cell is filled.'],
        ['integerOnly', 'boolean', 'Digits only — opens the numeric keypad on phones.'],
        ['groups / separator', 'number[] / ReactNode', 'e.g. [3, 3] renders 123 – 456.'],
        ['mask / revealable', 'boolean', 'Hide characters, with a Show code toggle.'],
        ['error / success', 'string / boolean | string', 'Error shakes the cells (not with reduced motion); success turns them green.'],
        ['resendAfter / onResend', 'number / () => void', 'Countdown in seconds before Resend unlocks.'],
      ],
      keys: [
        ['Arrow Left / Arrow Right', 'Move between cells'],
        ['Backspace', 'Clear and move back'],
        ['Home / End', 'First / last cell'],
        ['Ctrl + V', 'Paste a whole code from any cell'],
      ],
      a11y: 'Each cell has its own label ("Digit 2 of 6") inside a labelled group; autocomplete="one-time-code" lets phones fill the SMS code. Errors are announced (role="alert") and success politely. Digits stay left-to-right in Arabic pages. Separators and the caret are decorative.',
      code: {
        react: `<InputOtp label="Verification code" length={6} groups={[3, 3]} integerOnly
  resendAfter={30} onResend={sendAgain} error={wrong ? 'That code did not match' : undefined}
  onComplete={(code) => verify(code)} />`,
      },
    },
    {
      id: 'password',
      name: 'Password',
      description: 'Password field with a show/hide toggle, strength meter and requirement checklist.',
      props: [
        ['feedback', 'boolean', 'Shows the strength meter.'],
        ['toggleMask', 'boolean', 'Adds a show / hide button.'],
        ['requirements', 'boolean | PasswordRequirement[]', 'Live checklist of rules.'],
        ['strengthLabels', 'Record<strength, string>', 'Localised "Weak / Medium / Strong".'],
      ],
      keys: [['Tab', 'Moves between the field and the show / hide button']],
      a11y: 'Strength changes are announced politely; the toggle button reports aria-pressed.',
      code: {
        react: `<Password label="New password" autoComplete="new-password"
  feedback toggleMask requirements value={pw} onChange={(e) => setPw(e.target.value)} />`,
      },
    },
    {
      id: 'rating',
      name: 'Rating',
      description: 'Star rating built on radio buttons, with an optional clear button.',
      props: [
        ['value / onChange', 'number', 'Selected stars.'],
        ['stars', 'number', 'Number of stars. Default 5.'],
        ['cancel', 'boolean', 'Shows a clear button.'],
        ['readOnly / disabled', 'boolean', 'Display-only or disabled.'],
      ],
      keys: [
        ['Arrow keys', 'Change the rating (mirrored in RTL)'],
        ['Home / End', 'Lowest / highest'],
      ],
      code: {
        react: `<Rating label="Your rating" value={stars} onChange={setStars} cancel />`,
      },
    },
    {
      id: 'knob',
      name: 'Knob',
      description: 'A circular dial for picking a value in a range.',
      props: [
        ['value / onChange', 'number', 'Current value.'],
        ['min / max / step', 'number', 'Range.'],
        ['label', 'string', 'Accessible name (required).'],
        ['valueTemplate', 'string', 'e.g. "{value}%".'],
        ['size / strokeWidth', 'number', 'Dimensions in px.'],
      ],
      keys: [
        ['Arrow keys', 'Change by one step'],
        ['Page Up / Page Down', 'Change by ten steps'],
        ['Home / End', 'Min / max'],
      ],
      a11y: 'role="slider" with aria-valuetext built from valueTemplate. Drag works with mouse, pen and touch.',
      code: {
        react: `<Knob label="Volume" value={volume} onChange={setVolume} valueTemplate="{value}%" />`,
      },
    },
    {
      id: 'colorpicker',
      name: 'ColorPicker',
      description: 'A full colour picker: saturation / brightness area, hue and opacity sliders, HEX · RGB · HSL · OKLCH entry, eyedropper, presets, recent colours and a WCAG contrast check.',
      props: [
        ['value / onChange', 'string', 'Any CSS colour in; emits #rrggbb (or #rrggbbaa with alpha).'],
        ['onColorChange', '({ hex, rgba, css }) => void', 'Rich change event.'],
        ['mode', "'popover' | 'inline'", 'Swatch button with a popover (default), or always visible.'],
        ['alpha', 'boolean', 'Opacity slider.'],
        ['formats / format', "('hex' | 'rgb' | 'hsl' | 'oklch')[]", 'Text formats offered by the format switch.'],
        ['presets / recent', 'Array<string | { value, label }> / number', 'Swatches and how many recent colours to keep.'],
        ['contrastWith', 'string', 'Background to check against: shows the ratio and AA / AA Large / AAA pass or fail.'],
        ['eyeDropper', 'boolean', 'Pick from the screen where the EyeDropper API exists.'],
      ],
      keys: [
        ['Arrow Left / Arrow Right', 'Saturation (area) or value (sliders); Shift = 10 steps'],
        ['Arrow Up / Arrow Down', 'Brightness (area) or value (sliders)'],
        ['Page Up / Page Down', 'Large steps'],
        ['Home / End', 'Minimum / maximum'],
        ['Escape', 'Close the popover and return to the swatch button'],
      ],
      a11y: 'The area is a slider whose aria-valuetext reads "Saturation 40%, Brightness 70%"; the hue slider names the colour ("210 degrees, blue"). Swatches are toggle buttons with labels, and the contrast grades are written out, so nothing depends on seeing colour.',
      code: {
        react: `<ColorPicker label="Brand colour" value={color} onChange={setColor} alpha
  contrastWith="#ffffff" presets={[{ value: '#5b34d6', label: 'Violet' }, { value: '#0f766e', label: 'Teal' }]} />`,
      },
    },
    {
      id: 'datepicker',
      name: 'DatePicker',
      description: 'Typed or calendar date entry with ranges, multiple dates, time and min/max limits.',
      props: [
        ['value / onChange', 'Date | Date[] | null', 'Selection.'],
        ['selectionMode', "'single' | 'range' | 'multiple'", 'What a click selects.'],
        ['minDate / maxDate / disabledDays', 'Date / number[]', 'Restrict choices.'],
        ['inline', 'boolean', 'Always-visible calendar.'],
        ['showTime / showButtonBar', 'boolean', 'Time inputs and Today / Clear buttons.'],
        ['locale / firstDayOfWeek', 'string / number', 'Localisation (works with ar-JO, etc.).'],
      ],
      keys: [
        ['Arrow keys', 'Move by day / week'],
        ['Page Up / Page Down', 'Previous / next month'],
        ['Home / End', 'Start / end of the week'],
        ['Enter', 'Select the focused day'],
        ['Escape', 'Close the calendar'],
      ],
      a11y: 'The calendar is a grid with labelled days; the month change is announced.',
      code: {
        react: `<DatePicker label="Trip dates" selectionMode="range" value={range}
  onChange={setRange} minDate={new Date()} showButtonBar />
<DatePicker label="Meeting" showTime value={when} onChange={setWhen} />`,
      },
    },
    {
      id: 'togglebutton',
      name: 'ToggleButton',
      description: 'A button that stays pressed, reporting aria-pressed.',
      props: [
        ['checked / onChange', 'boolean', 'Pressed state.'],
        ['onLabel / offLabel', 'ReactNode', 'Text for each state.'],
        ['onIcon / offIcon', 'ReactNode', 'Icons for each state.'],
      ],
      keys: [['Space / Enter', 'Toggle']],
      code: {
        react: `<ToggleButton checked={bold} onChange={setBold} onLabel="Bold on" offLabel="Bold off" />`,
      },
    },
    {
      id: 'selectbutton',
      name: 'SelectButton',
      description: 'A row of buttons acting as single or multiple choice.',
      props: [
        ['options', 'FormOption[]', 'Choices.'],
        ['value / onChange', 'string | string[] | null', 'Selection.'],
        ['multiple', 'boolean', 'Allow several.'],
        ['allowEmpty', 'boolean', 'Allow deselecting the last one.'],
        ['label', 'string', 'Group name (required).'],
      ],
      keys: [
        ['Tab', 'Move between buttons'],
        ['Space / Enter', 'Toggle the focused option'],
      ],
      code: {
        react: `<SelectButton label="Text style" multiple options={[
  { label: 'Bold', value: 'b' }, { label: 'Italic', value: 'i' }, { label: 'Underline', value: 'u' },
]} value={styles} onChange={setStyles} />`,
      },
    },
    {
      id: 'floatlabel',
      name: 'FloatLabel',
      description: 'A label that sits inside the field and floats above it on focus or when filled.',
      props: [
        ['label', 'ReactNode', 'Label text.'],
        ['children', 'ReactElement', 'One input-like element; it gets an id automatically.'],
        ['variant', "'over' | 'in' | 'on'", 'Where the label rests.'],
      ],
      a11y: 'A real <label> linked with htmlFor — not a placeholder — so the name never disappears.',
      code: {
        react: `<FloatLabel label="Username">
  <input className="pl-input" value={user} onChange={(e) => setUser(e.target.value)} />
</FloatLabel>`,
      },
    },
    {
      id: 'iftalabel',
      name: 'IftaLabel',
      description: 'An "infield top-aligned" label that is always visible inside the top of the field.',
      props: [
        ['label', 'ReactNode', 'Label text.'],
        ['children', 'ReactElement', 'One input-like element.'],
      ],
      code: {
        react: `<IftaLabel label="Email">
  <input className="pl-input" type="email" />
</IftaLabel>`,
      },
    },
    {
      id: 'inputgroup',
      name: 'InputGroup',
      description: 'Joins addons (text, icons, buttons) to the sides of a field.',
      props: [
        ['InputGroup', 'HTMLAttributes<div>', 'Wrapper.'],
        ['InputGroupAddon', 'HTMLAttributes<span>', 'Static text or icon on either side.'],
      ],
      a11y: 'Addons are visual. Put essential information (like a currency) in the input’s label too.',
      code: {
        react: `<InputGroup>
  <InputGroupAddon>https://</InputGroupAddon>
  <input className="pl-input" aria-label="Website" />
  <Button>Go</Button>
</InputGroup>`,
      },
    },
    {
      id: 'iconfield',
      name: 'IconField',
      description: 'Places a decorative icon inside a field, at the start or end.',
      props: [
        ['iconPosition', "'start' | 'end'", 'Logical side; mirrors in RTL.'],
        ['InputIcon', 'HTMLAttributes<span>', 'The icon. Hidden from assistive tech.'],
      ],
      code: {
        react: `<IconField iconPosition="start">
  <InputIcon>🔍</InputIcon>
  <input className="pl-input" type="search" aria-label="Search" />
</IconField>`,
      },
    },
    {
      id: 'keyfilter',
      name: 'KeyFilter',
      description: 'Blocks characters that don’t match a pattern, both when typed and pasted.',
      props: [
        ['keyFilterProps(pattern)', '(pattern) => handlers', 'Spread onto any input.'],
        ['useKeyFilter(pattern)', 'hook', 'Memoised version.'],
        ['pattern', "'pint' | 'int' | 'num' | 'alpha' | 'alphanum' | 'hex' | RegExp", 'Allowed characters. Digits include Arabic-Indic numerals.'],
      ],
      a11y: 'Pair it with a hint that says what is allowed, so blocked keys are not a surprise.',
      code: {
        react: `const digits = useKeyFilter('pint');
<Input label="Quantity" hint="Digits only" inputMode="numeric" {...digits} />`,
      },
    },
  ],
};
