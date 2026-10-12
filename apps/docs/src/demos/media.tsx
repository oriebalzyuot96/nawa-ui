import { useState } from 'react';
import {
  Avatar,
  Badge,
  Carousel,
  Chip,
  FileUpload,
  Galleria,
  Image,
  ImageCompare,
  MeterGroup,
  Tag,
  Terminal,
  type GalleriaItem,
} from '@nawa-ui/react';
import { createDemoIsland, Output, scene } from './shared';

const places = [
  { name: 'Petra', hue: 18, variant: 1, price: 'from $420' },
  { name: 'Wadi Rum', hue: 28, variant: 0, price: 'from $380' },
  { name: 'Aqaba', hue: 195, variant: 2, price: 'from $310' },
  { name: 'Dead Sea', hue: 205, variant: 2, price: 'from $290' },
  { name: 'Jerash', hue: 40, variant: 1, price: 'from $260' },
  { name: 'Ajloun', hue: 120, variant: 0, price: 'from $240' },
];

function CarouselDemo() {
  return (
    <Carousel
      label="Featured trips"
      items={places}
      numVisible={3}
      numScroll={1}
      circular
      autoplayInterval={5000}
      responsiveOptions={[
        { breakpoint: '1024px', numVisible: 2 },
        { breakpoint: '640px', numVisible: 1 },
      ]}
      getKey={(p) => p.name}
      itemTemplate={(p) => (
        <figure style={{ margin: '0.25rem', border: '1px solid var(--nw-border)', borderRadius: 'var(--nw-radius-lg)', overflow: 'hidden', background: 'var(--nw-surface)' }}>
          <img src={scene(p.name, p.hue, p.variant)} alt={`Landscape illustration of ${p.name}`} style={{ display: 'block', width: '100%', aspectRatio: '3 / 2', objectFit: 'cover' }} />
          <figcaption style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.75rem' }}>
            <strong>{p.name}</strong>
            <span className="muted">{p.price}</span>
          </figcaption>
        </figure>
      )}
    />
  );
}

const photos: GalleriaItem[] = places.map((p) => ({
  src: scene(p.name, p.hue, p.variant),
  thumbnailSrc: scene(p.name, p.hue, p.variant),
  alt: `Illustration of ${p.name}`,
  caption: (
    <>
      <strong>{p.name}</strong> — Jordan
    </>
  ),
}));

function GalleriaDemo() {
  const [index, setIndex] = useState(0);
  return (
    <div className="demo-col" style={{ maxWidth: '40rem' }}>
      <Galleria label="Trip photos" items={photos} activeIndex={index} onActiveIndexChange={setIndex} showThumbnails showCaptions fullScreen circular />
      <Output label="Showing">{`${index + 1} of ${photos.length}`}</Output>
    </div>
  );
}

function ImageDemo() {
  return (
    <>
      <Image src={scene('Petra', 18, 1)} alt="Illustration of Petra at sunset" width={240} preview />
      <Image src={scene('Aqaba', 195, 2)} alt="Illustration of the Aqaba coast" width={240} preview />
      <p className="muted" style={{ margin: 0 }}>Click an image (or focus it and press Enter) to preview, zoom and rotate.</p>
    </>
  );
}

function CompareDemo() {
  const [v, setV] = useState(50);
  return (
    <div className="demo-col" style={{ maxWidth: '36rem' }}>
      <ImageCompare
        label="Before and after colour grading"
        value={v}
        onChange={setV}
        before={{ src: scene('Before', 210, 0), alt: 'Original, cool-toned photo' }}
        after={{ src: scene('After', 25, 0), alt: 'Warm, colour-graded photo' }}
      />
      <Output label="Divider">{`${Math.round(v)}%`}</Output>
    </div>
  );
}

function AvatarDemo() {
  return (
    <>
      <Avatar name="Lina Haddad" size="sm" />
      <Avatar name="Omar Saleh" />
      <Avatar name="Sara Nasser" size="lg" />
      <Avatar name="Yousef Karim" src={scene('', 260, 2)} size="lg" />
    </>
  );
}

