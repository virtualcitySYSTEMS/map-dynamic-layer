import {
  LayerContentTreeItem,
  NotificationType,
  type VcsAction,
  type VcsUiApp,
} from '@vcmap/ui';
import { getLogger } from '@vcsuite/logger';
import { reactive } from 'vue';
import type { DynamicLayerPlugin } from '../index.js';
import { createContentTreeName } from '../helper.js';
import { applyFnToItemAndChildren } from './webdataHelper.js';
import type { DataItem } from './webdataConstants.js';
import { itemToLayer } from './webdataApi.js';
import { CategoryType } from '../constants.js';
import { name } from '../../package.json';

/** Name of actions available for loaded elements. */
export enum ActionsNames {
  AddToMap = 'dynamicLayer.actions.layer.add',
  AddAll = 'dynamicLayer.actions.layer.addAll',
  EditLayer = 'editLayer',
  RemoveLayer = 'dynamicLayer.actions.layer.remove',
  DeleteSource = 'dynamicLayer.actions.source.delete',
}

/**
 * Counts the number of children not added to the Map. Deeply nested children are taken into account.
 * @param rootItem The item for which to count children not added to the Map.
 * @returns The number of nested childre not added to the Map.
 */
export function getNonAddedChildrenLength(rootItem: DataItem): number {
  let count = rootItem.children.filter((c) => !c.isAddedToMap).length ?? 0;
  function countChildren(item: DataItem[]): void {
    item
      .filter((child) => child.children.length)
      .forEach((child) => {
        count =
          count +
          (child.children.filter((c) => !c.isAddedToMap).length ?? 0) -
          1;
        if (child.children) {
          countChildren(child.children);
        }
      });
  }
  countChildren(rootItem.children);
  return count;
}

/**
 * Creates a layer from the passed item and adds it to the Map.
 * @param app The VcsUiApp.
 * @param item The item from which to create and add a layer.
 */
export async function addLayerFromItem(
  app: VcsUiApp,
  item: DataItem,
): Promise<void> {
  if (app.layers.hasKey(item.name)) {
    app.notifier.add({
      type: NotificationType.ERROR,
      message: `${app.vueI18n.t('dynamicLayer.common.theLayer')} ${item.title} ${app.vueI18n.t('dynamicLayer.errors.alreadyAdded')}`,
    });
  } else {
    const plugin = app.plugins.getByKey(name) as DynamicLayerPlugin;
    try {
      const layer = itemToLayer(item, plugin.layerIndex);
      await layer.activate();
      layer.properties.featureInfo = name;
      app.layers.add(layer);

      // Ensures if layer URL is a key in the plugin state
      if (!plugin.state[layer.url]) {
        plugin.state[layer.url] = { layerNames: [], type: item.type };
      }
      // Ensures item name is part of the plugin state
      if (!plugin.state[layer.url].layerNames.includes(item.name)) {
        plugin.state[layer.url].layerNames.push(item.name);
      }
      item.isAddedToMap = true;
      const contentTreeName = createContentTreeName(layer.name);
      const contentTreeItem = new LayerContentTreeItem(
        {
          name: contentTreeName,
          layerName: layer.name,
          title: item.title,
        },
        app,
      );
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      item.actions = getTreeviewDefaultActions(app, item);
      app.contentTree.add(contentTreeItem);
      plugin.addedToMap.value.push(item);
      plugin.addedSelected.value = item;

      if (plugin.activeTab.value === CategoryType.WEBDATA) {
        plugin.webdata.selected.value = item;
      }

      app.notifier.add({
        type: NotificationType.SUCCESS,
        message: `${app.vueI18n.t('dynamicLayer.common.theLayer')} ${item.title} ${app.vueI18n.t('dynamicLayer.info.successfullyAdded')}`,
      });
    } catch (error) {
      app.notifier.add({
        type: NotificationType.ERROR,
        title: `${app.vueI18n.t('dynamicLayer.errors.addingLayer')}: ${item.title}`,
        message: error as string,
      });
    }
  }
}

