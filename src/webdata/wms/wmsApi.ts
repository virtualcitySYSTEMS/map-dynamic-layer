import { Extent, WMSFeatureProvider, WMSLayer } from '@vcmap/core';
import { type VcsUiApp } from '@vcmap/ui';
import type { Reactive } from 'vue';
import { reactive, toRaw } from 'vue';
import WMSCapabilities from 'ol/format/WMSCapabilities';
import {
  parseWebdataUrl,
  getCapabilitiesParameters,
  validateExtent,
} from '../webdataHelper.js';
import type { DataItem } from '../webdataConstants.js';
import { WebdataTypes } from '../webdataConstants.js';
import { getTreeviewDefaultActions } from '../webdataActionsHelper.js';
import type { WmsCapabilities, WmsLayer } from './wmsConstants.js';
import { wmsSupportedFeatureInfoType } from './wmsConstants.js';

/**
 * Parses WMS Capabilities and returns the created DataItem.
 * @param app The VcsUiApp.
 * @param xml The WMS Capabilities.
 * @param url The fetched URL.
 * @param optionalParameters The optional parameters from the URL.
 * @returns The parsed capabilities as DataItem.
 */
function parseWmsSource(
  app: VcsUiApp,
  xml: string,
  url: string,
  optionalParameters: Record<string, string>,
): DataItem {
  const { Capability: capability, Service: service } =
    new WMSCapabilities().read(xml) as WmsCapabilities;

  const featureInfoResponseType = wmsSupportedFeatureInfoType.find((t) =>
    capability.Request.GetFeatureInfo.Format.includes(t),
  );

  /**
   * Gets the nested layers of the passed WMSLayer as DataItem.
   * @param layer The WMSLayer from which add children layers.
   * @returns The created DataItem.
   */
  function getNestedLayers(layer: WmsLayer): DataItem<WebdataTypes.WMS> {
    /**
     * Checks if a child layer is different from the parent (is not when only one layer with the same Name).
     * @param layer The layer to check.
     * @returns {boolean} Whether the nested layer is the same as the parent.
     */
    function isChildDifferent(l: WmsLayer): boolean {
      if (l.Layer) {
        if (l.Layer?.length > 1) {
          return true;
        } else {
          return l.Name !== l.Layer[0].Name;
        }
      } else {
        return false;
      }
    }
    const childDifferent = isChildDifferent(layer);

    /**
     * Finds the value of the last passed property name. When a layer and its nested layer are the same, returns the property of the nested one or, if it is a falsy value, the parent one. For non identical layers, returns the parent property value.
     * @param propertyNames The names of the nested properties to find.
     * @returns The value of the last passed property if exists.
     */
    function findValue(propertyNames: Array<string>): unknown {
      let prop = childDifferent
        ? (layer as Record<string, unknown>)
        : ((layer?.Layer?.[0] as Record<string, unknown>) ??
          (layer as Record<string, unknown>));
      propertyNames.forEach((n) => {
        prop = prop?.[n] as Record<string, unknown>;
      });
      return prop as unknown;
    }

    const alreadyExists = !!app.layers.hasKey(layer.Name);
    const item: DataItem<WebdataTypes.WMS> = {
      optionalParameters,
      formats: capability.Request.GetMap.Format.filter(
        (f) => f === 'image/png' || f === 'image/jpeg',
      ),
      featureInfoResponseType,
      attributions: {
        provider:
          service.ContactInformation?.ContactPersonPrimary?.ContactOrganization,
        url: service.OnlineResource,
      },
      url,
      actions: [],
      type: WebdataTypes.WMS,
      name: findValue(['Name']) as string,
      title: findValue(['Title']) as string,
      queryable: findValue(['queryable']) as boolean,
      supportsTransparency: !(findValue(['opaque']) as boolean),
      extent: validateExtent(
        new Extent({
          coordinates: findValue(['EX_GeographicBoundingBox']) as number[],
          projection: { epsg: 4326 },
        }),
      ),
      description: findValue(['Abstract']) as string,
      keywordList: findValue(['KeywordList']) as string[],
      styles: layer.Style?.map((s) => {
        return {
          value: s.Name,
          title: s.Title,
          abstract: s.Abstract,
          legendUrl: s.LegendURL[0].OnlineResource,
        };
      }),
      children: isChildDifferent(layer)
        ? layer.Layer?.map((l) => getNestedLayers(l))
        : [],
    };
    item.isAddedToMap = alreadyExists && !item.children.length;
    return item;
  }

  const content: Reactive<DataItem<WebdataTypes.WMS>> = reactive({
    actions: [],
    name: url,
    title: service.Title,
    type: WebdataTypes.WMS,
    url,
    isRootElement: true,
    accessConstraints: service.AccessConstraints,
    description: service.Abstract,
    fees: service.Fees,
    formats: capability.Request.GetMap.Format.filter(
      (f) => f === 'image/png' || f === 'image/jpeg',
    ),
    featureInfoResponseType,
    keywordList: service.KeywordList,
    onlineResource: service.OnlineResource,
    contact: {
      address: service.ContactInformation?.ContactAddress?.Address,
      city: `${service.ContactInformation?.ContactAddress?.PostCode ?? ''}${service.ContactInformation?.ContactAddress?.PostCode && service.ContactInformation?.ContactAddress?.City ? ' ' : ''}${service.ContactInformation?.ContactAddress?.City ?? ''}`,
      country: service.ContactInformation?.ContactAddress?.Country,
      person: service.ContactInformation?.ContactPersonPrimary?.ContactPerson,
      position: service.ContactInformation?.ContactPosition,
      organization:
        service.ContactInformation?.ContactPersonPrimary?.ContactOrganization,
    },
    children: capability.Layer.Layer.map((l) => getNestedLayers(l)),
  });
  function addActions(item: DataItem): void {
    item.actions.push(...getTreeviewDefaultActions(app, item));
    item.children?.forEach((child) => {
      addActions(child);
    });
  }
  addActions(content as DataItem);
  return content as DataItem;
}

