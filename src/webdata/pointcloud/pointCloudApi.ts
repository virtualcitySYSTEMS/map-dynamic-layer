import { PointCloudLayer } from '@vcmap/core';
import { type VcsUiApp } from '@vcmap/ui';
import { reactive, toRaw } from 'vue';
import { getTreeviewDefaultActions } from '../webdataActionsHelper.js';
import type { DataItem } from '../webdataConstants.js';
import { WebdataTypes } from '../webdataConstants.js';

/**
 * Creates and returns the created DataItem.
 * @param app The VcsUiApp.
 * @param url The URL of the PointCloud to add.
 * @param uniqueName The unique name of the DataItem.
 * @param title The title of the DataItem.
 * @returns The created DataItem.
 */
export function addPointCloudSource(
  app: VcsUiApp,
  url: string,
  uniqueName: string,
  title: string,
): DataItem {
  const pointCloudDataItem: DataItem<WebdataTypes.POINTCLOUD> = reactive({
    actions: [],
    children: [],
    name: uniqueName,
    title,
    type: WebdataTypes.POINTCLOUD,
    url,
    isRootElement: true,
  });
  pointCloudDataItem.actions.push(
    ...getTreeviewDefaultActions(app, pointCloudDataItem),
  );
  return pointCloudDataItem;
}

/**
 * Creates a PointCloudLayer from the passed DataItem.
 * @param item The DataItem to create a PointCloudLayer from.
 * @returns The created PointCloudLayer.
 */
export function itemToPointCloud(item: DataItem): PointCloudLayer {
  return new PointCloudLayer({
    url: item.url,
    name: item.name,
    headers: toRaw(item.headers),
    properties: { title: item.title },
  });
}
