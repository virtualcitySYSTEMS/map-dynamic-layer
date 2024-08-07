<template>
  <v-row no-gutters>
    <v-col cols="4">
      <v-row no-gutters>
        <v-col cols="10">
          <VcsTreeviewSearchbar v-model="search" />
        </v-col>
        <v-col
          cols="2"
          class="base lighten-3 d-flex align-center justify-end pr-3 gap-2"
        >
          <VcsButton
            icon="mdi-filter"
            tooltip="dynamicLayer.actions.filter"
            :active="filterActive"
            @click="filterActive = !filterActive"
          />
          <VcsButton
            icon="$vcsPlus"
            tooltip="dynamicLayer.actions.addSource"
            :active="!selected"
            @click="selected = undefined"
          />
        </v-col>
      </v-row>
      <VcsTreeview
        class="d-block"
        style="height: 486px; overflow-y: auto"
        :items="filterActive ? filter(added) : added"
        item-key="name"
        item-text="title"
        :active.sync="arraySelected"
        :open="opened"
        :search="search"
        activatable
        hoverable
        return-object
        dense
      />
    </v-col>
    <v-divider vertical />
    <v-col cols="8" class="px-1">
      <component
        v-if="selected"
        :is="getComponentName()"
        :item="selected"
        @switchTo="$emit('switchTo', $event)"
      />

      <v-row no-gutters v-else>
        <v-col cols="8" offset="2" class="pt-4">
          <v-card flat>
            <v-card-title
              class="font-weight-bold justify-center text-decoration-underline"
              >{{ $t('dynamicLayer.webdata.add.title') }}
            </v-card-title>
            <v-row no-gutters>
              <v-col cols="12">
                <VcsLabel>{{ $t('dynamicLayer.webdata.add.type') }}</VcsLabel>
              </v-col>
              <v-col cols="12">
                <VcsSelect
                  v-model="newSourceType"
                  :items="availableTypes"
                  return-object
              /></v-col>
            </v-row>
            <v-row no-gutters class="py-3">
              <v-col cols="12">
                <VcsLabel>{{ $t('dynamicLayer.webdata.add.url') }}</VcsLabel>
              </v-col>
              <v-col cols="12">
                <VcsTextField
                  placeholder="URL"
                  v-model="newSourceUrl"
                  @keyup.enter="addSource"
                ></VcsTextField>
              </v-col>
            </v-row>
            <div class="d-flex gap-2 w-100 justify-end pt-1 pr-1">
              <VcsFormButton
                variant="filled"
                :loading="isNewSourceLoading"
                :disabled="
                  !newSourceType || !newSourceUrl || isNewSourceLoading
                "
                @click="addSource"
                >{{ $t('dynamicLayer.webdata.add.add') }}
              </VcsFormButton>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script lang="ts">
  import { computed, defineComponent, inject, ref } from 'vue';
  import {
    NotificationType,
    VcsButton,
    VcsFormButton,
    VcsLabel,
    VcsSelect,
    VcsTextField,
    VcsTreeview,
    VcsTreeviewSearchbar,
    VcsUiApp,
  } from '@vcmap/ui';
  import { VCard, VCardTitle, VCol, VDivider, VRow } from 'vuetify/lib';
  import { fetchSource } from './webdataApi.js';
  import { DynamicLayerPlugin } from '../index.js';
  import { CategoryType } from '../constants.js';
  import { filterItemChildren, parseUrl } from './webdataHelper.js';
  import { getAvailableWebdataTypes } from '../helper.js';
  import { DataItem, WebdataTypes } from './webdataConstants.js';
  import { name } from '../../package.json';
  import WmsInformations from './wms/WmsInformations.vue';
  import CesiumTilesetInformations from './cesiumTileset/CesiumTilesetInformations.vue';
  import TerrainInformations from './terrain/TerrainInformations.vue';

  export default defineComponent({
    name: 'Webdata',
    components: {
      VCard,
      VCardTitle,
      VCol,
      VDivider,
      VRow,
      VcsButton,
      VcsFormButton,
      VcsLabel,
      VcsSelect,
      VcsTextField,
      VcsTreeview,
      VcsTreeviewSearchbar,
      CesiumTilesetInformations,
      TerrainInformations,
      WmsInformations,
    },
    setup() {
      const app = inject<VcsUiApp>('vcsApp')!;
      const plugin = app.plugins.getByKey(name) as DynamicLayerPlugin;
      const { added, selected, opened } = plugin.webdata;
      const arraySelected = computed({
        get() {
          return [plugin.webdata.selected.value];
        },
        set(value) {
          plugin.webdata.selected.value = value[0];
        },
      });

      const search = ref('');
      const isNewSourceLoading = ref(false);
      const availableTypes = getAvailableWebdataTypes(CategoryType.WEBDATA);
      const newSourceType = ref(
        availableTypes.find(
          (t) => t.value === plugin.config.webdataDefaultType,
        )!,
      );
      const newSourceUrl = ref(plugin.config.webdataDefaultUrl);
      const filterActive = ref(false);

      return {
        newSourceType,
        newSourceUrl,
        added,
        opened,
        selected,
        arraySelected,
        search,
        filterActive,
        availableTypes,
        isNewSourceLoading,

        filter(array: Array<DataItem>): Array<DataItem> {
          return filterItemChildren(array, (i) => !!i?.isAddedToMap);
        },
        getComponentName(): string {
          switch (selected.value!.type) {
            case WebdataTypes.WMS:
              return 'WmsInformations';
            case WebdataTypes.CESIUM_TILESET:
              return 'CesiumTilesetInformations';
            case WebdataTypes.TERRAIN:
              return 'TerrainInformations';

            default:
              return '';
          }
        },

        async addSource(): Promise<void> {
          if (
            !newSourceType.value ||
            !newSourceUrl.value ||
            isNewSourceLoading.value
          ) {
            return;
          }
          filterActive.value = false;
          try {
            isNewSourceLoading.value = true;
            const parsedUrl = parseUrl(
              newSourceType.value.value,
              newSourceUrl.value,
            );
            if (added.value.some((i) => i.url === parsedUrl)) {
              app.notifier.add({
                type: NotificationType.ERROR,
                message: 'dynamicLayer.errors.urlAlreadyAdded',
              });

              isNewSourceLoading.value = false;
              return;
            }
            isNewSourceLoading.value = true;
            await fetchSource(
              app,
              newSourceUrl.value,
              newSourceType.value.value,
            ).then((item: DataItem) => {
              selected.value = item;
              opened.value = [item];
            });
          } catch (error) {
            app.notifier.add({
              type: NotificationType.ERROR,
              message: error as string,
            });
          }
          isNewSourceLoading.value = false;
        },
      };
    },
  });
</script>
<style lang="scss" scoped>
  :deep(.v-treeview-node__root) {
    padding-right: 0 !important;
    cursor: pointer;
    .col-4 {
      max-width: 64px;
      flex: 0 0 64px;
      gap: 8px;
    }
    .col-8 {
      max-width: calc(100% - 54px);
      flex: 0 0 calc(100% - 54px);
    }
  }
</style>
