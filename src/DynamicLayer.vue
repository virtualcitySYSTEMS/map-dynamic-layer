<template>
  <v-sheet>
    <v-row no-gutters class="d-flex align-center">
      <VcsButton
        v-if="mdAndDown"
        :active="toggleState"
        :disabled="disableToggle"
        :tooltip="$t('dynamicLayer.actions.toggleDatasetList')"
        icon="mdi-view-split-vertical"
        class="toggle-button px-2"
        @click="toggleOverlay"
      />
      <v-tabs color="primary" height="32" :model-value="activeTab">
        <span v-for="type in enabledTabs" :key="type">
          <v-tab
            :value="type"
            :text="$t(`dynamicLayer.${type}.title`)"
            @click="switchCategory(type)"
          >
            <template #append>
              <VcsBadge
                v-if="type === CategoryType.ADDED && addedHasUpdate"
                class="position-absolute"
              />
              <VcsActionButtonList
                v-else-if="
                  type === CategoryType.CATALOGUES &&
                  activeTab === CategoryType.CATALOGUES &&
                  addedCatalogue.length > 1 &&
                  selectedCatalogue
                "
                :actions="cataloguesActions"
                overflow-icon="mdi-chevron-down"
                :overflow-count="0"
              />
            </template>
          </v-tab>
        </span>
      </v-tabs>
    </v-row>
    <v-divider />
    <v-container class="pa-0 dl-content">
      <v-tabs-window v-model="activeTab" class="h-100">
        <v-tabs-window-item :value="CategoryType.WEBDATA" class="h-100">
          <Webdata />
        </v-tabs-window-item>
        <v-tabs-window-item :value="CategoryType.CATALOGUES" class="h-100">
          <Catalogues />
        </v-tabs-window-item>
        <v-tabs-window-item :value="CategoryType.ADDED" class="h-100">
          <AddedData />
        </v-tabs-window-item>
      </v-tabs-window>
    </v-container>
  </v-sheet>
</template>

<script lang="ts">
  import {
    computed,
    defineComponent,
    inject,
    onMounted,
    onUnmounted,
    reactive,
    ref,
    watch,
  } from 'vue';
  import {
    VTab,
    VTabs,
    VTabsWindow,
    VTabsWindowItem,
    VContainer,
    VSheet,
    VDivider,
    VRow,
  } from 'vuetify/components';
  import { useDisplay } from 'vuetify';
  import {
    VcsActionButtonList,
    VcsBadge,
    VcsButton,
    type VcsUiApp,
  } from '@vcmap/ui';
  import type { DynamicLayerPlugin } from './index.js';
  import { CategoryType } from './constants.js';
  import Webdata from './webdata/WebdataWindow.vue';
  import Catalogues from './catalogues/CataloguesWindow.vue';
  import AddedData from './AddedData.vue';
  import { name } from '../package.json';

  export const dynamicLayerId = 'dynamic_layer_window_id';

  export default defineComponent({
    name: 'DynamicLayer',
    components: {
      VContainer,
      VDivider,
      VRow,
      VSheet,
      VTab,
      VTabs,
      VTabsWindow,
      VTabsWindowItem,
      VcsActionButtonList,
      VcsBadge,
      VcsButton,
      AddedData,
      Catalogues,
      Webdata,
    },
    setup() {
      const app = inject('vcsApp') as VcsUiApp;
      const plugin = app.plugins.getByKey(name) as DynamicLayerPlugin;
      const { activeTab, addedToMap, config, leftPanelActive } = plugin;
      const { added: addedCatalogue, selected: selectedCatalogue } =
        plugin.catalogues;

      const enabledTabs = computed(() => {
        return [
          ...Object.values(CategoryType).filter((t) =>
            config.enabledTabs.includes(t),
          ),
          ...(addedToMap.value.length ? [CategoryType.ADDED] : []),
        ];
      });
      const cataloguesActions = computed(() => [
        reactive({
          name: 'dynamicLayer.actions.overview',
          callback: (): void => {
            selectedCatalogue.value = undefined;
          },
        }),
        ...addedCatalogue.value.map((c) => {
          return reactive({
            name: c.title,
            title: `${c.data.count.toLocaleString(app.locale)} ${app.vueI18n.t('dynamicLayer.catalogues.datasets')} @ ${new URL(c.url).host}`,
            active: computed(() => selectedCatalogue.value?.url === c.url),
            callback: (): void => {
              selectedCatalogue.value = c;
            },
          });
        }),
      ]);

      const addedHasUpdate = ref(false);
      watch(
        () => addedToMap.value.length,
        (oldLength, newLength) => {
          addedHasUpdate.value = oldLength > newLength || addedHasUpdate.value;
        },
      );
      watch(activeTab, () => {
        if (activeTab.value === CategoryType.ADDED) {
          addedHasUpdate.value = false;
        }
      });

      const { mdAndDown } = useDisplay();
      const disableToggle = computed(
        () =>
          activeTab.value === CategoryType.CATALOGUES &&
          !selectedCatalogue.value,
      );
      const toggleState = computed(() => leftPanelActive[activeTab.value]);
      const toggleOverlay = (): void => {
        leftPanelActive[activeTab.value] = !leftPanelActive[activeTab.value];
      };
      const handleEscape = (event: KeyboardEvent): void => {
        if (event.key === 'ArrowRight' && mdAndDown.value) {
          toggleOverlay();
        }
      };

      onMounted(() => {
        window.addEventListener('keydown', handleEscape);
      });

      onUnmounted(() => {
        window.removeEventListener('keydown', handleEscape);
      });

      return {
        mdAndDown,
        disableToggle,
        toggleState,
        toggleOverlay,
        CategoryType,
        activeTab,
        enabledTabs,
        addedCatalogue,
        selectedCatalogue,
        cataloguesActions,
        addedHasUpdate,

        switchCategory(cat: CategoryType): void {
          if (
            activeTab.value === CategoryType.CATALOGUES &&
            cat === CategoryType.CATALOGUES &&
            addedCatalogue.value.length > 1
          ) {
            selectedCatalogue.value = undefined;
          }
          activeTab.value = cat;
        },
      };
    },
  });
</script>
<style lang="scss" scoped>
  .dl-content {
    height: calc(562px - var(--v-vcs-font-size) * 2 - 6px);
  }
  .vcs-badge {
    top: 4px;
    right: 2px;
  }
  .toggle-button {
    :deep(.v-icon) {
      font-size: 24px !important;
    }
  }
</style>
