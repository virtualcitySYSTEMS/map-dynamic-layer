import type { CatalogueData, Dataset, Distribution } from './catalogues.js';
import {
  getDistributionType,
  getLocalizedValue,
  removeLastSlash,
} from './catalogues.js';

/* eslint-disable @typescript-eslint/naming-convention */

type Locale = string;
type LocalizedObject = Record<Locale, string>;

type PiveauDistribution = {
  access_url: Array<string>;
  description: LocalizedObject;
  download_url: Array<string>;
  format: { id: string; label: string; title: string };
  id: string;
  issued: Date;
  license: { description: string; label: string; id: string };
  modified: Date;
  title: LocalizedObject;
};

type PiveauDataset = {
  catalog: { title: LocalizedObject; homepage: string };
  catalog_record: object;
  categories: Array<object>;
  contact_point: Array<object>;
  country: string;
  description: LocalizedObject;
  distributions: Array<PiveauDistribution>;
  id: string;
  identifier: Array<string>;
  is_hvd: boolean;
  issued: Date;
  keywords: Array<{
    id: string;
    label: string;
    title: string;
    language: string;
  }>;
  language: Array<{ id: string; label: string }>;
  modified: Date;
  publisher: { type: string; name: string; resource: string };
  quality_meas: null;
  resource: string;
  // temporal: Array<any>;
  title: LocalizedObject;
  translation_meta: object;
};

type PiveauResponse = {
  result: {
    // index: string;
    count: number;
    results: Array<PiveauDataset>;
    facets: Array<{
      id: string;
      title: string;
      items: Array<{
        count: number;
        id: string;
        title: string | LocalizedObject;
      }>;
    }>;
  };
};

export enum PiveauSortingOptions {
  relevance = 'relevance+desc',
  nameAsc = 'title.$locale$+asc',
  nameDesc = 'title.$locale$+desc',
  lastModified = 'modified+desc',
  lastCreated = 'issued+desc',
}

function parsePiveauDistribution(
  data: PiveauDistribution,
  locale: string,
): Distribution {
  const distribution: Distribution = {
    id: data.id,
    title: getLocalizedValue(data.title, locale) || data.id,
    description: getLocalizedValue(data.description, locale),
    type: getDistributionType(data.format?.label ?? data.format?.id),
    ...(data.issued && { created: new Date(data.issued).toDateString() }),
    ...(data.modified && { modified: new Date(data.modified).toDateString() }),
    ...(data.format && { format: data.format.label ?? data.format.id }),
    ...(data.license && { license: data.license.label ?? data.license.id }),
  };
  if (data.access_url?.[0]) {
    distribution.accessUrl = data.access_url[0];
  }
  if (data.download_url?.[0]) {
    distribution.downloadUrl = data.download_url[0];
  }
  return distribution;
}

function parsePiveauDataset(data: PiveauDataset, locale: string): Dataset {
  return {
    id: data.id,
    title: getLocalizedValue(data.title, locale),
    description: getLocalizedValue(data.description, locale),
    ...(data.publisher?.name && {
      publisher: { title: data.publisher.name, url: data.publisher?.resource },
    }),
    ...(data.issued && { created: new Date(data.issued).toDateString() }),
    ...(data.modified && { modified: new Date(data.modified).toDateString() }),
    keywords: data.keywords?.map(
      (k) => getLocalizedValue(k.title, locale) || k.label,
    ),
    distributions: data.distributions?.map((d) =>
      parsePiveauDistribution(d, locale),
    ),
  };
}

function parsePiveauResponse(
  data: PiveauResponse,
  locale: string,
): CatalogueData {
  return {
    count: data.result.count,
    datasets: data.result.results.map((r) => parsePiveauDataset(r, locale)),
    facets: data.result.facets
      .filter((f) => f.items.length > 0)
      .map((f) => ({
        id: f.id,
        title: f.title,
        values: f.items.map((i) => ({
          id: i.id,
          title: `${getLocalizedValue(i.title, locale)} (${i.count})`,
        })),
      })),
  };
}

/**
 * Fetches a Piveau catalogue and returns its response parsed.
 */
export async function fetchPiveau(
  catalogueUrl: string,
  itemsPerPage: number,
  page: number,
  query: string,
  sortBy: string | PiveauSortingOptions,
  facets: Record<string, string[]>,
  locale: string,
): Promise<CatalogueData> {
  const options = {
    method: 'GET',
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(30000),
  };
  const sort = Object.keys(PiveauSortingOptions).includes(sortBy)
    ? PiveauSortingOptions[sortBy as keyof typeof PiveauSortingOptions].replace(
        '$locale$',
        locale,
      )
    : PiveauSortingOptions.relevance;
  const url = new URL(`${removeLastSlash(catalogueUrl)}/search`);
  url.searchParams.append('filter', 'dataset');
  url.searchParams.append('q', query);
  url.searchParams.append('sort', sort);
  url.searchParams.append('page', page.toString());
  url.searchParams.append('limit', itemsPerPage.toString());
  url.searchParams.append('facets', JSON.stringify(facets));

  return fetch(url, options)
    .then((res) => res.json())
    .then((data: PiveauResponse) => parsePiveauResponse(data, locale));
}

/**
 * Fetches the catalogue to get the details of a dataset, return them.
 */
export async function fetchPiveauDataset(
  catalogueUrl: string,
  datasetId: string,
  locale: string,
): Promise<Dataset> {
  const url = new URL(`${removeLastSlash(catalogueUrl)}/datasets/${datasetId}`);
  const options = {
    method: 'GET',
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(5000),
  };

  return fetch(url, options)
    .then((res) => res.json())
    .then((data: { result: PiveauDataset }) =>
      parsePiveauDataset(data.result, locale),
    );
}
