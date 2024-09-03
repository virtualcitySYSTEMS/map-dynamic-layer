import { CesiumTilesetLayer, WMSLayer, TerrainLayer } from '@vcmap/core';
import { VcsAction } from '@vcmap/ui';
import { WmsItem } from './wms/wmsConstants.js';

/** The support Webdata types. */
export enum WebdataTypes {
  WMS = 'WMSLayer',
  CESIUM_TILESET = 'CesiumTilesetLayer',
  TERRAIN = 'TerrainLayer',
}

/** The supported Webdata layers types. */
export type WebdataSupportedLayers =
  | WMSLayer
  | CesiumTilesetLayer
  | TerrainLayer;

/** The properties shared by all the data items. */
export type DataItem<T extends WebdataTypes = WebdataTypes> = {
  type: T;
  actions: Array<VcsAction>;

  // XXX make children optional because of https://github.com/vuetifyjs/vuetify/issues/19983
  children?: Array<DataItem<T>>;
  name: string;
  title: string;
  url: string;
  icon?: string;
  isAddedToMap?: boolean;
  isRootElement?: boolean;
  // CesiumTileset and Terrain have no specific properties
} & (T extends WebdataTypes.WMS ? WmsItem : object);
