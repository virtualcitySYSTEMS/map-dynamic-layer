import {
  ButtonLocation,
  callSafeAction,
  createToggleAction,
  GroupContentTreeItem,
  TableFeatureInfoView,
  WindowSlot,
  type PluginConfigEditor,
  type VcsPlugin,
  type VcsUiApp,
} from '@vcmap/ui';
import { markVolatile, maxZIndex } from '@vcmap/core';
import { getLogger } from '@vcsuite/logger';
import type { Ref } from 'vue';
import { reactive, ref } from 'vue';
import { deepmergeCustom } from 'deepmerge-ts';
import { name, version, mapVersion } from '../package.json';
import de from './i18n/de.json';
import en from './i18n/en.json';
import DynamicLayer, { dynamicLayerId } from './DynamicLayer.vue';
import DynamicLayerConfigEditor from './DynamicLayerConfigEditor.vue';
import { fetchSource } from './webdata/webdataApi.js';
import { addLayerFromItem } from './webdata/webdataActionsHelper.js';
import { CategoryType } from './constants.js';
import type { DataItem, WebdataTypes } from './webdata/webdataConstants.js';
import type { CatalogueItem, Dataset } from './catalogues/catalogues.js';
import { applyFnToItemAndChildren } from './webdata/webdataHelper.js';
import { preloadCatalogues } from './helper.js';
import type { DynamicLayerConfig } from './defaultOptions.js';
import { getDefaultOptions } from './defaultOptions.js';

type AddedLayersState = Record<
  string,
  { layerNames: Array<string>; type: WebdataTypes }
>;
export type EntryPointState = {
  /** The catalogue URL */
  url: string;
  /** The dataset identifier. */
  dataset: string;
  /** The distribution identifier. */
  distrib: string;
};
type DynamicLayerState = AddedLayersState & { entry?: EntryPointState };

type DynamicLayerWebdata = {
  /** The added webdata sources. */
  added: Ref<Array<DataItem>>;
  /** The selected webdata item, in the content tree. */
  selected: Ref<DataItem | undefined>;
  /** The opened webdata nodes names, in the content tree. */
  opened: Ref<Array<string>>;
};
type DynamicLayerCatalogues = {
  /** The added catalogues. */
  added: Ref<Array<CatalogueItem>>;
  /** The opened catalogue. */
  selected: Ref<CatalogueItem | undefined>;
  /** The selected dataset. */
  selectedDataset: Ref<Dataset | undefined>;
  /** The expanded distributions. */
  expandedDistributionIds: Ref<Array<string>>;
};

export type DynamicLayerPlugin = VcsPlugin<
  DynamicLayerConfig,
  DynamicLayerState
> & {
  config: DynamicLayerConfig;
  state: DynamicLayerState;
  activeTab: Ref<CategoryType>;
  addedToMap: Ref<Array<DataItem>>;
  /** The selected item in the Added tab. */
  addedSelected: Ref<DataItem | undefined>;
  webdata: DynamicLayerWebdata;
  catalogues: DynamicLayerCatalogues;
  layerIndex: number;
};

