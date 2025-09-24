import { NotificationType, type VcsUiApp } from '@vcmap/ui';
import { getLogger } from '@vcsuite/logger';
import { CategoryType } from './constants.js';
import { WebdataTypes } from './webdata/webdataConstants.js';
import { name } from '../package.json';
import type { DynamicLayerPlugin, EntryPointState } from './index.js';
import type { CataloguePreset } from './defaultOptions.js';
import type { CatalogueItem } from './catalogues/catalogues.js';
import {
  CataloguesTypes,
  fetchCatalogue,
  fetchDataset,
} from './catalogues/catalogues.js';

/**
 * Returns the supported data types for a passed CategoryType.
 * @param type The CategoryType for which to return the supported types.
 * @returns All the supported data types for the passed CategoryTypes.
 */
export function getAvailableTypes(
  type: CategoryType.CATALOGUES | CategoryType.WEBDATA,
): Array<{
  value: WebdataTypes | CataloguesTypes;
  title: string;
}> {
  if (type === CategoryType.WEBDATA) {
    return Object.values(WebdataTypes).map((value) => ({
      value,
      title: `dynamicLayer.webdata.type.${value}`,
    }));
  } else {
    return Object.values(CataloguesTypes).map((value) => ({
      value,
      title: `dynamicLayer.catalogues.type.${value}`,
    }));
  }
}

/**
 * Creates a name for an item to be added to the content tree.
 * @param layerName The layer name.
 * @returns The name.
 */
export function createContentTreeName(layerName: string): string {
  // remove all points in the layer name, otherwise they don't show up
  return `${name}.${layerName.replaceAll('.', '')}`;
}

/**
 * Fetches and adds the predefined Catalogues to the plugin.
 * @param app The VcsUiApp.
 * @param catalogues The Catalogues defined in the config file to preload.
 * @param [entry] An optional object to load a distribution.
 */
export function preloadCatalogues(
  app: VcsUiApp,
  catalogues: Array<CataloguePreset>,
  entry?: EntryPointState,
): void {
  const plugin = app.plugins.getByKey(name) as DynamicLayerPlugin;

  /**
   * Loads and adds to the plugin the passed catalogue.
   * @param c The Catalogue to load.
   * @returns The loaded catalogue.
   */
  function load(c: CataloguePreset): Promise<CatalogueItem | undefined> {
    const { host } = new URL(c.url);
    const catalogueItem = {
      title: c.title ?? host.replace('www.', ''),
      url: c.url,
      type: c.type,
      subtitle: c.subtitle,
      ...(c.logo && { logo: c.logo }),
      ...(c.filter && { filter: c.filter }),
      ...(c.description && { description: c.description }),
    };

    return fetchCatalogue(
      catalogueItem.type,
      catalogueItem.url,
      plugin.config.catalogues.itemsPerPage,
      c.filter,
    ).then((data) => {
      if (data) {
        const catalogue: CatalogueItem = {
          ...catalogueItem,
          data,
        };
        plugin.catalogues.added.value.push(catalogue);
        return catalogue;
      }
      return undefined;
    });
  }

  const entryCatalogue = catalogues.find((c) => c.url === entry?.url);

  if (entryCatalogue) {
    load(entryCatalogue)
      .then((catalogue) => {
        plugin.catalogues.selected.value = catalogue as CatalogueItem;
        const { type, url } = catalogue as CatalogueItem;
        fetchDataset(type, url, entry!.dataset, app.locale)
          .then((result) => {
            plugin.catalogues.selectedDataset.value = result;
            plugin.catalogues.expandedDistributionIds.value = [entry!.distrib];
          })
          .catch((error: unknown) => {
            app.notifier.add({
              type: NotificationType.ERROR,
              title: 'dynamicLayer.errors.fetchingDatasetDetails',
              message: String(error),
            });
          });
      })
      .catch(() => {
        getLogger(name).error(
          `${app.vueI18n.t('dynamicLayer.errors.unablePreloadCatalogue')} ${entryCatalogue.url}`,
        );
      });
  }
  Promise.all(
    catalogues
      .filter((c) => c !== entryCatalogue)
      .map(async (c) => {
        await load(c);
      }),
  ).catch((error: unknown) => {
    getLogger(name).error(String(error));
  });
}
