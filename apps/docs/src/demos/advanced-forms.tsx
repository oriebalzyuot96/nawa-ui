import { useState } from 'react';
import {
  AutoComplete,
  Button,
  CascadeSelect,
  ColorPicker,
  DatePicker,
  FloatLabel,
  IconField,
  IftaLabel,
  Input,
  InputGroup,
  InputGroupAddon,
  InputIcon,
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
  useKeyFilter,
  type DatePickerValue,
  type FormOption,
} from '@nawa-ui/react';
import { createDemoIsland, Output } from './shared';

const countries: FormOption[] = [
  'Algeria', 'Bahrain', 'Brazil', 'Canada', 'Egypt', 'France', 'Germany', 'India', 'Iraq', 'Japan', 'Jordan', 'Kuwait',
  'Lebanon', 'Morocco', 'Oman', 'Palestine', 'Qatar', 'Saudi Arabia', 'Spain', 'Sudan', 'Syria', 'Tunisia', 'Turkey',
  'United Arab Emirates', 'United Kingdom', 'United States', 'Yemen',
].map((label) => ({ label, value: label.toLowerCase().replace(/\s+/g, '-') }));

const skills: FormOption[] = ['React', 'Vue', 'Svelte', 'Angular', 'Astro', 'TypeScript', 'CSS', 'Accessibility', 'Testing', 'Node.js'].map(
  (label) => ({ label, value: label.toLowerCase() }),
);

function AutoCompleteDemo() {
  const [country, setCountry] = useState<FormOption | null>(null);
  const [picked, setPicked] = useState<FormOption[]>([skills[0]!, skills[5]!]);
  return (
    <div className="demo-col">
      <AutoComplete label="Country" placeholder="Start typing, e.g. “jo”" suggestions={countries} onSelect={setCountry} hint="Try Arrow Down after typing" />
      <AutoComplete label="Skills" multiple suggestions={skills} selected={picked} onSelectionChange={setPicked} placeholder="Add a skill" />
      <Output label="Selected">{[country?.label ?? '—', picked.map((p) => p.label).join(', ')].join(' · ')}</Output>
    </div>
  );
}

const cities: FormOption[] = ['Amman', 'Beirut', 'Cairo', 'Doha', 'Dubai', 'Istanbul', 'Madrid', 'Riyadh', 'Tunis', 'Muscat'].map((label) => ({
  label,
  value: label.toLowerCase(),
}));

function MultiSelectDemo() {
  const [value, setValue] = useState<string[]>(['amman', 'dubai']);
  return (
    <div className="demo-col" style={{ maxWidth: '26rem' }}>
      <MultiSelect label="Cities" options={cities} value={value} onChange={setValue} filter showSelectAll display="chip" maxSelectedLabels={4} showClear />
      <Output label="Value">{value.join(', ') || 'none'}</Output>
    </div>
  );
}

function ListboxDemo() {
  const [zone, setZone] = useState<string | string[] | null>('gmt+3');
  return (
    <div className="demo-col" style={{ maxWidth: '22rem' }}>
      <Listbox
        label="Timezone"
        filter
        value={zone}
        onChange={setZone}
        options={[
          { label: 'GMT−5 · New York', value: 'gmt-5' },
          { label: 'GMT+0 · London', value: 'gmt+0' },
          { label: 'GMT+1 · Paris', value: 'gmt+1' },
          { label: 'GMT+3 · Amman', value: 'gmt+3' },
          { label: 'GMT+4 · Dubai', value: 'gmt+4' },
          { label: 'GMT+9 · Tokyo', value: 'gmt+9' },
        ]}
      />
      <Output label="Timezone">{String(zone ?? 'none')}</Output>
    </div>
  );
}

function CascadeDemo() {
  const [office, setOffice] = useState<string | null>(null);
  return (
    <div className="demo-col" style={{ maxWidth: '22rem' }}>
      <CascadeSelect
        label="Office"
        placeholder="Choose an office"
        value={office}
        onChange={setOffice}
        options={[
          { label: 'Jordan', children: [{ label: 'Amman', value: 'amman' }, { label: 'Irbid', value: 'irbid' }, { label: 'Aqaba', value: 'aqaba' }] },
          { label: 'UAE', children: [{ label: 'Dubai', children: [{ label: 'Downtown', value: 'dxb-downtown' }, { label: 'Marina', value: 'dxb-marina' }] }, { label: 'Abu Dhabi', value: 'auh' }] },
          { label: 'Germany', children: [{ label: 'Berlin', value: 'berlin' }, { label: 'Munich', value: 'munich' }] },
        ]}
      />
      <Output label="Office">{office ?? 'none'}</Output>
    </div>
  );
}

