<script lang="ts">
  let { class: className = '' }: { class?: string } = $props();
</script>

<div class="bg-muted animate-skeleton rounded-md {className}"></div>
