// Code examples shown in the docs, one per framework. Keep them short and copy-pasteable.

export type Framework = 'react' | 'vue' | 'svelte' | 'astro' | 'rn' | 'angular';

/** Code for one example, keyed by framework. Frameworks that don't ship the component are left out. */
export type CodeSet = Partial<Record<Framework, string>>;

export const frameworks: { key: Framework; label: string; lang: string }[] = [
  { key: 'react', label: 'React', lang: 'tsx' },
  { key: 'vue', label: 'Vue', lang: 'vue' },
  { key: 'svelte', label: 'Svelte', lang: 'svelte' },
  { key: 'astro', label: 'Astro', lang: 'astro' },
  { key: 'rn', label: 'React Native', lang: 'tsx' },
  { key: 'angular', label: 'Angular', lang: 'ts' },
];

export const install: CodeSet = {
  react: `npm i @nawa-ui/react @nawa-ui/core

// main.tsx
import '@nawa-ui/core/style.css';`,
  vue: `npm i @nawa-ui/vue @nawa-ui/core

// main.ts
import '@nawa-ui/core/style.css';`,
  svelte: `npm i @nawa-ui/svelte @nawa-ui/core

// +layout.svelte
import '@nawa-ui/core/style.css';`,
  astro: `npm i @nawa-ui/astro @nawa-ui/core

---
// src/layouts/Layout.astro
import '@nawa-ui/core/style.css';
import ThemeScript from '@nawa-ui/astro/components/ThemeScript';
---
<head><ThemeScript /></head>`,
  rn: `npm i @nawa-ui/react-native @nawa-ui/core

// App.tsx
import { NawaProvider } from '@nawa-ui/react-native';
export default () => <NawaProvider mode="system" accent="teal">{/* app */}</NawaProvider>;`,
  angular: `npm i @nawa-ui/angular @nawa-ui/core

/* src/styles.css */
@import '@nawa-ui/core/style.css';`,
};

