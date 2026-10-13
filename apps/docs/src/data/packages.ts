// Every package Pelagic UI ships, in the order the site presents them.
// Sizes were measured from the 0.1.0 build with `npm pack --dry-run` (packed = download size,
// unpacked = size on disk); the Flutter size is the Dart source in lib/.

export type Lang = 'en' | 'ar';
export type Text = Record<Lang, string>;

export type MarkId =
  | 'pelagic'
  | 'react'
  | 'vue'
  | 'angular'
  | 'svelte'
  | 'astro'
  | 'native'
  | 'flutter'
  | 'three'
  | 'icons'
  | 'illustrations'
  | 'core';

export interface InstallOption {
  /** Tab label: npm, yarn, pnpm, flutter … */
  pm: string;
  cmd: string;
}

export interface PackageInfo {
  id: string;
  /** Registry name. */
  name: string;
  registry: 'npm' | 'pub.dev';
  mark: MarkId;
  /** Short platform label shown on the card. */
  platform: Text;
  tagline: Text;
  description: Text;
  /** What the package contains, 3–5 short items. */
  includes: Record<Lang, string[]>;
  /** The headline number for the card. */
  stat: { value: string; label: Text };
  install: InstallOption[];
  usage: { file: string; lang: 'tsx' | 'ts' | 'vue' | 'svelte' | 'astro' | 'dart' | 'css' | 'yaml'; code: string };
  exports: { path: string; text: Text }[];
  peers: string[];
  size: { packed: string; unpacked: string };
  registryUrl: string;
  sourceUrl: string;
  /** Docs page on this site that shows it in use (path without base). */
  docs?: string;
}

const repo = 'https://github.com/oriebalzyuot96/pelagic-ui/tree/main/packages';
const npm = (name: string): InstallOption[] => [
  { pm: 'npm', cmd: `npm i ${name}` },
  { pm: 'yarn', cmd: `yarn add ${name}` },
  { pm: 'pnpm', cmd: `pnpm add ${name}` },
];

