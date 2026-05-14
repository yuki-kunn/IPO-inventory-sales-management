<script lang="ts">
  import type { Snippet } from 'svelte';
  let { title, description, actions }: {
    title: string;
    description?: string;
    actions?: Snippet;
  } = $props();
</script>

<div class="border-border flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between sm:pb-6">
  <div>
    <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
    {#if description}
      <p class="text-muted-foreground mt-1 text-xs sm:text-sm">{description}</p>
    {/if}
  </div>
  {#if actions}
    <div class="flex items-center gap-2 flex-wrap">
      {@render actions()}
    </div>
  {/if}
</div>
