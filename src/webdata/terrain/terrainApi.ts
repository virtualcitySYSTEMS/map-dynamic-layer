import { TerrainLayer } from '@vcmap/core';
import { VcsUiApp } from '@vcmap/ui';
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
  const TerrainDataItem: DataItem<WebdataTypes.TERRAIN> = {
    actions: [],
    children: [],
    name: defaultName,
    title: defaultName,
    type: WebdataTypes.TERRAIN,
    url: parsedUrl,
    isRootElement: true,
  };
  TerrainDataItem.actions.push(
    ...getTreeviewDefaultActions(app, TerrainDataItem),
  );
  plugin.webdata.added.value.push(TerrainDataItem);
  return TerrainDataItem;
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
