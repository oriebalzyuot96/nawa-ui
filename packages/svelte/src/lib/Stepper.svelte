<script lang="ts">
  interface Step {
    label: string;
    description?: string;
  }

  /** `current` is the zero-based index of the active step. */
  let { steps, current = 0 }: { steps: Step[]; current?: number } = $props();
</script>

<ol class="pl-stepper">
  {#each steps as s, i (i)}
    {@const state = i < current ? 'complete' : i === current ? 'current' : 'upcoming'}
    <li class="pl-stepper__step" data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
      <span>{s.label}</span>
      {#if s.description}<span class="pl-stepper__desc">{s.description}</span>{/if}
    </li>
  {/each}
</ol>
