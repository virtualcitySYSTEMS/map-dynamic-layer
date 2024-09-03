<template>
  <span>
    <v-row no-gutters class="px-1">
      <v-col>
        <VcsLabel html-for="title">{{
          $t('dynamicLayer.parameters.layerTitle')
        }}</VcsLabel>
      </v-col>
      <v-col>
        <VcsTextField id="title" v-model="parameters.properties.title" />
      </v-col>
    </v-row>

    <v-row
      no-gutters
      class="px-1"
      v-if="parameters?.zIndex || parameters?.zIndex === 0"
    >
      <v-col>
        <VcsLabel html-for="zIndex">{{
          $t('dynamicLayer.parameters.zIndex')
        }}</VcsLabel>
      </v-col>
      <v-col>
        <VcsTextField
          id="zIndex"
          type="number"
          show-spin-buttons
          v-model.number="parameters.zIndex"
        />
      </v-col>
    </v-row>

    <!-- FIXME: value not updated -->
    <v-row no-gutters v-if="parameters?.extent">
      <VcsExtent
        id="extent"
        :model-value="parameters.extent"
        @update:modelValue="setExtent"
        :first-cols="6"
      />
    </v-row>

    <v-row no-gutters v-if="parameters?.tilingSchema" class="px-1">
      <v-col>
        <VcsLabel html-for="tilingSchema">{{
          $t('dynamicLayer.parameters.tilingSchema')
        }}</VcsLabel>
      </v-col>
      <v-col>
        <VcsSelect
          id="tilingSchema"
          :items="['geographic', 'mercator']"
          v-model="parameters.tilingSchema"
          return-object
        />
      </v-col>
    </v-row>

    <v-row no-gutters class="px-1" v-if="parameters?.parameters?.FORMAT">
      <v-col>
        <VcsLabel html-for="format">{{
          $t('dynamicLayer.parameters.format')
        }}</VcsLabel>
      </v-col>
      <v-col>
        <VcsSelect
          id="format"
          :items="parameters.availableFormats"
          v-model="parameters.parameters.FORMAT"
          @update:modelValue="updateFormat"
        />
      </v-col>
    </v-row>

    <v-row no-gutters class="px-1" v-if="parameters?.supportsTransparency">
      <v-col>
        <VcsLabel html-for="transparency">{{
          $t('dynamicLayer.parameters.transparency')
        }}</VcsLabel>
      </v-col>
      <v-col class="d-flex align-center">
        <VcsCheckbox
          id="transparency"
          v-model="parameters.parameters.TRANSPARENT"
          @change="updateTransparency"
          true-value="true"
          false-value="false"
        />
      </v-col>
    </v-row>

    <v-row no-gutters class="px-1" v-if="parameters?.queryable">
      <v-col>
        <VcsLabel html-for="featureInfo">{{
          $t('dynamicLayer.parameters.featureInfo')
        }}</VcsLabel>
      </v-col>
      <v-col class="d-flex align-center">
        <VcsCheckbox id="featureInfo" v-model="enableFeatureInfo" />
      </v-col>
    </v-row>
    <v-row no-gutters v-if="parameters?.parameters?.STYLES" class="px-1">
      <v-col>
        <VcsLabel html-for="style">{{
          $t('dynamicLayer.parameters.style')
        }}</VcsLabel>
      </v-col>
      <v-col>
        <VcsSelect
          id="style"
          :items="parameters.availableStyles"
          :item-text="styleText"
          v-model="parameters.parameters.STYLES"
        />
      </v-col>
    </v-row>

    <v-row
      no-gutters
      v-if="
        parameters?.availableStyles &&
        findStyle(parameters.availableStyles, parameters.parameters.STYLES)
          ?.abstract
      "
    >
      <p class="px-2 pb-1">
        {{ $t('dynamicLayer.parameters.description') }}:
        {{
          findStyle(parameters.availableStyles, parameters.parameters.STYLES)
            ?.abstract
        }}
      </p>
    </v-row>

    <v-col class="d-flex justify-end gc-1" v-if="areParametersEdited">
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
    Ref,
    defineComponent,
    inject,
    nextTick,
    ref,
    toRaw,
    watch,
  } from 'vue';
  import {
    VcsCheckbox,
    VcsExtent,
    VcsFormButton,
    VcsLabel,
    VcsSelect,
    VcsTextField,
    VcsUiApp,
  } from '@vcmap/ui';
  import { Extent, ExtentOptions, WMSLayer } from '@vcmap/core';
  import { VCol, VRow } from 'vuetify/components';
  import { DynamicLayerPlugin } from 'src/index.js';
  import { WritableKeys } from '../../constants.js';
  import { DataItem, WebdataTypes } from '../webdataConstants.js';
  import { name } from '../../../package.json';
  import { WMSAvailableStyle, WMSParameters } from './wmsConstants.js';

  export default defineComponent({
    name: 'WmsParameters',
    components: {
      VCol,
      VRow,
      VcsCheckbox,
      VcsExtent,
      VcsFormButton,
      VcsLabel,
      VcsSelect,
      VcsTextField,
    },
    props: {
      item: {
        type: Object as PropType<DataItem<WebdataTypes.WMS>>,
        required: true,
      },
    },
    setup(props, { emit }) {
      const app = inject('vcsApp') as VcsUiApp;
      const plugin = app.plugins.getByKey(name) as DynamicLayerPlugin;

      const layer = app.layers.getByKey(props.item.name) as WMSLayer;
      const rootItem = toRaw(
        plugin.webdata.added.value.find((root) => root.url === props.item.url),
      ) as DataItem<WebdataTypes.WMS>;

      const parameters = ref({
        ...layer.toJSON(),
        tilingSchema: layer.tilingSchema,
        zIndex: layer.zIndex,
        availableStyles: toRaw(props.item.styles),
        availableFormats: rootItem.formats,
        supportsTransparency: props.item?.supportsTransparency,
        queryable: props.item?.queryable,
      }) as Ref<WMSParameters>;
      const initialParameters = ref(
        structuredClone(toRaw(parameters.value)),
      ) as Ref<WMSParameters>;

      const enableFeatureInfo = ref(!!layer.featureProvider);
      const areParametersEdited = ref(false);
      watch(
        [parameters, enableFeatureInfo],
        (): void => {
          areParametersEdited.value = true;
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
        areParametersEdited,
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
          // eslint-disable-next-line no-void
          void nextTick(() => {
            areParametersEdited.value = false;
          });
        },
        async apply(): Promise<void> {
          for (const key in parameters.value) {
            if (key in layer) {
              if (key === 'extent') {
                layer.extent = new Extent(parameters.value[key]);
              } else if (key === 'properties' || key === 'parameters') {
                // update legend style if style has changed
                if (
                  layer.parameters.STYLES !== parameters.value.parameters.STYLE
                ) {
                  layer.properties.legend = [
                    {
                      popoutBtn: true,
                      type: 'ImageLegendItem',
                      src: findStyle(
                        parameters.value.availableStyles!,
                        parameters.value.parameters.STYLES,
                      )?.legendUrl,
                    },
                  ];
                }
                // update parameters and properties values of the WMSLayer
                for (const nestedKey in layer[key]) {
                  // update layer title
                  if (
                    key === 'properties' &&
                    nestedKey === 'title' &&
                    parameters.value[key].title !== props.item.title
                  ) {
                    layer.properties.title = parameters.value.properties.title;
                    emit('rename');
                  } else if (parameters.value?.[key]?.[nestedKey]) {
                    layer[key][nestedKey] = toRaw(
                      parameters.value[key][nestedKey],
                    );
                  }
                }
              } else {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                layer[key as keyof WritableKeys] =
                  parameters.value[key as keyof WMSParameters];
              }
            }
          }
          if (enableFeatureInfo.value) {
            layer.properties.featureInfo = name;
          } else {
            delete layer.properties.featureInfo;
          }

          layer.deactivate();
          await layer.activate();
          await layer.reload();
          initialParameters.value = structuredClone(toRaw(parameters.value));
          areParametersEdited.value = false;
        },
      };
    },
  });
</script>
<style lang="scss" scoped></style>
