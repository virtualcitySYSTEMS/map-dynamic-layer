<template>
  <v-container class="pa-0">
    <v-row no-gutters class="base lighten-3">
      <VcsButton
        icon="mdi-home"
        class="d-flex align-center px-1"
        tooltip="dynamicLayer.catalogues.overview"
        :active="breadcrumbs.length === 1"
      />
      <!-- @click="" -->
      <v-breadcrumbs class="py-1 px-0" :items="breadcrumbs"></v-breadcrumbs>
      <v-spacer />
      <VcsButton
        icon="mdi-plus"
        class="d-flex align-center px-1"
        tooltip="dynamicLayer.catalogues.addCatalogue"
        :active="breadcrumbs.length === 1"
      />
      <!-- @click="" -->
    </v-row>
    <v-divider />
    <v-container class="pa-0" style="height: 502px; overflow-y: auto">
      <!-- <CataloguesOverview /> -->
    </v-container>
  </v-container>
</template>

<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import {
    VcsButton,
    // VcsFormButton,
    // VcsTreeview,
    // VcsTreeviewSearchbar,
  } from '@vcmap/ui';
  import {
    VBreadcrumbs,
    // VCard,
    // VCardText,
    // VCol,
    VContainer,
    VDivider,
    VRow,
    VSpacer,
  } from 'vuetify/lib';
  // import CataloguesOverview from './CataloguesOverview.vue';
  //   import { name } from '../../package.json';

  export default defineComponent({
    name: 'Catalogues',
    components: {
      VBreadcrumbs,
      // VCard,
      // VCardText,
      // VCol,
      VContainer,
      VDivider,
      VRow,
      VSpacer,
      VcsButton,
      // VcsFormButton,
      // VcsTreeview,
      // VcsTreeviewSearchbar,

      // CataloguesOverview,
    },
    setup() {
      //   const app = inject<VcsUiApp>('vcsApp')!;
      //   const plugin = app.plugins.getByKey(name) as DynamicLayerPlugin;
      // const { added, selected, opened } = plugin.catalogues;
      const breadcrumbs = ref([{ text: 'Catalogues' }]);
      const search = ref('');
      const filterActive = ref(false);
      return {
        filterActive,
        search,
        breadcrumbs,
      };
    },
  });
</script>
<style lang="scss" scoped></style>
