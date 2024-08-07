import { Extent, WMSFeatureProvider, WMSLayer } from '@vcmap/core';
import { VcsUiApp } from '@vcmap/ui';
import WMSCapabilities from 'ol/format/WMSCapabilities';
import { DynamicLayerPlugin } from 'src';
import { DataItem, WebdataTypes } from '../webdataConstants.js';
import { getTreeviewDefaultActions } from '../webdataActionsHelper.js';
import {
  WmsCapabilities,
  WmsLayer,
  wmsSupportedFeatureInfoType,
} from './wmsConstants.js';
import { name } from '../../../package.json';

/**
 * Parses WMS Capabilities and returns the created (and added to the plugin) DataItem.
 * @param app The VcsUiApp.
 * @param xml The WMS Capabilities.
 * @param url The fetched URL.
 * @returns The parsed capabilities as DataItem.
 */
function parseWmsSource(app: VcsUiApp, xml: string, url: string): DataItem {
  const plugin = app.plugins.getByKey(name) as DynamicLayerPlugin;
  const { Capability: capability, Service: service } =
    new WMSCapabilities().read(xml) as WmsCapabilities;

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
      if (l?.Layer) {
        if (l.Layer?.length > 1) return true;
        else return l.Name !== l.Layer[0].Name;
      } else return false;
    }
    const childDifferent = isChildDifferent(layer);

    /**
     * Finds the value of the last passed property name. When a layer and its nested layer are the same, returns the property of the nested one or, if it is a falsy value, the parent one. For non identical layers, returns the parent property value.
     * @param propertyNames The names of the nested properties to find.
     * @returns The value of the last passed property if exists.
     */
    function findValue(propertyNames: Array<string>): unknown {
      let prop = childDifferent
        ? (layer as { [k: string]: unknown })
        : (layer?.Layer?.[0] as { [k: string]: unknown }) ??
          (layer as { [k: string]: unknown });
      propertyNames.forEach((n) => {
        prop = prop?.[n] as { [k: string]: unknown };
      });
      return prop as unknown;
    }

    function validateExtent(extent: Extent): Extent {
      if (!Extent.validateOptions(extent.toJSON())) {
        return new Extent({
          coordinates: Extent.WGS_84_EXTENT,
          projection: { epsg: 4326 },
        });
      } else {
        if (extent.extent[0] < -180) extent.extent[0] = -180;
        if (extent.extent[1] < -90) extent.extent[1] = -90;
        if (extent.extent[2] > 180) extent.extent[2] = 180;
        if (extent.extent[3] > 90) extent.extent[3] = 90;
        return extent;
      }
    }

    return {
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
      attribution: {
        onlineResource: findValue(['Attribution', 'OnlineResource']) as string,
        title: findValue(['Attribution', 'Title']) as string,
      },
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
  }

  const content: DataItem<WebdataTypes.WMS> = {
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
    featureInfoResponseType: wmsSupportedFeatureInfoType.find((t) =>
      capability.Request.GetFeatureInfo.Format.includes(t),
    ),
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
  };
  function addActions(item: DataItem): void {
    item.actions.push(...getTreeviewDefaultActions(app, item));
    item.children.forEach((child) => addActions(child));
  }
  addActions(content);
  plugin.webdata.added.value.push(content);
  return content;
}

/**
 * Fetches a WMS source with the correct parameters.
 * @param app The VcsUiApp.
 * @param rawUrl The user-entered URL.
 * @returns The created and added to the plugin DataItem of the source.
 */
export async function addWmsSource(
  app: VcsUiApp,
  rawUrl: string,
): Promise<DataItem> {
  const serverUrl = rawUrl.split('?')[0];
  const rawParameters = rawUrl.split('?')[1]?.split('&');
  const parameters = rawParameters
    ? Object.fromEntries(rawParameters.map((p) => p.split('=')))
    : {};
  parameters.SERVICE = 'WMS';
  parameters.REQUEST = 'GetCapabilities';
  const stringParameters = Object.entries(parameters)
    .map((p) => p.join('='))
    .join('&');

  return fetch(`${serverUrl}?${stringParameters}`)
    .then((res) => res.text())
    .then((xml) => parseWmsSource(app, xml, serverUrl));
}

/**
 * Creates a Layer from the passed DataItem.
 * @param item The DataItem to add to the map.
 * @param rootItem The root DataItem.
 * @returns The created layer.
 */
export function itemToWmsLayer(
  item: DataItem<WebdataTypes.WMS>,
  rootItem: DataItem<WebdataTypes.WMS>,
): WMSLayer {
  const format = rootItem.formats!.includes('image/png')
    ? 'image/png'
    : rootItem.formats![0];
  const style = item.styles?.[0];
  const parameters = { format, styles: style?.value ?? '' };
  const layer = new WMSLayer({
    name: item.name,
    layers: item.name,
    url: item.url,
    extent:
      item.extent?.toJSON() ??
      new Extent({ coordinates: Extent.WGS_84_EXTENT }).toJSON(),
    ...(item.queryable && { featureInfo: { name } }),
    parameters,
    properties: {
      ...(item.queryable && { featureInfo: name }),
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
      attributions: {
        provider: rootItem.contact?.organization,
        url: rootItem?.onlineResource,
      },
    },
  });

  if (item.queryable) {
    layer.featureProvider = new WMSFeatureProvider(item.name, {
      url: item.url,
      parameters,
      extent: item?.extent,
      responseType: rootItem.featureInfoResponseType,
    });
  }
  return layer;
}
