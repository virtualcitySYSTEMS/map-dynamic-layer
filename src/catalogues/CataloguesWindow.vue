<template>
  <v-container class="h-100 pa-0">
    <!-- OVERVIEW -->
    <v-row
      v-if="!selectedCatalogue"
      no-gutters
      class="w-100 overflow-y-auto px-1"
    >
      <v-col
        v-for="catalogue in added"
        :key="catalogue.url"
        class="v-col-6 pa-1 d-flex flex-column"
      >
        <v-card variant="outlined" rounded class="flex-grow-1">
          <template #append>
            <img
              :src="getLogo(catalogue)"
              style="height: calc(2 * var(--v-vcs-font-size))"
            />
          </template>
          <template #title>
            <span class="d-flex align-start font-weight-black">
              {{ $t(catalogue.title) }}
            </span>
          </template>
          <template #subtitle>
            <span class="text-wrap max-3-lines">
              {{
                $t(
                  catalogue.subtitle ?? 'dynamicLayer.catalogues.noDescription',
                )
              }}
            </span>
          </template>
          <v-card-text class="details py-2">
            <v-row no-gutters class="d-flex align-center">
              <v-col>
                {{ catalogue.data.count.toLocaleString(locale) }}
                {{ $t('dynamicLayer.catalogues.datasets') }}
              </v-col>
              <v-col>
                <span class="d-flex justify-end gc-1">
                  <VcsFormButton
                    variant="filled"
                    @click="selectedCatalogue = catalogue"
                  >
                    {{ $t('dynamicLayer.actions.open') }}
                  </VcsFormButton>
                </span>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- CATALOGUE -->
    <DynamicColumns v-else :left-cols="5">
      <template #left>
        <DatasetsList
          :key="selectedCatalogue.url"
          v-model="selectedDataset"
          :source="selectedCatalogue"
        />
      </template>
      <template #right>
        <DatasetDetails
          v-if="selectedDataset"
          :key="selectedDataset.id"
          :dataset="selectedDataset"
          :show-description="showDatasetDescription"
          @toggle-description="showDatasetDescription = !showDatasetDescription"
        />
        <VcsMarkdown
          v-else
          class="pa-1 max-height overflow-y-auto"
          :content="
            selectedCatalogue.description
              ? $t(selectedCatalogue.description)
              : $t('dynamicLayer.catalogues.defaultMarkdownDescription')
          "
        />
      </template>
    </DynamicColumns>
  </v-container>
</template>

<script lang="ts">
  import { defineComponent, inject, ref, watch } from 'vue';
  import { VcsFormButton, VcsMarkdown, type VcsUiApp } from '@vcmap/ui';
  import { VCard, VCardText, VCol, VContainer, VRow } from 'vuetify/components';
  import { name } from '../../package.json';
  import type { DynamicLayerPlugin } from '../index.js';
  import { CategoryType } from '../constants.js';
  import DynamicColumns from '../DynamicColumns.vue';
  import type { CatalogueItem } from './catalogues.js';
  import { CataloguesTypes, getCatalogueIcon } from './catalogues.js';
  import DatasetsList from './DatasetsList.vue';
  import DatasetDetails from './DatasetDetails.vue';

  export default defineComponent({
    name: 'CataloguesWindow',
    components: {
      VCard,
      VCardText,
      VCol,
      VContainer,
      VRow,
      VcsFormButton,
      VcsMarkdown,
      DynamicColumns,
      DatasetsList,
      DatasetDetails,
    },
    setup() {
      const app = inject('vcsApp') as VcsUiApp;
      const plugin = app.plugins.getByKey(name) as DynamicLayerPlugin;
      const {
        added,
        selected: selectedCatalogue,
        selectedDataset,
      } = plugin.catalogues;
      if (added.value.length === 1) {
        selectedCatalogue.value = added.value[0];
      }

      const showDatasetDescription = ref(true);

      watch(selectedCatalogue, () => {
        selectedDataset.value = undefined;
        plugin.leftPanelActive[CategoryType.CATALOGUES] = true;
      });

      return {
        CataloguesTypes,
        locale: app.locale,
        added,
        selectedCatalogue,
        selectedDataset,
        showDatasetDescription,
        getLogo(catalogue: CatalogueItem): string {
          return catalogue.logo ?? getCatalogueIcon(app, catalogue.type);
        },
      };
    },
  });
</script>
<style lang="scss" scoped>
  .max-height {
    height: 530px;
  }
  .details {
    background-color: rgb(var(--v-theme-on-surface-variant));
  }
  .max-3-lines {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    height: 100%;
  }
  :deep(.v-card) > .v-card-item {
    height: calc(100% - 48px);
    align-content: start;
  }
</style>
