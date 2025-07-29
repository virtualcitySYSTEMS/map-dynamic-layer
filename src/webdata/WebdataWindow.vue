<template>
  <v-row no-gutters class="h-100">
    <v-col cols="4" class="h-100">
      <v-row no-gutters>
        <v-col cols="10">
          <VcsTreeviewSearchbar v-model="search" />
        </v-col>
        <v-col
          cols="2"
          class="bg-base-lighten-3 d-flex align-center justify-end px-2 gc-2"
        >
          <VcsButton
            icon="mdi-filter"
            tooltip="dynamicLayer.actions.filter.showAddedOnly"
            :active="filterActive"
            @click="filterActive = !filterActive"
          />
          <VcsButton
            icon="$vcsPlus"
            tooltip="dynamicLayer.actions.source.addNew"
            :active="!selected"
            @click="selected = undefined"
          />
        </v-col>
      </v-row>
      <v-row no-gutters style="height: 486px">
        <VcsTreeview
          v-model:opened="opened"
          class="treeview h-100 w-100 overflow-y-auto"
          :items="filterActive ? filter(added) : added"
          :search="search"
        >
          <template #title="{ item }">
            <DlTreeviewTitle
              :title="item.title"
              :active="selected === item"
              @click="selected = item"
            />
          </template>
        </VcsTreeview>
      </v-row>
    </v-col>
    <v-divider vertical />
    <v-col cols="8" class="h-100">
      <span v-if="selected" class="h-100">
        <WebdataInformations
          :key="selected.name"
          :item="selected"
          :title="selected.title"
          :subtitle="getSubtitle(selected)"
          start-open
          class="button-margin"
        />
        <v-row no-gutters class="fixed-bottom d-flex justify-end">
          <VDivider />
          <span class="d-flex justify-end gc-2 pa-2 w-100">
            <VcsFormButton
              v-if="selected.children.length"
              variant="filled"
              :disabled="!getNonAddedChildrenLength(selected)"
              @click="addNested(selected)"
              >{{ $t('dynamicLayer.actions.layer.addAll') }}
              {{
                getNonAddedChildrenLength(selected)
                  ? `(${getNonAddedChildrenLength(selected)})`
                  : ''
              }}
            </VcsFormButton>
            <VcsFormButton
              v-if="selected.isRootElement"
              @click="removeSource(selected)"
            >
              {{ $t('dynamicLayer.actions.source.delete') }}
            </VcsFormButton>
            <VSpacer
              v-if="!selected.children.length && selected.isAddedToMap"
            />
            <span
              v-if="!selected.children.length && selected.isAddedToMap"
              class="d-flex gc-2"
            >
              <VcsFormButton variant="filled" @click="editParameters(selected)"
                >{{ $t('dynamicLayer.actions.edit') }}
              </VcsFormButton>
              <VcsFormButton @click="removeLayer(selected)"
                >{{ $t('dynamicLayer.actions.layer.remove') }}
              </VcsFormButton>
            </span>
            <VcsFormButton
              v-else-if="!selected.children.length"
              variant="filled"
              @click="addLayer(selected)"
              >{{ $t('dynamicLayer.actions.layer.add') }}
            </VcsFormButton>
          </span>
        </v-row>
      </span>
      <v-row v-else no-gutters class="h-75">
        <v-col cols="8" offset="2" class="d-flex align-center">
          <v-card flat class="w-100">
            <v-card-title
              class="font-weight-bold d-flex justify-center text-decoration-underline"
              >{{ $t('dynamicLayer.webdata.add.title') }}
            </v-card-title>
            <v-row no-gutters class="w-100 pt-3">
              <VcsLabel html-for="type">{{
                $t('dynamicLayer.webdata.add.type')
              }}</VcsLabel>
            </v-row>
            <v-row no-gutters class="w-100">
              <VcsSelect
                id="type"
                v-model="newSourceType"
                :items="availableTypes"
              />
            </v-row>
            <v-row no-gutters class="w-100 pt-3">
              <VcsLabel html-for="url">{{
                $t('dynamicLayer.webdata.add.url')
              }}</VcsLabel>
            </v-row>
            <v-row no-gutters class="w-100">
              <VcsTextField
                id="url"
                v-model="newSourceUrl"
                placeholder="URL"
                @keyup.enter="addSource"
              />
            </v-row>
            <span class="d-flex justify-end pt-3">
              <VcsFormButton
                variant="filled"
                :loading="isNewSourceLoading"
                :disabled="
                  !newSourceType || !newSourceUrl || isNewSourceLoading
                "
                @click="addSource"
                >{{ $t('dynamicLayer.actions.source.add') }}
              </VcsFormButton>
            </span>
          </v-card>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script lang="ts">
  import { defineComponent, inject, ref } from 'vue';
  import {
    NotificationType,
    VcsButton,
    VcsFormButton,
    VcsLabel,
    VcsSelect,
    VcsTextField,
    VcsTreeview,
    VcsTreeviewSearchbar,
    type VcsUiApp,
  } from '@vcmap/ui';
  import {
    VCard,
    VCardTitle,
    VCol,
    VDivider,
    VRow,
    VSpacer,
  } from 'vuetify/components';
  import { fetchSource } from './webdataApi.js';
  import {
    filterItemChildren,
    isWxsWebdataType,
    parseWebdataUrl,
  } from './webdataHelper.js';
  import type { DynamicLayerPlugin } from '../index.js';
  import { CategoryType } from '../constants.js';
  import { getAvailableTypes } from '../helper.js';
  import type { DataItem } from './webdataConstants.js';
  import { name } from '../../package.json';
  import DlTreeviewTitle from '../DlTreeviewTitle.vue';
  import {
    addAllNestedLayersFromItem,
    addLayerFromItem,
    getNonAddedChildrenLength,
    removeLayer,
    removeSource,
  } from './webdataActionsHelper.js';
  import WebdataInformations from './WebdataInformations.vue';

  export default defineComponent({
    name: 'WebdataWindow',
    components: {
      VCard,
      VCardTitle,
      VCol,
      VDivider,
      VRow,
      VSpacer,
      VcsButton,
      VcsFormButton,
      VcsLabel,
      VcsSelect,
      VcsTextField,
      VcsTreeview,
      DlTreeviewTitle,
      VcsTreeviewSearchbar,
      WebdataInformations,
    },
    setup() {
      const app = inject('vcsApp') as VcsUiApp;
      const plugin = app.plugins.getByKey(name) as DynamicLayerPlugin;
      const { added, selected, opened } = plugin.webdata;

      const search = ref('');
      const isNewSourceLoading = ref(false);
      const availableTypes = getAvailableTypes(CategoryType.WEBDATA);
      const newSourceType = ref(plugin.config.webdata.defaultType);
      const newSourceUrl = ref(plugin.config.webdata.defaultUrl);
      const filterActive = ref(false);

      return {
        newSourceType,
        newSourceUrl,
        added,
        opened,
        selected,
        search,
        filterActive,
        availableTypes,
        isNewSourceLoading,
        getNonAddedChildrenLength,
        addLayer: addLayerFromItem.bind(null, app),
        addNested: addAllNestedLayersFromItem.bind(null, app),
        removeLayer: removeLayer.bind(null, app),
        removeSource: removeSource.bind(null, app),
        editParameters(item: DataItem): void {
          plugin.activeTab.value = CategoryType.ADDED;
          plugin.addedSelected.value = item;
        },
        filter(array: Array<DataItem>): Array<DataItem> {
          return filterItemChildren(array, (i) => !!i.isAddedToMap);
        },
        getSubtitle(item: DataItem): string {
          return isWxsWebdataType(item)
            ? item.name
            : parseWebdataUrl(item.url, item.type);
        },

        async addSource(): Promise<void> {
          if (
            !newSourceType.value ||
            !newSourceUrl.value ||
            isNewSourceLoading.value
          ) {
            return;
          }
          filterActive.value = false;
          try {
            isNewSourceLoading.value = true;
            const parsedUrl = parseWebdataUrl(
              newSourceUrl.value,
              newSourceType.value,
            );
            if (added.value.some((i) => i.url === parsedUrl)) {
              app.notifier.add({
                type: NotificationType.ERROR,
                message: 'dynamicLayer.errors.urlAlreadyAdded',
              });
              isNewSourceLoading.value = false;
              return;
            }
            const item = await fetchSource(
              app,
              newSourceUrl.value,
              newSourceType.value,
            );
            selected.value = item;
            opened.value = [item.name];
            added.value.push(item);
          } catch (error) {
            app.notifier.add({
              type: NotificationType.ERROR,
              message: error as string,
            });
          }
          isNewSourceLoading.value = false;
        },
      };
    },
  });
</script>
<style lang="scss" scoped>
  .treeview {
    :deep(.vcs-action-button-list) {
      padding-right: 8px !important;
    }
    :deep(.prepend:not(.level-0 .prepend)) {
      display: none !important;
    }
    :deep(.v-spacer) {
      display: none !important;
    }
    :deep(.treenode):has(.active) {
      > button > span > i {
        color: rgb(var(--v-theme-primary)) !important;
      }
    }
  }
  .fixed-bottom {
    position: sticky !important;
    flex-grow: 0;
    bottom: 0;
    margin-top: auto;
    z-index: 1;
    background-color: rgb(var(--v-theme-surface));
  }
  .button-margin {
    height: calc(100% - (var(--v-vcs-font-size) * 2 + 16px)) !important;
  }
</style>
