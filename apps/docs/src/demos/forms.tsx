import { useState } from 'react';
import { Button, Checkbox, Input, RadioGroup, Segmented, Select, Slider, Textarea } from '@nawa-ui/react';
import { createDemoIsland, Output, SwitchField } from './shared';

function ButtonDemo() {
  const [saving, setSaving] = useState(false);
  const save = () => {
    setSaving(true);
    window.setTimeout(() => setSaving(false), 1500);
  };
  return (
    <>
      <Button onClick={save} loading={saving}>
        {saving ? 'Saving' : 'Save changes'}
      </Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Delete</Button>
      <Button size="sm">Small</Button>
      <Button size="lg">Large</Button>
      <Button iconOnly aria-label="Add item">
        ＋
      </Button>
    </>
  );
}

function InputDemo() {
  const [email, setEmail] = useState('lina@');
  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  return (
    <>
      <Input label="Full name" placeholder="Lina Haddad" hint="As it appears on your ID" autoComplete="name" />
      <Input
        label="Email"
        type="email"
        value={email}
        autoComplete="email"
        onChange={(e) => setEmail(e.target.value)}
        error={valid ? undefined : 'Enter a valid email address'}
        hint="We never share it"
      />
    </>
  );
}

function TextareaDemo() {
  const [brief, setBrief] = useState('');
  return (
    <>
      <Textarea label="Project brief" rows={3} value={brief} placeholder="What are you building?" onChange={(e) => setBrief(e.target.value)} hint={`${brief.length}/280 characters`} maxLength={280} />
    </>
  );
}

function SelectDemo() {
  const [team, setTeam] = useState('');
  return (
    <>
      <Select
        label="Team"
        placeholder="Choose a team"
        value={team}
        onChange={(e) => setTeam(e.target.value)}
        options={[
          { label: 'Design', value: 'Design' },
          { label: 'Engineering', value: 'Engineering' },
          { label: 'Product', value: 'Product' },
          { label: 'Legal (full)', value: 'Legal', disabled: true },
        ]}
      />
      <Output label="Selected">{team || 'none'}</Output>
    </>
  );
}

function CheckboxDemo() {
  const [a, setA] = useState(true);
  const [b, setB] = useState(false);
  return (
    <>
      <Checkbox label="Email me updates" checked={a} onChange={(e) => setA(e.target.checked)} />
      <Checkbox label="Weekly digest" checked={b} onChange={(e) => setB(e.target.checked)} />
      <Checkbox label="SMS alerts (unavailable)" disabled />
    </>
  );
}

function SwitchDemo() {
  const [on, setOn] = useState(true);
  return (
    <>
      <SwitchField label="Dark previews" checked={on} onChange={setOn} />
      <Output label="Dark previews">{on ? 'On' : 'Off'}</Output>
    </>
  );
}

function RadioDemo() {
  const [plan, setPlan] = useState('pro');
  return (
    <>
      <RadioGroup
        name="docs-plan"
        label="Plan"
        value={plan}
        onChange={setPlan}
        options={[
          { label: 'Free', value: 'free' },
          { label: 'Pro', value: 'pro' },
          { label: 'Enterprise', value: 'ent', disabled: true },
        ]}
      />
      <Output label="Plan">{plan}</Output>
    </>
  );
}

function SliderDemo() {
  const [v, setV] = useState(40);
  return (
    <div style={{ minWidth: '16rem', flex: 1 }}>
      <Slider label="Budget (k$)" value={v} onChange={setV} min={0} max={200} step={5} showValue />
    </div>
  );
}

function SegmentedDemo() {
  const [view, setView] = useState('grid');
  return (
    <>
      <Segmented
        label="View"
        value={view}
        onChange={setView}
        options={[
          { label: 'Grid', value: 'grid' },
          { label: 'List', value: 'list' },
          { label: 'Board', value: 'board' },
        ]}
      />
      <Output label="View">{view}</Output>
    </>
  );
}

export default createDemoIsland({
  button: ButtonDemo,
  input: InputDemo,
  textarea: TextareaDemo,
  select: SelectDemo,
  checkbox: CheckboxDemo,
  switch: SwitchDemo,
  'radio-group': RadioDemo,
  slider: SliderDemo,
  segmented: SegmentedDemo,
}, ['textarea']);
