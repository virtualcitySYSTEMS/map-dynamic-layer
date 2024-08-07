<template>
  <v-row no-gutters style="height: 492px">
    <v-card flat style="width: 100%">
      <v-card-title
        class="d-flex text-truncate font-weight-bold justify-center text-decoration-underline pa-0"
        >{{ item.name }}
      </v-card-title>
      <v-card-subtitle class="py-2 d-flex justify-center font-italic">
        <span class="text-truncate">{{ item.url }}</span>
      </v-card-subtitle>
      <v-card-title class="base lighten-3 pa-1">
        <v-icon color="primary" class="px-2">$vcsEdit</v-icon
        >{{ $t('dynamicLayer.actions.edit') }}
      </v-card-title>
      <component
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
  } from 'vuetify/lib';
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
