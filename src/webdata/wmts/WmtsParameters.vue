<template>
  <span>
    <v-row no-gutters class="px-1">
      <v-col>
        <VcsLabel html-for="opacity">{{
          $t('dynamicLayer.parameters.opacity')
        }}</VcsLabel>
      </v-col>
      <v-col>
        <VcsSlider
          id="opacity"
          v-model="parameters.opacity"
          min="0"
          max="1"
          step="0.01"
        >
          <template #append
            >{{ Math.round(parameters.opacity! * 100) }}%</template
          >
        </VcsSlider>
      </v-col>
    </v-row>

    <v-row no-gutters class="px-1">
      <v-col>
        <VcsLabel html-for="format">{{
          $t('dynamicLayer.common.format')
        }}</VcsLabel>
      </v-col>
      <v-col>
        <VcsSelect
          id="format"
          v-model="parameters.format"
          :items="item.formats"
        />
      </v-col>
    </v-row>

    <v-row no-gutters class="px-1">
      <v-col>
        <VcsLabel html-for="tileMatrixSetID">{{
          $t('dynamicLayer.parameters.tileMatrixSetID')
        }}</VcsLabel>
      </v-col>
      <v-col>
        <VcsSelect
          id="tileMatrixSetID"
          v-model="parameters.tileMatrixSetID"
          :items="item.matrixSetIds"
        />
      </v-col>
    </v-row>

    <v-row no-gutters class="px-1">
      <v-col>
        <VcsLabel html-for="tileMatrixPrefix">{{
          $t('dynamicLayer.parameters.tileMatrixPrefix')
        }}</VcsLabel>
      </v-col>
      <v-col>
        <VcsTextField
          id="tileMatrixPrefix"
          v-model="parameters.tileMatrixPrefix"
        />
      </v-col>
    </v-row>

    <v-row
      v-if="
        parameters.numberOfLevelZeroTilesX && parameters.numberOfLevelZeroTilesY
      "
      no-gutters
      class="px-1"
    >
      <v-col cols="6">
        <VcsLabel html-for="levelZeroTilesX">{{
          $t('dynamicLayer.parameters.numberLevelZeroTiles')
        }}</VcsLabel>
      </v-col>
      <v-col>
        <VcsTextField
          id="levelZeroTilesX"
          v-model.number="parameters.numberOfLevelZeroTilesX"
          prefix="X"
        />
      </v-col>
      <v-col>
        <VcsTextField
          id="levelZeroTilesY"
          v-model.number="parameters.numberOfLevelZeroTilesX"
          prefix="Y"
        />
      </v-col>
    </v-row>

    <v-row no-gutters class="px-1">
      <v-col cols="6">
        <VcsLabel html-for="zoomLevelMin">{{
          $t('dynamicLayer.parameters.zoomLevels')
        }}</VcsLabel>
      </v-col>
      <v-col>
        <VcsTextField
          id="zoomLevelMin"
          v-model.number="parameters.minLevel"
          prefix="min"
        />
      </v-col>
      <v-col>
        <VcsTextField
          id="zoomLevelMax"
          v-model.number="parameters.maxLevel"
          prefix="max"
        />
      </v-col>
    </v-row>

    <v-row no-gutters class="px-1">
      <v-col cols="6">
        <VcsLabel html-for="tileSizeX">{{
          $t('dynamicLayer.parameters.tileSize')
        }}</VcsLabel>
      </v-col>
      <v-col>
        <VcsTextField
          id="tileSizeX"
          v-model.number="parameters.tileSize[0]"
          prefix="X"
          suffix="pixels"
        />
      </v-col>
      <v-col>
        <VcsTextField
          id="tileSizeY"
          v-model.number="parameters.tileSize[1]"
          prefix="Y"
          suffix="pixels"
        />
      </v-col>
    </v-row>

    <v-row no-gutters class="px-1">
      <v-col>
        <VcsLabel html-for="style">{{
          $t('dynamicLayer.parameters.style')
        }}</VcsLabel>
      </v-col>
      <v-col>
        <VcsSelect
          id="style"
          v-model="parameters.wmtsStyle"
          :items="item.styles"
          :item-text="itemText"
        />
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
  import {
    VcsExtent,
    VcsLabel,
    VcsSelect,
    VcsSlider,
    VcsTextField,
    type VcsUiApp,
  } from '@vcmap/ui';
  import type { ExtentOptions, WMTSLayer } from '@vcmap/core';
  import { Extent } from '@vcmap/core';
  import { VCol, VRow } from 'vuetify/components';
  import type { DataItem, WebdataTypes } from '../webdataConstants.js';

  export default defineComponent({
    name: 'WmtsParameters',
    components: {
      VCol,
      VRow,
      VcsExtent,
      VcsLabel,
      VcsSelect,
      VcsSlider,
      VcsTextField,
    },
    props: {
      item: {
        type: Object as PropType<DataItem<WebdataTypes.WMTS>>,
        required: true,
      },
    },
    emits: ['parametersEdited'],
    setup(props, { emit }) {
      const app = inject('vcsApp') as VcsUiApp;
      const layer = app.layers.getByKey(props.item.name) as WMTSLayer;

      const parameters = ref({
        ...layer.toJSON(),
        opacity: layer.opacity,
        minLevel: layer.minLevel,
        maxLevel: layer.maxLevel,
        tileSize: layer.tileSize,
        tileMatrixPrefix: layer.tileMatrixPrefix,
        numberOfLevelZeroTilesX: layer.numberOfLevelZeroTilesX,
        numberOfLevelZeroTilesY: layer.numberOfLevelZeroTilesY,
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
        itemText: (s: Record<string, string>): string => s.title ?? s.name,
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
