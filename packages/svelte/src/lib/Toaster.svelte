<script lang="ts">
  // Notification region shared with every Pelagic package (@pelagic-ui/core/toast): spring enter and exit,
  // a deck that fans out on hover or focus, swipe to dismiss, pausing countdowns, animated icons, actions
  // and undo, a queue, polite / assertive announcements and RTL. Render once; call toast() anywhere.
  //
  //   <Toaster position="top-center" progress closeButton />
  //   toast.success('Saved', { undo: () => restore() })
  import { onDestroy, onMount } from 'svelte';
  import { mountToaster, type MountToasterOptions, type ToasterController } from '@pelagic-ui/core/toast';

  let props: Omit<MountToasterOptions, 'target' | 'store'> = $props();
  let ctl: ToasterController | null = null;

  const clean = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as MountToasterOptions;

  onMount(() => {
    ctl = mountToaster(clean({ ...props }));
  });
  onDestroy(() => ctl?.destroy());
  $effect(() => {
    const next = clean({ ...props });
    ctl?.update(next);
  });
</script>
