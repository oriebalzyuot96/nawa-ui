// The hero showcase: the same "new deployment" card written for every platform Orca UI ships.

export interface ShowcaseCode {
  key: string;
  label: string;
  file: string;
  lang: string;
  code: string;
}

export const showcase: ShowcaseCode[] = [
  {
    key: 'react',
    label: 'React',
    file: 'Deploy.tsx',
    lang: 'tsx',
    code: `import { useState } from 'react';
import { Card, Input, Segmented, Switch, ProgressBar, Badge, Button, toast } from '@orca-ui/react';

const envs = [{ label: 'Preview', value: 'preview' }, { label: 'Production', value: 'prod' }];

export function Deploy() {
  const [env, setEnv] = useState('preview');
  const [notify, setNotify] = useState(true);
  return (
    <Card
      title="New deployment"
      footer={<Button onClick={() => toast.success('orca-app is live')}>Deploy</Button>}
    >
      <Input label="Project name" defaultValue="orca-app" />
      <Segmented label="Environment" options={envs} value={env} onChange={setEnv} />
      <Switch label="Notify the team" showLabel checked={notify} onChange={setNotify} />
      <ProgressBar value={72} label="Build progress" />
      <Badge variant="success">Checks passed</Badge>
    </Card>
  );
}`,
  },
  {
    key: 'vue',
    label: 'Vue',
    file: 'Deploy.vue',
    lang: 'vue',
    code: `<script setup lang="ts">
import { ref } from 'vue';
import { Card, Input, Segmented, Switch, ProgressBar, Badge, Button } from '@orca-ui/vue';

const envs = [{ label: 'Preview', value: 'preview' }, { label: 'Production', value: 'prod' }];
const name = ref('orca-app');
const env = ref('preview');
const notify = ref(true);
</script>

<template>
  <Card title="New deployment">
    <Input v-model="name" label="Project name" />
    <Segmented v-model="env" label="Environment" :options="envs" />
    <Switch v-model="notify" label="Notify the team" />
    <ProgressBar :value="72" label="Build progress" />
    <Badge variant="success">Checks passed</Badge>
    <template #footer>
      <Button>Deploy</Button>
    </template>
  </Card>
</template>`,
  },
  {
    key: 'angular',
    label: 'Angular',
    file: 'deploy.component.ts',
    lang: 'ts',
    code: `import { Component, signal } from '@angular/core';
import { ORCA_UI } from '@orca-ui/angular';

@Component({
  selector: 'app-deploy',
  imports: [ORCA_UI],
  template: \`
    <oc-card title="New deployment">
      <oc-input label="Project name" [(value)]="name" />
      <oc-segmented label="Environment" [options]="envs" [(value)]="env" />
      <oc-switch label="Notify the team" [(value)]="notify" />
      <oc-progress-bar [value]="72" label="Build progress" />
      <oc-badge variant="success">Checks passed</oc-badge>
      <div ocCardFooter><button ocButton>Deploy</button></div>
    </oc-card>\`,
})
export class DeployComponent {
  envs = [{ label: 'Preview', value: 'preview' }, { label: 'Production', value: 'prod' }];
  name = signal('orca-app');
  env = signal('preview');
  notify = signal(true);
}`,
  },
  {
    key: 'svelte',
    label: 'Svelte',
    file: 'Deploy.svelte',
    lang: 'svelte',
    code: `<script lang="ts">
  import { Card, Input, Segmented, Switch, ProgressBar, Badge, Button } from '@orca-ui/svelte';

  const envs = [{ label: 'Preview', value: 'preview' }, { label: 'Production', value: 'prod' }];
  let name = $state('orca-app');
  let env = $state('preview');
  let notify = $state(true);
</script>

<Card title="New deployment">
  <Input bind:value={name} label="Project name" />
  <Segmented bind:value={env} label="Environment" options={envs} />
  <Switch bind:checked={notify} label="Notify the team" />
  <ProgressBar value={72} label="Build progress" />
  <Badge variant="success">Checks passed</Badge>
  {#snippet footer()}
    <Button>Deploy</Button>
  {/snippet}
</Card>`,
  },
  {
    key: 'astro',
    label: 'Astro',
    file: 'Deploy.astro',
    lang: 'astro',
    code: `---
import Card from '@orca-ui/astro/components/Card';
import Input from '@orca-ui/astro/components/Input';
import Segmented from '@orca-ui/astro/components/Segmented';
import Switch from '@orca-ui/astro/components/Switch';
import ProgressBar from '@orca-ui/astro/components/ProgressBar';
import Badge from '@orca-ui/astro/components/Badge';
import Button from '@orca-ui/astro/components/Button';

const envs = [{ label: 'Preview', value: 'preview' }, { label: 'Production', value: 'prod' }];
---
<Card title="New deployment">
  <Input label="Project name" value="orca-app" />
  <Segmented name="env" label="Environment" options={envs} />
  <Switch label="Notify the team" checked />
  <ProgressBar value={72} label="Build progress" />
  <Badge variant="success">Checks passed</Badge>
  <Button slot="footer">Deploy</Button>
</Card>`,
  },
  {
    key: 'rn',
    label: 'React Native',
    file: 'Deploy.tsx',
    lang: 'tsx',
    code: `import { useState } from 'react';
import { Card, Input, Segmented, Switch, ProgressBar, Badge, Button } from '@orca-ui/react-native';

const envs = [{ label: 'Preview', value: 'preview' }, { label: 'Production', value: 'prod' }];

export function Deploy() {
  const [env, setEnv] = useState('preview');
  const [notify, setNotify] = useState(true);
  return (
    <Card title="New deployment" footer={<Button title="Deploy" onPress={deploy} />}>
      <Input label="Project name" defaultValue="orca-app" />
      <Segmented label="Environment" options={envs} value={env} onChange={setEnv} />
      <Switch label="Notify the team" checked={notify} onChange={setNotify} />
      <ProgressBar value={72} label="Build progress" />
      <Badge variant="success">Checks passed</Badge>
    </Card>
  );
}`,
  },
  {
    key: 'flutter',
    label: 'Flutter',
    file: 'deploy.dart',
    lang: 'dart',
    code: `import 'package:flutter/widgets.dart';
import 'package:orca_ui/orca_ui.dart';

Widget deployCard() => OrcaCard(
      title: 'New deployment',
      footer: OrcaButton(label: 'Deploy', onPressed: deploy),
      child: Column(children: [
        OrcaInput(label: 'Project name', controller: name),
        OrcaSegmented<String>(
          label: 'Environment',
          options: const [
            OrcaOption(value: 'preview', label: 'Preview'),
            OrcaOption(value: 'prod', label: 'Production'),
          ],
          value: env,
          onChanged: setEnv,
        ),
        OrcaSwitch(label: 'Notify the team', value: notify, onChanged: setNotify),
        const OrcaProgressBar(value: 0.72, label: 'Build progress'),
        const OrcaBadge(label: 'Checks passed', tone: OrcaTone.success),
      ]),
    );`,
  },
];
