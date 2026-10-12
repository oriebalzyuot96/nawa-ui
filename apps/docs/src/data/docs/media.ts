import type { CategoryDoc } from './types';

export const media: CategoryDoc = {
  slug: 'media',
  nav: 'Media & display',
  icon: '🖼️',
  title: 'Media & display components — Carousel, Galleria, Image, Avatar, Badge, FileUpload',
  h1: 'Media & display',
  description:
    'Accessible media components with live demos: Carousel, Galleria, Image preview, ImageCompare, Avatar, Badge, Tag, Chip, MeterGroup, FileUpload and Terminal.',
  intro:
    'Images, galleries and small display elements. Carousels pause on hover and focus and never auto-advance under reduced motion; every image requires alt text.',
  entries: [
    {
      id: 'carousel',
      name: 'Carousel',
      description: 'Pages through items several at a time, with responsive breakpoints, indicators and optional autoplay.',
      props: [
        ['items / itemTemplate', 'T[] / (item, index) => ReactNode', 'Slides.'],
        ['label', 'string', 'Accessible name (required).'],
        ['numVisible / numScroll', 'number', 'Items per page and per step.'],
        ['responsiveOptions', '{ breakpoint, numVisible, numScroll? }[]', 'Breakpoint overrides.'],
        ['circular / autoplayInterval', 'boolean / number', 'Loop and autoplay (ms).'],
      ],
      keys: [
        ['Tab', 'Reach the previous / next buttons and indicators'],
        ['Enter / Space', 'Activate the focused control'],
      ],
      a11y: 'role="region" with aria-roledescription="carousel"; autoplay has a pause button and stops while focused or hovered.',
      code: {
        react: `<Carousel label="Featured products" items={products} numVisible={3} numScroll={1} circular
  responsiveOptions={[{ breakpoint: '768px', numVisible: 1 }]}
  itemTemplate={(p) => <ProductCard product={p} />} />`,
      },
    },
    {
      id: 'galleria',
      name: 'Galleria',
      description: 'An image gallery with thumbnails, captions and a full-screen mode.',
      props: [
        ['items', '{ src, alt, thumbnailSrc?, caption? }[]', 'Images.'],
        ['label', 'string', 'Accessible name (required).'],
        ['showThumbnails / showCaptions', 'boolean', 'UI parts.'],
        ['fullScreen', 'boolean', 'Adds a full-screen viewer.'],
        ['activeIndex / onActiveIndexChange', 'number', 'Controlled index.'],
      ],
      keys: [
        ['Arrow Left / Arrow Right', 'Previous / next image (mirrored in RTL)'],
        ['Escape', 'Leave full screen'],
      ],
      code: {
        react: `<Galleria label="Trip photos" items={photos} showThumbnails showCaptions fullScreen />`,
      },
    },
    {
      id: 'image',
      name: 'Image',
      description: 'An image with an optional zoomable, rotatable preview overlay.',
      props: [
        ['src / alt', 'string', 'Image and required alt text.'],
        ['preview', 'boolean', 'Click to open the preview.'],
        ['previewSrc', 'string', 'Higher-resolution source for the preview.'],
      ],
      keys: [
        ['Enter / Space', 'Open the preview'],
        ['Escape', 'Close the preview'],
      ],
      a11y: 'The preview is a modal dialog with a labelled toolbar (zoom, rotate, close).',
      code: {
        react: `<Image src="/photos/amman.jpg" alt="Amman citadel at sunset" width={240} preview />`,
      },
    },
    {
      id: 'imagecompare',
      name: 'ImageCompare',
      description: 'Compare two images with a draggable divider.',
      props: [
        ['before / after', '{ src, alt }', 'The two images.'],
        ['value / onChange', 'number (0–100)', 'Divider position.'],
        ['label', 'string', 'Accessible name of the slider.'],
      ],
      keys: [
        ['Arrow keys', 'Move the divider'],
        ['Home / End', 'Show only one image'],
      ],
      a11y: 'The divider is a native range input, so it works with every assistive technology.',
      code: {
        react: `<ImageCompare label="Before and after retouching"
  before={{ src: before, alt: 'Original photo' }} after={{ src: after, alt: 'Edited photo' }} />`,
      },
    },
    {
      id: 'avatar',
      name: 'Avatar',
      description: 'A user picture with initials fallback.',
      props: [
        ['name', 'string', 'Used for initials and the accessible name.'],
        ['src', 'string', 'Optional image.'],
        ['size', "'sm' | 'md' | 'lg'", 'Size.'],
      ],
      code: {
        react: `<Avatar name="Lina Haddad" />
<Avatar name="Omar Saleh" src="/omar.jpg" size="lg" />`,
        vue: `<Avatar name="Lina Haddad" />`,
        svelte: `<Avatar name="Lina Haddad" />`,
        astro: `<Avatar name="Lina Haddad" />`,
        rn: `<Avatar name="Lina Haddad" />`,
      },
    },
    {
      id: 'badge',
      name: 'Badge',
      description: 'A small status label.',
      props: [['variant', "'neutral' | 'primary' | 'info' | 'success' | 'warning' | 'danger'", 'Colour and meaning.']],
      a11y: 'Status is carried by the text, not only the colour, and every variant meets 4.5:1 contrast in all themes.',
      code: {
        react: `<Badge variant="success">Active</Badge>`,
        vue: `<Badge variant="success">Active</Badge>`,
        svelte: `<Badge variant="success">Active</Badge>`,
        astro: `<Badge variant="success">Active</Badge>`,
        rn: `<Badge variant="success">Active</Badge>`,
      },
    },
    {
      id: 'tag',
      name: 'Tag',
      description: 'A label for categorising, optionally removable.',
      props: [
        ['removable / onRemove', 'boolean / () => void', 'Adds a remove button.'],
        ['children', 'ReactNode', 'Label.'],
      ],
      keys: [['Enter / Space', 'Remove (on the remove button)']],
      code: {
        react: `<Tag removable onRemove={() => remove('design')}>Design</Tag>`,
        vue: `<Tag removable @remove="remove('design')">Design</Tag>`,
        svelte: `<Tag removable onremove={() => remove('design')}>Design</Tag>`,
        astro: `<Tag removeHref="?remove=design">Design</Tag>`,
        rn: `<Tag removable onRemove={() => remove('design')}>Design</Tag>`,
      },
    },
    {
      id: 'chip',
      name: 'Chip',
      description: 'A compact element with an image or icon, for people, filters or selections.',
      props: [
        ['label', 'string', 'Text.'],
        ['image / imageAlt', 'string', 'Leading image.'],
        ['icon', 'ReactNode', 'Leading icon.'],
        ['removable / onRemove / removeLabel', '…', 'Remove button and its name.'],
      ],
      code: {
        react: `<Chip label="Lina Haddad" image={avatar} imageAlt="" removable onRemove={drop} />
<Chip label="Amman" icon="📍" />`,
      },
    },
    {
      id: 'metergroup',
      name: 'MeterGroup',
      description: 'Several values stacked in one bar, such as storage by type.',
      props: [
        ['value', '{ label, value, color? }[]', 'Segments.'],
        ['label', 'string', 'Accessible name (required).'],
        ['min / max', 'number', 'Scale.'],
        ['showLegend / formatValue', 'boolean / fn', 'Legend and value formatting.'],
      ],
      a11y: 'A labelled group of role="meter" segments, each with its own label and aria-valuetext; segments also differ by pattern, not only colour.',
      code: {
        react: `<MeterGroup label="Storage" max={256} formatValue={(v) => v + ' GB'} value={[
  { label: 'Apps', value: 64, color: 'primary' },
  { label: 'Photos', value: 48, color: 'success' },
  { label: 'System', value: 24, color: 'warning' },
]} />`,
      },
    },
    {
      id: 'fileupload',
      name: 'FileUpload',
      description: 'Choose or drop files, validate size and type, and show upload progress.',
      props: [
        ['mode', "'basic' | 'advanced'", 'Single button or drop zone with a file list.'],
        ['accept / multiple / maxFileSize / fileLimit', '…', 'Validation.'],
        ['auto', 'boolean', 'Upload right after choosing.'],
        ['onUpload', '(files, { onProgress }) => Promise', 'Your upload; report progress per file.'],
        ['onSelect / onRemove / onError', 'callbacks', 'Lifecycle.'],
      ],
      keys: [
        ['Enter / Space', 'Open the file chooser'],
        ['Tab', 'Reach upload, cancel and per-file remove buttons'],
      ],
      a11y: 'Validation errors and upload completion are announced; drag and drop is optional, never required.',
      code: {
        react: `<FileUpload label="Attachments" multiple accept="image/*,.pdf" maxFileSize={2_000_000}
  onUpload={async (files, { onProgress }) => {
    for (const f of files) await send(f, (p) => onProgress(f, p));
  }} />`,
      },
    },
    {
      id: 'terminal',
      name: 'Terminal',
      description: 'A command-line style console that runs your command handler.',
      props: [
        ['onCommand', '(command) => ReactNode | Promise<ReactNode>', 'Returns the response.'],
        ['prompt', 'string', 'Prompt text. Default "$".'],
        ['welcomeMessage', 'ReactNode', 'First line.'],
        ['label', 'string', 'Accessible name.'],
      ],
      keys: [
        ['Enter', 'Run the command'],
        ['Arrow Up / Arrow Down', 'Command history'],
      ],
      a11y: 'Responses are added to a log region and announced; the terminal stays left-to-right even in RTL pages.',
      code: {
        react: `<Terminal label="Demo shell" welcomeMessage="Type help"
  onCommand={(cmd) => cmd === 'date' ? new Date().toString() : 'Unknown command: ' + cmd} />`,
      },
    },
  ],
};
