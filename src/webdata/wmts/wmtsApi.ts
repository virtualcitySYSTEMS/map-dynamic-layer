import { type VcsUiApp } from '@vcmap/ui';
import { Extent, WMTSLayer } from '@vcmap/core';
import type { Reactive } from 'vue';
import { reactive, toRaw } from 'vue';
import WMTSCapabilities from 'ol/format/WMTSCapabilities.js';
import type { DataItem } from '../webdataConstants.js';
import { WebdataTypes } from '../webdataConstants.js';
import { getTreeviewDefaultActions } from '../webdataActionsHelper.js';
import {
  appendQueryParamsToUrl,
  getCapabilitiesParameters,
  getUniqueLayerName,
  parseWebdataUrl,
  validateExtent,
} from '../webdataHelper.js';
import type { WmtsCapabilities, WmtsLayer } from './wmtsConstants.js';

/**
 * Parses the XML capabilities to create the returned DataItem.
 * @param app The VcsUiApp.
 * @param xml The raw XML capabilities of the WMTS webserver.
 * @param url The webserver URL.
 * @param optionalParameters The optional parameters from the URL.
 * @returns The created DataItem.
 */
function parseWmtsCapabilities(
  app: VcsUiApp,
  xml: string,
  url: string,
  optionalParameters: Record<string, string>,
): DataItem {
  const capabilities = new WMTSCapabilities().read(xml) as WmtsCapabilities;
  const defaultTileMatrixSet =
    capabilities.Contents.TileMatrixSet.filter((tms) =>
      tms.SupportedCRS.includes('3857'),
    ).sort((a, b) => b.TileMatrix.length - a.TileMatrix.length)[0] ??
    capabilities.Contents.TileMatrixSet[0];

  /**
   * @param layer The layer from which to create child DataItem.
   * @returns The created DataItem.
   */
  function createChildren(layer: WmtsLayer): DataItem<WebdataTypes.WMTS> {
    const alreadyExists = !!app.layers.getByKey(layer.Identifier);
    const extent = validateExtent(
      new Extent({
        coordinates: layer.WGS84BoundingBox?.length
          ? layer.WGS84BoundingBox
          : Extent.WGS_84_EXTENT,
        projection: { epsg: 4326 },
      }),
    );

    const child: DataItem<WebdataTypes.WMTS> = {
      actions: [],
      children: [],
      name: layer.Identifier,
      title: layer.Title,
      optionalParameters,
      isAddedToMap: alreadyExists,
      type: WebdataTypes.WMTS,
      url:
        layer.ResourceURL?.find((r) => r.resourceType === 'tile')?.template ??
        url,
      description: layer.Abstract,
      keywordList: [],
      attributions: {
        url: capabilities.ServiceProvider?.ProviderSite,
        provider: capabilities.ServiceProvider?.ProviderName,
      },
      formats: layer.Format,
      extent,
      defaultTileMatrixSetId: defaultTileMatrixSet.Identifier,
      matrixSetIds: layer.TileMatrixSetLink.map((s) => s.TileMatrixSet),
      styles: layer.Style.map((s) => {
        return {
          name: s.Identifier,
          title: s.Title,
          legendUrl: s.LegendURL?.[0].href,
          isDefault: s.isDefault,
        };
      }),
    };

    child.actions = getTreeviewDefaultActions(app, child);
    return child;
  }

  const wmtsDataItem: Reactive<DataItem<WebdataTypes.WMTS>> = reactive({
    actions: [],
    name: url,
    title:
      capabilities.ServiceIdentification?.Title ??
      getUniqueLayerName(app, 'WMTSLayer'),
    accessConstraints: capabilities.ServiceIdentification?.AccessConstraints,
    description: capabilities.ServiceIdentification?.Abstract,
    fees: capabilities.ServiceIdentification?.Fees,
    keywordList: [],
    contact: {
      address:
        capabilities.ServiceProvider?.ServiceContact?.ContactInfo.Address
          .DeliveryPoint,
      city: `${capabilities.ServiceProvider?.ServiceContact?.ContactInfo.Address.PostalCode ?? ''}${capabilities.ServiceProvider?.ServiceContact?.ContactInfo.Address.PostalCode && capabilities.ServiceProvider?.ServiceContact?.ContactInfo.Address.City ? ' ' : ''}${capabilities.ServiceProvider?.ServiceContact?.ContactInfo.Address.City ?? ''}`,
      country:
        capabilities.ServiceProvider?.ServiceContact?.ContactInfo.Address
          .Country,
      person: capabilities.ServiceProvider?.ServiceContact?.IndividualName,
      position: capabilities.ServiceProvider?.ServiceContact?.PositionName,
      organization: capabilities.ServiceProvider?.ProviderName,
    },
    type: WebdataTypes.WMTS,
    url,
    isRootElement: true,
    children: capabilities.Contents.Layer.map((l) => createChildren(l)),
  });
  wmtsDataItem.actions.push(...getTreeviewDefaultActions(app, wmtsDataItem));
  return wmtsDataItem;
}

/**
 * Fetches a WMTS source with the correct parameters.
 * @param app The VcsUiApp.
 * @param rawUrl The user-entered URL.
 * @returns The created and added to the plugin DataItem of the source.
 */
export async function addWmtsSource(
  app: VcsUiApp,
  rawUrl: string,
): Promise<DataItem> {
  const serverUrl = parseWebdataUrl(rawUrl, WebdataTypes.WMTS);
  const { parameters, optionalParameters } = getCapabilitiesParameters(
    rawUrl,
    'WMTS',
  );
  return fetch(`${serverUrl}?${parameters}`)
    .then((r) => r.text())
    .then((xml) =>
      parseWmtsCapabilities(app, xml, serverUrl, optionalParameters),
    );
}

/**
 * Creates a WMTS from the passed DataItem.
 * @param item The DataItem to convert to a VC Map layer.
 * @param zIndex The zIndex to use for the layer.
 * @returns The created WMTSLayer.
 */
export function itemToWmtsLayer(
  item: DataItem<WebdataTypes.WMTS>,
  zIndex: number,
): WMTSLayer {
  return new WMTSLayer({
    url: appendQueryParamsToUrl(item.url, item.optionalParameters),
    name: item.name,
    layer: item.name,
    tileMatrixSetID: item.defaultTileMatrixSetId,
    format: item.formats?.[0],
    wmtsStyle:
      item.styles?.find((s) => s.isDefault)?.name ?? item.styles?.[0].name,
    matrixIds: item.matrixSetIds ?? [],
    extent: item.extent?.toJSON(),
    properties: { title: item.title, attributions: toRaw(item.attributions) },
    tileSize: [256, 256],
    zIndex,
  });
}
