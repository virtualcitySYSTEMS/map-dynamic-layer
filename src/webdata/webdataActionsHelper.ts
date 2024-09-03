import {
  LayerContentTreeItem,
  NotificationType,
  VcsAction,
  VcsUiApp,
} from '@vcmap/ui';
import { Layer } from '@vcmap/core';
import { reactive } from 'vue';
import { DynamicLayerPlugin } from 'src';
import { applyFnToItemAndChildren } from './webdataHelper.js';
import { DataItem } from './webdataConstants.js';
import { itemToLayer } from './webdataApi.js';
import { name } from '../../package.json';

/** Name of actions available for loaded elements. */
export enum ActionsNames {
  AddToMap = 'addToMap',
  AddAll = 'addAll',
  EditLayer = 'editLayer',
  RemoveLayer = 'removeLayer',
  DeleteSource = 'removeSource',
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
  const plugin = app.plugins.getByKey(name) as DynamicLayerPlugin;

  const addLayerAction: VcsAction = reactive({
    icon: '$vcsPlus',
    name: ActionsNames.AddToMap,
    title: 'dynamicLayer.actions.addToMap',
    callback(): void {
      if (app.layers.hasKey(item.name)) {
        app.notifier.add({
          type: NotificationType.ERROR,
          message: `The layer ${item.title} has already been added!`,
        });
      } else {
        const layer = itemToLayer(plugin, item);
        app.layers.add(layer);
        layer.activate().catch((e) => {
          app.notifier.add({ type: NotificationType.ERROR, message: e });
        });
        if (!plugin.state?.[item.url]) {
          plugin.state[item.url] = { layerNames: [], type: item.type };
        }
        if (!plugin.state?.[item.url]?.layerNames.includes(item.name)) {
          plugin.state[item.url].layerNames.push(item.name);
        }
        item.isAddedToMap = true;
        item.icon = 'mdi-map-check-outline';
        const contentTreeItem = new LayerContentTreeItem(
          {
            // remove all points in the layer name, otherwise they don't show up
            name: `${name}.${layer.name.replaceAll('.', '')}`,
            layerName: layer.name,
            title: item.title,
          },
          app,
        );
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        const removeAction = getRemoveLayerAction(
          app,
          layer,
          item,
          contentTreeItem,
        );
        item.actions.push(removeAction);
        app.contentTree.add(contentTreeItem);
        plugin.webdata.selected.value = item;
      }
    },
  });

  const addAllAction: VcsAction = reactive({
    icon: 'mdi-map-plus',
    name: ActionsNames.AddAll,
    title: 'dynamicLayer.actions.addAll',
    callback(): void {
      plugin.webdata.selected.value = item;
      applyFnToItemAndChildren((i: DataItem) => {
        // eslint-disable-next-line no-void
        void i.actions
          .find((a) => a.name === ActionsNames.AddToMap)
          ?.callback(this);
      }, item);
    },
  });

  // TODO? add a vdialog to confirm deletion the source when layers are added?
  const removeSourceAction: VcsAction = reactive({
    icon: 'mdi-trash-can-outline',
    name: ActionsNames.DeleteSource,
    title: 'dynamicLayer.actions.deleteSource',
    callback(): void {
      plugin.webdata.selected.value = undefined;
      applyFnToItemAndChildren((i: DataItem) => {
        // eslint-disable-next-line no-void
        void i.actions
          .find((a) => a.name === ActionsNames.RemoveLayer)
          ?.callback(this);
      }, item);
      const { value: webdata } = plugin.webdata.added;
      webdata.splice(webdata.indexOf(item), 1);
    },
  });

  return [
    ...(item?.isRootElement ? [removeSourceAction] : []),
    ...(item.children?.some((c) => !c.isAddedToMap) ? [addAllAction] : []),
    ...(!item?.isAddedToMap && !item.children?.length ? [addLayerAction] : []),
  ];
}

/**
 * Creates a VcsAction to remove a layer.
 * @param app The VcsUiApp.
 * @param layer The layer for which to get a removeAction.
 * @param item The DataItem used to create the layer.
 * @param contentTreeItem The ContentTree item of the layer.
 * @returns A VcsAction to remove the layer.
 */
export function getRemoveLayerAction(
  app: VcsUiApp,
  layer: Layer,
  item: DataItem,
  contentTreeItem: LayerContentTreeItem,
): VcsAction {
  const plugin = app.plugins.getByKey(name) as DynamicLayerPlugin;
  item.actions = getTreeviewDefaultActions(app, item);
  const removeLayerAction: VcsAction = reactive({
    name: ActionsNames.RemoveLayer,
    title: 'dynamicLayer.actions.removeLayer',
    icon: 'mdi-close',
    callback: () => {
      app.layers.remove(layer);
      layer.destroy();
      app.contentTree.remove(contentTreeItem);
      plugin.state[layer.url].layerNames.splice(
        plugin.state[layer.url].layerNames.findIndex((n) => n === item.name),
        1,
      );
      if (!plugin.state[layer.url].layerNames.length) {
        delete plugin.state[layer.url];
      }
      item.isAddedToMap = false;
      item.icon = undefined;
      item.actions = getTreeviewDefaultActions(app, item);
    },
  });
  return removeLayerAction;
}

/**
 * Counts the number of children not added to the Map. Deeply nested children are taken into account.
 * @param rootItem The item for which to count children not added to the Map.
 * @returns The number of nested childre not added to the Map.
 */
export function getNonAddedChildrenLength(rootItem: DataItem): number {
  let count = rootItem.children?.filter((c) => !c.isAddedToMap).length ?? 0;
  function countChildren(item: DataItem[]): void {
    item
      .filter((child) => child.children?.length)
      .forEach((child) => {
        count =
          count +
          (child.children?.filter((c) => !c.isAddedToMap).length ?? 0) -
          1;
        if (child?.children) countChildren(child.children);
      });
  }
  countChildren(rootItem.children!);
  return count;
}
