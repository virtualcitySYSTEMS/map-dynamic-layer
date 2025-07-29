<template>
  <span>
    <v-row v-if="parameters.screenSpaceError" no-gutters class="px-1">
      <v-col>
        <VcsLabel html-for="screenSpaceError">{{
          $t('dynamicLayer.parameters.screenSpaceError')
        }}</VcsLabel>
      </v-col>
      <v-col>
        <VcsTextField
          id="screenSpaceError"
          v-model.number="parameters.screenSpaceError"
          type="number"
          show-spin-buttons
        />
      </v-col>
    </v-row>
  </span>
</template>

<script lang="ts">
  import type { PropType } from 'vue';
  import { defineComponent, inject, ref, toRaw, watch } from 'vue';
  import { VCol, VRow } from 'vuetify/components';
  import { VcsLabel, VcsTextField, type VcsUiApp } from '@vcmap/ui';
  import type { CesiumTilesetLayer } from '@vcmap/core';
  import type { DataItem, WebdataTypes } from '../webdataConstants.js';

  export default defineComponent({
    name: 'CesiumTilesetParameters',
    components: {
      VCol,
      VRow,
      VcsLabel,
      VcsTextField,
    },
    props: {
      item: {
        type: Object as PropType<DataItem<WebdataTypes.CESIUM_TILESET>>,
        required: true,
      },
    },
    emits: ['parametersEdited'],
    setup(props, { emit }) {
      const app = inject('vcsApp') as VcsUiApp;
      const layer = app.layers.getByKey(props.item.name) as CesiumTilesetLayer;

      const parameters = ref({
        properties: { title: layer.properties.title },
        screenSpaceError: layer.screenSpaceError,
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
          layer.screenSpaceError = parameters.value.screenSpaceError;
          await layer.reload();
          initialParameters.value = structuredClone(toRaw(parameters.value));
        },
      };
    },
  });
</script>
<style lang="scss" scoped></style>
