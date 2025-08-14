import { type VcsUiApp } from '@vcmap/ui';
import { Extent, WFSLayer } from '@vcmap/core';
import type { Reactive } from 'vue';
import { reactive, toRaw } from 'vue';
import WFSCapabilities from 'ol-wfs-capabilities';
import {
  parseWebdataUrl,
  appendQueryParamsToUrl,
  getCapabilitiesParameters,
  getUniqueLayerName,
  validateExtent,
} from '../webdataHelper.js';
import type { DataItem } from '../webdataConstants.js';
import { WebdataTypes } from '../webdataConstants.js';
import type { WfsCapabilities, WfsFeature } from './wfsConstants.js';
import { getTreeviewDefaultActions } from '../webdataActionsHelper.js';

/**
 * Fetches the WFS webserver with a `DescribeFeatureType` request to get the namespace.
 * @param serverUrl The URL of the WFS webserver.
 * @param version The version used to fetch the webserver.
 * @returns The namespace, if found.
 */
async function getNamespace(
  serverUrl: string,
  version: string,
): Promise<string | undefined> {
  return fetch(
    `${serverUrl}?SERVICE=WFS&REQUEST=DescribeFeatureType&VERSION=${version}`,
  )
    .then((t) => t.text())
    .then((s) => new DOMParser().parseFromString(s, 'application/xml'))
    .then(
      (doc) =>
        doc.activeElement?.attributes.getNamedItem('targetNamespace')?.value,
    );
}

/**
 * Parses the XML capabilities to create the returned DataItem.
 * @param app The VcsUiApp.
 * @param xml The raw XML capabilities of the WFS webserver.
 * @param url The webserver URL.
 * @param optionalParameters The optional parameters from the URL.
 * @returns The created DataItem.
 */
async function parseWfsCapabilities(
  app: VcsUiApp,
  xml: string,
  url: string,
  optionalParameters: Record<string, string>,
): Promise<DataItem> {
  const capabilities = new WFSCapabilities().read(xml) as WfsCapabilities;
  const namespace = await getNamespace(url, capabilities.version);

  /**
   * @param features The features from which to create child DataItem.
   * @returns The created Array of DataItem.
   */
  function createChildrenArray(
    features: Array<WfsFeature>,
  ): Array<DataItem<WebdataTypes.WFS>> {
    const children: Array<DataItem<WebdataTypes.WFS>> = [];
    features.forEach((f) => {
      const alreadyExists = !!app.layers.hasKey(f.Name);
      const extent = validateExtent(
        new Extent({
          coordinates:
            f.WGS84BoundingBox?.LowerCorner && f.WGS84BoundingBox?.UpperCorner
              ? [
                  ...f.WGS84BoundingBox.LowerCorner,
                  ...f.WGS84BoundingBox.UpperCorner,
                ]
              : Extent.WGS_84_EXTENT,
          projection: { epsg: 4326 },
        }),
      );

      const child: DataItem<WebdataTypes.WFS> = {
        actions: [],
        children: [],
        optionalParameters,
        name: f.Name,
        title: f.Title,
        attributions: { provider: capabilities.ServiceProvider.ProviderName },
        type: WebdataTypes.WFS,
        url,
        namespace,
        description: f.Abstract,
        keywordList: f.Keywords,
        onlineResource: f.MetadataUrl,
        extent,
      };
      child.actions.push(...getTreeviewDefaultActions(app, child));
      child.isAddedToMap = alreadyExists && !child.children.length;
      children.push(child);
    });
    return children;
  }

  const wfsDataItem: Reactive<DataItem<WebdataTypes.WFS>> = reactive({
    actions: [],
    name: url,
    title:
      capabilities.ServiceIdentification?.Title ??
      getUniqueLayerName(app, 'WFSLayer'),
    accessConstraints: capabilities.ServiceIdentification?.AccessConstraints,
    description: capabilities.ServiceIdentification?.Abstract,
    fees: capabilities.ServiceIdentification?.Fees,
    keywordList: capabilities.ServiceIdentification?.Keywords,
    contact: {
      address:
        capabilities.ServiceProvider?.ServiceContact?.ContactInfo.Address
          .AdministrativeArea,
      city: `${capabilities.ServiceProvider?.ServiceContact?.ContactInfo.Address.PostalCode ?? ''}${capabilities.ServiceProvider?.ServiceContact?.ContactInfo.Address.PostalCode && capabilities.ServiceProvider?.ServiceContact?.ContactInfo.Address.City ? ' ' : ''}${capabilities.ServiceProvider?.ServiceContact?.ContactInfo.Address.City ?? ''}`,
      country:
        capabilities.ServiceProvider?.ServiceContact?.ContactInfo.Address
          .Country,
      person: capabilities.ServiceProvider?.ServiceContact?.IndividualName,
      position: capabilities.ServiceProvider?.ServiceContact?.PositionName,
      organization: capabilities.ServiceProvider?.ProviderName,
    },
    type: WebdataTypes.WFS,
    url,
    isRootElement: true,
    children: createChildrenArray(
      Array.isArray(capabilities.FeatureTypeList)
        ? capabilities.FeatureTypeList
        : capabilities.FeatureTypeList.FeatureType,
    ),
  });
  wfsDataItem.actions.push(...getTreeviewDefaultActions(app, wfsDataItem));
  return wfsDataItem;
}

/**
 * Fetches a WFS source with the correct parameters.
 * @param app The VcsUiApp.
 * @param rawUrl The user-entered URL.
 * @returns The created and added to the plugin DataItem of the source.
 */
export async function addWfsSource(
  app: VcsUiApp,
  rawUrl: string,
): Promise<DataItem> {
  const serverUrl = parseWebdataUrl(rawUrl, WebdataTypes.WFS);
  const { parameters, optionalParameters } = getCapabilitiesParameters(
    rawUrl,
    'WFS',
  );
  return fetch(`${serverUrl}?${parameters}`)
    .then((r) => r.text())
    .then((xml) =>
      parseWfsCapabilities(app, xml, serverUrl, optionalParameters),
    );
}

/**
 * Creates a WFS from the passed DataItem.
 * @param item The DataItem to convert to a VC Map layer.
 * @param zIndex The zIndex to use for the layer.
 * @returns The created WFSLayer.
 */
export function itemToWfsLayer(
  item: DataItem<WebdataTypes.WFS>,
  zIndex: number,
): WFSLayer {
  const feature = item.name.split(':');
  const featurePrefix = feature[0];
  const featureType = feature[1];

  return new WFSLayer({
    url: appendQueryParamsToUrl(item.url, item.optionalParameters),
    name: item.name,
    extent: item.extent?.toJSON(),
    featureType,
    featurePrefix,
    featureNS: item.namespace ?? '',
    projection: item.extent?.projection,
    properties: { title: item.title, attributions: toRaw(item.attributions) },
    zIndex,
  });
}
