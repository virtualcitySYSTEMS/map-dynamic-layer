<template>
  <span>
    <v-row no-gutters class="px-1" v-if="parameters.properties?.title">
      <v-col>
        <VcsLabel html-for="title">{{
          $t('dynamicLayer.parameters.layerTitle')
        }}</VcsLabel>
      </v-col>
      <v-col>
        <VcsTextField
          id="title"
          v-model="parameters.properties.title"
          clearable
        />
      </v-col>
    </v-row>
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
    <v-col class="d-flex justify-end gap-1" v-if="areParametersEdited">
      <VcsFormButton @click="cancel">{{
        $t('dynamicLayer.actions.cancel')
      }}</VcsFormButton>
      <VcsFormButton
        variant="filled"
        :disabled="!parameters.properties.title"
        @click="apply"
        >{{ $t('dynamicLayer.actions.apply') }}</VcsFormButton
      >
    </v-col>
  </span>
</template>

<script lang="ts">
  import {
    PropType,
    defineComponent,
    inject,
    nextTick,
    ref,
    toRaw,
    watch,
  } from 'vue';
  import { VCol, VRow } from 'vuetify/lib';
  import {
    VcsCheckbox,
    VcsFormButton,
    VcsLabel,
    VcsTextField,
    VcsUiApp,
  } from '@vcmap/ui';
  import { TerrainLayer } from '@vcmap/core';
  import { DataItem, WebdataTypes } from '../webdataConstants.js';

  export default defineComponent({
    name: 'TerrainParameters',
    components: {
      VCol,
      VRow,
      VcsCheckbox,
      VcsFormButton,
      VcsLabel,
      VcsTextField,
    },
    props: {
      item: {
        type: Object as PropType<DataItem<WebdataTypes.TERRAIN>>,
        required: true,
      },
    },
    setup(props, { emit }) {
      const app = inject('vcsApp') as VcsUiApp;

      const layer = app.layers.getByKey(props.item.name) as TerrainLayer;

      const parameters = ref({
        properties: { title: layer.properties.title },
        requestVertexNormals: layer.requestVertexNormals,
        requestWaterMask: layer.requestWaterMask,
      });
      const initialParameters = ref(structuredClone(toRaw(parameters.value)));

      const areParametersEdited = ref(false);
      watch(
        parameters,
        (): void => {
          areParametersEdited.value = true;
        },
        { deep: true },
      );

      return {
        parameters,
        areParametersEdited,

        cancel(): void {
          parameters.value = structuredClone(toRaw(initialParameters.value));
          nextTick(() => {
            areParametersEdited.value = false;
          });
        },
        async apply(): Promise<void> {
          if (layer.properties.title !== parameters.value.properties.title) {
            layer.properties.title = parameters.value.properties.title;
            emit('rename');
          }
          let layerNeedsReload = false;
          if (
            layer.requestVertexNormals !== parameters.value.requestVertexNormals
          ) {
            layerNeedsReload = true;
            layer.requestVertexNormals = parameters.value.requestVertexNormals;
          }
          if (layer.requestWaterMask !== parameters.value.requestWaterMask) {
            layerNeedsReload = true;
            layer.requestWaterMask = parameters.value.requestWaterMask;
          }
          if (layerNeedsReload) {
            layer.deactivate();
            await layer.activate();
          }
          initialParameters.value = structuredClone(toRaw(parameters.value));
          areParametersEdited.value = false;
        },
      };
    },
  });
</script>
<style lang="scss" scoped></style>
