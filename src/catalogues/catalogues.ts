import { Viewpoint } from '@vcmap/core';
import type { VcsUiApp } from '@vcmap/ui';
import { NotificationType, getPluginAssetUrl } from '@vcmap/ui';
import { getLogger } from '@vcsuite/logger';
import type Feature from 'ol/Feature.js';
import {
  addLayerFromItem,
  ActionsNames,
} from '../webdata/webdataActionsHelper.js';
import { fetchSource } from '../webdata/webdataApi.js';
import type { DataItem } from '../webdata/webdataConstants.js';
import { WebdataTypes } from '../webdata/webdataConstants.js';
import { dynamicLayerId } from '../DynamicLayer.vue';
import {
  fetchGeoNetwork,
  fetchGeoNetworkDataset,
  GeoNetworkSortingOptions,
} from './geonetwork.js';
import {
  fetchPiveau,
  fetchPiveauDataset,
  PiveauSortingOptions,
} from './piveau.js';
import { fetchIdra, fetchIdraDataset, IdraSortingOptions } from './idra.js';
import { name } from '../../package.json';
import { fetchRegistry } from './nbsRegistry.js';

/** The support Catalogues types. */
export enum CataloguesTypes {
  IDRA = 'idra',
  NBS = 'nbsRegistry',
  PIVEAU = 'piveau',
  GEONETWORK = 'geonetwork',
}

export type Distribution = {
  id: string;
  title: string;
  type: WebdataTypes | 'feature' | undefined;
  description?: string;
  accessUrl?: string;
  downloadUrl?: string;
  feature?: Feature;
  created?: string;
  modified?: string;
  format?: string;
  license?: string;
};

export type Dataset = {
  id: string;
  title: string;
  description?: string;
  publisher?: { title: string; url?: string };
  source?: { title: string; url?: string };
  owner?: { title: string; url?: string };
  created?: string;
  modified?: string;
  keywords?: string[];
  distributions?: Distribution[];
};
export type CatalogueData = {
  count: number;
  facets: Array<Facet>;
  datasets: Array<Dataset>;
};

export type CatalogueItem = {
  title: string;
  url: string;
  type: CataloguesTypes;
  subtitle?: string;
  /** The markdown template rendered when no dataset is selected. */
  description?: string;
  /** Optional logo to overwrite the catalogue type's logo */
  logo?: string;
  /** Optional filter to apply when loading the catalogue, defined in the config */
  filter?: string;
  data: CatalogueData;
};

/** The generic Facet of a Catalogue */
export type Facet = {
  id: string;
  title: string;
  values: Array<{ title: string; id: string }>;
};

export const sortOptions: Record<CataloguesTypes, Array<string>> = {
  [CataloguesTypes.PIVEAU]: Object.keys(PiveauSortingOptions),
  [CataloguesTypes.IDRA]: Object.keys(IdraSortingOptions),
  [CataloguesTypes.GEONETWORK]: Object.keys(GeoNetworkSortingOptions),
  [CataloguesTypes.NBS]: [],
};

/**
 * Fetches a catalogue based on the provided parameters.
 * @param item - A partial object of type `CatalogueItem` containing the item details.
 * @param itemsPerPage - The number of items to fetch per page.
 * @param filter - An optional filter string to apply when fetching the catalogue.
 * @param locale - The locale to use for fetching the catalogue. Defaults to 'en'.
 * @param page - The page number to fetch. Defaults to 0.
 * @param query - The search query string. Defaults to an empty string.
 * @param sortBy - The sorting mode to use. Defaults to `Sorting.relevance`.
 * @param facets - An object containing facet filters. Defaults to an empty object.
 * @returns A promise that resolves to either a `PiveauResult` or an `IdraResult`.
 */
export async function fetchCatalogue(
  catalogueType: CataloguesTypes,
  url: string,
  itemsPerPage: number,
  filter?: string,
  locale = 'en',
  page = 0,
  query = '',
  sortBy = 'relevance',
  facets: Record<string, string[]> = {},
): Promise<CatalogueData | undefined> {
  if (catalogueType === CataloguesTypes.PIVEAU) {
    return fetchPiveau(
      url,
      itemsPerPage,
      page,
      query,
      sortBy,
      facets,
      locale,
      filter,
    );
  } else if (catalogueType === CataloguesTypes.NBS) {
    return fetchRegistry(url, itemsPerPage, page, facets);
  } else if (catalogueType === CataloguesTypes.IDRA) {
    return fetchIdra(url, itemsPerPage, page, query, sortBy, facets);
  } else {
    return fetchGeoNetwork(
      url,
      itemsPerPage,
      page,
      query,
      sortBy,
      facets,
      filter,
    );
  }
}

