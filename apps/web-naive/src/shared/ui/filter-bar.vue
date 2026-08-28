<template>
  <section class="filter-bar">
    <div class="filter-bar__fields">
      <slot></slot>
    </div>
    <div v-if="$slots.actions" class="filter-bar__actions">
      <slot name="actions"></slot>
    </div>
  </section>
</template>

<style scoped>
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
}

.filter-bar__fields,
.filter-bar__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

@media (max-width: 639px) {
  .filter-bar,
  .filter-bar__fields,
  .filter-bar__actions {
    width: 100%;
  }

  .filter-bar__actions :deep(.n-button) {
    flex: 1;
  }
}
</style>
