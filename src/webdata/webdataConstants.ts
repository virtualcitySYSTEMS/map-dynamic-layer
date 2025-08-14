import type {
  CesiumTilesetLayer,
  WMSLayer,
  TerrainLayer,
  WFSLayer,
  WMTSLayer,
  Extent,
  GeoJSONLayer,
  PointCloudLayer,
  CzmlLayer,
} from '@vcmap/core';
import type { VcsAction } from '@vcmap/ui';
import type { WmsItem } from './wms/wmsConstants.js';
import type { WfsItem } from './wfs/wfsConstants.js';
import type { WmtsItem } from './wmts/wmtsConstants.js';

/** The support Webdata types. */
export enum WebdataTypes {
  CESIUM_TILESET = 'CesiumTilesetLayer',
  POINTCLOUD = 'PointCloudLayer',
  TERRAIN = 'TerrainLayer',
  CZML = 'CzmlLayer',
  GEOJSON = 'GeoJSONLayer',
  WFS = 'WFSLayer',
  WMS = 'WMSLayer',
  WMTS = 'WMTSLayer',
}

export type WxsWebdataTypes =
  | WebdataTypes.WFS
  | WebdataTypes.WMS
  | WebdataTypes.WMTS;

/** The supported Webdata layers types. */
export type WebdataSupportedLayers =
  | CesiumTilesetLayer
  | CzmlLayer
  | GeoJSONLayer
  | PointCloudLayer
  | TerrainLayer
  | WFSLayer
  | WMSLayer
  | WMTSLayer;

/** The properties shared by all the data items. */
export type DataItem<T extends WebdataTypes = WebdataTypes> = {
  type: T;
  actions: Array<VcsAction>;
  children: Array<DataItem<T>>;
  name: string;
  title: string;
  url: string;
  isAddedToMap?: boolean;
  isRootElement?: boolean;
  // CesiumTileset, PointCloud and Terrain layers have no specific properties
} & (T extends WxsWebdataTypes ? WxsItem : object) &
  (T extends WebdataTypes.WFS ? WfsItem : object) &
  (T extends WebdataTypes.WMS ? WmsItem : object) &
  (T extends WebdataTypes.WMTS ? WmtsItem : object);

/** The basic item type for WFS, WMS and WMTS */
export type WxsItem = {
  optionalParameters?: Record<string, string>;
  accessConstraints?: string;
  description?: string;
  extent?: Extent;
  fees?: string;
  keywordList?: Array<string>;
  onlineResource?: string;
  attributions?: {
    url?: string;
    provider?: string;
  };
  contact?: {
    address?: string;
    city?: string;
    country?: string;
    person?: string;
    position?: string;
    organization?: string;
  };
};
