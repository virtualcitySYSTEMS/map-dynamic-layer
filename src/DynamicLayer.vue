<template>
  <v-sheet>
    <v-tabs color="primary" v-model="selectedType" height="32">
      <span v-for="type in CategoryType" :key="type">
        <v-tab :value="type">
          {{ $t(`dynamicLayer.${type}.title`) }}
        </v-tab>
      </span>
    </v-tabs>
    <v-divider />
    <v-container class="d-block flex-column pa-0 dl-content">
      <v-tabs-window v-model="selectedType" class="h-100">
        <v-tabs-window-item :value="CategoryType.WEBDATA" class="h-100">
          <Webdata @switchTo="switchToTab" />
        </v-tabs-window-item>
        <v-tabs-window-item :value="CategoryType.CATALOGUES" class="h-100">
          <Catalogues @switchTo="switchToTab" />
        </v-tabs-window-item>
        <v-tabs-window-item :value="CategoryType.ADDED" class="h-100">
          <AddedData @switchTo="switchToTab" :key="selectedType" />
        </v-tabs-window-item>
      </v-tabs-window>
    </v-container>
  </v-sheet>
</template>

<script lang="ts">
  import { defineComponent, inject, ref } from 'vue';
  import {
    VTab,
    VTabs,
    VTabsWindow,
    VTabsWindowItem,
    VContainer,
    VSheet,
    VDivider,
  } from 'vuetify/components';
  import { VcsUiApp } from '@vcmap/ui';
  import { DynamicLayerPlugin } from 'src';
  import { CategoryType } from '../src/constants.js';
  import Webdata from './webdata/Webdata.vue';
  import Catalogues from './catalogues/Catalogues.vue';
  import AddedData from './AddedData.vue';
  import { name } from '../package.json';

  export const dynamicLayerId = 'dynamic_layer_window_id';

  export default defineComponent({
    name: 'DynamicLayer',
    components: {
      VContainer,
      VDivider,
      VSheet,
      VTab,
      VTabs,
      VTabsWindow,
      VTabsWindowItem,
      AddedData,
      Catalogues,
      Webdata,
    },
    setup() {
      const app = inject('vcsApp') as VcsUiApp;
      const plugin = app.plugins.getByKey(name) as DynamicLayerPlugin;
      const { state } = plugin;
      const selectedType = ref(plugin.config.defaultTab);

      return {
        CategoryType,
        state,
        selectedType,
        switchToTab(tab: CategoryType): void {
          selectedType.value = tab;
        },
      };
    },
  });
</script>
<style lang="scss" scoped>
  .dl-content {
    height: calc(562px - calc(var(--v-vcs-font-size) * 2 + 6));
  }
</style>
