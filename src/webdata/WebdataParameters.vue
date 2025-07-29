<template>
  <VcsFormSection
    heading="dynamicLayer.parameters.title"
    class="h-100"
    :header-actions="headerActions"
    :help-text="hasUpdate ? $t('dynamicLayer.parameters.saveHint') : ''"
    start-help-open
    expandable
    start-open
    :action-button-list-overflow-count="3"
  >
    <div class="h-100 overflow-y-auto">
      <v-row no-gutters class="px-1">
        <v-col>
          <VcsLabel html-for="title">{{
            $t('dynamicLayer.common.title')
          }}</VcsLabel>
        </v-col>
        <v-col>
          <VcsTextField
            id="title"
            v-model="title"
            @update:model-value="titleHasUpdate = true"
          />
        </v-col>
      </v-row>
      <component
        :is="getComponentName()"
        ref="itemParameters"
        class="w-100 d-inline-block overflow-y-auto"
        :item="item"
        @rename="$emit('rename')"
        @parameters-edited="parametersHaveUpdate = true"
      />
    </div>
  </VcsFormSection>
</template>

<script lang="ts">
  import type { PropType } from 'vue';
  import { computed, defineComponent, nextTick, reactive, ref } from 'vue';
  import { VCol, VRow } from 'vuetify/components';
  import { VcsFormSection, VcsLabel, VcsTextField } from '@vcmap/ui';
  import type { DataItem } from './webdataConstants.js';
  import { WebdataTypes } from './webdataConstants.js';
  import WmsParameters from './wms/WmsParameters.vue';
  import CesiumTilesetParameters from './cesiumTileset/CesiumTilesetParameters.vue';
  import GeoJSONParameters from './geojson/GeoJSONParameters.vue';
  import TerrainParameters from './terrain/TerrainParameters.vue';
  import WfsParameters from './wfs/WfsParameters.vue';
  import WmtsParameters from './wmts/WmtsParameters.vue';
  import PointCloudParameters from './pointcloud/PointCloudParameters.vue';
  import CzmlParameters from './czml/CzmlParameters.vue';

  export default defineComponent({
    name: 'WebdataParameters',
    components: {
      VCol,
      VRow,
      VcsFormSection,
      VcsLabel,
      VcsTextField,
      CesiumTilesetParameters,
      CzmlParameters,
      GeoJSONParameters,
      PointCloudParameters,
      TerrainParameters,
      WfsParameters,
      WmsParameters,
      WmtsParameters,
    },
    props: {
      item: {
        type: Object as PropType<DataItem>,
        required: true,
      },
    },
    emits: ['rename'],
    setup(props, { emit }) {
      const show = ref(true);
      const titleHasUpdate = ref(false);
      const parametersHaveUpdate = ref(false);
      const hasUpdate = computed(
        () => titleHasUpdate.value || parametersHaveUpdate.value,
      );
      const itemParameters = ref();
      const title = ref(props.item.title);
      return {
        show,
        hasUpdate,
        itemParameters,
        parametersHaveUpdate,
        title,
        titleHasUpdate,
        headerActions: computed(() =>
          !hasUpdate.value
            ? []
            : [
                reactive({
                  icon: 'mdi-close',
                  tooltip: 'dynamicLayer.actions.cancel',
                  disabled: !hasUpdate.value,
                  callback: async (): Promise<void> => {
                    title.value = props.item.title;
                    itemParameters.value.cancel();
                    await nextTick();
                    titleHasUpdate.value = false;
                    parametersHaveUpdate.value = false;
                  },
                }),
                reactive({
                  icon: 'mdi-content-save-edit-outline',
                  tooltip: 'dynamicLayer.actions.apply',
                  disabled: !hasUpdate.value,
                  callback: (): void => {
                    if (titleHasUpdate.value) {
                      emit('rename', title.value);
                      titleHasUpdate.value = false;
                    }
                    if (parametersHaveUpdate.value) {
                      itemParameters.value.apply();
                      parametersHaveUpdate.value = false;
                    }
                  },
                }),
              ],
        ),
        getComponentName(): string {
          switch (props.item.type) {
            case WebdataTypes.CESIUM_TILESET:
              return 'CesiumTilesetParameters';
            case WebdataTypes.CZML:
              return 'CzmlParameters';
            case WebdataTypes.GEOJSON:
              return 'GeoJSONParameters';
            case WebdataTypes.POINTCLOUD:
              return 'PointCloudParameters';
            case WebdataTypes.TERRAIN:
              return 'TerrainParameters';
            case WebdataTypes.WFS:
              return 'WfsParameters';
            case WebdataTypes.WMS:
              return 'WmsParameters';
            case WebdataTypes.WMTS:
              return 'WmtsParameters';
            default:
              return '';
          }
        },
      };
    },
  });
</script>
<style lang="scss" scoped>
  :deep(.badge) {
    top: -6px;
    right: -6px;
  }
</style>
