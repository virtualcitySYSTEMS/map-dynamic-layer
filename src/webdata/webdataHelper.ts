import { DynamicLayerPlugin } from 'src';
import { DataItem, WebdataTypes } from './webdataConstants.js';

/**
 * Finds a DataItem with the passed name in the passed source.
 * @param source The DataItem in which to find the item.
 * @param itemName The name of the item to find.
 * @returns The found DataItem.
 */
function findNestedItemByName(source: DataItem, itemName: string): DataItem {
  function find(items: Array<DataItem>): DataItem {
    return (
      items.find((child) => child.name === itemName) ??
      find(items.flatMap((newItem) => newItem.children))
    );
  }
  return find(source.children);
}

/**
 * Finds a DataItem in the plugin.
 * @param plugin The DynamicLayer plugin.
 * @param url The URL of the DataItem to find.
 * @param name The name of the layer to find.
 * @returns The found DataItem.
 */
export function findDataItem(
  plugin: DynamicLayerPlugin,
  url: string,
  name: string,
): DataItem {
  const source = plugin.webdata.added.value.find((s) => s.url === url)!;
  return source.name === name ? source : findNestedItemByName(source, name);
}

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
      child.children.forEach((c) => applyFn([c]));
    });
  }
  applyFn([item]);
}

/**
 * Finds an unique name for a root DataItem.
 * @param plugin The DynamicLayerPlugin.
 * @param name The root of the layer name.
 * @returns An unique name starting with the passed root and ending with -number
 */
export function getUniqueLayerName(
  plugin: DynamicLayerPlugin,
  name: string,
): string {
  let index = 0;
  const find = (): boolean =>
    !!plugin.webdata.added.value.find((i) => i.name === `${name}-${index}`);
  while (find()) {
    index += 1;
  }
  return `${name}-${index}`;
}

/**
 * Parses an URL depending on the type of item to be added.
 * @param type The type of WebdataItem to be added.
 * @param url The URL to parse.
 * @returns The parsed URL.
 */
export function parseUrl(type: WebdataTypes, url: string): string {
  switch (type) {
    case WebdataTypes.WMS:
      return url.split('?')[0];
    case WebdataTypes.TERRAIN:
      return url.split('/layer.json')[0];
    default:
      return url;
  }
}