function TreeSelectDemo() {
  const [keys, setKeys] = useState<string | string[] | null>(['tokens']);
  return (
    <div className="demo-col" style={{ maxWidth: '24rem' }}>
      <TreeSelect
        label="Folders"
        selectionMode="checkbox"
        value={keys}
        onChange={setKeys}
        defaultExpandedKeys={['design']}
        placeholder="Pick folders"
        nodes={[
          { key: 'design', label: 'Design', children: [{ key: 'tokens', label: 'Tokens' }, { key: 'icons', label: 'Icons' }, { key: 'figma', label: 'Figma files' }] },
          { key: 'code', label: 'Code', children: [{ key: 'react', label: 'React' }, { key: 'vue', label: 'Vue' }] },
          { key: 'docs', label: 'Docs' },
        ]}
      />
      <Output label="Keys">{Array.isArray(keys) ? keys.join(', ') || 'none' : String(keys ?? 'none')}</Output>
    </div>
  );
}

function InputNumberDemo() {
  const [price, setPrice] = useState<number | null>(1250);
  const [qty, setQty] = useState<number | null>(3);
  return (
    <>
      <InputNumber label="Price" mode="currency" currency="USD" value={price} onChange={setPrice} min={0} />
      <InputNumber label="Quantity" value={qty} onChange={setQty} min={1} max={20} showButtons />
      <InputNumber label="Discount" mode="percent" defaultValue={0.15} maxFractionDigits={1} />
      <Output label="Total">{price != null && qty != null ? (price * qty).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '—'}</Output>
    </>
  );
}

function InputMaskDemo() {
  const [phone, setPhone] = useState('');
  const [done, setDone] = useState(false);
  return (
    <>
      <InputMask
        label="Phone"
        mask="(999) 999-9999"
        value={phone}
        onChange={(raw, { complete }) => {
          setPhone(raw);
          setDone(complete);
        }}
      />
      <InputMask label="Card expiry" mask="99/99" placeholder="MM/YY" />
      <Output label="Phone">{done ? `complete (${phone})` : 'incomplete'}</Output>
    </>
  );
}

function InputOtpDemo() {
  const [status, setStatus] = useState('Waiting for code');
  return (
    <div className="demo-col">
      <InputOtp label="Verification code" hint="Try 123456" length={6} integerOnly onComplete={(c) => setStatus(c === '123456' ? 'Verified ✓' : 'Wrong code, try 123456')} onChange={() => setStatus('Typing…')} />
      <Output label="Status">{status}</Output>
    </div>
  );
}

function PasswordDemo() {
  const [pw, setPw] = useState('');
  return (
    <div style={{ flex: 1, minWidth: '16rem', maxWidth: '24rem' }}>
      <Password label="New password" autoComplete="new-password" feedback toggleMask requirements value={pw} onChange={(e) => setPw(e.target.value)} />
    </div>
  );
}

function RatingDemo() {
  const [stars, setStars] = useState(4);
  return (
    <>
      <Rating label="Your rating" value={stars} onChange={setStars} cancel />
      <Rating label="Average rating" value={3} readOnly />
      <Output label="Rating">{stars} / 5</Output>
    </>
  );
}

function KnobDemo() {
  const [volume, setVolume] = useState(60);
  return (
    <>
      <Knob label="Volume" value={volume} onChange={setVolume} valueTemplate="{value}%" />
      <Knob label="Temperature" defaultValue={22} min={16} max={30} valueTemplate="{value}°C" size={110} />
      <Knob label="Progress" value={75} readOnly size={90} />
    </>
  );
}

function ColorDemo() {
  const [color, setColor] = useState('#5b34d6');
  return (
    <>
      <ColorPicker
        label="Brand colour"
        value={color}
        onChange={setColor}
        showInput
        presets={[
          { value: '#5b34d6', label: 'Violet' },
          { value: '#0f766e', label: 'Teal' },
          { value: '#be123c', label: 'Rose' },
          { value: '#b45309', label: 'Amber' },
          { value: '#047857', label: 'Emerald' },
          { value: '#334155', label: 'Slate' },
        ]}
      />
      <span aria-hidden="true" style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: color, border: '2px solid var(--nw-border)' }} />
    </>
  );
}

function DatePickerDemo() {
  const [range, setRange] = useState<DatePickerValue>(null);
  const [when, setWhen] = useState<DatePickerValue>(null);
  const today = new Date();
  return (
    <div className="demo-col">
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <DatePicker label="Trip dates" selectionMode="range" value={range} onChange={setRange} minDate={today} showButtonBar />
        <DatePicker label="Meeting" showTime value={when} onChange={setWhen} disabledDays={[5, 6]} hint="Weekdays only" />
      </div>
      <DatePicker label="Inline calendar" inline defaultValue={today} />
      <Output label="Trip">
        {Array.isArray(range) && range.length ? range.map((d) => d.toLocaleDateString()).join(' → ') : 'none'}
      </Output>
    </div>
  );
}

