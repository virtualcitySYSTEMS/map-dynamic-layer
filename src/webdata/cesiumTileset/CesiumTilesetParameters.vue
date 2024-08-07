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
    <v-row no-gutters class="px-1" v-if="parameters?.screenSpaceError">
      <v-col>
        <VcsLabel html-for="screenSpaceError">{{
          $t('dynamicLayer.parameters.screenSpaceError')
        }}</VcsLabel>
      </v-col>
      <v-col>
        <VcsTextField
          id="screenSpaceError"
          type="number"
          show-spin-buttons
          v-model.number="parameters.screenSpaceError"
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
  import { VcsFormButton, VcsLabel, VcsTextField, VcsUiApp } from '@vcmap/ui';
  import { CesiumTilesetLayer } from '@vcmap/core';
  import { DataItem, WebdataTypes } from '../webdataConstants.js';

  export default defineComponent({
    name: 'CesiumTilesetParameters',
    components: {
      VCol,
      VRow,
      VcsFormButton,
      VcsLabel,
      VcsTextField,
    },
    props: {
      item: {
        type: Object as PropType<DataItem<WebdataTypes.CESIUM_TILESET>>,
        required: true,
      },
    },
    setup(props, { emit }) {
      const app = inject('vcsApp') as VcsUiApp;

      const layer = app.layers.getByKey(props.item.name) as CesiumTilesetLayer;

      const parameters = ref({
        properties: { title: layer.properties.title },
        screenSpaceError: layer.screenSpaceError,
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
          if (layer.screenSpaceError !== parameters.value.screenSpaceError) {
            layer.screenSpaceError = parameters.value.screenSpaceError;
            await layer.reload();
          }
          initialParameters.value = structuredClone(toRaw(parameters.value));
          areParametersEdited.value = false;
        },
      };
    },
  });
</script>
<style lang="scss" scoped></style>
