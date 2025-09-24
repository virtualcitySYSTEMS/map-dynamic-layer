<template>
  <span class="d-block h-100">
    <v-row no-gutters>
      <v-col cols="12" class="d-flex align-center bg-base-lighten-3 px-1">
        <VcsTreeviewSearchbar
          v-model="search"
          class="w-100"
          :loading="searchLoading"
          :placeholder="`${$t('dynamicLayer.catalogues.searchAmong')} ${data.count.toLocaleString(locale)} ${$t('dynamicLayer.catalogues.datasets')}`"
          @click:clear="updateSearch"
          @keyup.enter="updateSearch"
        />
        <VcsActionButtonList
          v-if="sortByActions?.length"
          class="px-1"
          :actions="sortByActions"
          button="VcsButton"
          overflow-icon="mdi-sort"
          :overflow-count="0"
        />

        <VcsButton
          v-if="data.facets.length"
          class="pl-2"
          :active="Object.values(filters).some((f) => f.length)"
          icon="mdi-filter"
          :tooltip="$t('dynamicLayer.common.filter')"
        >
          <v-menu
            activator="parent"
            :close-on-content-click="false"
            :menu-props="{ closeOnContentClick: true }"
            location="end"
          >
            <v-card min-width="300">
              <v-row
                v-for="facet in data.facets"
                :key="facet.id"
                no-gutters
                class="px-2 py-1"
              >
                <CatalogueFilter
                  :facet="facet"
                  :selection="filters[facet.id]"
                  :opened="openedFacet === facet.id"
                  @filter="updateFilters"
                  @toggle-facet="(id) => (openedFacet = id)"
                />
              </v-row>
            </v-card>
          </v-menu>
        </VcsButton>
      </v-col>
    </v-row>
    <div v-if="loading" class="h-100 d-flex align-center justify-center">
      <v-icon size="2em" color="primary" icon="$vcsProgress" />
    </div>
    <v-row v-else no-gutters>
      <VcsList
        v-model="arraySelected"
        selectable
        single-select
        return-object
        :items="datasets"
      />
    </v-row>
    <v-row no-gutters class="d-flex justify-center">
      <VPagination
        v-model="page"
        class="w-100"
        prev-icon="mdi-chevron-left"
        next-icon="mdi-chevron-right"
        active-color="primary"
        density="compact"
        :length="Math.ceil(data.count / itemsPerPage)"
        total-visible="5"
      />
    </v-row>
  </span>
</template>

<script lang="ts">
  import type { PropType } from 'vue';
  import { computed, defineComponent, inject, reactive, ref, watch } from 'vue';
  import {
    VCard,
    VCol,
    VIcon,
    VMenu,
    VPagination,
    VRow,
  } from 'vuetify/components';
  import {
    NotificationType,
    VcsActionButtonList,
    VcsList,
    VcsButton,
    VcsTreeviewSearchbar,
    type VcsListItem,
    type VcsUiApp,
  } from '@vcmap/ui';
  import type { DynamicLayerPlugin } from '../index.js';
  import type { CatalogueItem } from './catalogues.js';
  import { fetchCatalogue, sortOptions } from './catalogues.js';
  import CatalogueFilter from './CataloguesFilter.vue';
  import { name } from '../../package.json';

  /** Maps Datasets to VcsListItems */
  function createDatasetsList(
    results: Array<{ id: string; title: string }>,
  ): Array<VcsListItem> {
    return results.map((i) => {
      return { name: i.id, title: i.title };
    });
  }

  export default defineComponent({
    name: 'DatasetsList',
    components: {
      VCard,
      VCol,
      VIcon,
      VMenu,
      VPagination,
      VRow,
      VcsActionButtonList,
      VcsList,
      VcsButton,
      VcsTreeviewSearchbar,
      CatalogueFilter,
    },
    props: {
      source: {
        type: Object as PropType<CatalogueItem>,
        required: true,
      },
    },
    emits: ['select'],
    setup(props, { emit }) {
      const app = inject('vcsApp') as VcsUiApp;
      const plugin = app.plugins.getByKey(name) as DynamicLayerPlugin;
      const { locale } = app;
      const { itemsPerPage } = plugin.config.catalogues;
      const data = ref(props.source.data);

      const search = ref('');
      const searchLoading = ref(false);

      const loading = ref(false);
      const sortBy = ref(sortOptions[props.source.type]?.[0]);
      const sortByActions = sortOptions[props.source.type]?.map((sort) =>
        reactive({
          active: computed(() => sortBy.value === sort),
          name: `dynamicLayer.catalogues.sortBy.${sort}`,
          callback: (): void => {
            sortBy.value = sort;
          },
        }),
      );

      const datasets = ref(createDatasetsList(data.value.datasets));
      const page = ref(1);
      const showDatasetDescription = ref(true);
      const arraySelected = computed({
        get: () => [],
        set(value?: Array<VcsListItem>) {
          const selection = value?.[0]
            ? data.value.datasets.find((i) => i.id === value[0].name)
            : undefined;
          emit('select', selection);
        },
      });

      const filters = Object.fromEntries(
        data.value.facets.map((f) => [f.id, [] as Array<string>]),
      );
      const openedFacet = ref();
      const silentUpdatePage = ref(false);

      async function updateResults(
        keepCurrentPage = false,
        previousPage = 1,
      ): Promise<void> {
        loading.value = true;
        if (!keepCurrentPage) {
          page.value = 1;
        }

        const fetchedData = await fetchCatalogue(
          props.source.type,
          props.source.url,
          itemsPerPage,
          props.source.filter,
          locale,
          page.value - 1,
          search.value ?? '',
          sortBy.value,
          Object.fromEntries(
            Object.entries(filters).filter((f) => f[1].length > 0),
          ),
        )
          .catch(() => {
            silentUpdatePage.value = true;
            page.value = previousPage;
            app.notifier.add({
              type: NotificationType.ERROR,
              message: `${app.vueI18n.t('dynamicLayer.errors.fetchingCatalogue')} ${props.source.url}`,
            });
          })
          .finally(() => {
            loading.value = false;
          });

        if (fetchedData) {
          data.value = fetchedData;
          datasets.value = createDatasetsList(data.value.datasets);
          arraySelected.value = undefined;
        }
      }

      watch(sortBy, async () => {
        await updateResults();
      });
      watch(page, async (_, oldPage) => {
        if (silentUpdatePage.value) {
          silentUpdatePage.value = false;
          return;
        }
        await updateResults(true, oldPage);
      });

      return {
        locale: app.locale,
        data,
        page,
        itemsPerPage,
        loading,
        search,
        searchLoading,
        sortByActions,
        showDatasetDescription,
        datasets,
        arraySelected,
        filters,
        openedFacet,
        async updateFilters(
          filterId: string,
          selection: Array<string>,
        ): Promise<void> {
          filters[filterId] = selection;
          await updateResults();
        },
        async updateSearch(): Promise<void> {
          searchLoading.value = true;
          await updateResults();
          searchLoading.value = false;
        },
      };
    },
  });
</script>

<style lang="scss" scoped>
  :deep(.v-list) {
    width: 100%;
    height: 448px;
  }
  :deep(.v-pagination__list) {
    .v-pagination__prev {
      position: absolute;
      left: 0px;
    }
    .v-pagination__item > button {
      width: fit-content;
      min-width: 28px;
    }
    .v-pagination__next {
      position: absolute;
      right: 58.5%;
    }
  }
</style>
