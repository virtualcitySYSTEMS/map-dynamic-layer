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
import { getUniqueLayerName } from './webdataHelper.js';

/**
 * Fetches a source at the passed URL and returns the DataItem created.
 * @param app The VcsUiApp.
 * @param url The URL to fetch.
 * @param type The type of source to fetch.
 * @param id An unique identifier for the DataItem to be created.
 * @param title The title of the DataItem to be created.
 * @returns The DataItem of the source.
 */
export async function fetchSource(
  app: VcsUiApp,
  url: string,
  type: WebdataTypes,
  id?: string,
  title?: string,
): Promise<DataItem> {
  const ensuredTitle = title || getUniqueLayerName(app, type);
  const uniqueName = id || ensuredTitle;
  switch (type) {
    case WebdataTypes.CESIUM_TILESET:
      return addCesiumTilesetSource(app, url, uniqueName, ensuredTitle);
    case WebdataTypes.CZML:
      return addCzmlSource(app, url, uniqueName, ensuredTitle);
    case WebdataTypes.GEOJSON:
      return addGeoJSONSource(app, url, uniqueName, ensuredTitle);
    case WebdataTypes.POINTCLOUD:
      return addPointCloudSource(app, url, uniqueName, ensuredTitle);
    case WebdataTypes.TERRAIN:
      return addTerrainSource(app, url, uniqueName, ensuredTitle);
    case WebdataTypes.WFS:
      return addWfsSource(app, url);
    case WebdataTypes.WMS:
      return addWmsSource(app, url);
    case WebdataTypes.WMTS:
      return addWmtsSource(app, url);
    default:
      throw new Error(app.vueI18n.t('dynamicLayer.errors.fetchingSource'));
  }
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
