<template>
  <v-sheet>
    <v-tabs v-model="selectedType" height="32">
      <v-tab :href="`#${CategoryType.WEBDATA}`">{{
        $t('dynamicLayer.webdata.title')
      }}</v-tab>
      <v-tab :href="`#${CategoryType.CATALOGUE}`">{{
        $t('dynamicLayer.catalogues.title')
      }}</v-tab>
      <v-tab :href="`#${CategoryType.MYDATA}`">{{
        $t('dynamicLayer.mydata.title')
      }}</v-tab>
      <v-tab :href="`#${CategoryType.ADDED}`">{{
        $t('dynamicLayer.added.title')
      }}</v-tab>
    </v-tabs>
    <v-divider />
    <v-container class="d-flex flex-column flex-nowrap pa-0">
      <Webdata
        v-if="selectedType === CategoryType.WEBDATA"
        @switchTo="switchToTab"
      />
      <Catalogues
        v-else-if="selectedType === CategoryType.CATALOGUE"
        @switchTo="switchToTab"
      />
      <AddedData
        v-else-if="selectedType === CategoryType.ADDED"
        @switchTo="switchToTab"
      />
    </v-container>
  </v-sheet>
</template>

<script lang="ts">
  import { defineComponent, inject, ref } from 'vue';
  import { VTab, VTabs, VContainer, VSheet, VDivider } from 'vuetify/lib';
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
  :deep(.v-tab) {
    font-size: 1rem;
  }
</style>
