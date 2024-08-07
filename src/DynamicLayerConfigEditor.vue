<template>
  <AbstractConfigEditor
    @submit="apply"
    v-bind="{ ...$attrs, ...$props }"
    v-if="localConfig"
  >
    <v-container class="py-0 px-1">
      <v-row no-gutters>
        <v-col>
          <VcsLabel html-for="defaultTab" required dense>
            {{ $t('dynamicLayer.config.defaultTab') }}
          </VcsLabel>
        </v-col>
        <v-col>
          <VcsSelect
            id="defaultTab"
            dense
            :items="tabs"
            v-model="localConfig.defaultTab"
          />
        </v-col>
      </v-row>
      <v-row no-gutters class="pt-1">
        <VcsLabel dense class="font-weight-bold">
          {{ $t('dynamicLayer.webdata.title') }}
        </VcsLabel>
      </v-row>
      <v-row no-gutters>
        <v-col>
          <VcsLabel html-for="webdataType" required dense>
            {{ $t('dynamicLayer.config.defaultType') }}
          </VcsLabel>
        </v-col>
        <v-col>
          <VcsSelect
            id="webdataType"
            dense
            :items="webdataTypes"
            v-model="localConfig.webdataDefaultType"
          />
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>
          <VcsLabel html-for="webdataUrl" dense>
            {{ $t('dynamicLayer.config.defaultUrl') }}
          </VcsLabel>
        </v-col>
        <v-col>
          <VcsTextField
            id="webdataUrl"
            dense
            v-model="localConfig.webdataDefaultUrl"
            :rules="[isUrl]"
          />
        </v-col>
      </v-row>
    </v-container>
  </AbstractConfigEditor>
</template>

<script lang="ts">
  import { VContainer, VRow, VCol } from 'vuetify/lib';
  import {
    AbstractConfigEditor,
    VcsLabel,
    VcsTextField,
    VcsSelect,
  } from '@vcmap/ui';
  import { defineComponent, PropType, Ref, ref } from 'vue';
  import { getLogger } from '@vcsuite/logger';
  import { getDefaultOptions, DynamicLayerConfig } from './index.js';
  import { CategoryType } from './constants.js';
  import { name } from '../package.json';
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
        type: Function as PropType<() => Promise<DynamicLayerConfig>>,
        required: true,
      },
      setConfig: { type: Function, required: true },
    },
    setup(props) {
      const localConfig: Ref<DynamicLayerConfig | undefined> = ref(undefined);
      const defaultOptions = getDefaultOptions();
      props
        .getConfig()
        .then((config: DynamicLayerConfig) => {
          localConfig.value = { ...defaultOptions, ...config };
        })
        .catch((err) => getLogger(name).error(err));

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
        async apply(): Promise<void> {
          await props.setConfig(localConfig.value);
        },
      };
    },
  });
</script>

<style scoped></style>
