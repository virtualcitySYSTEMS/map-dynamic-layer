<template>
  <span>
    <v-row v-if="parameters.extent" no-gutters>
      <VcsExtent
        id="extent"
        :model-value="parameters.extent"
        :first-cols="6"
        @update:model-value="setExtent"
      />
    </v-row>

    <v-row v-if="parameters.tilingSchema" no-gutters class="px-1">
      <v-col>
        <VcsLabel html-for="tilingSchema">{{
          $t('dynamicLayer.parameters.tilingSchema')
        }}</VcsLabel>
      </v-col>
      <v-col>
        <VcsSelect
          id="tilingSchema"
          v-model="parameters.tilingSchema"
          :items="['geographic', 'mercator']"
          return-object
        />
      </v-col>
    </v-row>

    <v-row v-if="parameters.parameters.FORMAT" no-gutters class="px-1">
      <v-col>
        <VcsLabel html-for="format">{{
          $t('dynamicLayer.common.format')
        }}</VcsLabel>
      </v-col>
      <v-col>
        <VcsSelect
          id="format"
          v-model="parameters.parameters.FORMAT"
          :items="parameters.availableFormats"
          @update:model-value="updateFormat"
        />
      </v-col>
    </v-row>

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

    <v-row v-if="parameters.supportsTransparency" no-gutters class="px-1">
      <v-col>
        <VcsLabel html-for="transparency">{{
          $t('dynamicLayer.parameters.transparency')
        }}</VcsLabel>
      </v-col>
      <v-col class="d-flex align-center">
        <VcsCheckbox
          id="transparency"
          v-model="parameters.parameters.TRANSPARENT"
          true-value="TRUE"
          false-value="FALSE"
          @change="updateTransparency"
        />
      </v-col>
    </v-row>

    <v-row v-if="parameters.queryable" no-gutters class="px-1">
      <v-col>
        <VcsLabel html-for="featureInfo">{{
          $t('dynamicLayer.parameters.featureInfo')
        }}</VcsLabel>
      </v-col>
      <v-col class="d-flex align-center">
        <VcsCheckbox id="featureInfo" v-model="enableFeatureInfo" />
      </v-col>
    </v-row>
    <v-row v-if="parameters.parameters.STYLES" no-gutters class="px-1">
      <v-col>
        <VcsLabel html-for="style">{{
          $t('dynamicLayer.parameters.style')
        }}</VcsLabel>
      </v-col>
      <v-col>
        <VcsSelect
          id="style"
          v-model="parameters.parameters.STYLES"
          :items="parameters.availableStyles"
          :item-text="styleText"
        />
      </v-col>
    </v-row>
    <v-row
      v-if="
        parameters.availableStyles &&
        findStyle(parameters.availableStyles, parameters.parameters.STYLES)
          ?.abstract
      "
      no-gutters
    >
      <p class="px-2 pb-1">
        {{ $t('dynamicLayer.common.description') }}:
        {{
          findStyle(parameters.availableStyles, parameters.parameters.STYLES)
            ?.abstract
        }}
      </p>
    </v-row>
  </span>
</template>

<script lang="ts">
  import type { PropType, Ref } from 'vue';
  import { defineComponent, inject, ref, toRaw, watch } from 'vue';
  import {
    VcsCheckbox,
    VcsExtent,
    VcsLabel,
    VcsSelect,
    VcsSlider,
    type VcsUiApp,
  } from '@vcmap/ui';
  import type { ExtentOptions, WMSLayer } from '@vcmap/core';
  import { Extent } from '@vcmap/core';
  import { VCol, VRow } from 'vuetify/components';
  import type { DataItem, WebdataTypes } from '../webdataConstants.js';
  import { name } from '../../../package.json';
  import type { WMSAvailableStyle, WMSParameters } from './wmsConstants.js';

  export default defineComponent({
    name: 'WmsParameters',
    components: {
      VCol,
      VRow,
      VcsCheckbox,
      VcsExtent,
      VcsLabel,
      VcsSelect,
      VcsSlider,
    },
    props: {
      item: {
        type: Object as PropType<DataItem<WebdataTypes.WMS>>,
        required: true,
      },
    },
    emits: ['parametersEdited'],
    setup(props, { emit }) {
      const app = inject('vcsApp') as VcsUiApp;
      const layer = app.layers.getByKey(props.item.name) as WMSLayer;

      const parameters = ref({
        ...layer.toJSON(),
        tilingSchema: layer.tilingSchema,
        opacity: layer.opacity,
        availableStyles: toRaw(props.item.styles),
        availableFormats: toRaw(props.item.formats),
        supportsTransparency: props.item.supportsTransparency,
        queryable: props.item.queryable,
      }) as Ref<WMSParameters>;
      const initialParameters = ref(
        structuredClone(toRaw(parameters.value)),
      ) as Ref<WMSParameters>;

      const enableFeatureInfo = ref(!!layer.featureProvider);
      watch(
        [parameters, enableFeatureInfo],
        (): void => {
          emit('parametersEdited');
        },
        { deep: true },
      );
      function findStyle(
        availableStyles: Array<WMSAvailableStyle>,
        styleName: string,
      ): WMSAvailableStyle | undefined {
        return availableStyles.find((s) => s.value === styleName);
      }
      return {
        parameters,
        findStyle,
        enableFeatureInfo,
        styleText(style: { title: string }): string {
          return style.title;
        },
        setExtent(value: ExtentOptions): void {
          parameters.value.extent = value;
        },
        updateTransparency(): void {
          if (parameters.value.parameters.TRANSPARENT === 'true') {
            parameters.value.parameters.FORMAT = 'image/png';
          }
        },
        updateFormat(f: string): void {
          if (f !== 'image/png' && parameters.value.parameters?.TRANSPARENT) {
            parameters.value.parameters.TRANSPARENT = 'false';
          }
        },
        cancel(): void {
          parameters.value = structuredClone(toRaw(initialParameters.value));
        },
        async apply(): Promise<void> {
          Object.keys(parameters.value).forEach((key) => {
            if (key in layer) {
              if (key === 'extent') {
                layer.extent = new Extent(parameters.value[key]);
              } else if (key === 'properties' || key === 'parameters') {
                // update legend style if style has changed
                if (
                  parameters.value.availableStyles &&
                  layer.parameters.STYLES !== parameters.value.parameters.STYLE
                ) {
                  layer.properties.legend = [
                    {
                      popoutBtn: true,
                      type: 'ImageLegendItem',
                      src: findStyle(
                        parameters.value.availableStyles,
                        parameters.value.parameters.STYLES,
                      )?.legendUrl,
                    },
                  ];
                }
                // update parameters and properties values of the WMSLayer
                Object.keys(layer[key]).forEach((nestedKey) => {
                  if (parameters.value[key]?.[nestedKey]) {
                    layer[key][nestedKey] = toRaw(
                      parameters.value[key][nestedKey],
                    );
                  }
                });
              } else {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                layer[key] = parameters.value[key as keyof WMSParameters];
              }
            }
          });
          if (enableFeatureInfo.value) {
            layer.properties.featureInfo = name;
          } else {
            delete layer.properties.featureInfo;
          }

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
