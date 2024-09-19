<template>
  <v-row no-gutters class="h-100">
    <v-col cols="4" class="h-100">
      <v-row no-gutters>
        <v-col cols="10">
          <VcsTreeviewSearchbar v-model="search" />
        </v-col>
        <v-col
          cols="2"
          class="bg-base-lighten-3 d-flex align-center justify-end pr-2 gc-2"
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
        class="treeview"
        :items="filterActive ? filter(added) : added"
        v-model:activated="arraySelected"
        v-model:opened="opened"
        :search="search"
        active-strategy="single-independent"
        color="primary"
        height="486px"
        activatable
        mandatory
        return-object
      />
    </v-col>
    <v-divider vertical />
    <v-col cols="8" class="px-1" style="height: 530px">
      <component
        v-if="selected"
        :is="getComponentName()"
        :item="selected"
        @switchTo="$emit('switchTo', $event)"
      />

      <v-row no-gutters v-else class="h-75">
        <v-col cols="8" offset="2" class="d-flex align-center">
          <v-card flat class="w-100">
            <v-card-title
              class="font-weight-bold d-flex justify-center text-decoration-underline"
              >{{ $t('dynamicLayer.webdata.add.title') }}
            </v-card-title>
            <v-row no-gutters class="w-100 pt-3">
              <VcsLabel html-for="type">{{
                $t('dynamicLayer.webdata.add.type')
              }}</VcsLabel>
            </v-row>
            <v-row no-gutters class="w-100">
              <VcsSelect
                id="type"
                v-model="newSourceType"
                :items="availableTypes"
              />
            </v-row>
            <v-row no-gutters class="w-100 pt-3">
              <VcsLabel html-for="url">{{
                $t('dynamicLayer.webdata.add.url')
              }}</VcsLabel>
            </v-row>
            <v-row no-gutters class="w-100">
              <VcsTextField
                id="url"
                placeholder="URL"
                v-model="newSourceUrl"
                @keyup.enter="addSource"
              />
            </v-row>
            <span class="d-flex justify-end pt-3">
              <VcsFormButton
                variant="filled"
                :loading="isNewSourceLoading"
                :disabled="
                  !newSourceType || !newSourceUrl || isNewSourceLoading
                "
                @click="addSource"
                >{{ $t('dynamicLayer.webdata.add.add') }}
              </VcsFormButton>
            </span>
          </v-card>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script lang="ts">
  import { computed, defineComponent, inject, ref, shallowRef } from 'vue';
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
  import {
    VCard,
    VCardTitle,
    VCol,
    VDivider,
    VIcon,
    VRow,
  } from 'vuetify/components';
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
      VIcon,
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
      const availableTypes = shallowRef(
        getAvailableWebdataTypes(CategoryType.WEBDATA),
      );
      const newSourceType = ref(plugin.config.webdataDefaultType);
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
            const parsedUrl = parseUrl(newSourceType.value, newSourceUrl.value);
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
              newSourceType.value,
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
  .treeview {
    :deep(.v-list-item) {
      padding-inline-end: 8px;
    }
    :deep(.v-spacer) {
      display: none !important;
    }
  }
</style>
