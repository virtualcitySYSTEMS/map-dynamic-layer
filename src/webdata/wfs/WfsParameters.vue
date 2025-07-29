<template>
  <span>
    <v-row no-gutters class="px-1">
      <v-col>
        <VcsLabel html-for="featureNS">{{
          $t('dynamicLayer.parameters.featureNS')
        }}</VcsLabel>
      </v-col>
      <v-col>
        <VcsTextField id="featureNS" v-model="parameters.featureNS" />
      </v-col>
    </v-row>

    <v-row no-gutters class="px-1">
      <v-col>
        <VcsLabel html-for="featurePrefix">{{
          $t('dynamicLayer.parameters.featurePrefix')
        }}</VcsLabel>
      </v-col>
      <v-col>
        <VcsTextField id="featurePrefix" v-model="parameters.featurePrefix" />
      </v-col>
    </v-row>

    <v-row no-gutters class="px-1">
      <v-col>
        <VcsLabel html-for="featureType">{{
          $t('dynamicLayer.parameters.featureType')
        }}</VcsLabel>
      </v-col>
      <v-col>
        <VcsTextField id="featureType" v-model="parameters.featureType[0]" />
      </v-col>
    </v-row>

    <v-row v-if="parameters.extent" no-gutters>
      <VcsExtent
        id="extent"
        :model-value="parameters.extent"
        :first-cols="6"
        @update:model-value="setExtent"
      />
    </v-row>
  </span>
</template>

<script lang="ts">
  import type { PropType } from 'vue';
  import { defineComponent, inject, ref, toRaw, watch } from 'vue';
  import { VcsExtent, VcsLabel, VcsTextField, type VcsUiApp } from '@vcmap/ui';
  import type { ExtentOptions, WFSLayer } from '@vcmap/core';
  import { Extent } from '@vcmap/core';
  import { VCol, VRow } from 'vuetify/components';
  import type { DataItem, WebdataTypes } from '../webdataConstants.js';

  export default defineComponent({
    name: 'WfsParameters',
    components: {
      VCol,
      VRow,
      VcsExtent,
      VcsLabel,
      VcsTextField,
    },
    props: {
      item: {
        type: Object as PropType<DataItem<WebdataTypes.WFS>>,
        required: true,
      },
    },
    emits: ['parametersEdited'],
    setup(props, { emit }) {
      const app = inject('vcsApp') as VcsUiApp;
      const layer = app.layers.getByKey(props.item.name) as WFSLayer;

      const parameters = ref({ ...layer.toJSON() });
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
        setExtent(value: ExtentOptions): void {
          parameters.value.extent = value;
        },
        cancel(): void {
          parameters.value = structuredClone(toRaw(initialParameters.value));
        },
        async apply(): Promise<void> {
          Object.keys(parameters.value).forEach((key) => {
            if (key in layer) {
              if (
                key === 'extent' &&
                parameters.value.extent !== layer.extent
              ) {
                layer.extent = new Extent(toRaw(parameters.value.extent));
              } else if (key !== 'projection') {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                layer[key] = toRaw(parameters.value[key]);
              }
            }
          });
          layer.deactivate();
          await layer.activate();
          await layer.reload();
          initialParameters.value = structuredClone(toRaw(parameters.value));
        },
      };
    },
  });
</script>
<style lang="scss" scoped></style>
