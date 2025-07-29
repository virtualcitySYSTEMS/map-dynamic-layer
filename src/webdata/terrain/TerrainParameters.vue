<template>
  <span>
    <v-row no-gutters class="px-1">
      <v-col>
        <VcsLabel html-for="requestVertexNormals">{{
          $t('dynamicLayer.parameters.requestVertexNormals')
        }}</VcsLabel>
      </v-col>
      <v-col class="d-flex align-center">
        <VcsCheckbox
          id="requestVertexNormals"
          v-model="parameters.requestVertexNormals"
        />
      </v-col>
    </v-row>
    <v-row no-gutters class="px-1">
      <v-col>
        <VcsLabel html-for="requestWaterMask">{{
          $t('dynamicLayer.parameters.requestWaterMask')
        }}</VcsLabel>
      </v-col>
      <v-col class="d-flex align-center">
        <VcsCheckbox
          id="requestWaterMask"
          v-model="parameters.requestWaterMask"
        />
      </v-col>
    </v-row>
  </span>
</template>

<script lang="ts">
  import type { PropType } from 'vue';
  import { defineComponent, inject, ref, toRaw, watch } from 'vue';
  import { VCol, VRow } from 'vuetify/components';
  import { VcsCheckbox, VcsLabel, type VcsUiApp } from '@vcmap/ui';
  import type { TerrainLayer } from '@vcmap/core';
  import type { DataItem, WebdataTypes } from '../webdataConstants.js';

  export default defineComponent({
    name: 'TerrainParameters',
    components: {
      VCol,
      VRow,
      VcsCheckbox,
      VcsLabel,
    },
    props: {
      item: {
        type: Object as PropType<DataItem<WebdataTypes.TERRAIN>>,
        required: true,
      },
    },
    emits: ['parametersEdited'],
    setup(props, { emit }) {
      const app = inject('vcsApp') as VcsUiApp;
      const layer = app.layers.getByKey(props.item.name) as TerrainLayer;

      const parameters = ref({
        requestVertexNormals: layer.requestVertexNormals,
        requestWaterMask: layer.requestWaterMask,
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
        async apply(): Promise<void> {
          if (
            layer.requestVertexNormals !== parameters.value.requestVertexNormals
          ) {
            layer.requestVertexNormals = parameters.value.requestVertexNormals;
          }
          if (layer.requestWaterMask !== parameters.value.requestWaterMask) {
            layer.requestWaterMask = parameters.value.requestWaterMask;
          }
          layer.deactivate();
          await layer.activate();
          initialParameters.value = structuredClone(toRaw(parameters.value));
        },
      };
    },
  });
</script>
<style lang="scss" scoped></style>
