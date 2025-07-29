/* eslint-disable @typescript-eslint/naming-convention */

type TileMatrixSet = {
  Identifier: string;
  SupportedCRS: string;
  TileMatrix: Array<{
    Identifier: string;
    MatrixHeight: number;
    MatrixWidth: number;
    ScaleDenominator: number;
    TileHeight: number;
    TileWidth: number;
    TopLeftCorner: Array<number>;
  }>;
};

export type WmtsItem = {
  defaultTileMatrixSetId?: string;
  matrixSetIds?: Array<string>;
  styles?: Array<{
    name: string;
    title: string;
    isDefault: boolean;
    legendUrl: string;
  }>;
  formats?: Array<string>;
};

/** Raw layer style capabilities obtained from a WMTS webserver. */
type WmtsStyle = {
  Identifier: string;
  LegendURL: Array<{ format: string; href: string }>;
  Title: string;
  isDefault: boolean;
};

/** Raw Layer obtained from the Capabilities of a WMTS webserver. */
export type WmtsLayer = {
  Abstract: string;
  Format: Array<string>;
  Identifier: string;
  ResourceURL: Array<{
    format: string;
    resourceType: string;
    template: string;
  }>;
  Style: Array<WmtsStyle>;
  TileMatrixSetLink: Array<{
    TileMatrixSet: string;
    TileMatrixSetLimits: Array<{
      MaxTileCol: number;
      MaxTileRow: number;
      MinTileCol: number;
      MinTileRow: number;
      TileMatrix: string;
    }>;
  }>;
  Title: string;
  WGS84BoundingBox: Array<number>;
};

/** Raw capabilities obtained from a WMTS webserver. */
export type WmtsCapabilities = {
  Contents: {
    Layer: Array<WmtsLayer>;
    TileMatrixSet: Array<TileMatrixSet>;
  };
  // XXX not correct but not usefull
  // OperationsMetadata: { ... };
  ServiceIdentification: {
    Abstract: string;
    AccessConstraints: string;
    Fees: string;
    ServiceType: string;
    ServiceTypeVersion: string;
    Title: string;
  };
  ServiceProvider: {
    ProviderName: string;
    ProviderSite: string;
    ServiceContact: {
      IndividualName: string;
      PositionName: string;
      ContactInfo: {
        Address: {
          AdministrativeArea: string;
          City: string;
          Country: string;
          DeliveryPoint: string;
          ElectronicMailAddress: string;
          PostalCode: string;
        };
        Phone: { Facsimile: string; Voice: string };
      };
    };
  };
  version: string;
};
