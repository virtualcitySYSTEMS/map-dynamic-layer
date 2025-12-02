import { TerrainLayer } from '@vcmap/core';
import { type VcsUiApp } from '@vcmap/ui';
import { reactive, toRaw } from 'vue';
import { getTreeviewDefaultActions } from '../webdataActionsHelper.js';
import type { DataItem } from '../webdataConstants.js';
import { WebdataTypes } from '../webdataConstants.js';
import { parseWebdataUrl } from '../webdataHelper.js';

/**
 * Creates, adds to the plugin and returns the created DataItem.
 * @param app The VcsUiApp.
 * @param url The URL of the Terrain to add.
 * @param uniqueName The unique name of the DataItem.
 * @param title The title of the DataItem.
 * @returns The created DataItem.
 */
export function addTerrainSource(
  app: VcsUiApp,
  url: string,
  uniqueName: string,
  title: string,
): DataItem {
  const parsedUrl = parseWebdataUrl(url, WebdataTypes.TERRAIN);
  const terrainDataItem: DataItem<WebdataTypes.TERRAIN> = reactive({
    actions: [],
    children: [],
    name: uniqueName,
    title,
    type: WebdataTypes.TERRAIN,
    url: parsedUrl,
    isRootElement: true,
  });
  terrainDataItem.actions.push(
    ...getTreeviewDefaultActions(app, terrainDataItem),
  );
  return terrainDataItem;
}

/**
 * Creates a TerrainLayer from the passed DataItem.
 * @param item The DataItem to create a TerrainLayer from.
 * @returns The created TerrainLayer.
 */
export function itemToTerrainLayer(item: DataItem): TerrainLayer {
  return new TerrainLayer({
    url: item.url,
    name: item.name,
    headers: toRaw(item.headers),
    properties: { title: item.title },
  });
}
