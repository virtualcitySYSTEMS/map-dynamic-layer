<template>
  <tr>
    <td :colspan="columns.length">
      <span no-gutters class="d-flex justify-end gc-2 font-italic">
        id: {{ distribution.id }}
      </span>

      <span v-if="distribution.description">
        <v-row no-gutters>
          <VcsLabel html-for="description" class="font-weight-bold">
            {{ $t('dynamicLayer.common.description') }}
          </VcsLabel>
        </v-row>
        <v-row no-gutters class="px-2 w-100">
          <span class="w-100 d-inline-block text-break">
            {{ distribution.description }}
          </span>
        </v-row>
      </span>

      <div class="d-flex gc-2 justify-end py-2">
        <VcsFormButton
          v-if="distribution.downloadUrl"
          download
          :href="distribution.downloadUrl"
          target="_blank"
        >
          {{ $t('dynamicLayer.actions.download') }}
        </VcsFormButton>
        <span v-if="distribution.accessUrl">
          <VcsFormButton
            v-if="!distribution.type"
            variant="filled"
            target="_blank"
            :href="distribution.accessUrl"
          >
            {{ $t('dynamicLayer.actions.access') }}
          </VcsFormButton>
          <VcsFormButton
            v-else
            variant="filled"
            :loading="loading"
            @click="addToMap(distribution)"
          >
            {{ $t('dynamicLayer.actions.add') }}
          </VcsFormButton>

          <v-dialog
            :model-value="!!chooseLayerOfItem"
            width="400"
            @after-leave="chooseLayerOfItem = undefined"
          >
            <v-card>
              <span class="pa-2">
                {{ $t('dynamicLayer.catalogues.chooseLayersToAdd') }}
                <p v-if="distribution.title">
                  {{ $t('dynamicLayer.catalogues.selectedDistributionName') }}
                  <span class="font-italic"> {{ distribution.title }}</span
                  >.
                </p>
              </span>
              <VcsTreeview
                show-searchbar
                :items="[chooseLayerOfItem]"
                open-all
                class="treeview"
              >
                <template #title="{ item }">
                  <DlTreeviewTitle :title="item.title" />
                </template>
              </VcsTreeview>
            </v-card>
          </v-dialog>
        </span>
        <span v-else-if="distribution.feature">
          <VcsFormButton
            variant="filled"
            :loading="loading"
            @click="addNbs(distribution)"
          >
            {{ $t('dynamicLayer.actions.add') }}
          </VcsFormButton>
        </span>
      </div>
    </td>
  </tr>
</template>

<script lang="ts">
  import type { PropType } from 'vue';
  import { defineComponent, inject, ref } from 'vue';
  import { VCard, VDialog, VRow } from 'vuetify/components';
  import {
    NotificationType,
    VcsFormButton,
    VcsLabel,
    VcsTreeview,
    type VcsUiApp,
  } from '@vcmap/ui';
  import type { DynamicLayerPlugin } from '../index.js';
  import DlTreeviewTitle from '../DlTreeviewTitle.vue';
  import { addDistributionToMap } from './catalogues.js';
  import type { Distribution } from './catalogues.js';
  import { name } from '../../package.json';
  import { addNBSToMap } from './nbsRegistry.js';
  import type { WebdataTypes } from '../webdata/webdataConstants.js';

  export default defineComponent({
    name: 'DistributionDetails',
    components: {
      VCard,
      VDialog,
      VRow,
      VcsFormButton,
      VcsLabel,
      VcsTreeview,
      DlTreeviewTitle,
    },
    props: {
      columns: { type: Array, required: true },
      distribution: {
        type: Object as PropType<Distribution>,
        required: true,
      },
    },
    setup(props) {
      const app = inject('vcsApp') as VcsUiApp;
      const plugin = app.plugins.getByKey(name) as DynamicLayerPlugin;

      const loading = ref(false);
      const chooseLayerOfItem = ref();

      async function addToMap(item: Distribution): Promise<void> {
        loading.value = true;
        const toChoose = await addDistributionToMap(
          app,
          item.accessUrl!,
          item.type as WebdataTypes,
          item.id,
          item.title,
          !!plugin.state.entry,
        );
        loading.value = false;
        chooseLayerOfItem.value = toChoose;
      }

      if (
        plugin.state.entry &&
        plugin.state.entry.distrib === props.distribution.id
      ) {
        addToMap(props.distribution)
          .then(() => {
            delete plugin.state.entry;
          })
          .catch((e: unknown) => {
            app.notifier.add({
              type: NotificationType.ERROR,
              message: `${app.vueI18n.t('dynamicLayer.errors.addingLayer')} ${props.distribution.title}: ${String(e)}`,
            });
          });
      }

      return {
        plugin,
        loading,
        chooseLayerOfItem,
        addToMap,
        addNbs: addNBSToMap.bind(null, app),
      };
    },
  });
</script>

<style lang="scss" scoped>
  .treeview {
    :deep(.vcs-action-button-list) {
      padding-right: 8px !important;
    }
    :deep(.v-spacer) {
      display: none !important;
    }
  }
</style>
