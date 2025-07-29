import { CzmlLayer } from '@vcmap/core';
import { type VcsUiApp } from '@vcmap/ui';
import { reactive } from 'vue';
import { getTreeviewDefaultActions } from '../webdataActionsHelper.js';
import type { DataItem } from '../webdataConstants.js';
import { WebdataTypes } from '../webdataConstants.js';

/**
 * Creates and returns the created DataItem.
 * @param app The VcsUiApp.
 * @param url The URL of the CzmlLayer to add.
 * @param uniqueName The unique name of the DataItem.
 * @param title The title of the DataItem.
 * @returns The created DataItem.
 */
export function addCzmlSource(
  app: VcsUiApp,
  url: string,
  uniqueName: string,
  title: string,
): DataItem {
  const czmlDataItem: DataItem<WebdataTypes.CZML> = reactive({
    actions: [],
    children: [],
    name: uniqueName,
    title,
    type: WebdataTypes.CZML,
    url,
    isRootElement: true,
  });
  czmlDataItem.actions.push(...getTreeviewDefaultActions(app, czmlDataItem));
  return czmlDataItem;
}

/**
 * Creates a CzmlLayer from the passed DataItem.
 * @param item The DataItem to create a CzmlLayer from.
 * @returns The created CzmlLayer.
 */
export function itemToCzml(item: DataItem): CzmlLayer {
  return new CzmlLayer({
    url: item.url,
    name: item.name,
    properties: { title: item.title },
  });
}
