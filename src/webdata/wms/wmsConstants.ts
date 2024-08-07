import { Extent, WMSOptions } from '@vcmap/core';

export const wmsParametersKeys = [
  'zIndex',
  'extent',
  'style',
  'styles',
  'tilingSchema',
  'formats',
  'format',
  'supportsTransparency',
  'transparent',
  'queryable',
  'enableQuery',
];

export type WMSAvailableStyle = {
  value: string;
  title: string;
  abstract: string;
  legendUrl: string;
};

/** The parameters of a WMS layer, including @vcmap/core WMSOptions */
export type WMSParameters = WMSOptions & {
  parameters: Record<string, string>;
  properties: Record<string, string>;
  zIndex: number;
  tilingSchema: string;
  availableStyles?: Array<WMSAvailableStyle>;
  availableFormats?: Array<string>;
  supportsTransparency?: boolean;
  queryable?: boolean;
};

/** The specific properties of a WMS webdata item. */
export type WmsItem = {
  extent?: Extent;
  queryable?: boolean;
  supportsTransparency?: boolean;

  styles?: Array<{
    value: string;
    title: string;
    abstract: string;
    legendUrl: string;
  }>;
  accessConstraints?: string;
  description?: string;
  fees?: string;
  formats?: Array<string>;
  keywordList?: Array<string>;
  onlineResource?: string;
  featureInfoResponseType?: string;
  attribution?: {
    onlineResource?: string;
    title?: string;
  };
  contact?: {
    address?: string;
    city?: string;
    country?: string;
    mail?: string;
    person?: string;
    position?: string;
    organization?: string;
  };
};

/** Raw layer style capabilities obtained from a WMS webserver. */
type WmsStyle = {
  Abstract: string;
  Name: string;
  Title: string;
  LegendURL: Array<{ OnlineResource: string }>;
};

/** Raw layer capabilities obtained from a WMS webserver. */
export type WmsLayer = {
  Abstract: string;
  Attribution?: {
    OnlineResource?: string;
    Title?: string;
  };
  Layer: Array<WmsLayer>;
  Name: string;
  Title: string;
  Style?: Array<WmsStyle>;
  EX_GeographicBoundingBox: Array<number>;
  KeywordList: Array<string>;
  queryable: boolean;
};

/** Raw capabilities obtained from a WMS webserver. */
export type WmsCapabilities = {
  Capability: {
    Layer: WmsLayer;
    Request: {
      GetMap: { Format: Array<string> };
      GetFeatureInfo: { Format: Array<string> };
    };
  };
  Service: {
    Abstract: string;
    AccessConstraints: string;
    Fees: string;
    KeywordList: Array<string>;
    OnlineResource: string;
    Title: string;
    ContactInformation: {
      ContactAddress: {
        Address: string;
        PostCode: string;
        City: string;
        Country: string;
      };
      ContactElectronicMailAddress: string;
      ContactPersonPrimary: {
        ContactPerson: string;
        ContactOrganization: string;
      };
      ContactPosition: string;
    };
  };
  version: string;
};

/** WMS FeatureInfo Response Type supported by VC Map. */
export const wmsSupportedFeatureInfoType = [
  'application/json',
  'application/geojson',
  'application/geo+json',
  'application/vnd.geo+json',
  'application/vnd.ogc.gml',
  'text/xml',
];
