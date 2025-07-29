import { GeoJSONLayer, Projection } from '@vcmap/core';
import { type VcsUiApp } from '@vcmap/ui';
import type { Reactive } from 'vue';
import { reactive } from 'vue';
import { getTreeviewDefaultActions } from '../webdataActionsHelper.js';
import type { DataItem } from '../webdataConstants.js';
import { WebdataTypes } from '../webdataConstants.js';

/**
 * Creates, adds to the plugin and returns the created DataItem.
 * @param app The VcsUiApp.
 * @param url The URL of the GeoJSON to add.
 * @param uniqueName The unique name of the DataItem.
 * @param title The title of the DataItem.
 * @returns The created DataItem.
 */
export function addGeoJSONSource(
  app: VcsUiApp,
  url: string,
  uniqueName: string,
  title: string,
): DataItem {
  const geojsonDataItem: Reactive<DataItem<WebdataTypes.GEOJSON>> = reactive({
    actions: [],
    children: [],
    name: uniqueName,
    title,
    type: WebdataTypes.GEOJSON,
    url,
    isRootElement: true,
  });
  geojsonDataItem.actions = getTreeviewDefaultActions(app, geojsonDataItem);
  return geojsonDataItem;
}

/**
 * Creates a GeoJSONLayer from the passed DataItem.
 * @param item The DataItem to create a GeoJSONLayer from.
 * @returns The created GeoJSONLayer.
 */
export function itemToGeoJSONLayer(item: DataItem): GeoJSONLayer {
  return new GeoJSONLayer({
    url: item.url,
    name: item.name,
    projection: new Projection({ epsg: 4326 }),
    properties: { title: item.title },
  });
}
