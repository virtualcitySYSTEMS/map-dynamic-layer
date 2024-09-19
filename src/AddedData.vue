<template>
  <span
    v-if="!Object.values(state).length"
    class="d-flex align-center"
    style="height: 530px"
  >
    <v-row no-gutters>
      <v-col cols="12" class="py-1 d-flex justify-center">
        <VcsLabel html-for="choice" class="font-weight-bold"
          >{{ $t('dynamicLayer.errors.noData') }}
        </VcsLabel>
      </v-col>
      <v-col cols="12" class="py-1 d-flex justify-center">
        <VcsFormButton @click="$emit('switchTo', CategoryType.WEBDATA)">{{
          $t('dynamicLayer.added.goToWebdata')
        }}</VcsFormButton>
      </v-col>
      <v-col cols="12" class="py-1 d-flex justify-center">
        <VcsFormButton @click="$emit('switchTo', CategoryType.CATALOGUES)">{{
          $t('dynamicLayer.added.goToCatalogue')
        }}</VcsFormButton>
      </v-col>
      <v-col cols="12" class="py-1 d-flex justify-center">
        <VcsFormButton @click="$emit('switchTo', CategoryType.MYDATA)">{{
          $t('dynamicLayer.added.goToLocal')
        }}</VcsFormButton>
      </v-col>
    </v-row>
  </span>
  <v-row no-gutters v-else>
    <v-col cols="4">
      <VcsTreeview
        class="treeview"
        :items="localItems"
        v-model:activated="arraySelected"
        height="486px"
        color="primary"
        active-strategy="single-leaf"
        show-searchbar
        mandatory
        activatable
        open-all
        open-on-click
        return-object
      />
    </v-col>
    <v-divider vertical style="z-index: 1" />

    <v-col cols="8" class="px-1">
      <span v-if="!selected">
        <VcsLabel class="py-1 d-flex justify-center font-weight-bold"
          >{{ $t('dynamicLayer.added.selectToEdit') }}
        </VcsLabel>
      </span>
      <span v-else-if="selectedDataItem">
        <WebdataParameters
          class="parameters-slot"
          :item="selectedDataItem"
          @rename="rename"
          :key="selectedDataItem.name"
        />
        <ActionsButtons
          class="align-end"
          :item="selectedDataItem"
          :selected-tab="CategoryType.ADDED"
          @reloadAddedContent="reloadContent"
          @switchTo="(c) => $emit('switchTo', c)"
        />
      </span>
    </v-col>
  </v-row>
</template>

<script lang="ts">
  import { VcsFormButton, VcsLabel, VcsTreeview, VcsUiApp } from '@vcmap/ui';
  import { Ref, computed, defineComponent, inject, ref, toRaw } from 'vue';
  import { VCol, VDivider, VRow } from 'vuetify/components';
  import { DynamicLayerPlugin } from 'src/index.js';
  import ActionsButtons from './webdata/ActionsButtons.vue';
  import { CategoryType } from './constants.js';
  import { WebdataTypes } from './webdata/webdataConstants.js';
  import { name } from '../package.json';
  import { findDataItem } from './webdata/webdataHelper.js';
  import WebdataParameters from './webdata/WebdataParameters.vue';
  import { renameAction } from './helper.js';

  type LocalItem = {
    name: string;
    title: string;
    actions: object;
    url: string;
  };
  type LocalType = {
    name: WebdataTypes;
    title: string;
    actions: object;
    children: Array<LocalItem>;
  };

  function createTreeviewContent(
    app: VcsUiApp,
    plugin: DynamicLayerPlugin,
  ): Array<LocalType> {
    const contentTree: Array<LocalType> = [];
    Object.entries(plugin.state).forEach(([url, value]) => {
      let contentTreeType = contentTree.find((t) => t.name === value.type);
      if (!contentTreeType) {
        contentTreeType = {
          name: value.type,
          title: `dynamicLayer.webdata.${value.type}`,
          actions: {},
          children: [],
        };
        contentTree.push(contentTreeType);
      }
      value.layerNames.forEach((layerName) => {
        contentTreeType.children.push({
          name: layerName,
          title:
            (app.layers.getByKey(layerName)?.properties.title as string) || url,
          actions: {},
          url,
        });
      });
    });
    return contentTree;
  }

  export default defineComponent({
    name: 'AddedData',
    components: {
      VCol,
      VDivider,
      VRow,
      VcsFormButton,
      VcsLabel,
      VcsTreeview,

      ActionsButtons,
      WebdataParameters,
    },
    setup() {
      const app = inject<VcsUiApp>('vcsApp')!;
      const plugin = app.plugins.getByKey(name) as DynamicLayerPlugin;
      const { state } = plugin;
      const { selected: webdataSelected } = plugin.webdata;

      const localItems = ref(createTreeviewContent(app, plugin));
      const selectedDataItem = ref();
      const selected: Ref<LocalItem | undefined> = ref();
      const search = ref('');

      const arraySelected = computed({
        get() {
          return [selected.value];
        },
        set(value) {
          selected.value = value[0];
          if (value[0]) {
            selectedDataItem.value = toRaw(
              findDataItem(plugin, value[0].url, value[0].name),
            );
            webdataSelected.value = toRaw(selectedDataItem.value);
          }
        },
      });

      const localSelection = localItems.value
        .find((type) => type.name === webdataSelected.value?.type)
        ?.children.find((item) => item.name === webdataSelected.value?.name);

      if (localSelection) {
        arraySelected.value = [localSelection];
      }
      function reloadContent(): void {
        localItems.value = createTreeviewContent(app, plugin);
        if (!webdataSelected.value?.isAddedToMap) arraySelected.value = [];
      }

      return {
        plugin,
        state,
        CategoryType,
        WebdataTypes,
        localItems,
        selected,
        search,
        arraySelected,
        selectedDataItem,
        reloadContent,

        rename(): void {
          renameAction(app, selectedDataItem.value);
          reloadContent();
        },
      };
    },
  });
</script>
<style lang="scss" scoped>
  .treeview {
    :deep(.v-list-item) {
      padding-inline-end: 0px;
    }
  }
</style>
