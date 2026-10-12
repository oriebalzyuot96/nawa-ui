<script lang="ts">
  import Input from '../../src/lib/Input.svelte';
  import Textarea from '../../src/lib/Textarea.svelte';
  import Select from '../../src/lib/Select.svelte';
  let { error, hint }: { error?: string; hint?: string } = $props();
  let name = $state('Ada');
  let bio = $state('');
  let fruit = $state('');
</script>

<Input label="Name" {hint} {error} bind:value={name} />
<Textarea label="Bio" bind:value={bio} />
<Select label="Fruit" placeholder="Pick one" options={[{ label: 'Apple', value: 'apple' }, { label: 'Pear', value: 'pear', disabled: true }]} bind:value={fruit} />
<output data-testid="name">{name}</output>
<output data-testid="bio">{bio}</output>
<output data-testid="fruit">{fruit}</output>
<button type="button" onclick={() => (name = 'Grace')}>reset</button>
