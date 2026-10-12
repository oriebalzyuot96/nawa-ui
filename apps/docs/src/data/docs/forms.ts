import type { CategoryDoc } from './types';
import { snippets } from '../snippets';

export const forms: CategoryDoc = {
  slug: 'forms',
  nav: 'Forms',
  icon: '✍️',
  title: 'Form components — Button, Input, Select, Checkbox, Switch, Slider',
  h1: 'Form components',
  description:
    'Accessible form components for React, Vue, Svelte, Astro, React Native and Angular: Button, Input, Textarea, Select, Checkbox, Switch, RadioGroup, Slider and Segmented — with live demos.',
  intro:
    'The core form controls ship in every Orca UI package. Labels are always linked, hints and errors are announced through aria-describedby, and invalid fields set aria-invalid.',
  entries: [
    {
      id: 'button',
      name: 'Button',
      description: 'Five variants, three sizes, a loading state with aria-busy and icon-only buttons with an accessible name.',
      props: [
        ['variant', "'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'", 'Visual style. Default primary.'],
        ['size', "'sm' | 'md' | 'lg'", 'Control height and padding.'],
        ['loading', 'boolean', 'Shows a spinner, sets aria-busy and disables the button.'],
        ['block', 'boolean', 'Full width.'],
        ['iconOnly', 'boolean', 'Square button for a single icon. Pass aria-label.'],
      ],
      keys: [
        ['Enter / Space', 'Activates the button'],
        ['Tab', 'Moves focus to the next control'],
      ],
      a11y: 'Native <button> element, so focus, disabled and form submission behave as browsers expect.',
      code: snippets.button!,
    },
    {
      id: 'input',
      name: 'Input',
      description: 'A labelled text field with hint and error messages wired to aria-describedby.',
      props: [
        ['label', 'string', 'Visible label linked with htmlFor.'],
        ['hint', 'string', 'Helper text under the field.'],
        ['error', 'string', 'Error text. Sets aria-invalid and replaces the hint.'],
        ['…input attributes', 'InputHTMLAttributes', 'type, value, onChange, placeholder, autoComplete, etc.'],
      ],
      keys: [['Tab', 'Moves focus into and out of the field']],
      a11y: 'Errors replace the hint so screen readers announce a single, current message.',
      code: {
        ...snippets.input,
        angular: `<oc-input label="Email" type="email" [(value)]="email"
  [error]="email() ? undefined : 'Required'" />`,
      },
    },
    {
      id: 'textarea',
      name: 'Textarea',
      description: 'Multi-line text with the same label, hint and error wiring as Input.',
      props: [
        ['label', 'string', 'Visible label.'],
        ['hint / error', 'string', 'Helper or error message.'],
        ['rows', 'number', 'Initial visible rows.'],
      ],
      keys: [['Tab', 'Moves focus; Enter inserts a new line']],
      code: {
        react: `<Textarea label="Project brief" rows={4} value={brief}
  onChange={(e) => setBrief(e.target.value)} hint="Markdown supported" />`,
        vue: `<Textarea v-model="brief" label="Project brief" :rows="4" hint="Markdown supported" />`,
        svelte: `<Textarea bind:value={brief} label="Project brief" rows={4} hint="Markdown supported" />`,
        astro: `<Textarea name="brief" label="Project brief" rows={4} hint="Markdown supported" />`,
        rn: `<Textarea label="Project brief" value={brief} onChangeText={setBrief} />`,
        angular: `<oc-textarea label="Project brief" [rows]="4" [(value)]="brief" hint="Markdown supported" />`,
      },
    },
    {
      id: 'select',
      name: 'Select',
      description: 'A native select with a styled trigger, placeholder option and linked label.',
      props: [
        ['options', '{ label, value, disabled? }[]', 'Choices to render.'],
        ['placeholder', 'string', 'Empty first option.'],
        ['label / hint / error', 'string', 'Field metadata.'],
      ],
      keys: [
        ['Arrow Up / Arrow Down', 'Changes the selected option'],
        ['Alt + Arrow Down', 'Opens the native list'],
      ],
      a11y: 'Uses the native <select>, so mobile pickers and assistive technology work out of the box.',
      code: {
        react: `<Select label="Team" placeholder="Choose a team" value={team}
  onChange={(e) => setTeam(e.target.value)}
  options={[{ label: 'Design', value: 'design' }, { label: 'Engineering', value: 'eng' }]} />`,
        vue: `<Select v-model="team" label="Team" placeholder="Choose a team" :options="teams" />`,
        svelte: `<Select bind:value={team} label="Team" placeholder="Choose a team" options={teams} />`,
        astro: `<Select name="team" label="Team" placeholder="Choose a team" options={teams} />`,
        rn: `<Select label="Team" value={team} onChange={setTeam} options={teams} />`,
        angular: `<oc-select label="Team" placeholder="Choose a team" [options]="teams" [(value)]="team" />`,
      },
    },
    {
      id: 'checkbox',
      name: 'Checkbox',
      description: 'A native checkbox with a visible, clickable label.',
      props: [
        ['label', 'ReactNode', 'Label text.'],
        ['checked / onChange', 'boolean / ChangeEvent', 'Controlled state.'],
        ['disabled', 'boolean', 'Disables the control.'],
      ],
      keys: [['Space', 'Toggles the checkbox']],
      code: {
        react: `<Checkbox label="Email me updates" checked={updates}
  onChange={(e) => setUpdates(e.target.checked)} />`,
        vue: `<Checkbox v-model="updates" label="Email me updates" />`,
        svelte: `<Checkbox bind:checked={updates} label="Email me updates" />`,
        astro: `<Checkbox name="updates" label="Email me updates" checked />`,
        rn: `<Checkbox label="Email me updates" checked={updates} onChange={setUpdates} />`,
        angular: `<oc-checkbox label="Email me updates" [(value)]="updates" />`,
      },
    },
    {
      id: 'switch',
      name: 'Switch',
      description: 'An on/off toggle using role="switch" with aria-checked.',
      props: [
        ['checked', 'boolean', 'Current state.'],
        ['onChange', '(checked: boolean) => void', 'Called on toggle.'],
        ['label', 'string', 'Accessible name (required).'],
        ['disabled', 'boolean', 'Disables the switch.'],
      ],
      keys: [['Space / Enter', 'Toggles the switch']],
      code: {
        react: `<Switch label="Dark previews" checked={dark} onChange={setDark} />`,
        vue: `<Switch v-model="dark" label="Dark previews" />`,
        svelte: `<Switch bind:checked={dark} label="Dark previews" />`,
        astro: `<Switch name="dark" label="Dark previews" checked />`,
        rn: `<Switch label="Dark previews" checked={dark} onChange={setDark} />`,
        angular: `<oc-switch label="Dark previews" [(value)]="dark" />`,
      },
    },
    {
      id: 'radio-group',
      name: 'RadioGroup',
      description: 'A fieldset of radio buttons with a legend; one option can be chosen.',
      props: [
        ['name', 'string', 'Shared input name.'],
        ['options', '{ label, value, disabled? }[]', 'Choices.'],
        ['value / onChange', 'string / (value) => void', 'Controlled selection.'],
        ['label', 'string', 'Legend text.'],
      ],
      keys: [
        ['Arrow keys', 'Move selection between options'],
        ['Tab', 'Moves into and out of the group'],
      ],
      code: {
        react: `<RadioGroup name="plan" label="Plan" value={plan} onChange={setPlan}
  options={[{ label: 'Free', value: 'free' }, { label: 'Pro', value: 'pro' }]} />`,
        vue: `<RadioGroup v-model="plan" name="plan" label="Plan" :options="plans" />`,
        svelte: `<RadioGroup bind:value={plan} name="plan" label="Plan" options={plans} />`,
        astro: `<RadioGroup name="plan" label="Plan" value="pro" options={plans} />`,
        rn: `<RadioGroup label="Plan" value={plan} onChange={setPlan} options={plans} />`,
        angular: `<oc-radio-group name="plan" label="Plan" [options]="plans" [(value)]="plan" />`,
      },
    },
    {
      id: 'slider',
      name: 'Slider',
      description: 'A range input with an optional live value readout.',
      props: [
        ['value / onChange', 'number / (value) => void', 'Controlled value.'],
        ['min / max / step', 'number', 'Range. Defaults 0, 100, 1.'],
        ['label', 'string', 'Visible label.'],
        ['showValue', 'boolean', 'Shows the current value next to the label.'],
      ],
      keys: [
        ['Arrow keys', 'Change by one step'],
        ['Page Up / Page Down', 'Change by a larger step'],
        ['Home / End', 'Jump to min / max'],
      ],
      code: {
        react: `<Slider label="Budget" value={budget} onChange={setBudget} showValue />`,
        vue: `<Slider v-model="budget" label="Budget" show-value />`,
        svelte: `<Slider bind:value={budget} label="Budget" showValue />`,
        astro: `<Slider name="budget" label="Budget" value={40} showValue />`,
        angular: `<oc-slider label="Budget" [(value)]="budget" showValue />`,
      },
    },
    {
      id: 'segmented',
      name: 'Segmented',
      description: 'A compact single-choice control for switching views.',
      props: [
        ['options', '{ label, value }[]', 'Segments.'],
        ['value / onChange', 'string / (value) => void', 'Controlled selection.'],
        ['label', 'string', 'Accessible group name (required).'],
      ],
      keys: [['Arrow keys', 'Move between segments']],
      a11y: 'Built from native radio inputs inside a labelled group.',
      code: {
        react: `<Segmented label="View" value={view} onChange={setView}
  options={[{ label: 'Grid', value: 'grid' }, { label: 'List', value: 'list' }]} />`,
        vue: `<Segmented v-model="view" label="View" :options="views" />`,
        svelte: `<Segmented bind:value={view} label="View" options={views} />`,
        astro: `<Segmented name="view" label="View" options={views} />`,
        rn: `<Segmented label="View" value={view} onChange={setView} options={views} />`,
        angular: `<oc-segmented label="View" [options]="views" [(value)]="view" />`,
      },
    },
  ],
};
