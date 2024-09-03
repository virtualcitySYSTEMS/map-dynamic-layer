<template>
  <v-row no-gutters>
    <v-card flat class="w-100">
      <v-card-title
        class="d-flex text-truncate font-weight-bold justify-center text-decoration-underline pa-0"
        >{{ item.name }}
      </v-card-title>
      <v-card-subtitle class="d-flex justify-center font-italic">
        <span class="text-truncate">{{ item.url }}</span>
      </v-card-subtitle>
      <v-card-title class="bg-base-lighten-3 pa-2" style="border-radius: 4px">
        <span class="px-2"> <v-icon color="primary" icon="$vcsEdit" /> </span
        >{{ $t('dynamicLayer.actions.edit') }}
      </v-card-title>
      <component
        class="w-100 d-inline-block overflow-y-auto"
        style="height: 412px"
        :is="getComponentName()"
        :item="item"
        @rename="$emit('rename')"
      />
    </v-card>
  </v-row>
</template>

<script lang="ts">
  import { PropType, defineComponent } from 'vue';
  import {
    VCard,
    VCardTitle,
    VCardSubtitle,
    VIcon,
    VRow,
    VCol,
  } from 'vuetify/components';
  import { DataItem, WebdataTypes } from './webdataConstants.js';
  import WmsParameters from './wms/WmsParameters.vue';
  import CesiumTilesetParameters from './cesiumTileset/CesiumTilesetParameters.vue';
  import TerrainParameters from './terrain/TerrainParameters.vue';

  export default defineComponent({
    name: 'WebdataParameters',
    components: {
      VCard,
      VCardTitle,
      VCardSubtitle,
      VCol,
      VIcon,
      VRow,
      WmsParameters,
      CesiumTilesetParameters,
      TerrainParameters,
    },
    props: {
      item: {
        type: Object as PropType<DataItem>,
        required: true,
      },
    },
    setup(props) {
      return {
        getComponentName(): string {
          switch (props.item.type) {
            case WebdataTypes.WMS:
              return 'WmsParameters';
            case WebdataTypes.CESIUM_TILESET:
              return 'CesiumTilesetParameters';
            case WebdataTypes.TERRAIN:
              return 'TerrainParameters';

            default:
              return '';
          }
        },
      };
    },
  });
</script>
<style lang="scss" scoped></style>
