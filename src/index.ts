import {
  createToggleAction,
  ButtonLocation,
  GroupContentTreeItem,
  TableFeatureInfoView,
  WindowSlot,
  VcsPlugin,
  VcsUiApp,
  PluginConfigEditor,
} from '@vcmap/ui';
import { Ref, reactive, ref } from 'vue';
import { name, version, mapVersion } from '../package.json';
import de from './i18n/de.json';
import en from './i18n/en.json';
import DynamicLayer, { dynamicLayerId } from './DynamicLayer.vue';
import DynamicLayerConfigEditor from './DynamicLayerConfigEditor.vue';
import { fetchSource } from './webdata/webdataApi.js';
import { ActionsNames } from './webdata/webdataActionsHelper.js';
import { CategoryType } from './constants.js';
import { DataItem, WebdataTypes } from './webdata/webdataConstants.js';
import { applyFnToItemAndChildren } from './webdata/webdataHelper.js';

export type DynamicLayerConfig = {
  defaultTab: CategoryType;
  webdataDefaultType: WebdataTypes;
  webdataDefaultUrl: string;
};
export function getDefaultOptions(): DynamicLayerConfig {
  return {
    defaultTab: CategoryType.WEBDATA,
    webdataDefaultType: WebdataTypes.WMS,
    webdataDefaultUrl: '',
  };
}
type DynamicLayerState = {
  [url: string]: { layerNames: Array<string>; type: WebdataTypes };
};
type DynamicLayerWebdata = {
  /** The added webdata sources. */
  added: Ref<Array<DataItem>>;
  /** The selected webdata item, in the content tree. */
  selected: Ref<DataItem | undefined>;
  /** The opened webdata nodes, in the content tree. */
  opened: Ref<Array<DataItem>>;
};
type DynamicLayerCatalogues = {
  added: Ref<Array<never>>;
};

export type DynamicLayerPlugin = VcsPlugin<
  DynamicLayerConfig,
  DynamicLayerState
> & {
  config: DynamicLayerConfig;
  state: DynamicLayerState;
  webdata: DynamicLayerWebdata;
  catalogues: DynamicLayerCatalogues;
};

export default function plugin(
  options: DynamicLayerConfig,
): DynamicLayerPlugin {
  let app: VcsUiApp;
  const listeners: Array<() => void> = [];
  const config: DynamicLayerConfig = { ...getDefaultOptions(), ...options };
  const state: DynamicLayerState = reactive({});
  const webdata: DynamicLayerWebdata = {
    added: ref([]),
    selected: ref(),
    opened: ref([]),
  };
  const catalogues = { added: ref([]) };

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
    webdata,
    catalogues,
    initialize(
      this: DynamicLayerPlugin,
      vcsUiApp: VcsUiApp,
      pluginState?: DynamicLayerState,
    ): Promise<void> {
      app = vcsUiApp;
      const { action, destroy } = createToggleAction(
        {
          name: 'dynamicLayerButton',
          icon: 'mdi-database-search-outline',
          title: 'dynamicLayer.title',
        },
        {
          id: dynamicLayerId,
          component: DynamicLayer,
          state: {
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
      vcsUiApp.contentTree.add(
        new GroupContentTreeItem(
          {
            name,
            title: 'dynamicLayer.contentTreeTitle',
            initOpen: true,
          },
          vcsUiApp,
        ),
      );
      vcsUiApp.featureInfo.add(new TableFeatureInfoView({ name }));

      if (pluginState) {
        Object.entries(pluginState).forEach(([url, value]) => {
          const { type, layerNames } = value;
          // eslint-disable-next-line no-void
          void fetchSource(app, url, type).then((sourceItem) => {
            applyFnToItemAndChildren((i: DataItem) => {
              if (layerNames.includes(i.name)) {
                // eslint-disable-next-line no-void
                void i.actions
                  .find((a) => a.name === ActionsNames.AddToMap)!
                  .callback(new PointerEvent(''));
              }
            }, sourceItem);
          });
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
        webdataDefaultType: config.webdataDefaultType,
        webdataDefaultUrl: config.webdataDefaultUrl,
      };
    },
    getConfigEditors(): PluginConfigEditor<object>[] {
      return [{ component: DynamicLayerConfigEditor }];
    },
    destroy(): void {
      listeners.forEach((cb) => cb());
    },
  };
}
