<script setup lang="ts">
  import { createEllipseTooltip } from '@vcmap/ui';
  import { computed, ref } from 'vue';
  import { VTooltip } from 'vuetify/components';

  const props = defineProps({
    title: {
      type: String,
      required: true,
    },
    active: {
      type: Boolean,
      default: false,
    },
  });

  const titleParent = ref();

  const tooltip = createEllipseTooltip(
    computed(() => titleParent.value as HTMLElement),
    computed(() => ''),
    computed(() => props.title),
  );
</script>
<template>
  <div
    ref="titleParent"
    class="title-parent pr-2 vcs-treeview-title w-100"
    :class="{ active: active }"
  >
    <span>{{ title }}</span>
    <v-tooltip v-if="tooltip" activator="parent">
      {{ tooltip }}
    </v-tooltip>
  </div>
</template>
<style lang="scss" scoped>
  .title-parent {
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
  }
  .active {
    color: rgb(var(--v-theme-primary));
  }
</style>
