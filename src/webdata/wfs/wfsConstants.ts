/* eslint-disable @typescript-eslint/naming-convention */
export type WfsItem = {
  namespace?: string;
};

/** Raw Feature obtained from the Capabilities of a WFS webserver. */
export type WfsFeature = {
  Abstract: string;
  DefaultSrs: string;
  Keywords: Array<string>;
  MetadataUrl: string;
  Name: string;
  OtherSRS: Array<string>;
  Title: string;
  WGS84BoundingBox: { LowerCorner: Array<number>; UpperCorner: Array<number> };
};

/** Raw capabilities obtained from a WFS webserver. */
export type WfsCapabilities = {
  FeatureTypeList:
    | Array<WfsFeature>
    | {
        FeatureType: Array<WfsFeature>;
        Operations: Array<string>;
      };
  Filter_Capabilities: {
    Id_Capabilities: Array<string>;
    Scalar_Capabilities: {
      ComparisonOperators: Array<string>;
      LogicalOperators: string;
    };
    Spatial_Capabilities: {
      GeometryOperands: Array<string>;
      SpatialOperators: Array<string>;
    };
  };
  OperationsMetadata: {
    Constraint: Array<{ name: string }>;
    Operation: Array<{
      DCP: { HTTP: { Get: string; Post: string } };
      Parameter: Array<{ Value: Array<string>; name: string }>;
      name: string;
    }>;
  };
  ServiceIdentification: {
    Abstract: string;
    AccessConstraints: string;
    Fees: string;
    Keywords: Array<string>;
    ServiceType: string;
    ServiceTypeVersion: string;
    Title: string;
  };
  ServiceProvider: {
    ProviderName: string;
    ServiceContact: {
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
      IndividualName: string;
      PositionName: string;
    };
  };
  version: string;
};
