<script lang="ts">
  import Card from './ui/Card.svelte';
  import CardContent from './ui/CardContent.svelte';
  import CardHeader from './ui/CardHeader.svelte';
  import CardTitle from './ui/CardTitle.svelte';
  import type { Component } from 'svelte';

  interface Props {
    title: string;
    value: string | number;
    description: string;
    icon: Component;
    iconColor?: string;
  }

  let { title, value, description, icon: Icon, iconColor = 'text-blue-600' }: Props = $props();
</script>

<Card class="hover:border-primary/50 transition-colors">
  <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle class="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</CardTitle>
    <Icon class="h-4 w-4 {iconColor}" />
  </CardHeader>
  <CardContent>
    <div class="text-2xl font-semibold">{value}</div>
    <p class="text-xs text-muted-foreground mt-1">{description}</p>
  </CardContent>
</Card>