/**
 *
 * @param type The type of catalogue to be fetched
 * @param url The URL of the catalogue
 * @param datasetId The id of the dataset to load.
 * @param locale The locale to use when parsing the compatible datasets.
 * @returns The dataset.
 */
export function fetchDataset(
  type: CataloguesTypes,
  url: string,
  datasetId: string,
  locale: string,
): Promise<Dataset> {
  switch (type) {
    case CataloguesTypes.GEONETWORK:
      return fetchGeoNetworkDataset(url, datasetId);
    case CataloguesTypes.IDRA:
      return fetchIdraDataset(url, datasetId);
    case CataloguesTypes.PIVEAU: {
      return fetchPiveauDataset(url, datasetId, locale);
    }
    default:
      throw new Error('Unsupported catalogue type');
  }
}

function zoomToLayerExtent(app: VcsUiApp, layerName: string): void {
  if (app.windowManager.has(dynamicLayerId)) {
    app.windowManager.remove(dynamicLayerId);
  }
  const extent = app.layers.getByKey(layerName)?.getZoomToExtent();
  if (extent) {
    const vp = Viewpoint.createViewpointFromExtent(extent);
    if (vp) {
      const { activeMap } = app.maps;
      if (activeMap) {
        app.maps.activeMap!.gotoViewpoint(vp).catch((error: unknown) => {
          getLogger(name).error(String(error));
        });
      } else {
        const listener = app.maps.mapActivated.addEventListener(() => {
          listener();
          app.maps.activeMap!.gotoViewpoint(vp).catch((error: unknown) => {
            getLogger(name).error(String(error));
          });
        });
      }
    }
  }
}

export async function addDistributionToMap(
  app: VcsUiApp,
  url: string,
  dataType: WebdataTypes,
  id: string,
  title: string,
  zoomToExtent = false,
): Promise<undefined | DataItem> {
  try {
    const source = await fetchSource(app, url, dataType, id, title);
    if (!source.children.length) {
      await addLayerFromItem(app, source);
      if (zoomToExtent) {
        zoomToLayerExtent(app, source.name);
      }
    } else if (
      source.children.length === 1 &&
      !source.children[0].children.length
    ) {
      await addLayerFromItem(app, source.children[0]);
      if (zoomToExtent) {
        zoomToLayerExtent(app, source.children[0].name);
      }
    } else {
      return Object.assign(source, {
        actions: source.actions.filter(
          (a) => a.name !== ActionsNames.DeleteSource.toString(),
        ),
      });
    }
  } catch (error) {
    app.notifier.add({ type: NotificationType.ERROR, message: String(error) });
  }
  return undefined;
}

/**
 * Finds the icon URL of a catalogue.
 * @param app The VcsUiApp.
 * @param catalogueType The type of Catalogue to get an icon for.
 * @returns The source URL of the icon.
 */
export function getCatalogueIcon(
  app: VcsUiApp,
  catalogueType: CataloguesTypes,
): string {
  return (
    getPluginAssetUrl(app, name, `plugin-assets/${catalogueType}_logo.png`) ??
    ''
  );
}

/**
 * Returns the localized value according to the passed locale, or English otherwise.
 * If none of these languages exist, returns the first value.
 * If the passed element is a string, returns this string.
 * @param el The element to get the value from.
 * @param locale The locale to use in priority.
 * @returns The localized value.
 */
export function getLocalizedValue(
  el: string | Record<string, string> | undefined,
  locale: string,
): string {
  if (!el) {
    return '';
  }
  if (typeof el === 'string') {
    return el;
  }
  return el[locale] ?? el.en ?? Object.values(el)[0];
}

export function removeLastSlash(url: string): string {
  if (url.slice(-1) === '/') {
    return url.slice(0, -1);
  }
  return url;
}

export function camelCaseToWords(str: string): string {
  return str
    .match(/^[a-z]+|[A-Z][a-z]*/g)!
    .map((x) => x[0].toUpperCase() + x.substring(1).toLowerCase())
    .join(' ');
}

/**
 * Finds in the distribution format if its format is map supported.
 * @param distribution The distribution from which to get the equivalent WebdataType.
 */
export function getDistributionType(
  format: string | undefined,
): WebdataTypes | undefined {
  function checkType(type: string): boolean {
    return format ? format.toLowerCase().includes(type) : false;
  }
  if (checkType('wfs')) {
    return WebdataTypes.WFS;
  }
  if (checkType('wms')) {
    return WebdataTypes.WMS;
  }
  if (checkType('wmts')) {
    return WebdataTypes.WMTS;
  }
  if (checkType('geojson')) {
    return WebdataTypes.GEOJSON;
  }
  if (checkType('czml')) {
    return WebdataTypes.CZML;
  }
  return undefined;
}