/**
 * Fetches a WMS source with the correct parameters.
 * @param app The VcsUiApp.
 * @param rawUrl The user-entered URL.
 * @returns The created DataItem of the source.
 */
export async function addWmsSource(
  app: VcsUiApp,
  rawUrl: string,
): Promise<DataItem> {
  const serverUrl = parseWebdataUrl(rawUrl, WebdataTypes.WMS);
  const { parameters, optionalParameters } = getCapabilitiesParameters(
    rawUrl,
    'WMS',
  );

  return fetch(`${serverUrl}?${parameters}`)
    .then((res) => res.text())
    .then((xml) => parseWmsSource(app, xml, serverUrl, optionalParameters));
}

/**
 * Creates a Layer from the passed DataItem.
 * @param item The DataItem to add to the map.
 * @param zIndex The zIndex to use for the layer.
 * @returns The created layer.
 */
export function itemToWmsLayer(
  item: DataItem<WebdataTypes.WMS>,
  zIndex: number,
): WMSLayer {
  const format = item.formats!.includes('image/png')
    ? 'image/png'
    : item.formats![0];
  const style = item.styles?.[0];
  const parameters = {
    ...item.optionalParameters,
    FORMAT: format,
    STYLES: style?.value ?? '',
    LAYERS: item.name,
    TRANSPARENT: item.supportsTransparency ? 'TRUE' : 'FALSE',
  };
  const layer = new WMSLayer({
    name: item.name,
    layers: item.name,
    url: item.url,
    extent:
      item.extent?.toJSON() ??
      new Extent({ coordinates: Extent.WGS_84_EXTENT }).toJSON(),
    parameters,
    properties: {
      title: item.title,
      ...(style?.legendUrl && {
        legend: [
          {
            type: 'ImageLegendItem',
            src: style.legendUrl,
            popoutBtn: true,
          },
        ],
      }),
      attributions: toRaw(item.attributions),
    },
    zIndex,
  });
  if (item.queryable) {
    layer.featureProvider = new WMSFeatureProvider(item.name, {
      url: item.url,
      parameters,
      extent: item.extent,
      responseType: item.featureInfoResponseType,
    });
  }
  return layer;
}
