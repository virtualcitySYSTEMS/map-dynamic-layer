import { VcsUiApp } from '@vcmap/ui';
import { DynamicLayerPlugin } from 'src';
import {
  DataItem,
  WebdataSupportedLayers,
  WebdataTypes,
} from './webdataConstants.js';
import { addWmsSource, itemToWmsLayer } from './wms/wmsApi.js';
import {
  addCesiumTilesetSource,
  itemToCesiumTileset,
} from './cesiumTileset/cesiumTilesetApi.js';
import { addTerrainSource, itemToTerrainLayer } from './terrain/terrainApi.js';

/**
 * Fetches a source at the passed URL and returns the DataItem created and added to the plugin.
 * @param app The VcsUiApp..
 * @param url The URL to fetch.
 * @param type The type of source to fetch.
 * @returns The DataItem of the source.
 */
export async function fetchSource(
  app: VcsUiApp,
  url: string,
  type: WebdataTypes,
): Promise<DataItem> {
  switch (type) {
    case WebdataTypes.WMS:
      return addWmsSource(app, url);
    case WebdataTypes.CESIUM_TILESET:
      return addCesiumTilesetSource(app, url);
    case WebdataTypes.TERRAIN:
      return addTerrainSource(app, url);
    default:
      throw new Error('Error while fetching the source');
  }
}

/**
 * Creates a VCMap Layer from the passed DataItem.
 * @param plugin The DynamicLayer plugin.
 * @param item The DataItem to create a layer from.
 * @returns The created layer.
 */
export function itemToLayer(
  plugin: DynamicLayerPlugin,
  item: DataItem,
): WebdataSupportedLayers {
  switch (item.type) {
    case WebdataTypes.WMS: {
      const rootItem = plugin.webdata.added.value.find(
        (i) => i.url === item.url,
      )!;
      return itemToWmsLayer(
        item as DataItem<WebdataTypes.WMS>,
        rootItem as DataItem<WebdataTypes.WMS>,
      );
    }
    case WebdataTypes.CESIUM_TILESET:
      return itemToCesiumTileset(item);
    case WebdataTypes.TERRAIN:
      return itemToTerrainLayer(item);

    default:
      throw new Error('An error occurred during layer creation');
  }
}
