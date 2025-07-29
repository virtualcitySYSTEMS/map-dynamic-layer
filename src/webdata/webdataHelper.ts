import { type VcsUiApp } from '@vcmap/ui';
import { Extent } from '@vcmap/core';
import type { DynamicLayerPlugin } from '../index.js';
import type { DataItem, WxsWebdataTypes } from './webdataConstants.js';
import { WebdataTypes } from './webdataConstants.js';
import { name } from '../../package.json';

/**
 * Filters the Array of DataItems and their children according to the passed condition.
 * @param array The DataItems to filter.
 * @param condition The condition to check.
 * @returns An Array of DataItems with their children respecting the condition.
 */
export function filterItemChildren(
  array: Array<DataItem>,
  condition: (item: DataItem) => boolean,
): Array<DataItem> {
  const getNodes = (
    result: Array<DataItem>,
    item: DataItem,
  ): Array<DataItem> => {
    if (condition(item)) {
      result.push(item);
      return result;
    } else if (item.children.length) {
      const nodes = item.children.reduce(getNodes, []);
      if (nodes.length) {
        const newItem = { ...item };
        newItem.children = nodes;
        result.push(newItem);
      }
    }
    return result;
  };
  return array.reduce(getNodes, []);
}

/**
 * Applies a function to a DataItem and all its children.
 * @param fn The function to apply to the passed item and its children.
 * @param item The root DataItem on which apply the passed function.
 */
export function applyFnToItemAndChildren(
  fn: (el: DataItem) => void,
  item: DataItem,
): void {
  function applyFn(items: Array<DataItem>): void {
    items.forEach((child) => {
      fn(child);
      if (child.children.length) {
        applyFn(child.children);
      }
    });
  }
  applyFn([item]);
}

/**
 * Finds an unique name for a root DataItem.
 * @param app The VcsUIApp.
 * @param layername The root of the layer name.
 * @returns An unique name starting with the passed root and ending with -number
 */
export function getUniqueLayerName(app: VcsUiApp, layername: string): string {
  const plugin = app.plugins.getByKey(name) as DynamicLayerPlugin;
  let index = 1;
  const find = (): boolean =>
    !!app.layers.getByKey(`${layername}-${index}`) ||
    !!plugin.webdata.added.value.find(
      (i) => i.name === `${layername}-${index}`,
    );
  while (find()) {
    index += 1;
  }
  return `${layername}-${index}`;
}

/**
 * @param url The URL from which to keep parameters.
 * @param service The type of service to be fetched.
 * @returns All the parameters from the URL as a string, and the optional parameters.
 */
export function getCapabilitiesParameters(
  url: string,
  service: 'WFS' | 'WMS' | 'WMTS',
): { parameters: string; optionalParameters: Record<string, string> } {
  const requiredParameters = ['REQUEST', 'SERVICE', 'VERSION'];
  const rawParameters = url.split('?')[1]?.split('&');
  const parameters = rawParameters
    ? Object.fromEntries(
        rawParameters
          .map((p) => p.split('='))
          .map(([p, v]) => [
            requiredParameters.includes(p.toUpperCase()) ? p.toUpperCase() : p,
            v,
          ]),
      )
    : {};
  const optionalParameters = { ...parameters };
  requiredParameters.forEach((p) => {
    delete optionalParameters[p];
  });
  parameters.SERVICE = service;
  parameters.REQUEST = 'GetCapabilities';
  return {
    parameters: Object.entries(parameters)
      .map((p) => p.join('='))
      .join('&'),
    optionalParameters,
  };
}

/**
 * Appends parameters to an URL in query notation.
 * @param url The URL to append the parameters to.
 * @param parameters The parameters to append to the URL.
 * @returns The URL with the appened parameters.
 */
export function appendQueryParamsToUrl(
  url: string,
  parameters?: Record<string, string>,
): string {
  const fullUrl = new URL(url);
  if (parameters && Object.entries(parameters).length) {
    Object.entries(parameters).forEach(([key, value]) => {
      fullUrl.searchParams.append(key, value);
    });
  }
  return fullUrl.toString();
}

/**
 * Validates and adjusts the given extent to ensure it falls within the valid range.
 * @param extent - The extent to validate and adjust.
 * @returns The validated and adjusted extent. If the input extent is invalid, returns a new extent with WGS 84 coordinates.
 */
export function validateExtent(extent: Extent): Extent {
  if (!Extent.validateOptions(extent.toJSON())) {
    return new Extent({
      coordinates: Extent.WGS_84_EXTENT,
      projection: { epsg: 4326 },
    });
  } else {
    if (extent.extent[0] < -180) {
      extent.extent[0] = -180;
    }
    if (extent.extent[1] < -90) {
      extent.extent[1] = -90;
    }
    if (extent.extent[2] > 180) {
      extent.extent[2] = 180;
    }
    if (extent.extent[3] > 90) {
      extent.extent[3] = 90;
    }
    return extent;
  }
}

/**
 * Parses an URL according to the type. The returned value is the one used for the `url` value of the root DataItem.
 * @param url The URL to parse.
 * @param type The WebdataType used to define the way to parse.
 * @returns The parsed URL.
 */
export function parseWebdataUrl(url: string, type?: WebdataTypes): string {
  switch (type) {
    case WebdataTypes.TERRAIN:
      return url.split('/layer.json')[0];
    case WebdataTypes.WFS:
    case WebdataTypes.WMS:
    case WebdataTypes.WMTS:
      return url.split('?')[0];
    // 3D Tiles URL does not need to be parsed.
    default:
      return url;
  }
}

/**
 * Checks if the passed DataItem is a WXS WebdataType (WFS, WMS, WMTS).
 * @param item The DataItem to check.
 * @returns True if the item is a WXS WebdataType, false otherwise.
 */
export function isWxsWebdataType(
  item: DataItem,
): item is DataItem<WxsWebdataTypes> {
  return [WebdataTypes.WFS, WebdataTypes.WMS, WebdataTypes.WMTS].includes(
    item.type,
  );
}
