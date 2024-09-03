<template>
  <AbstractConfigEditor
    @submit="apply"
    v-bind="{ ...$attrs, ...$props }"
    v-if="localConfig"
  >
    <v-container class="py-0 px-1">
      <v-row no-gutters>
        <v-col>
          <VcsLabel html-for="defaultTab" required>
            {{ $t('dynamicLayer.config.defaultTab') }}
          </VcsLabel>
        </v-col>
        <v-col>
          <VcsSelect
            id="defaultTab"
            :items="tabs"
            v-model="localConfig.defaultTab"
          />
        </v-col>
      </v-row>
      <v-row no-gutters class="pt-1">
        <VcsLabel class="font-weight-bold">
          {{ $t('dynamicLayer.webdata.title') }}
        </VcsLabel>
      </v-row>
      <v-row no-gutters>
        <v-col>
          <VcsLabel html-for="webdataType" required>
            {{ $t('dynamicLayer.config.defaultType') }}
          </VcsLabel>
        </v-col>
        <v-col>
          <VcsSelect
            id="webdataType"
            :items="webdataTypes"
            v-model="localConfig.webdataDefaultType"
          />
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>
          <VcsLabel html-for="webdataUrl">
            {{ $t('dynamicLayer.config.defaultUrl') }}
          </VcsLabel>
        </v-col>
        <v-col>
          <VcsTextField
            id="webdataUrl"
            v-model="localConfig.webdataDefaultUrl"
            :rules="[isUrl]"
          />
        </v-col>
      </v-row>
    </v-container>
  </AbstractConfigEditor>
</template>

<script lang="ts">
  import { VContainer, VRow, VCol } from 'vuetify/components';
  import {
    AbstractConfigEditor,
    VcsLabel,
    VcsTextField,
    VcsSelect,
  } from '@vcmap/ui';
  import { defineComponent, PropType, ref } from 'vue';
  import { getDefaultOptions, DynamicLayerConfig } from './index.js';
  import { CategoryType } from './constants.js';
  import { getAvailableWebdataTypes } from './helper.js';

  export default defineComponent({
    name: 'DynamicLayerConfigEditor',
    title: 'dynamicLayer.configEditorTitle',
    components: {
      VCol,
      VContainer,
      VRow,
      AbstractConfigEditor,
      VcsLabel,
      VcsSelect,
      VcsTextField,
    },
    props: {
      getConfig: {
        type: Function as PropType<() => DynamicLayerConfig>,
        required: true,
      },
      setConfig: {
        type: Function as PropType<(config: object | undefined) => void>,
        required: true,
      },
    },
    setup(props) {
      const defaultOptions = getDefaultOptions();
      const config = props.getConfig();
      const localConfig = ref({ ...defaultOptions, ...config });
      const tabs = ref(Object.values(CategoryType));
      const webdataTypes = ref(getAvailableWebdataTypes(CategoryType.WEBDATA));

      return {
        localConfig,
        tabs,
        webdataTypes,
        isUrl(value: string): boolean | string {
          try {
            return Boolean(new URL(value));
          } catch (e) {
            return 'dynamicLayer.errors.invalidUrl';
          }
        },
        apply(): void {
          props.setConfig(localConfig.value);
        },
      };
    },
  });
</script>

<style scoped></style>
