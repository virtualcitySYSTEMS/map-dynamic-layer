<template>
  <DynamicColumns>
    <template #left>
      <VcsGroupedList
        v-model="localSelected"
        class="list h-100"
        :items="localItems"
        :groups="groups"
        searchable
        selectable
        open-all
      />
    </template>
    <template #right>
      <span
        v-if="!addedSelected"
        class="d-flex w-100 py-1 justify-center font-weight-bold"
      >
        {{ $t('dynamicLayer.added.selectToEdit') }}
      </span>
      <v-row v-else no-gutters class="d-flex w-100 h-100">
        <v-row no-gutters class="d-block w-100 overflow-y-auto button-margin">
          <WebdataInformations
            :item="addedSelected"
            :title="addedSelected.name"
            :subtitle="addedSelected.url"
            style="height: min-content !important"
          />
          <WebdataParameters
            :key="addedSelected.name"
            :item="addedSelected"
            style="height: min-content !important"
            @rename="rename"
          />
        </v-row>
        <v-row no-gutters class="w-100 justify-end">
          <VDivider />
          <span class="pa-2">
            <VcsFormButton @click="removeLayer(addedSelected)"
              >{{ $t('dynamicLayer.actions.layer.remove') }}
            </VcsFormButton>
          </span>
        </v-row>
      </v-row>
    </template>
  </DynamicColumns>
</template>

<script lang="ts">
  import type { VcsGroupedListItem, VcsUiApp } from '@vcmap/ui';
  import { VcsFormButton, VcsGroupedList } from '@vcmap/ui';
  import { computed, defineComponent, inject, reactive, ref, watch } from 'vue';
  import { VDivider, VRow } from 'vuetify/components';
  import { name } from '../package.json';
  import type { DynamicLayerPlugin } from './index.js';
  import { createContentTreeName } from './helper.js';
  import WebdataParameters from './webdata/WebdataParameters.vue';
  import WebdataInformations from './webdata/WebdataInformations.vue';
  import { removeLayer } from './webdata/webdataActionsHelper.js';
  import type { DataItem } from './webdata/webdataConstants.js';
  import { CategoryType } from './constants.js';
  import DynamicColumns from './DynamicColumns.vue';

  export default defineComponent({
    name: 'AddedData',
    components: {
      VDivider,
      VRow,
      VcsFormButton,
      VcsGroupedList,
      DynamicColumns,
      WebdataParameters,
      WebdataInformations,
    },
    setup() {
      const app = inject('vcsApp') as VcsUiApp;
      const plugin = app.plugins.getByKey(name) as DynamicLayerPlugin;
      const { addedSelected, addedToMap } = plugin;

      const localItems = computed(() =>
        addedToMap.value.map((item) =>
          reactive<VcsGroupedListItem>({
            name: item.name,
            title: item.title,
            group: item.type,
          }),
        ),
      );
      watch(localItems, () => {
        if (localItems.value.length === 0) {
          plugin.activeTab.value = plugin.config.defaultTab;
        } else if (localItems.value.length === 1 && !addedSelected.value) {
          addedSelected.value = addedToMap.value[0];
        }
      });

      const localSelected = ref<(VcsGroupedListItem | undefined)[]>([
        localItems.value.find(
          (item) => item.name === addedSelected.value?.name,
        ),
      ]);
      watch(localSelected, (newValue) => {
        if (newValue?.length === 1) {
          addedSelected.value = addedToMap.value.find(
            (item) => item.name === newValue[0]?.name,
          );
        } else {
          addedSelected.value = undefined;
        }
      });

      function selectWebdataItem(): void {
        if (addedSelected.value) {
          localSelected.value = [
            localItems.value.find(
              (item) => item.name === addedSelected.value!.name,
            ),
          ];
        }
      }
      selectWebdataItem();
      watch(plugin.activeTab, (newValue) => {
        if (newValue === CategoryType.ADDED) {
          selectWebdataItem();
        }
      });

      const groups = computed(() => {
        return [...new Set(addedToMap.value.map((i) => i.type))].map(
          (type) => ({
            name: type,
            title: `dynamicLayer.webdata.type.${type}`,
            headerActions: [
              reactive({
                name: 'dynamicLayer.added.actions.selectAll',
                callback: (): void => {
                  localSelected.value = localItems.value.filter(
                    (item) => item.group === String(type),
                  );
                },
              }),
              reactive({
                name: 'dynamicLayer.added.actions.clearSelection',
                disabled: computed(() => !localSelected.value.length),
                callback: (): void => {
                  localSelected.value = [];
                },
              }),
              reactive({
                name: 'dynamicLayer.added.actions.removeSelection',
                title: 'dynamicLayer.added.actions.removeSelectionTitle',
                disabled: computed(() => !localSelected.value.length),
                callback: (): void => {
                  addedToMap.value
                    .filter((i) =>
                      localSelected.value.some((s) => s?.name === i.name),
                    )
                    .forEach((item) => {
                      removeLayer(app, item);
                    });
                  localSelected.value = [];
                },
              }),
            ],
          }),
        );
      });

      return {
        groups,
        localItems,
        addedSelected,
        localSelected,
        removeLayer(toRemove: DataItem): void {
          removeLayer(app, toRemove);
          plugin.leftPanelActive[CategoryType.ADDED] = true;
        },
        rename(title: string): void {
          const layerName = addedSelected.value!.name;
          const layer = app.layers.getByKey(layerName)!;
          layer.properties.title = title;
          const contentTreeName = createContentTreeName(layerName);
          const contentTreeItem = app.contentTree.getByKey(contentTreeName)!;
          contentTreeItem.title = title;
          addedSelected.value!.title = title;
        },
      };
    },
  });
</script>
<style lang="scss" scoped>
  .list {
    :deep(.v-expansion-panels) {
      height: calc(100% - (var(--v-vcs-font-size) * 2 + 18px)) !important;
      overflow-y: auto;
      align-content: flex-start;
    }
    :deep(.v-list-item) {
      padding-left: 24px !important;
      &.v-list-item--active {
        padding-left: 20px !important;
      }
    }
    :deep(.v-spacer) {
      display: none !important;
    }
  }
  .button-margin {
    height: calc(100% - (var(--v-vcs-font-size) * 2 + 20px)) !important;
  }
</style>