/**
 * Creates layers from the children of the passed item and adds them to the Map.
 * @param app The VcsUiApp.
 * @param item The item from which to add the nested items.
 */
export function addAllNestedLayersFromItem(
  app: VcsUiApp,
  item: DataItem,
): void {
  const plugin = app.plugins.getByKey(name) as DynamicLayerPlugin;
  item.children
    .filter((child) => !child.isAddedToMap)
    .forEach((child) => {
      applyFnToItemAndChildren((i) => {
        addLayerFromItem(app, i).catch((error: unknown) => {
          getLogger(name).error(String(error));
        });
      }, child);
    });
  if (plugin.activeTab.value === CategoryType.WEBDATA) {
    plugin.webdata.selected.value = item;
  }
}

/**
 * Removes the layer relative to the passed item.
 * @param app The VcsUiApp.
 * @param item The item from which has been created the layer to remove.
 */
export function removeLayer(app: VcsUiApp, item: DataItem): void {
  const { state, addedToMap, addedSelected } = app.plugins.getByKey(
    name,
  ) as DynamicLayerPlugin;
  if (addedSelected.value?.name === item.name) {
    addedSelected.value = undefined;
  }
  const layer = app.layers.getByKey(item.name);
  if (layer) {
    app.layers.remove(layer);
    layer.destroy();
  }
  const contentTreeName = createContentTreeName(item.name);
  const contentTreeItem = app.contentTree.getByKey(contentTreeName);
  if (contentTreeItem) {
    app.contentTree.remove(contentTreeItem);
  }
  if (state[item.url]) {
    if (state[item.url].layerNames.includes(item.name)) {
      state[item.url].layerNames.splice(
        state[item.url].layerNames.findIndex((n) => n === item.name),
        1,
      );
    }
    if (!state[item.url].layerNames.length) {
      delete state[item.url];
    }
  }
  const index = addedToMap.value.indexOf(item);
  addedToMap.value.splice(index, 1);
  item.isAddedToMap = false;
  item.icon = undefined;
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  item.actions = getTreeviewDefaultActions(app, item);
}

/**
 * Removes an added Webdata source, ensuring that all its children layers are removed too.
 * @param app The VcsUiApp.
 * @param item The item from which to add the nested items.
 */
export function removeSource(app: VcsUiApp, item: DataItem): void {
  const plugin = app.plugins.getByKey(name) as DynamicLayerPlugin;
  plugin.webdata.selected.value = undefined;
  applyFnToItemAndChildren((i: DataItem) => {
    removeLayer(app, i);
  }, item);
  const { value: webdata } = plugin.webdata.added;
  webdata.splice(webdata.indexOf(item), 1);
}

/**
 * Creates VcsActions for the passed item of the ContentTree.
 * @param app The VcsUiApp.
 * @param item The item to which add the actions.
 * @returns The required actions for the passed item.
 */
export function getTreeviewDefaultActions(
  app: VcsUiApp,
  item: DataItem,
): Array<VcsAction> {
  const actions: VcsAction[] = [];
  if (item.isAddedToMap) {
    actions.push(
      reactive({
        icon: 'mdi-map-check-outline',
        name: ActionsNames.RemoveLayer,
        title: ActionsNames.RemoveLayer,
        callback: removeLayer.bind(null, app, item),
      }),
    );
  }
  if (!item.children.length && !item.isAddedToMap) {
    actions.push(
      reactive({
        icon: '$vcsPlus',
        name: ActionsNames.AddToMap,
        title: ActionsNames.AddToMap,
        callback: addLayerFromItem.bind(null, app, item),
      }),
    );
  }
  if (item.children.some((c) => !c.isAddedToMap)) {
    actions.push(
      reactive({
        name: ActionsNames.AddAll,
        callback: addAllNestedLayersFromItem.bind(null, app, item),
      }),
    );
  }
  if (item.isRootElement) {
    actions.push(
      reactive({
        name: ActionsNames.DeleteSource,
        callback: removeSource.bind(null, app, item),
      }),
    );
  }
  return actions;
}
