import { VcsUiApp } from '@vcmap/ui';
import { CategoryType } from './constants.js';
import { DataItem, WebdataTypes } from './webdata/webdataConstants.js';
import { name } from '../package.json';

/**
 * Returns the supported data types for a passed CategoryType.
 * @param type The CategoryType for which to return the supported types.
 * @returns All the supported data types for the passed CategoryTypes.
 */
export function getAvailableWebdataTypes(
  type: CategoryType.CATALOGUES | CategoryType.WEBDATA,
): Array<{
  value: WebdataTypes;
  title: string;
}> {
  if (type === CategoryType.WEBDATA) {
    return Object.values(WebdataTypes).map((typeName) => {
      return {
        value: typeName,
        title: `dynamicLayer.webdata.${typeName}`,
      };
    });
  } else {
    return [];
  }
}

/**
 * Renames an item and its contentTreeItem based on the layer's title (which must have been renamed in a first place).
 * @param app The VcsUiApp.
 * @param item The item to rename.
 */
export function renameAction(app: VcsUiApp, item: DataItem): void {
  const layer = app.layers.getByKey(item.name)!;
  const newTitle = layer.properties.title as string;
  const contentTreeItem = app.contentTree.getByKey(
    `${name}.${item.name.replaceAll('.', '')}`,
  )!;
  contentTreeItem.title = newTitle;
  item.title = newTitle;
}
