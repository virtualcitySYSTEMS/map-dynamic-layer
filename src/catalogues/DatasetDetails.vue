<template>
  <span class="py-1 d-flex flex-column" style="max-height: 100%">
    <v-row
      no-gutters
      class="font-weight-black d-flex justify-center text-center py-1"
    >
      {{ dataset.title }}
    </v-row>
    <div class="d-inline-block w-100 flex-grow-1 overflow-y-auto">
      <v-row
        v-if="dataset.source"
        no-gutters
        class="d-flex align-center justify-center gc-1"
      >
        <span class="text-truncate pr-1">
          {{ $t('dynamicLayer.info.source') }}:
          <span class="font-italic">
            <a
              v-if="dataset.source.url"
              :href="dataset.source.url"
              target="_blank"
            >
              {{ dataset.source.title }}
            </a>
            <span v-else class="text-decoration-underline">
              {{ dataset.source.title }}
            </span>
          </span>
        </span>
      </v-row>
      <v-row
        v-if="dataset.publisher"
        no-gutters
        class="d-flex align-center justify-center gc-1"
      >
        <span class="text-truncate pr-1">
          {{ $t('dynamicLayer.info.publisher') }}:
          <span class="font-italic">
            <a
              v-if="dataset.publisher.url"
              :href="dataset.publisher.url"
              target="_blank"
            >
              {{ dataset.publisher.title }}
            </a>
            <span v-else class="text-decoration-underline">
              {{ dataset.publisher.title }}
            </span>
          </span>
        </span>
      </v-row>
      <v-row
        v-if="dataset.owner"
        no-gutters
        class="d-flex align-center justify-center gc-1"
      >
        <span class="text-truncate pr-1">
          {{ $t('dynamicLayer.info.owner') }}:
          <span class="font-italic">
            <a
              v-if="dataset.owner.url"
              :href="dataset.owner.url"
              target="_blank"
            >
              {{ dataset.owner.title }}
            </a>
            <span v-else class="text-decoration-underline">
              {{ dataset.owner.title }}
            </span>
          </span>
        </span>
      </v-row>

      <v-row no-gutters class="d-flex justify-center gc-4">
        <span v-if="dataset.created">
          <span class="text-decoration-underline">
            {{ $t('dynamicLayer.info.created') }}:</span
          >
          <span class="font-italic">&nbsp;{{ dataset.created }}</span>
        </span>
        <span v-if="dataset.modified">
          <span class="text-decoration-underline">
            {{ $t('dynamicLayer.info.modified') }}:</span
          >
          <span class="font-italic">&nbsp;{{ dataset.modified }}</span>
        </span>
      </v-row>
      <VcsFormSection heading="dynamicLayer.info.title" expandable start-open>
        <v-row v-if="dataset.keywords?.length" no-gutters class="w-100 pt-1">
          <v-chip
            v-if="dataset.keywords.length > 3"
            size="x-small"
            color="primary"
            variant="outlined"
            class="ma-1"
            @click="showAllKeywords = !showAllKeywords"
            >{{
              showAllKeywords
                ? $t('dynamicLayer.actions.collapse')
                : `${$t('dynamicLayer.common.show')} ${dataset.keywords.length} ${$t('dynamicLayer.common.more')}`
            }}
          </v-chip>
          <v-chip
            v-for="keyword in dataset.keywords.slice(
              showAllKeywords ? undefined : -1,
            )"
            :key="keyword"
            size="x-small"
            color="primary"
            class="ma-1"
            >{{ keyword }}
          </v-chip>
        </v-row>

        <span v-if="dataset.description" class="w-100 pb-1">
          <v-row no-gutters>
            <VcsLabel html-for="description" class="font-weight-bold">{{
              $t('dynamicLayer.common.description')
            }}</VcsLabel>
          </v-row>
          <v-row no-gutters class="px-2">
            {{ dataset.description }}
          </v-row>
        </span>
      </VcsFormSection>

      <VcsFormSection
        :heading="`${$t('dynamicLayer.info.distributions')} (${distributions.length})`"
        expandable
        start-open
      >
        <v-row no-gutters>
          <span v-if="!distributions.length">
            {{ $t('dynamicLayer.catalogues.noDistributionAvailable') }}
          </span>
          <VcsDataTable
            v-else
            v-model:expanded="expandedDistributionIds"
            class="w-100"
            :items="distributions"
            :headers="headers"
            :items-per-page="distributions.length"
            show-expand
            expand-on-click
          >
            <template #expanded-row="{ columns, item }">
              <DistributionDetails :columns="columns" :distribution="item" />
            </template>
          </VcsDataTable>
        </v-row>
      </VcsFormSection>
    </div>
  </span>
</template>

<script lang="ts">
  import type { PropType } from 'vue';
  import { defineComponent, inject, ref } from 'vue';
  import { VChip, VRow } from 'vuetify/components';
  import {
    VcsDataTable,
    VcsFormSection,
    VcsLabel,
    type VcsUiApp,
  } from '@vcmap/ui';
  import type { DynamicLayerPlugin } from '../index.js';
  import type { Dataset, Distribution } from './catalogues.js';
  import DistributionDetails from './DistributionDetails.vue';
  import { name } from '../../package.json';

  function getHeaders(distributions: Distribution[] = []): Array<object> {
    const headers = [
      {
        title: 'dynamicLayer.common.title',
        value: (item: Distribution): string => item.title ?? item.id,
        cellProps: { nowrap: false },
        nowrap: true,
        key: 'title',
        sortable: true,
      },
    ];
    if (distributions.some((d) => d.format)) {
      headers.push({
        title: 'dynamicLayer.common.format',
        value: (item) => item.format ?? '',
        sortable: true,
        cellProps: { nowrap: false },
        nowrap: true,
        key: 'format',
      });
    }
    if (distributions.some((d) => d.modified)) {
      headers.push({
        title: 'dynamicLayer.info.modified',
        cellProps: { nowrap: true },
        nowrap: true,
        key: 'modified',
        value: (item) => item.modified ?? '',
        sortable: true,
      });
    } else if (distributions.some((d) => d.created)) {
      headers.push({
        title: 'dynamicLayer.info.created',
        cellProps: { nowrap: true },
        nowrap: true,
        key: 'created',
        value: (item) => item.created ?? '',
        sortable: true,
      });
    }
    if (distributions.some((d) => d.license)) {
      headers.push({
        title: 'dynamicLayer.info.license',
        value: (item) => item.license ?? '',
        cellProps: { nowrap: false },
        nowrap: true,
        key: 'license',
        sortable: true,
      });
    }
    return headers;
  }

  export default defineComponent({
    name: 'DatasetDetails',
    components: {
      VChip,
      VRow,
      VcsDataTable,
      VcsFormSection,
      VcsLabel,
      DistributionDetails,
    },
    props: {
      dataset: {
        type: Object as PropType<Dataset>,
        required: true,
      },
    },
    setup(props) {
      const app = inject('vcsApp') as VcsUiApp;
      const plugin = app.plugins.getByKey(name) as DynamicLayerPlugin;
      const { expandedDistributionIds } = plugin.catalogues;
      const { locale } = app;
      const distributions = ref(props.dataset.distributions ?? []);
      const headers = ref(getHeaders(distributions.value as Distribution[]));
      const showAllKeywords = ref(
        props.dataset.keywords && props.dataset.keywords.length <= 4,
      );
      return {
        expandedDistributionIds,
        locale,
        distributions,
        headers,
        showAllKeywords,
      };
    },
  });
</script>

<style lang="scss" scoped>
  :deep(.v-data-table__td) {
    word-break: break-all;
  }
</style>
