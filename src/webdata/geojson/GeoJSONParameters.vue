<template>
  <span>
    <v-row no-gutters class="px-1">
      <v-col>
        <VcsLabel html-for="epsg">{{
          $t('dynamicLayer.parameters.epsg')
        }}</VcsLabel>
      </v-col>
      <v-col>
        <VcsTextField id="epsg" v-model="parameters.epsg" clearable />
      </v-col>
    </v-row>

    <v-row no-gutters class="px-1">
      <v-col>
        <VcsLabel html-for="proj4">{{
          $t('dynamicLayer.parameters.proj4')
        }}</VcsLabel>
      </v-col>
      <v-col>
        <VcsTextField id="proj4" v-model="parameters.proj4" clearable />
      </v-col>
    </v-row>
  </span>
</template>

<script lang="ts">
  import type { PropType } from 'vue';
  import { defineComponent, inject, ref, toRaw, watch } from 'vue';
  import { VCol, VRow } from 'vuetify/components';
  import { VcsLabel, VcsTextField, type VcsUiApp } from '@vcmap/ui';
  import type { GeoJSONLayer } from '@vcmap/core';
  import { Projection } from '@vcmap/core';
  import type { DataItem, WebdataTypes } from '../webdataConstants.js';

  export default defineComponent({
    name: 'GeoJSONParameters',
    components: {
      VCol,
      VRow,
      VcsLabel,
      VcsTextField,
    },
    props: {
      item: {
        type: Object as PropType<DataItem<WebdataTypes.GEOJSON>>,
        required: true,
      },
    },
    emits: ['parametersEdited'],
    setup(props, { emit }) {
      const app = inject('vcsApp') as VcsUiApp;
      const layer = app.layers.getByKey(props.item.name) as GeoJSONLayer;

      const parameters = ref({
        ...layer.toJSON(),
        epsg: layer.projection.epsg,
        proj4: layer.projection.proj4,
      });
      const initialParameters = ref(structuredClone(toRaw(parameters.value)));

      watch(
        parameters,
        (): void => {
          emit('parametersEdited');
        },
        { deep: true },
      );
      return {
        parameters,
        cancel(): void {
          parameters.value = structuredClone(toRaw(initialParameters.value));
        },
        apply(): void {
          if (
            layer.projection.epsg !== parameters.value.epsg ||
            layer.projection.proj4 !== parameters.value.proj4
          ) {
            layer.projection = new Projection({
              epsg: parameters.value.epsg,
              proj4: parameters.value.proj4,
            });
          }
          initialParameters.value = structuredClone(toRaw(parameters.value));
        },
      };
    },
  });
</script>
<style lang="scss" scoped></style>