export const packages: PackageInfo[] = [
  {
    id: 'pelagic',
    name: 'pelagic',
    registry: 'npm',
    mark: 'pelagic',
    platform: { en: 'Everything', ar: 'كل شيء' },
    tagline: { en: 'The whole system in one install', ar: 'النظام كاملاً في تثبيت واحد' },
    description: {
      en: 'One package with every target: components for each framework, charts, 3D, icons, illustrations, the theme engine, motion and sound. Framework packages are optional peers, so you only pull in what you import.',
      ar: 'حزمة واحدة تضم كل شيء: مكونات لكل إطار، رسوم بيانية، ثلاثي الأبعاد، أيقونات، رسوم توضيحية، محرّك الثيمات والحركة والصوت. أُطر العمل اعتماديات اختيارية، فلا يُحمَّل إلا ما تستورده.',
    },
    includes: {
      en: ['Every framework entry point', 'Core CSS, tokens and theme engine', 'Icons and illustrations', 'WebGL 3D components'],
      ar: ['مدخل لكل إطار عمل', 'CSS الأساسي والرموز ومحرّك الثيمات', 'الأيقونات والرسوم التوضيحية', 'مكونات ثلاثية الأبعاد WebGL'],
    },
    stat: { value: '7', label: { en: 'platforms in one package', ar: 'منصّات في حزمة واحدة' } },
    install: npm('pelagic'),
    usage: {
      file: 'main.tsx',
      lang: 'tsx',
      code: `import 'pelagic/style.css';
import { Button, DataTable, swal } from 'pelagic/react';
import { SearchIcon } from 'pelagic/icons/react';
import { createTheme, applyCustomTheme } from 'pelagic/core/theme';

applyCustomTheme(createTheme({ primary: '#ff6a00' }));`,
    },
    exports: [
      { path: 'pelagic/style.css', text: { en: 'All component styles and themes', ar: 'أنماط كل المكونات والثيمات' } },
      { path: 'pelagic/react', text: { en: 'React components', ar: 'مكونات React' } },
      { path: 'pelagic/vue', text: { en: 'Vue 3 components', ar: 'مكونات Vue 3' } },
      { path: 'pelagic/angular', text: { en: 'Angular standalone components', ar: 'مكونات Angular المستقلة' } },
      { path: 'pelagic/svelte', text: { en: 'Svelte 5 components', ar: 'مكونات Svelte 5' } },
      { path: 'pelagic/astro/components/*', text: { en: 'Astro components', ar: 'مكونات Astro' } },
      { path: 'pelagic/react-native', text: { en: 'React Native components', ar: 'مكونات React Native' } },
      { path: 'pelagic/three', text: { en: 'WebGL 3D', ar: 'ثلاثي الأبعاد WebGL' } },
      { path: 'pelagic/icons/*', text: { en: 'Icons for every framework', ar: 'أيقونات لكل إطار' } },
      { path: 'pelagic/illustrations/*', text: { en: 'Illustrations for every framework', ar: 'رسوم توضيحية لكل إطار' } },
      { path: 'pelagic/core/*', text: { en: 'theme, a11y-prefs, motion, sound, tokens', ar: 'الثيمات وتفضيلات الوصول والحركة والصوت والرموز' } },
    ],
    peers: ['react', 'vue', '@angular/core', 'svelte', 'astro', 'react-native', 'three', '(all optional)'],
    size: { packed: '624 kB', unpacked: '2.8 MB' },
    registryUrl: 'https://www.npmjs.com/package/pelagic',
    sourceUrl: `${repo}/pelagic`,
    docs: '/getting-started/',
  },
  {
    id: 'react',
    name: '@pelagic-ui/react',
    registry: 'npm',
    mark: 'react',
    platform: { en: 'React 18 / 19', ar: 'React 18 / 19' },
    tagline: { en: 'The most complete set', ar: 'المجموعة الأكثر اكتمالاً' },
    description: {
      en: 'The full catalogue: forms, advanced inputs, DataTable, overlays, menus, media, charts, motion, Wizard, swal and toasts. Every widget follows its WAI-ARIA pattern and is tested with axe.',
      ar: 'الكتالوج الكامل: النماذج، المدخلات المتقدمة، جدول البيانات، النوافذ، القوائم، الوسائط، الرسوم البيانية، الحركة، المعالج، التنبيهات والإشعارات. كل مكوّن يتبع نمط WAI-ARIA ومُختبر بـ axe.',
    },
    includes: {
      en: ['DataTable, Tree, VirtualScroller', '13 accessible chart types', 'Motion engine and Wizard', 'swal(), toast(), 15 loaders'],
      ar: ['جدول البيانات والشجرة والتمرير الافتراضي', '13 نوعاً من الرسوم البيانية سهلة الوصول', 'محرّك الحركة والمعالج', 'swal() و toast() و15 مؤشر تحميل'],
    },
    stat: { value: '171', label: { en: 'components', ar: 'مكوّناً' } },
    install: npm('@pelagic-ui/react @pelagic-ui/core'),
    usage: {
      file: 'App.tsx',
      lang: 'tsx',
      code: `import '@pelagic-ui/core/style.css';
import { Button, Input, toast, Toaster } from '@pelagic-ui/react';

export function App() {
  return (
    <>
      <Input label="Project name" defaultValue="pelagic-app" />
      <Button onClick={() => toast.success('Deployed')}>Deploy</Button>
      <Toaster />
    </>
  );
}`,
    },
    exports: [
      { path: '@pelagic-ui/react', text: { en: 'Components, hooks (useConfirm, useDialog), swal, toast', ar: 'المكونات والخطافات (useConfirm و useDialog) و swal و toast' } },
    ],
    peers: ['react ^18 || ^19', 'react-dom'],
    size: { packed: '182 kB', unpacked: '749 kB' },
    registryUrl: 'https://www.npmjs.com/package/@pelagic-ui/react',
    sourceUrl: `${repo}/react`,
    docs: '/components/',
  },
  {
    id: 'vue',
    name: '@pelagic-ui/vue',
    registry: 'npm',
    mark: 'vue',
    platform: { en: 'Vue 3', ar: 'Vue 3' },
    tagline: { en: 'v-model everywhere', ar: 'v-model في كل مكان' },
    description: {
      en: 'Composition-API components with v-model on every input, typed props and slots for custom cells, empty states and footers.',
      ar: 'مكونات مبنية على Composition API مع v-model في كل حقل، وخصائص مكتوبة الأنواع، وفتحات (slots) للخلايا والحالات الفارغة والتذييلات.',
    },
    includes: {
      en: ['Forms with v-model', 'DataTable with cell slots', 'Dialog, Drawer, Tooltip', 'AccessibilityPanel'],
      ar: ['نماذج مع v-model', 'جدول بيانات بفتحات للخلايا', 'نافذة ودرج وتلميح', 'لوحة إمكانية الوصول'],
    },
    stat: { value: '33', label: { en: 'components', ar: 'مكوّناً' } },
    install: npm('@pelagic-ui/vue @pelagic-ui/core'),
    usage: {
      file: 'App.vue',
      lang: 'vue',
      code: `<script setup lang="ts">
import '@pelagic-ui/core/style.css';
import { ref } from 'vue';
import { Button, Input, Switch } from '@pelagic-ui/vue';
const name = ref('pelagic-app');
const previews = ref(true);
</script>

<template>
  <Input v-model="name" label="Project name" />
  <Switch v-model="previews" label="Preview deployments" />
  <Button>Deploy</Button>
</template>`,
    },
    exports: [{ path: '@pelagic-ui/vue', text: { en: 'Components and the sound composable', ar: 'المكونات ووحدة الصوت' } }],
    peers: ['vue ^3.4'],
    size: { packed: '17 kB', unpacked: '93 kB' },
    registryUrl: 'https://www.npmjs.com/package/@pelagic-ui/vue',
    sourceUrl: `${repo}/vue`,
  },
  {
    id: 'angular',
    name: '@pelagic-ui/angular',
    registry: 'npm',
    mark: 'angular',
    platform: { en: 'Angular 20–22', ar: 'Angular 20–22' },
    tagline: { en: 'Standalone, signals, forms', ar: 'مستقلة، إشارات، نماذج' },
    description: {
      en: 'Standalone components and directives built on signals. Inputs implement ControlValueAccessor, so they work with reactive and template-driven forms.',
      ar: 'مكونات وموجّهات مستقلة مبنية على الإشارات (signals). الحقول تطبّق ControlValueAccessor فتعمل مع النماذج التفاعلية والقوالب.',
    },
    includes: {
      en: ['plButton directive', 'Reactive-forms inputs', 'DataTable with cell templates', 'PELAGIC_UI import bundle'],
      ar: ['موجّه plButton', 'حقول للنماذج التفاعلية', 'جدول بيانات بقوالب للخلايا', 'حزمة الاستيراد PELAGIC_UI'],
    },
    stat: { value: '39', label: { en: 'components & directives', ar: 'مكوّناً وموجّهاً' } },
    install: npm('@pelagic-ui/angular @pelagic-ui/core'),
    usage: {
      file: 'deploy.component.ts',
      lang: 'ts',
      code: `import { Component } from '@angular/core';
import { PELAGIC_UI } from '@pelagic-ui/angular';

@Component({
  selector: 'app-deploy',
  imports: [PELAGIC_UI],
  template: \`
    <pl-input label="Project name" [(value)]="name" />
    <button plButton (click)="deploy()">Deploy</button>\`,
})
export class DeployComponent {
  name = 'pelagic-app';
  deploy() {}
}`,
    },
    exports: [{ path: '@pelagic-ui/angular', text: { en: 'Pl* components, PELAGIC_UI, theme helpers', ar: 'مكونات Pl* و PELAGIC_UI وأدوات الثيم' } }],
    peers: ['@angular/core 20–22', '@angular/common', '@angular/forms'],
    size: { packed: '61 kB', unpacked: '359 kB' },
    registryUrl: 'https://www.npmjs.com/package/@pelagic-ui/angular',
    sourceUrl: `${repo}/angular`,
  },
  {
    id: 'svelte',
    name: '@pelagic-ui/svelte',
    registry: 'npm',
    mark: 'svelte',
    platform: { en: 'Svelte 5', ar: 'Svelte 5' },
    tagline: { en: 'Runes-native components', ar: 'مكونات مبنية على Runes' },
    description: {
      en: 'Svelte 5 components written with runes. bind:value on every field, snippets for custom content, and actions for tooltips and focus traps.',
      ar: 'مكونات Svelte 5 مكتوبة بالـ runes. ‏bind:value في كل حقل، ومقاطع (snippets) للمحتوى المخصص، وإجراءات للتلميحات وحبس التركيز.',
    },
    includes: {
      en: ['bind:value forms', 'DataTable and Pagination', 'Dialog and Drawer', 'Skeleton presets'],
      ar: ['نماذج مع bind:value', 'جدول بيانات وترقيم صفحات', 'نافذة ودرج', 'هياكل تحميل جاهزة'],
    },
    stat: { value: '33', label: { en: 'components', ar: 'مكوّناً' } },
    install: npm('@pelagic-ui/svelte @pelagic-ui/core'),
    usage: {
      file: '+page.svelte',
      lang: 'svelte',
      code: `<script lang="ts">
  import { Button, Input, Switch } from '@pelagic-ui/svelte';
  let name = $state('pelagic-app');
  let previews = $state(true);
</script>

<Input bind:value={name} label="Project name" />
<Switch bind:checked={previews} label="Preview deployments" />
<Button>Deploy</Button>`,
    },
    exports: [{ path: '@pelagic-ui/svelte', text: { en: 'Components, actions and sound', ar: 'المكونات والإجراءات والصوت' } }],
    peers: ['svelte ^5'],
    size: { packed: '13 kB', unpacked: '42 kB' },
    registryUrl: 'https://www.npmjs.com/package/@pelagic-ui/svelte',
    sourceUrl: `${repo}/svelte`,
  },
  {
    id: 'astro',
    name: '@pelagic-ui/astro',
    registry: 'npm',
    mark: 'astro',
    platform: { en: 'Astro 5', ar: 'Astro 5' },
    tagline: { en: 'Zero JS by default', ar: 'بلا JavaScript افتراضياً' },
    description: {
      en: 'Server-rendered components that ship no JavaScript unless they need it. Tabs, switches and dialogs hydrate with a few hundred bytes of script. This site is built with it.',
      ar: 'مكونات تُعرض على الخادم ولا ترسل JavaScript إلا عند الحاجة. التبويبات والمفاتيح والنوافذ تعمل ببضع مئات من البايتات. هذا الموقع مبني بها.',
    },
    includes: {
      en: ['ThemeScript (no flash of wrong theme)', 'Server-sorted DataTable', 'Tabs, Dialog, Toaster', 'AccessibilityPanel'],
      ar: ['ThemeScript (بلا وميض للثيم الخاطئ)', 'جدول بيانات مرتّب على الخادم', 'تبويبات ونافذة وإشعارات', 'لوحة إمكانية الوصول'],
    },
    stat: { value: '34', label: { en: 'components', ar: 'مكوّناً' } },
    install: npm('@pelagic-ui/astro @pelagic-ui/core'),
    usage: {
      file: 'Layout.astro',
      lang: 'astro',
      code: `---
import '@pelagic-ui/core/style.css';
import ThemeScript from '@pelagic-ui/astro/components/ThemeScript';
import Button from '@pelagic-ui/astro/components/Button';
---
<html lang="en">
  <head><ThemeScript /></head>
  <body><Button>Deploy</Button></body>
</html>`,
    },
    exports: [{ path: '@pelagic-ui/astro/components/*', text: { en: 'One .astro file per component', ar: 'ملف .astro لكل مكوّن' } }],
    peers: ['astro ^5'],
    size: { packed: '14 kB', unpacked: '41 kB' },
    registryUrl: 'https://www.npmjs.com/package/@pelagic-ui/astro',
    sourceUrl: `${repo}/astro`,
  },
  {
    id: 'react-native',
    name: '@pelagic-ui/react-native',
    registry: 'npm',
    mark: 'native',
    platform: { en: 'React Native / Expo', ar: 'React Native / Expo' },
    tagline: { en: 'Same API, native views', ar: 'نفس الواجهة، عناصر أصلية' },
    description: {
      en: 'Native components with the same names and props as the web packages, driven by the same tokens. Screen-reader roles, 48dp targets and large-text support built in.',
      ar: 'مكونات أصلية بنفس أسماء وخصائص حزم الويب، وبنفس الرموز. أدوار قارئ الشاشة وأهداف لمس 48dp ودعم النص الكبير مدمجة.',
    },
    includes: {
      en: ['PelagicProvider with every theme', 'Forms and DataTable', 'Dialog, Drawer, Toast', 'RTL via I18nManager'],
      ar: ['PelagicProvider مع كل الثيمات', 'نماذج وجدول بيانات', 'نافذة ودرج وإشعار', 'دعم RTL عبر I18nManager'],
    },
    stat: { value: '31', label: { en: 'components', ar: 'مكوّناً' } },
    install: npm('@pelagic-ui/react-native @pelagic-ui/core'),
    usage: {
      file: 'App.tsx',
      lang: 'tsx',
      code: `import { PelagicProvider, Button, Input } from '@pelagic-ui/react-native';

export default function App() {
  return (
    <PelagicProvider mode="system" accent="violet">
      <Input label="Project name" defaultValue="pelagic-app" />
      <Button title="Deploy" onPress={deploy} />
    </PelagicProvider>
  );
}`,
    },
    exports: [{ path: '@pelagic-ui/react-native', text: { en: 'Components, PelagicProvider, usePelagicTheme', ar: 'المكونات و PelagicProvider و usePelagicTheme' } }],
    peers: ['react', 'react-native'],
    size: { packed: '13 kB', unpacked: '51 kB' },
    registryUrl: 'https://www.npmjs.com/package/@pelagic-ui/react-native',
    sourceUrl: `${repo}/react-native`,
  },
  {
    id: 'flutter',
    name: 'pelagic_ui',
    registry: 'pub.dev',
    mark: 'flutter',
    platform: { en: 'Flutter 3.24+', ar: 'Flutter 3.24+' },
    tagline: { en: 'Pure Flutter, no dependencies', ar: 'Flutter خالص بلا اعتماديات' },
    description: {
      en: 'Widgets generated from the same token source as the web, so a Flutter app and a web app look the same. Semantics, 48×48 hit areas, reduced motion and RTL built in.',
      ar: 'عناصر مولّدة من نفس مصدر الرموز للويب، فيبدو تطبيق Flutter وتطبيق الويب متطابقين. الدلالات وأهداف 48×48 وتقليل الحركة و RTL مدمجة.',
    },
    includes: {
      en: ['PelagicApp with every theme', 'Forms, tabs, accordion', 'Sortable PelagicDataTable', 'Bar and line charts'],
      ar: ['PelagicApp مع كل الثيمات', 'نماذج وتبويبات وأكورديون', 'جدول بيانات قابل للترتيب', 'رسوم أعمدة وخطوط'],
    },
    stat: { value: '30+', label: { en: 'widgets', ar: 'عنصراً' } },
    install: [
      { pm: 'flutter', cmd: 'flutter pub add pelagic_ui' },
      { pm: 'dart', cmd: 'dart pub add pelagic_ui' },
      { pm: 'pubspec', cmd: 'dependencies:\n  pelagic_ui: ^0.1.0' },
    ],
    usage: {
      file: 'main.dart',
      lang: 'dart',
      code: `import 'package:flutter/material.dart';
import 'package:pelagic_ui/pelagic_ui.dart';

void main() => runApp(const PelagicApp(title: 'Pelagic', home: Deploy()));

class Deploy extends StatelessWidget {
  const Deploy({super.key});
  @override
  Widget build(BuildContext context) => Column(children: [
        const PelagicInput(label: 'Project name'),
        PelagicButton(label: 'Deploy', onPressed: () {}),
      ]);
}`,
    },
    exports: [{ path: 'package:pelagic_ui/pelagic_ui.dart', text: { en: 'Widgets, PelagicApp, PelagicTheme, tokens', ar: 'العناصر و PelagicApp و PelagicTheme والرموز' } }],
    peers: ['Flutter SDK ≥ 3.24', 'Dart ≥ 3.5'],
    size: { packed: '—', unpacked: '194 kB' },
    registryUrl: 'https://pub.dev/packages/pelagic_ui',
    sourceUrl: `${repo}/flutter`,
  },
  {
    id: 'three',
    name: '@pelagic-ui/three',
    registry: 'npm',
    mark: 'three',
    platform: { en: 'WebGL · React', ar: 'WebGL · React' },
    tagline: { en: '3D that follows the theme', ar: 'ثلاثي أبعاد يتبع الثيم' },
    description: {
      en: 'Theme-aware three.js scenes: a globe, 3D charts, particles and a model viewer. They pause off-screen, render one still frame under reduced motion and fall back without WebGL.',
      ar: 'مشاهد three.js تتبع الثيم: كرة أرضية، رسوم بيانية ثلاثية الأبعاد، جسيمات وعارض نماذج. تتوقف خارج الشاشة، وتعرض إطاراً ثابتاً عند تقليل الحركة، ولها بديل دون WebGL.',
    },
    includes: {
      en: ['Globe3D and Chart3D', 'ModelViewer (glTF)', 'ParticlesField, FloatingShapes', 'Lazy-loaded three.js'],
      ar: ['Globe3D و Chart3D', 'عارض النماذج (glTF)', 'جسيمات وأشكال عائمة', 'تحميل three.js عند الحاجة'],
    },
    stat: { value: '6', label: { en: 'WebGL components', ar: 'مكونات WebGL' } },
    install: npm('@pelagic-ui/three three'),
    usage: {
      file: 'Hero.tsx',
      lang: 'tsx',
      code: `import { Globe3D } from '@pelagic-ui/three';

<Globe3D
  label="Our offices"
  markers={[{ lat: 24.7, lng: 46.7, label: 'Riyadh' }]}
/>`,
    },
    exports: [{ path: '@pelagic-ui/three', text: { en: 'Scene3D, Globe3D, Chart3D, ModelViewer …', ar: 'Scene3D و Globe3D و Chart3D و ModelViewer …' } }],
    peers: ['react', 'react-dom', 'three ≥ 0.160'],
    size: { packed: '13 kB', unpacked: '46 kB' },
    registryUrl: 'https://www.npmjs.com/package/@pelagic-ui/three',
    sourceUrl: `${repo}/three`,
    docs: '/components/3d/',
  },
  {
    id: 'icons',
    name: '@pelagic-ui/icons',
    registry: 'npm',
    mark: 'icons',
    platform: { en: 'Every framework', ar: 'كل الأطر' },
    tagline: { en: '239 original duotone icons', ar: '239 أيقونة أصلية ثنائية اللون' },
    description: {
      en: 'Original icons on a 24px grid in outline, duotone and solid. Tree-shakable named components for every framework, a web component and an SVG sprite. RTL-aware arrows.',
      ar: 'أيقونات أصلية على شبكة 24px بأنماط الخط والثنائي والمصمت. مكونات قابلة للتجزئة لكل إطار، ومكوّن ويب، وملف SVG مجمّع. الأسهم تنعكس في RTL.',
    },
    includes: {
      en: ['Outline, duotone, solid', 'React, Vue, Svelte, Angular, Astro, RN', 'Web component + sprite.svg', 'Accessible titles'],
      ar: ['خطي وثنائي ومصمت', 'React و Vue و Svelte و Angular و Astro و RN', 'مكوّن ويب و sprite.svg', 'عناوين سهلة الوصول'],
    },
    stat: { value: '239', label: { en: 'icons', ar: 'أيقونة' } },
    install: npm('@pelagic-ui/icons'),
    usage: {
      file: 'Toolbar.tsx',
      lang: 'tsx',
      code: `import { SearchIcon, BellIcon } from '@pelagic-ui/icons/react';

<SearchIcon />
<BellIcon variant="duotone" size={20} title="Notifications" />`,
    },
    exports: [
      { path: '@pelagic-ui/icons/react', text: { en: 'React components', ar: 'مكونات React' } },
      { path: '@pelagic-ui/icons/vue · /svelte · /angular · /astro', text: { en: 'Framework adapters', ar: 'محوّلات الأطر' } },
      { path: '@pelagic-ui/icons/react-native', text: { en: 'react-native-svg components', ar: 'مكونات react-native-svg' } },
      { path: '@pelagic-ui/icons/element', text: { en: '<pelagic-icon> web component', ar: 'مكوّن الويب <pelagic-icon>' } },
      { path: '@pelagic-ui/icons/sprite.svg', text: { en: 'SVG sprite', ar: 'ملف SVG مجمّع' } },
      { path: '@pelagic-ui/icons/css', text: { en: 'Optional base styles', ar: 'أنماط أساسية اختيارية' } },
    ],
    peers: ['react · vue · svelte · @angular/core · astro · react-native-svg (optional)'],
    size: { packed: '85 kB', unpacked: '594 kB' },
    registryUrl: 'https://www.npmjs.com/package/@pelagic-ui/icons',
    sourceUrl: `${repo}/icons`,
  },
  {
    id: 'illustrations',
    name: '@pelagic-ui/illustrations',
    registry: 'npm',
    mark: 'illustrations',
    platform: { en: 'Every framework', ar: 'كل الأطر' },
    tagline: { en: 'Empty states that match your theme', ar: 'حالات فارغة تطابق ثيمك' },
    description: {
      en: '24 original scenes — no data, no results, offline, 404, success and more — drawn with CSS variables so they recolor with every theme and brand color.',
      ar: '24 مشهداً أصلياً — لا بيانات، لا نتائج، غير متصل، 404، نجاح وغيرها — مرسومة بمتغيرات CSS فتتلوّن مع كل ثيم ولون علامة.',
    },
    includes: {
      en: ['24 themeable scenes', 'Pairs with EmptyState', 'Web component and raw SVG', 'Zero dependencies'],
      ar: ['24 مشهداً قابلاً للتلوين', 'يتكامل مع EmptyState', 'مكوّن ويب و SVG خام', 'بلا اعتماديات'],
    },
    stat: { value: '24', label: { en: 'illustrations', ar: 'رسماً توضيحياً' } },
    install: npm('@pelagic-ui/illustrations'),
    usage: {
      file: 'Empty.tsx',
      lang: 'tsx',
      code: `import { EmptyState } from '@pelagic-ui/react';
import { NoResultsIllustration } from '@pelagic-ui/illustrations/react';

<EmptyState
  illustration={<NoResultsIllustration />}
  title="No results"
  description="Try a different search."
/>`,
    },
    exports: [
      { path: '@pelagic-ui/illustrations', text: { en: 'illustrationToSvg() and data', ar: 'illustrationToSvg() والبيانات' } },
      { path: '@pelagic-ui/illustrations/react · /vue · /svelte · /angular · /astro', text: { en: 'Framework adapters', ar: 'محوّلات الأطر' } },
      { path: '@pelagic-ui/illustrations/native', text: { en: 'React Native', ar: 'React Native' } },
      { path: '@pelagic-ui/illustrations/svg/*', text: { en: 'Raw SVG files', ar: 'ملفات SVG خام' } },
    ],
    peers: ['react · vue · svelte · @angular/core · react-native-svg (optional)'],
    size: { packed: '27 kB', unpacked: '197 kB' },
    registryUrl: 'https://www.npmjs.com/package/@pelagic-ui/illustrations',
    sourceUrl: `${repo}/illustrations`,
    docs: '/components/feedback/',
  },
  {
    id: 'core',
    name: '@pelagic-ui/core',
    registry: 'npm',
    mark: 'core',
    platform: { en: 'Framework-agnostic', ar: 'مستقلة عن الأطر' },
    tagline: { en: 'Tokens, CSS and engines', ar: 'الرموز و CSS والمحرّكات' },
    description: {
      en: 'The foundation every package shares: design tokens, the CSS for all components, 21 themes, createTheme() for brand colors, accessibility display modes, the motion engine and the sound engine.',
      ar: 'الأساس المشترك لكل الحزم: رموز التصميم، CSS لكل المكونات، 21 ثيماً، createTheme() لألوان العلامة، أوضاع العرض لإمكانية الوصول، محرّك الحركة ومحرّك الصوت.',
    },
    includes: {
      en: ['style.css (65 kB gzip)', 'createTheme() with WCAG checks', 'data-a11y-* display modes', 'Motion and sound engines'],
      ar: ['style.css ‏(65 kB مضغوطاً)', 'createTheme() مع فحوص WCAG', 'أوضاع العرض data-a11y-*', 'محرّكا الحركة والصوت'],
    },
    stat: { value: '21', label: { en: 'built-in themes', ar: 'ثيماً مدمجاً' } },
    install: npm('@pelagic-ui/core'),
    usage: {
      file: 'theme.ts',
      lang: 'ts',
      code: `import '@pelagic-ui/core/style.css';
import { applyTheme, createTheme, applyCustomTheme } from '@pelagic-ui/core/theme';
import { applyA11yPrefs } from '@pelagic-ui/core/a11y-prefs';

applyTheme({ mode: 'dark', accent: 'teal', shape: 'round' });
applyCustomTheme(createTheme({ primary: '#ff6a00' }));
applyA11yPrefs({ fontScale: 1.25, motion: 'reduce' });`,
    },
    exports: [
      { path: '@pelagic-ui/core/style.css', text: { en: 'Every component style and theme', ar: 'أنماط كل المكونات والثيمات' } },
      { path: '@pelagic-ui/core/theme', text: { en: 'applyTheme, createTheme, contrast math', ar: 'applyTheme و createTheme وحساب التباين' } },
      { path: '@pelagic-ui/core/a11y-prefs', text: { en: 'Display modes and the panel renderer', ar: 'أوضاع العرض ومولّد اللوحة' } },
      { path: '@pelagic-ui/core/motion', text: { en: 'animate, springs, timelines, FLIP', ar: 'animate والنوابض والخطوط الزمنية و FLIP' } },
      { path: '@pelagic-ui/core/sound', text: { en: '18 synthesized UI sounds', ar: '18 صوتاً مركّباً للواجهة' } },
      { path: '@pelagic-ui/core/tokens', text: { en: 'Tokens as JS / TS', ar: 'الرموز بصيغة JS / TS' } },
      { path: '@pelagic-ui/core/a11y', text: { en: 'Focus trap, ids, announcer', ar: 'حبس التركيز والمعرّفات والمُعلِن' } },
    ],
    peers: ['none'],
    size: { packed: '202 kB', unpacked: '666 kB' },
    registryUrl: 'https://www.npmjs.com/package/@pelagic-ui/core',
    sourceUrl: `${repo}/core`,
    docs: '/themes/',
  },
];

export const packageById = (id: string) => packages.find((p) => p.id === id);
