import { useState } from 'react';
import {
  Accordion,
  Badge,
  Button,
  Card,
  Divider,
  Fieldset,
  Input,
  Panel,
  ScrollPanel,
  Splitter,
  SplitterPanel,
  Stepper,
  Tabs,
  Toolbar,
} from '@nawa-ui/react';
import { createDemoIsland, Output, Row } from './shared';

function CardDemo() {
  return (
    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))', width: '100%' }}>
      <Card
        title="Quarterly report"
        footer={
          <Row style={{ justifyContent: 'flex-end' }}>
            <Button variant="ghost" size="sm">Share</Button>
            <Button size="sm">Open</Button>
          </Row>
        }
      >
        Revenue grew 24% with the new onboarding flow.
      </Card>
      <Card title={<span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>Team plan <Badge variant="primary">Popular</Badge></span>}>
        <strong style={{ fontSize: '1.6rem' }}>$29</strong> <span className="muted">/ month</span>
      </Card>
    </div>
  );
}

function AccordionDemo() {
  return (
    <Accordion
      defaultOpen={['free']}
      items={[
        { key: 'free', title: 'Is Nawa UI free?', content: 'Yes. It is MIT licensed for personal and commercial use.' },
        { key: 'fw', title: 'Which frameworks are supported?', content: 'React, Vue 3, Svelte 5, Astro, React Native and Angular (in progress).' },
        { key: 'rtl', title: 'Does it support Arabic and RTL?', content: 'Yes. Layouts use logical CSS properties and mirror automatically — try the RTL button above.' },
      ]}
    />
  );
}

function TabsDemo() {
  const [tab, setTab] = useState('overview');
  return (
    <div className="demo-col">
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'overview', label: 'Overview', content: <p>12 tasks, 3 in review.</p> },
          { key: 'activity', label: 'Activity', content: <p>Omar merged “New onboarding”.</p> },
          { key: 'settings', label: 'Settings', content: <p>Notifications are on.</p> },
          { key: 'billing', label: 'Billing', disabled: true },
        ]}
      />
      <Output label="Active tab">{tab}</Output>
    </div>
  );
}

function PanelDemo() {
  const [refreshed, setRefreshed] = useState(0);
  return (
    <div className="demo-col">
      <Panel
        header="Activity"
        toggleable
        headingLevel={3}
        actions={
          <Button size="sm" variant="ghost" onClick={() => setRefreshed((n) => n + 1)}>
            Refresh
          </Button>
        }
        footer={<span className="muted">Refreshed {refreshed} times</span>}
      >
        12 new events today. Collapse me with the toggle button.
      </Panel>
    </div>
  );
}

function FieldsetDemo() {
  return (
    <div className="demo-col">
      <Fieldset legend="Shipping address" toggleable>
        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))' }}>
          <Input label="Street" autoComplete="street-address" />
          <Input label="City" autoComplete="address-level2" />
        </div>
      </Fieldset>
    </div>
  );
}

function ScrollPanelDemo() {
  return (
    <div className="demo-col" style={{ maxWidth: '32rem' }}>
      <ScrollPanel label="Terms of service" height={180}>
        {Array.from({ length: 8 }, (_, i) => (
          <p key={i} style={{ marginTop: 0 }}>
            <strong>{i + 1}. Section {i + 1}.</strong> You may use Nawa UI in personal and commercial projects. Attribution is appreciated but not
            required. The software is provided “as is”, without warranty of any kind.
          </p>
        ))}
      </ScrollPanel>
    </div>
  );
}

function SplitterDemo() {
  const [sizes, setSizes] = useState<number[]>([30, 70]);
  return (
    <div className="demo-col">
      <div style={{ height: 220 }}>
        <Splitter onResize={setSizes}>
          <SplitterPanel size={30} minSize={15}>
            <div style={{ padding: '1rem' }}>
              <strong>Files</strong>
              <p className="muted">Drag the gutter or focus it and use the arrow keys.</p>
            </div>
          </SplitterPanel>
          <SplitterPanel size={70} minSize={30}>
            <Splitter layout="vertical">
              <SplitterPanel size={60}>
                <div style={{ padding: '1rem' }}>
                  <strong>Editor</strong>
                </div>
              </SplitterPanel>
              <SplitterPanel size={40}>
                <div style={{ padding: '1rem' }}>
                  <strong>Terminal</strong>
                </div>
              </SplitterPanel>
            </Splitter>
          </SplitterPanel>
        </Splitter>
      </div>
      <Output label="Sizes">{sizes.map((s) => `${Math.round(s)}%`).join(' / ')}</Output>
    </div>
  );
}

function ToolbarDemo() {
  const [last, setLast] = useState('none');
  const b = (label: string) => (
    <Button size="sm" variant="ghost" onClick={() => setLast(label)}>
      {label}
    </Button>
  );
  return (
    <div className="demo-col">
      <Toolbar
        label="Formatting"
        start={
          <>
            {b('Bold')}
            {b('Italic')}
            {b('Underline')}
          </>
        }
        center={b('Insert link')}
        end={
          <Button size="sm" variant="secondary" onClick={() => setLast('Share')}>
            Share
          </Button>
        }
      />
      <Output label="Last action">{last}</Output>
    </div>
  );
}

function DividerDemo() {
  return (
    <div className="demo-col">
      <p style={{ margin: 0 }}>Account settings</p>
      <Divider />
      <p style={{ margin: 0 }}>Danger zone</p>
    </div>
  );
}

function StepperDemo() {
  const [step, setStep] = useState(1);
  const steps = [{ label: 'Account', description: 'Your details' }, { label: 'Workspace', description: 'Name it' }, { label: 'Invite team' }, { label: 'Launch' }];
  return (
    <div className="demo-col">
      <Stepper current={step} steps={steps} />
      <Row>
        <Button size="sm" variant="secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Back
        </Button>
        <Button size="sm" disabled={step === steps.length - 1} onClick={() => setStep((s) => s + 1)}>
          Next
        </Button>
      </Row>
    </div>
  );
}

export default createDemoIsland(
  {
    card: CardDemo,
    accordion: AccordionDemo,
    tabs: TabsDemo,
    panel: PanelDemo,
    fieldset: FieldsetDemo,
    scrollpanel: ScrollPanelDemo,
    splitter: SplitterDemo,
    toolbar: ToolbarDemo,
    divider: DividerDemo,
    stepper: StepperDemo,
  },
  ['accordion', 'tabs', 'panel', 'fieldset', 'scrollpanel', 'splitter', 'toolbar', 'divider', 'stepper'],
);
