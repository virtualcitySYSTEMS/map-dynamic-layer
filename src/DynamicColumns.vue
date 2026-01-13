<template>
  <v-row no-gutters class="h-100">
    <v-slide-x-transition>
      <v-col
        v-show="!mdAndDown || showLeft"
        :cols="leftCols"
        class="h-100"
        :class="{ 'overlay-left': mdAndDown }"
      >
        <slot name="left" />
      </v-col>
    </v-slide-x-transition>
    <v-divider v-if="!mdAndDown || showLeft" vertical />
    <v-col :cols="!mdAndDown ? 12 - leftCols : 12" class="h-100">
      <v-fade-transition>
        <div
          v-if="mdAndDown && showLeft"
          class="right-overlay"
          @click="closeOverlay"
        />
      </v-fade-transition>
      <slot name="right" />
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
  import type { VcsUiApp } from '@vcmap/ui';
  import {
    VCol,
    VDivider,
    VFadeTransition,
    VRow,
    VSlideXTransition,
  } from 'vuetify/components';
  import { useDisplay } from 'vuetify';
  import { computed, inject } from 'vue';
  import { name } from '../package.json';
  import type { DynamicLayerPlugin } from './index.js';

  defineOptions({ name: 'DynamicColumns' });
  defineProps({
    leftCols: { type: Number, default: 4 },
  });

  const app = inject('vcsApp') as VcsUiApp;
  const plugin = app.plugins.getByKey(name) as DynamicLayerPlugin;
  const { activeTab, leftPanelActive } = plugin;
  const { mdAndDown } = useDisplay();

  const showLeft = computed(() => leftPanelActive[activeTab.value]);
  function closeOverlay(): void {
    leftPanelActive[activeTab.value] = false;
  }
</script>
<style scoped>
  .overlay-left {
    top: 0;
    left: 0;
    z-index: 10;
    position: absolute;
    max-width: 80%;
    background-color: rgb(var(--v-theme-surface));
  }

  .right-overlay {
    top: 0;
    right: 0;
    z-index: 9;
    width: 100%;
    height: 100%;
    cursor: pointer;
    position: absolute;
    background-color: rgba(
      0,
      0,
      0,
      calc(var(--v-disabled-opacity) * var(--v-disabled-opacity))
    );
  }
</style>
