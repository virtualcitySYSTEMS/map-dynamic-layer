<template>
  <span>
    <v-row no-gutters class="px-1">
      <v-col>
        <VcsLabel html-for="featureInfo">{{
          $t('dynamicLayer.parameters.featureInfo')
        }}</VcsLabel>
      </v-col>
      <v-col>
        <VcsCheckbox id="featureInfo" v-model.number="parameters.featureInfo" />
      </v-col>
    </v-row>
  </span>
</template>

<script lang="ts">
  import type { PropType } from 'vue';
  import { defineComponent, inject, ref, toRaw, watch } from 'vue';
  import { VCol, VRow } from 'vuetify/components';
  import { VcsCheckbox, VcsLabel, type VcsUiApp } from '@vcmap/ui';
  import type { CzmlLayer } from '@vcmap/core';
  import type { DataItem, WebdataTypes } from '../webdataConstants.js';
  import { name } from '../../../package.json';

  export default defineComponent({
    name: 'CzmlParameters',
    components: {
      VCol,
      VRow,
      VcsCheckbox,
      VcsLabel,
    },
    props: {
      item: {
        type: Object as PropType<DataItem<WebdataTypes.POINTCLOUD>>,
        required: true,
      },
    },
    emits: ['parametersEdited'],
    setup(props, { emit }) {
      const app = inject('vcsApp') as VcsUiApp;
      const layer = app.layers.getByKey(props.item.name) as CzmlLayer;

      const parameters = ref({
        ...layer.toJSON(),
        featureInfo: !!layer.properties.featureInfo,
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
          if (parameters.value.featureInfo) {
            layer.properties.featureInfo = name;
          } else {
            delete layer.properties.featureInfo;
          }
          initialParameters.value = structuredClone(toRaw(parameters.value));
        },
      };
    },
  });
</script>
<style lang="scss" scoped></style>
