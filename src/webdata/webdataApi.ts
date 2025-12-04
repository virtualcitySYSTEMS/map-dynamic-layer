import { type VcsUiApp } from '@vcmap/ui';
import { getLogger } from '@vcsuite/logger';
import type { DataItem, WebdataSupportedLayers } from './webdataConstants.js';
import { WebdataTypes } from './webdataConstants.js';
import { addWmsSource, itemToWmsLayer } from './wms/wmsApi.js';
import {
  addCesiumTilesetSource,
  itemToCesiumTileset,
} from './cesiumTileset/cesiumTilesetApi.js';
import { addTerrainSource, itemToTerrainLayer } from './terrain/terrainApi.js';
import { addWfsSource, itemToWfsLayer } from './wfs/wfsApi.js';
import { addWmtsSource, itemToWmtsLayer } from './wmts/wmtsApi.js';
import { addGeoJSONSource, itemToGeoJSONLayer } from './geojson/geojsonApi.js';
import {
  addPointCloudSource,
  itemToPointCloud,
} from './pointcloud/pointCloudApi.js';
import { addCzmlSource, itemToCzml } from './czml/czmlApi.js';
import { name } from '../../package.json';
import {
  applyFnToItemAndChildren,
  getUniqueLayerName,
} from './webdataHelper.js';

type SourceOptions = {
  url: string;
  type: WebdataTypes;
  id?: string;
  title?: string;
  headers?: Record<string, string>;
};

/**
 * Fetches a source at the passed URL and returns the DataItem created.
 * @returns The DataItem of the source.
 */
export async function fetchSource(
  app: VcsUiApp,
  options: SourceOptions,
): Promise<DataItem> {
  const ensuredTitle = options.title || getUniqueLayerName(app, options.type);
  const uniqueName = options.id || ensuredTitle;
  let item: DataItem;
  switch (options.type) {
    case WebdataTypes.CESIUM_TILESET:
      item = addCesiumTilesetSource(app, options.url, uniqueName, ensuredTitle);
      break;
    case WebdataTypes.CZML:
      item = addCzmlSource(app, options.url, uniqueName, ensuredTitle);
      break;
    case WebdataTypes.GEOJSON:
      item = addGeoJSONSource(app, options.url, uniqueName, ensuredTitle);
      break;
    case WebdataTypes.POINTCLOUD:
      item = addPointCloudSource(app, options.url, uniqueName, ensuredTitle);
      break;
    case WebdataTypes.TERRAIN:
      item = addTerrainSource(app, options.url, uniqueName, ensuredTitle);
      break;
    case WebdataTypes.WFS:
      item = await addWfsSource(app, options.url, options.headers);
      break;
    case WebdataTypes.WMS:
      item = await addWmsSource(app, options.url, options.headers);
      break;
    case WebdataTypes.WMTS:
      item = await addWmtsSource(app, options.url, options.headers);
      break;
    default:
      throw new Error(app.vueI18n.t('dynamicLayer.errors.fetchingSource'));
  }
  if (options.headers) {
    applyFnToItemAndChildren((dataItem) => {
      dataItem.headers = options.headers!;
    }, item);
  }
  return item;
}

/**
 * Converts a given `DataItem` to a corresponding `WebdataSupportedLayers` based on its type.
 * @param item - The data item to be converted. The type of the item determines the conversion function to be used.
 * @param zIndex - The z-index to be applied to the layer, used for rendering order.
 * @returns The converted layer of type `WebdataSupportedLayers`.
 * @throws Will throw an error if the item type is not supported.
 *
 * @remarks
 * The function supports the following item types:
 * - `WebdataTypes.CESIUM_TILESET`
 * - `WebdataTypes.CZML`
 * - `WebdataTypes.GEOJSON`
 * - `WebdataTypes.POINTCLOUD`
 * - `WebdataTypes.TERRAIN`
 * - `WebdataTypes.WFS`
 * - `WebdataTypes.WMS`
 * - `WebdataTypes.WMTS`
 *
 * If the item type is not recognized, an error is logged and an exception is thrown.
 */
export function itemToLayer(
  item: DataItem,
  zIndex: number,
): WebdataSupportedLayers {
  switch (item.type) {
    case WebdataTypes.CESIUM_TILESET:
      return itemToCesiumTileset(item);
    case WebdataTypes.CZML:
      return itemToCzml(item);
    case WebdataTypes.GEOJSON:
      return itemToGeoJSONLayer(item);
    case WebdataTypes.POINTCLOUD:
      return itemToPointCloud(item);
    case WebdataTypes.TERRAIN:
      return itemToTerrainLayer(item);
    case WebdataTypes.WFS:
      return itemToWfsLayer(item as DataItem<WebdataTypes.WFS>, zIndex);
    case WebdataTypes.WMS:
      return itemToWmsLayer(item as DataItem<WebdataTypes.WMS>, zIndex);
    case WebdataTypes.WMTS:
      return itemToWmtsLayer(item as DataItem<WebdataTypes.WMTS>, zIndex);
    default:
      getLogger(name).error('dynamicLayer.errors.layerCreation');
      throw new Error();
  }
}
