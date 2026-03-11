<script lang="ts">
  export let color = '#3b82f6';
  export let label = '';
</script>

<span class="badge" style="background-color: {color};">
  {label}
</span>

<style>
  .badge {
    display: inline-block;
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    color: white;
    border-radius: var(--border-radius-full);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
</style>