function BadgeDemo() {
  return (
    <>
      <Badge>Neutral</Badge>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="success">Active</Badge>
      <Badge variant="warning">Pending</Badge>
      <Badge variant="danger">Overdue</Badge>
      <Badge variant="info">Beta</Badge>
    </>
  );
}

function TagDemo() {
  const [tags, setTags] = useState(['Design system', 'Accessibility', 'RTL', 'Charts']);
  return (
    <>
      {tags.map((t) => (
        <Tag key={t} removable onRemove={() => setTags((list) => list.filter((x) => x !== t))}>
          {t}
        </Tag>
      ))}
      {tags.length === 0 && (
        <button type="button" className="nw-btn nw-btn--secondary nw-btn--sm" onClick={() => setTags(['Design system', 'Accessibility', 'RTL', 'Charts'])}>
          Reset tags
        </button>
      )}
    </>
  );
}

function ChipDemo() {
  const [people, setPeople] = useState(['Lina Haddad', 'Omar Saleh', 'Sara Nasser']);
  return (
    <>
      {people.map((p, i) => (
        <Chip key={p} label={p} image={scene('', 200 + i * 50, i)} imageAlt="" removable removeLabel={`Remove ${p}`} onRemove={() => setPeople((l) => l.filter((x) => x !== p))} />
      ))}
      <Chip label="Amman" icon="📍" />
      <Chip label="Remote OK" icon="🏠" />
    </>
  );
}

function MeterDemo() {
  return (
    <div className="demo-col">
      <MeterGroup
        label="Storage used"
        max={256}
        formatValue={(v) => `${v} GB`}
        value={[
          { label: 'Apps', value: 64, color: 'primary' },
          { label: 'Photos', value: 48, color: 'success' },
          { label: 'Messages', value: 22, color: 'info' },
          { label: 'System', value: 30, color: 'warning' },
        ]}
      />
    </div>
  );
}

function UploadDemo() {
  const [log, setLog] = useState('No uploads yet');
  return (
    <div className="demo-col">
      <FileUpload
        label="Attachments"
        multiple
        accept="image/*,.pdf,.txt"
        maxFileSize={2_000_000}
        fileLimit={5}
        onError={(errs) => setLog(errs.join(' · '))}
        onUpload={async (files, { onProgress }) => {
          // Simulated upload — nothing leaves your browser.
          for (const f of files) {
            for (let p = 0; p <= 100; p += 20) {
              await new Promise((r) => window.setTimeout(r, 120));
              onProgress(f, p);
            }
          }
          setLog(`Uploaded ${files.length} file(s) (simulated)`);
        }}
      />
      <FileUpload mode="basic" label="Avatar" accept="image/*" chooseLabel="Choose avatar" onSelect={(f) => setLog(`Selected ${f.map((x) => x.name).join(', ')}`)} />
      <Output label="Status">{log}</Output>
    </div>
  );
}

const commands: Record<string, string> = {
  help: 'Commands: help, date, whoami, components, theme',
  whoami: 'guest@nawa-ui',
  components: 'Forms, Advanced inputs, Data, Panels, Overlays, Menus, Media, Feedback, Charts, 3D',
  theme: 'Use the Mode / Accent / Shape menus in the header.',
};

function TerminalDemo() {
  return (
    <div className="demo-col">
      <Terminal
        label="Demo shell"
        prompt="nawa $"
        welcomeMessage="Welcome to the Nawa UI demo shell. Type help and press Enter."
        onCommand={(cmd) => {
          const c = cmd.trim().toLowerCase();
          if (c === 'date') return new Date().toString();
          return commands[c] ?? `Unknown command: ${cmd}`;
        }}
      />
    </div>
  );
}

export default createDemoIsland(
  {
    carousel: CarouselDemo,
    galleria: GalleriaDemo,
    image: ImageDemo,
    imagecompare: CompareDemo,
    avatar: AvatarDemo,
    badge: BadgeDemo,
    tag: TagDemo,
    chip: ChipDemo,
    metergroup: MeterDemo,
    fileupload: UploadDemo,
    terminal: TerminalDemo,
  },
  ['carousel', 'galleria', 'imagecompare', 'metergroup', 'fileupload', 'terminal'],
);
