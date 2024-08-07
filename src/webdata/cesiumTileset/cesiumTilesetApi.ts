import { CesiumTilesetLayer } from '@vcmap/core';
import { VcsUiApp } from '@vcmap/ui';
import { getTreeviewDefaultActions } from '../webdataActionsHelper.js';
import { DynamicLayerPlugin } from '../../index.js';
import { DataItem, WebdataTypes } from '../webdataConstants.js';
import { name } from '../../../package.json';
import { getUniqueLayerName } from '../webdataHelper.js';

/**
 * Creates, adds to the plugin and returns the created DataItem.
 * @param app The VcsUiApp.
 * @param url The URL of the 3DTileset to add.
 * @returns The created DataItem.
 */
export function addCesiumTilesetSource(app: VcsUiApp, url: string): DataItem {
  const plugin = app.plugins.getByKey(name) as DynamicLayerPlugin;
  const defaultName = getUniqueLayerName(plugin, 'Cesium3DTileset');
  const cesiumTilesetDataItem: DataItem<WebdataTypes.CESIUM_TILESET> = {
    actions: [],
    children: [],
    name: defaultName,
    title: defaultName,
    type: WebdataTypes.CESIUM_TILESET,
    url,
    isRootElement: true,
  };
  cesiumTilesetDataItem.actions.push(
    ...getTreeviewDefaultActions(app, cesiumTilesetDataItem),
  );
  plugin.webdata.added.value.push(cesiumTilesetDataItem);
  return cesiumTilesetDataItem;
}

/**
 * Creates a CesiumTilesetLayer from the passed DataItem.
 * @param item The DataItem to create a CesiumTilesetLayer from.
 * @returns The created CesiumTilesetLayer.
 */
export function itemToCesiumTileset(item: DataItem): CesiumTilesetLayer {
  return new CesiumTilesetLayer({
    url: item.url,
    name: item.name,
    activeOnStartup: true,
    properties: { title: item.title },
  });
}