export default function plugin(
  options: DynamicLayerConfig,
): DynamicLayerPlugin {
  let app: VcsUiApp;
  let layerIndex: number;
  const listeners: Array<() => void> = [];
  const state: DynamicLayerState = reactive({});
  const configMerge = deepmergeCustom({ mergeArrays: false });
  const config: DynamicLayerConfig = configMerge(getDefaultOptions(), options);

  const addedToMap = ref([]);
  const addedSelected: Ref<DataItem | undefined> = ref();
  const activeTab = ref(
    config.enabledTabs.includes(config.defaultTab)
      ? config.defaultTab
      : config.enabledTabs[0],
  );
  const catalogues: DynamicLayerCatalogues = {
    added: ref([]),
    selected: ref(),
    selectedDataset: ref(),
    expandedDistributionIds: ref([]),
  };
  const webdata: DynamicLayerWebdata = {
    added: ref([]),
    selected: ref(),
    opened: ref([]),
  };

  return {
    get name(): string {
      return name;
    },
    get version(): string {
      return version;
    },
    get mapVersion(): string {
      return mapVersion;
    },
    get config(): DynamicLayerConfig {
      return config;
    },
    state,
    activeTab,
    addedToMap,
    addedSelected,
    catalogues,
    webdata,

    get layerIndex(): number {
      if (!layerIndex) {
        const layerIndexes = [...app.layers]
          .map((l) => l.zIndex)
          .filter((i) => i < maxZIndex);
        layerIndex = Math.max(0, ...layerIndexes);
      }
      layerIndex += 1;
      return layerIndex;
    },

    initialize(
      this: DynamicLayerPlugin,
      vcsUiApp: VcsUiApp,
      pluginState?: DynamicLayerState,
    ): Promise<void> {
      app = vcsUiApp;

      if (!activeTab.value) {
        throw new Error(
          `${name} ${app.vueI18n.t('dynamicLayer.error.noActiveCategory')}`,
        );
      }
      const { action, destroy } = createToggleAction(
        {
          name: 'dynamicLayer.title',
          icon: 'mdi-database-search-outline',
          title: 'dynamicLayer.title',
        },
        {
          id: dynamicLayerId,
          component: DynamicLayer,
          state: {
            infoUrlCallback: app.getHelpUrlCallback(
              '/tools/dynamicLayerTool.html',
            ),
            headerTitle: 'dynamicLayer.title',
            headerIcon: 'mdi-database-search-outline',
          },
          slot: WindowSlot.DETACHED,
          position: {
            left: '20%',
            right: '20%',
            top: '10%',
            height: 600,
            minWidth: 800,
          },
        },
        vcsUiApp.windowManager,
        name,
      );
      listeners.push(destroy);

      vcsUiApp.navbarManager.add(
        { id: name, action },
        name,
        ButtonLocation.CONTENT,
      );
      const contentTreeItem = new GroupContentTreeItem(
        {
          name,
          title: 'dynamicLayer.contentTreeTitle',
          initOpen: true,
        },
        vcsUiApp,
      );
      markVolatile(contentTreeItem);
      vcsUiApp.contentTree.add(contentTreeItem);
      const tableView = new TableFeatureInfoView({ name });
      markVolatile(tableView);
      vcsUiApp.featureInfo.add(tableView);

      if (config.enabledTabs.includes(CategoryType.CATALOGUES)) {
        preloadCatalogues(app, config.catalogues.presets, pluginState?.entry);
      }
      if (pluginState) {
        Object.entries(pluginState).forEach(([key, value]) => {
          if (key === 'entry') {
            state.entry = value as EntryPointState;
            callSafeAction(action);
          } else {
            const { type, layerNames } = value as {
              layerNames: Array<string>;
              type: WebdataTypes;
            };
            fetchSource(app, key, type)
              .then((item) => {
                item.children.forEach((child) => {
                  applyFnToItemAndChildren((i) => {
                    if (layerNames.includes(i.name)) {
                      addLayerFromItem(app, i).catch((error: unknown) => {
                        getLogger(name).error(String(error));
                      });
                    }
                  }, child);
                });
                webdata.added.value.push(item);
              })
              .catch((e: unknown) => {
                getLogger(name).error(String(e));
              });
          }
        });
      }

      return Promise.resolve();
    },
    getState(): DynamicLayerState {
      return state;
    },
    i18n: { en, de },
    toJSON(): DynamicLayerConfig {
      return {
        defaultTab: config.defaultTab,
        enabledTabs: config.enabledTabs,
        webdata: config.webdata,
        catalogues: config.catalogues,
      };
    },
    getConfigEditors(): PluginConfigEditor<object>[] {
      return [
        {
          component: DynamicLayerConfigEditor,
          title: 'dynamicLayer.configEditorTitle',
          infoUrlCallback: app.getHelpUrlCallback(
            '/components/plugins/dynamicLayerConfig.html',
            'app-configurator',
          ),
        },
      ];
    },
    destroy(): void {
      listeners.forEach((cb) => {
        cb();
      });
      app.navbarManager.remove(name);
      const contentTreeItem = app.contentTree.getByKey(name);
      if (contentTreeItem) {
        app.contentTree.remove(contentTreeItem);
      }
      const featureInfo = app.featureInfo.getByKey(name);
      if (featureInfo) {
        app.featureInfo.remove(featureInfo);
      }
    },
  };
}