function ToggleDemo() {
  const [bold, setBold] = useState(false);
  const [fav, setFav] = useState(true);
  return (
    <>
      <ToggleButton checked={bold} onChange={setBold} onLabel="Bold on" offLabel="Bold off" />
      <ToggleButton checked={fav} onChange={setFav} onLabel="Favourited" offLabel="Favourite" onIcon="★" offIcon="☆" />
      <Output label="Bold">{bold ? 'pressed' : 'not pressed'}</Output>
    </>
  );
}

function SelectButtonDemo() {
  const [plan, setPlan] = useState<string | string[] | null>('monthly');
  const [styles, setStyles] = useState<string | string[] | null>(['b']);
  return (
    <div className="demo-col">
      <SelectButton label="Billing" value={plan} onChange={setPlan} options={[{ label: 'Monthly', value: 'monthly' }, { label: 'Yearly', value: 'yearly' }]} />
      <SelectButton
        label="Text style"
        multiple
        value={styles}
        onChange={setStyles}
        options={[
          { label: 'Bold', value: 'b' },
          { label: 'Italic', value: 'i' },
          { label: 'Underline', value: 'u' },
        ]}
      />
      <Output label="Value">{`${String(plan)} · ${Array.isArray(styles) ? styles.join(', ') : String(styles)}`}</Output>
    </div>
  );
}

function FloatLabelDemo() {
  const [user, setUser] = useState('');
  return (
    <>
      <FloatLabel label="Username">
        <input className="nw-input" value={user} onChange={(e) => setUser(e.target.value)} />
      </FloatLabel>
      <FloatLabel label="City (in)" variant="in">
        <input className="nw-input" />
      </FloatLabel>
      <FloatLabel label="Company (on)" variant="on">
        <input className="nw-input" />
      </FloatLabel>
    </>
  );
}

function IftaDemo() {
  return (
    <>
      <IftaLabel label="Email">
        <input className="nw-input" type="email" autoComplete="email" />
      </IftaLabel>
      <IftaLabel label="Amount">
        <input className="nw-input" inputMode="decimal" defaultValue="250.00" />
      </IftaLabel>
    </>
  );
}

function InputGroupDemo() {
  return (
    <div className="demo-col" style={{ maxWidth: '28rem' }}>
      <InputGroup>
        <InputGroupAddon>https://</InputGroupAddon>
        <input className="nw-input" aria-label="Website address" placeholder="nawa-ui.dev" />
        <Button>Go</Button>
      </InputGroup>
      <InputGroup>
        <InputGroupAddon>$</InputGroupAddon>
        <input className="nw-input" aria-label="Price in US dollars" inputMode="decimal" defaultValue="49" />
        <InputGroupAddon>.00</InputGroupAddon>
      </InputGroup>
    </div>
  );
}

function IconFieldDemo() {
  return (
    <>
      <IconField iconPosition="start">
        <InputIcon>🔍</InputIcon>
        <input className="nw-input" type="search" aria-label="Search components" placeholder="Search" />
      </IconField>
      <IconField iconPosition="end">
        <InputIcon>✉️</InputIcon>
        <input className="nw-input" type="email" aria-label="Email" placeholder="you@example.com" />
      </IconField>
    </>
  );
}

function KeyFilterDemo() {
  const digits = useKeyFilter('pint');
  const hex = useKeyFilter('hex');
  const alpha = useKeyFilter('alpha');
  return (
    <>
      <Input label="Quantity" hint="Digits only (Arabic-Indic too)" inputMode="numeric" {...digits} />
      <Input label="Hex colour" hint="0–9 and a–f" {...hex} />
      <Input label="Name" hint="Letters only" {...alpha} />
    </>
  );
}

export default createDemoIsland(
  {
    autocomplete: AutoCompleteDemo,
    multiselect: MultiSelectDemo,
    listbox: ListboxDemo,
    cascadeselect: CascadeDemo,
    treeselect: TreeSelectDemo,
    inputnumber: InputNumberDemo,
    inputmask: InputMaskDemo,
    inputotp: InputOtpDemo,
    password: PasswordDemo,
    rating: RatingDemo,
    knob: KnobDemo,
    colorpicker: ColorDemo,
    datepicker: DatePickerDemo,
    togglebutton: ToggleDemo,
    selectbutton: SelectButtonDemo,
    floatlabel: FloatLabelDemo,
    iftalabel: IftaDemo,
    inputgroup: InputGroupDemo,
    iconfield: IconFieldDemo,
    keyfilter: KeyFilterDemo,
  },
  ['autocomplete', 'multiselect', 'listbox', 'cascadeselect', 'treeselect', 'inputotp', 'datepicker', 'selectbutton', 'inputgroup'],
);
