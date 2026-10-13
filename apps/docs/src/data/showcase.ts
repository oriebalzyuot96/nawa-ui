// The hero showcase: the same "new deployment" card written for every platform Pelagic UI ships.

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
import { Card, Input, Segmented, Switch, ProgressBar, Badge, Button, toast } from '@pelagic-ui/react';

const envs = [{ label: 'Preview', value: 'preview' }, { label: 'Production', value: 'prod' }];

export function Deploy() {
  const [env, setEnv] = useState('preview');
  const [notify, setNotify] = useState(true);
  return (
    <Card
      title="New deployment"
      footer={<Button onClick={() => toast.success('pelagic-app is live')}>Deploy</Button>}
    >
      <Input label="Project name" defaultValue="pelagic-app" />
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
import { Card, Input, Segmented, Switch, ProgressBar, Badge, Button } from '@pelagic-ui/vue';

const envs = [{ label: 'Preview', value: 'preview' }, { label: 'Production', value: 'prod' }];
const name = ref('pelagic-app');
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
import { PELAGIC_UI } from '@pelagic-ui/angular';

@Component({
  selector: 'app-deploy',
  imports: [PELAGIC_UI],
  template: \`
    <pl-card title="New deployment">
      <pl-input label="Project name" [(value)]="name" />
      <pl-segmented label="Environment" [options]="envs" [(value)]="env" />
      <pl-switch label="Notify the team" [(value)]="notify" />
      <pl-progress-bar [value]="72" label="Build progress" />
      <pl-badge variant="success">Checks passed</pl-badge>
      <div plCardFooter><button plButton>Deploy</button></div>
    </pl-card>\`,
})
export class DeployComponent {
  envs = [{ label: 'Preview', value: 'preview' }, { label: 'Production', value: 'prod' }];
  name = signal('pelagic-app');
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
  import { Card, Input, Segmented, Switch, ProgressBar, Badge, Button } from '@pelagic-ui/svelte';

  const envs = [{ label: 'Preview', value: 'preview' }, { label: 'Production', value: 'prod' }];
  let name = $state('pelagic-app');
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
import Card from '@pelagic-ui/astro/components/Card';
import Input from '@pelagic-ui/astro/components/Input';
import Segmented from '@pelagic-ui/astro/components/Segmented';
import Switch from '@pelagic-ui/astro/components/Switch';
import ProgressBar from '@pelagic-ui/astro/components/ProgressBar';
import Badge from '@pelagic-ui/astro/components/Badge';
import Button from '@pelagic-ui/astro/components/Button';

const envs = [{ label: 'Preview', value: 'preview' }, { label: 'Production', value: 'prod' }];
---
<Card title="New deployment">
  <Input label="Project name" value="pelagic-app" />
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
import { Card, Input, Segmented, Switch, ProgressBar, Badge, Button } from '@pelagic-ui/react-native';

const envs = [{ label: 'Preview', value: 'preview' }, { label: 'Production', value: 'prod' }];

export function Deploy() {
  const [env, setEnv] = useState('preview');
  const [notify, setNotify] = useState(true);
  return (
    <Card title="New deployment" footer={<Button title="Deploy" onPress={deploy} />}>
      <Input label="Project name" defaultValue="pelagic-app" />
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
import 'package:pelagic_ui/pelagic_ui.dart';

Widget deployCard() => PelagicCard(
      title: 'New deployment',
      footer: PelagicButton(label: 'Deploy', onPressed: deploy),
      child: Column(children: [
        PelagicInput(label: 'Project name', controller: name),
        PelagicSegmented<String>(
          label: 'Environment',
          options: const [
            PelagicOption(value: 'preview', label: 'Preview'),
            PelagicOption(value: 'prod', label: 'Production'),
          ],
          value: env,
          onChanged: setEnv,
        ),
        PelagicSwitch(label: 'Notify the team', value: notify, onChanged: setNotify),
        const PelagicProgressBar(value: 0.72, label: 'Build progress'),
        const PelagicBadge(label: 'Checks passed', tone: PelagicTone.success),
      ]),
    );`,
  },
];