export const snippets: Record<string, CodeSet> = {
  button: {
    react: `<Button>Save</Button>
<Button variant="outline">Preview</Button>
<Button variant="danger" loading>Deleting</Button>`,
    vue: `<Button>Save</Button>
<Button variant="outline">Preview</Button>
<Button variant="danger" loading>Deleting</Button>`,
    svelte: `<Button>Save</Button>
<Button variant="outline">Preview</Button>
<Button variant="danger" loading>Deleting</Button>`,
    astro: `---
import Button from '@nawa-ui/astro/components/Button';
---
<Button>Save</Button>
<Button variant="outline">Preview</Button>`,
    rn: `<Button title="Save" />
<Button title="Preview" variant="outline" />
<Button title="Deleting" variant="danger" loading />`,
    angular: `import { NwButton } from '@nawa-ui/angular';

@Component({
  imports: [NwButton],
  template: \`
    <button nwButton>Save</button>
    <button nwButton variant="outline">Preview</button>
    <button nwButton variant="danger" [loading]="true">Deleting</button>\`,
})
export class Actions {}`,
  },
  input: {
    react: `const [email, setEmail] = useState('');
<Input label="Email" type="email" value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={email ? undefined : 'Required'} />`,
    vue: `<Input v-model="email" label="Email" type="email"
  :error="email ? undefined : 'Required'" />`,
    svelte: `<Input bind:value={email} label="Email" type="email"
  error={email ? undefined : 'Required'} />`,
    astro: `<Input name="email" label="Email" type="email" hint="We never share it" />`,
    rn: `<Input label="Email" value={email} onChangeText={setEmail}
  keyboardType="email-address" error={email ? undefined : 'Required'} />`,
  },
  datatable: {
    react: `<DataTable
  caption="Team members"
  rows={members}
  loading={isLoading}
  columns={[
    { key: 'name', label: 'Name', sortable: true },
    { key: 'projects', label: 'Projects', sortable: true, align: 'end' },
    { key: 'status', label: 'Status', render: (m) => <Badge>{m.status}</Badge> },
  ]}
/>`,
    vue: `<DataTable caption="Team members" :rows="members" :loading="isLoading"
  :columns="[{ key: 'name', label: 'Name', sortable: true },
             { key: 'projects', label: 'Projects', sortable: true, align: 'end' }]">
  <template #cell-name="{ row }"><strong>{{ row.name }}</strong></template>
</DataTable>`,
    svelte: `<DataTable rows={members} loading={isLoading}
  columns={[{ key: 'name', label: 'Name', sortable: true },
            { key: 'projects', label: 'Projects', sortable: true, align: 'end' }]} />`,
    astro: `<DataTable caption="Team members" rows={members}
  sort={{ key: Astro.url.searchParams.get('sort') ?? 'name', direction: 'asc' }}
  sortHref="?sort={key}&dir={dir}"
  columns={[{ key: 'name', label: 'Name', sortable: true }]} />`,
    rn: `<DataTable rows={members} loading={isLoading}
  columns={[{ key: 'name', label: 'Name', sortable: true, width: 160 },
            { key: 'projects', label: 'Projects', sortable: true, align: 'end' }]} />`,
  },
  dialog: {
    react: `<Button onClick={() => setOpen(true)}>Open</Button>
<Dialog open={open} title="Delete project?" onClose={() => setOpen(false)}
  footer={<Button variant="danger">Delete</Button>}>
  This cannot be undone.
</Dialog>`,
    vue: `<Dialog :open="open" title="Delete project?" @close="open = false">
  This cannot be undone.
  <template #footer><Button variant="danger">Delete</Button></template>
</Dialog>`,
    svelte: `<Dialog {open} title="Delete project?" onclose={() => (open = false)}>
  This cannot be undone.
  {#snippet footer()}<Button variant="danger">Delete</Button>{/snippet}
</Dialog>`,
    astro: `<Button data-nw-open="confirm">Open</Button>
<Dialog id="confirm" title="Delete project?">
  This cannot be undone.
  <Button slot="footer" variant="danger" data-nw-close>Delete</Button>
</Dialog>`,
    rn: `<Dialog visible={open} title="Delete project?" onClose={() => setOpen(false)}
  footer={<Button title="Delete" variant="danger" />}>
  <Text>This cannot be undone.</Text>
</Dialog>`,
  },
  tabs: {
    react: `<Tabs tabs={[
  { key: 'overview', label: 'Overview', content: <p>…</p> },
  { key: 'activity', label: 'Activity', content: <p>…</p> },
]} />`,
    vue: `<Tabs v-model="tab" :tabs="[{ key: 'overview', label: 'Overview' }, { key: 'activity', label: 'Activity' }]">
  <template #panel-overview>…</template>
  <template #panel-activity>…</template>
</Tabs>`,
    svelte: `<Tabs bind:value={tab} tabs={[{ key: 'overview', label: 'Overview' }, { key: 'activity', label: 'Activity' }]}>
  {#snippet panel(key)}{key === 'overview' ? 'Overview…' : 'Activity…'}{/snippet}
</Tabs>`,
    astro: `<Tabs tabs={[{ key: 'overview', label: 'Overview' }, { key: 'activity', label: 'Activity' }]}>
  <p slot="panel-overview">…</p>
  <p slot="panel-activity">…</p>
</Tabs>`,
    rn: `<Tabs tabs={[
  { key: 'overview', label: 'Overview', content: <Text>…</Text> },
  { key: 'activity', label: 'Activity', content: <Text>…</Text> },
]} />`,
  },
  skeleton: {
    react: `{loading ? <SkeletonCard label="Loading profile" /> : <Profile />}
<SkeletonText lines={4} />
<DataTable loading rows={[]} columns={columns} />`,
    vue: `<SkeletonCard v-if="loading" label="Loading profile" />
<SkeletonText :lines="4" />`,
    svelte: `{#if loading}<SkeletonCard label="Loading profile" />{/if}
<SkeletonText lines={4} />`,
    astro: `<SkeletonCard label="Loading profile" />
<SkeletonText lines={4} />`,
    rn: `{loading ? <SkeletonCard label="Loading profile" /> : <Profile />}
<SkeletonText lines={4} />`,
  },
  toast: {
    react: `const [toasts, setToasts] = useState<ToastItem[]>([]);
<Toast items={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />`,
    vue: `<Toast :items="toasts" @dismiss="(id) => toasts = toasts.filter((t) => t.id !== id)" />`,
    svelte: `<Toast items={toasts} ondismiss={(id) => (toasts = toasts.filter((t) => t.id !== id))} />`,
    astro: `<Toaster />
<script>
  window.nawaToast({ title: 'Saved', message: 'Changes are live', variant: 'success' });
</script>`,
    rn: `<Toast items={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />`,
  },
  theme: {
    react: `import { applyTheme, saveTheme } from '@nawa-ui/react';
applyTheme({ mode: 'dark', accent: 'indigo', shape: 'round' });`,
    vue: `import { applyTheme } from '@nawa-ui/vue';
applyTheme({ mode: 'hc' }); // high contrast`,
    svelte: `import { applyTheme } from '@nawa-ui/svelte';
applyTheme({ mode: 'system', accent: 'rose' });`,
    astro: `<html data-theme="dark" data-accent="emerald" data-shape="sharp">
<!-- or scope a section: <section data-theme="dark"> -->`,
    rn: `<NawaProvider mode="system" accent="indigo">
  <App />
</NawaProvider>`,
  },
};
