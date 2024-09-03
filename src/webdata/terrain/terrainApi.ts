import { TerrainLayer } from '@vcmap/core';
import { VcsUiApp } from '@vcmap/ui';
import { reactive } from 'vue';
import { getTreeviewDefaultActions } from '../webdataActionsHelper.js';
import { DynamicLayerPlugin } from '../../index.js';
import { DataItem, WebdataTypes } from '../webdataConstants.js';
import { name } from '../../../package.json';
import { getUniqueLayerName } from '../webdataHelper.js';

/**
 * Creates, adds to the plugin and returns the created DataItem.
 * @param app The VcsUiApp.
 * @param url The URL of the Terrain to add.
 * @returns The created DataItem.
 */
export function addTerrainSource(app: VcsUiApp, url: string): DataItem {
  const parsedUrl = url.split('/layer.json')[0];
  const plugin = app.plugins.getByKey(name) as DynamicLayerPlugin;
  const defaultName = getUniqueLayerName(plugin, 'TerrainLayer');
  const terrainDataItem: DataItem<WebdataTypes.TERRAIN> = reactive({
    actions: [],
    // XXX disable children because even empty, render the parents as expandable.
    // children: [],
    name: defaultName,
    title: defaultName,
    type: WebdataTypes.TERRAIN,
    url: parsedUrl,
    isRootElement: true,
  });
  terrainDataItem.actions.push(
    ...getTreeviewDefaultActions(app, terrainDataItem),
  );
  plugin.webdata.added.value.push(terrainDataItem);
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
    activeOnStartup: true,
    properties: { title: item.title },
  });
}
