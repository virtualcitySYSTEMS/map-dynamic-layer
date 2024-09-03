<template>
  <WebdataInformations
    :item="item"
    :subtitle="`${item.url}/layer.json`"
    @switchTo="(c) => $emit('switchTo', c)"
  >
    <template #informations>
      <v-row no-gutters>
        {{ $t('dynamicLayer.info.noInfoTerrain') }}
      </v-row>
    </template>
  </WebdataInformations>
</template>

<script lang="ts">
  import { PropType, defineComponent } from 'vue';
  import { VRow } from 'vuetify/components';
  import { DataItem, WebdataTypes } from '../webdataConstants.js';
  import WebdataInformations from '../WebdataInformations.vue';

  export default defineComponent({
    name: 'TerrainInformations',
    components: {
      VRow,
      WebdataInformations,
    },
    props: {
      item: {
        type: Object as PropType<DataItem<WebdataTypes.TERRAIN>>,
        required: true,
      },
    },
    setup() {
      return {};
    },
  });
</script>
<style lang="scss" scoped></style>
