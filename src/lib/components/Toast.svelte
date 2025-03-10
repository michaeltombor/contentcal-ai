<!-- src/lib/components/Toast.svelte -->
<script lang="ts">
  import { toast } from '$lib/stores/toastStore';
  import { fly } from 'svelte/transition';
</script>

<div class="toast-container">
  {#each $toast as t (t.id)}
    <div
      class="toast-item {t.type}"
      transition:fly={{ x: 100, duration: 300 }}
    >
      <div class="toast-content">
        <span>{t.message}</span>
      </div>
      <button class="toast-close" on:click={() => toast.remove(t.id)}>×</button>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    top: 1rem;
    right: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    z-index: 9999;
    max-width: 320px;
  }

  .toast-item {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    border-radius: 0.25rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    color: white;
  }

  .toast-item.success {
    background-color: #10b981;
  }

  .toast-item.error {
    background-color: #ef4444;
  }

  .toast-item.info {
    background-color: #3b82f6;
  }

  .toast-item.warning {
    background-color: #f59e0b;
  }

  .toast-content {
    flex: 1;
  }

  .toast-close {
    background: none;
    border: none;
    color: white;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0;
    margin-left: 0.5rem;
    opacity: 0.7;
  }

  .toast-close:hover {
    opacity: 1;
  }
</style>