import { CesiumTilesetLayer } from '@vcmap/core';
import { type VcsUiApp } from '@vcmap/ui';
import { reactive, toRaw } from 'vue';
import { getTreeviewDefaultActions } from '../webdataActionsHelper.js';
import type { DataItem } from '../webdataConstants.js';
import { WebdataTypes } from '../webdataConstants.js';

/**
 * Creates, adds to the plugin and returns the created DataItem.
 * @param app The VcsUiApp.
 * @param url The URL of the 3DTileset to add.
 * @param uniqueName The unique name of the DataItem.
 * @param title The title of the DataItem.
 * @returns The created DataItem.
 */
export function addCesiumTilesetSource(
  app: VcsUiApp,
  url: string,
  uniqueName: string,
  title: string,
): DataItem {
  const cesiumTilesetDataItem: DataItem<WebdataTypes.CESIUM_TILESET> = reactive(
    {
      actions: [],
      children: [],
      name: uniqueName,
      title,
      type: WebdataTypes.CESIUM_TILESET,
      url,
      isRootElement: true,
    },
  );
  cesiumTilesetDataItem.actions.push(
    ...getTreeviewDefaultActions(app, cesiumTilesetDataItem),
  );
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
    headers: toRaw(item.headers),
    properties: { title: item.title },
  });
}
