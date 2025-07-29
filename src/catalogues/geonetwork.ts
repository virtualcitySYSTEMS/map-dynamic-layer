import { v4 as uuid } from 'uuid';
import type { CatalogueData, Dataset, Distribution } from './catalogues.js';
import {
  camelCaseToWords,
  getDistributionType,
  removeLastSlash,
} from './catalogues.js';

/* eslint-disable @typescript-eslint/naming-convention */

/** GeoNetwork API types of a dataset. */
type GeoNetworkDataset = {
  title: string;
  abstract: string;
  responsibleParty: string[];
  validInspire: string;
  type: string;
  resolution: string;
  legalConstraints: string;
  isHarvested: string;
  displayOrder: string;
  docLocale: string;
  popularity: string;
  publishedForGroup: string;
  valid_xsd: string;
  identifier: string;
  image: string;
  tempExtentBegin: string;
  mdLanguage: string;
  crsDetails: { code: string; codeSpace: string; name: string; url: string };
  spatialRepresentationType_text: string;
  mdStatus: string;
  root: string;
  isTemplate: string;
  valid: string;
  tempExtentEnd: Date;
  rating: string;
  source: string;
  category: string[];
  status: string;
  geoBox: string;
  owner: string;
  recordOwner: string;
  defaultAbstract: string;
  link: string | string[];
  defaultTitle: string;
  datasetLang: string;
  userinfo: string;
  topicCat: string;
  tempExtentPeriod: string;
  publicationDate: Date;
  status_text: string;
  standardName: string;
  crs: string;
  logo: string;
  draft: string;
  keyword: string[] | string;
  keywordGroup: Record<string, Array<{ value: string; link: string }>>;
  groupOwner: string;
  _locale: string;
  'geonet:info': {
    '@xmlns:geonet': string;
    id: string;
    uuid: string;
    schema: string;
    createDate: Date;
    changeDate: Date;
    source: string;
    isPublishedToAll: string;
    view: string;
    notify: string;
    download: string;
    dynamic: string;
    featured: string;
    selected: string;
  };
};

type CategoryEntry = {
  '@count': string;
  '@label': string;
  '@value': string;
};

type GeoNetworkResponse = {
  // '@from': string; '@maxPageSize': string; '@selected': string; '@to': string;
  metadata: Array<GeoNetworkDataset> | GeoNetworkDataset;
  summary: {
    // '@type': string;
    '@count': string;
    dimension: Array<{
      '@label': string;
      '@name': string;
      category?: Array<CategoryEntry> | CategoryEntry;
    }>;
  };
};

export enum GeoNetworkSortingOptions {
  relevance = 'relevance',
  lastModified = 'changeDate',
  nameAsc = 'title',
  rating = 'rating',
  popularity = 'popularity',
  lowScaleFirst = 'denominatorDesc',
  highScaleFirst = 'denominatorAsc',
}

function parseGeoNetworkDistribution(data: string): Distribution {
  const rawDistribution = data.split('|');
  let title = rawDistribution[0];
  if (title && rawDistribution[1]) {
    title += ` ${rawDistribution[1]}`;
  } else if (rawDistribution[1]) {
    title = rawDistribution[1];
  } else if (!title) {
    title = rawDistribution[2];
  }
  const type =
    getDistributionType(rawDistribution[4]) ??
    getDistributionType(rawDistribution[3]) ??
    getDistributionType(rawDistribution[2]);

  return {
    id: uuid(),
    title,
    description: rawDistribution[1],
    type,
    [rawDistribution[3].includes('link') ? 'downloadUrl' : 'accessUrl']:
      rawDistribution[2],
    format: (rawDistribution[3] || type?.slice(0, -5)) ?? rawDistribution[4],
  };
}

function parseGeoNetworkDataset(data: GeoNetworkDataset): Dataset {
  const dataset: Dataset = {
    id: data['geonet:info'].uuid,
    title: data.title ?? data.defaultTitle ?? data.identifier,
    description: data.abstract ?? data.defaultAbstract,
    ...(data.recordOwner && { owner: { title: data.recordOwner } }),
  };
  if (data.publicationDate) {
    dataset.created = new Date(data.publicationDate).toDateString();
  }
  if (data['geonet:info']?.changeDate) {
    dataset.modified = new Date(data['geonet:info'].changeDate).toDateString();
  }
  if (data.keyword) {
    dataset.keywords = Array.isArray(data.keyword)
      ? data.keyword
      : [data.keyword];
  }
  if (data.link) {
    dataset.distributions = (
      Array.isArray(data.link) ? data.link : [data.link]
    ).map(parseGeoNetworkDistribution);
  }
  return dataset;
}

function parseGeoNetworkResponse(data: GeoNetworkResponse): CatalogueData {
  const facets = data.summary.dimension
    .filter(
      (f) =>
        f.category &&
        (Array.isArray(f.category) ? f.category : [f.category]).length > 0,
    )
    .map((f) => ({
      id: f['@name'],
      title: camelCaseToWords(f['@label']),
      values: (Array.isArray(f.category) ? f.category : [f.category])
        .filter((v) => !!v)
        .map((v) => ({
          id: v['@value'],
          title: `${v['@label']} (${v['@count']})`,
        })),
    }));
  const datasets = Array.isArray(data.metadata)
    ? data.metadata.map(parseGeoNetworkDataset)
    : [parseGeoNetworkDataset(data.metadata)];

  return { count: +data.summary['@count'], datasets, facets };
}

// https://idecyl.jcyl.es/geonetwork/doc/en/api/q-search.html

/**
 * Fetches a GeoNetwork Catalogue.
 * @param catalogueUrl The URl of the GeoNetwork Catalogue to fetch.
 * @param itemsPerPage The number of datasets to return.
 * @param page The page to fetch.
 * @param query The user query.
 * @param sort The sorting order.
 * @param facets The filters to apply.
 * @returns The results from the GeoNetwork Catalogue.
 */

export async function fetchGeoNetwork(
  catalogueUrl: string,
  itemsPerPage: number,
  page: number,
  query: string,
  sort: string,
  facets: Record<string, string[]>,
): Promise<CatalogueData> {
  const options = { method: 'GET', signal: AbortSignal.timeout(30000) };
  const facetQ = { type: 'dataset', ...facets };
  const sortBy = Object.keys(GeoNetworkSortingOptions).includes(sort)
    ? GeoNetworkSortingOptions[sort as keyof typeof GeoNetworkSortingOptions]
    : GeoNetworkSortingOptions.relevance;

  const url = new URL(`${removeLastSlash(catalogueUrl)}/q`);
  url.searchParams.set('_content_type', 'json');
  url.searchParams.set(
    'facet.q',
    Object.entries(facetQ)
      .map(([k, v]) => `${k}/${encodeURIComponent(v)}`)
      .join('&'),
  );
  url.searchParams.set('resultType', 'details');
  url.searchParams.set('fast', 'index');
  url.searchParams.set('from', (itemsPerPage * page + 1).toString());
  url.searchParams.set('to', (itemsPerPage * (page + 1)).toString());
  url.searchParams.set('any', query);
  url.searchParams.set('sortBy', sortBy);
  if (sortBy === GeoNetworkSortingOptions.nameAsc) {
    url.searchParams.append('sortOrder', 'reverse');
  }

  return fetch(url, options)
    .then((res) => res.json())
    .then((data: GeoNetworkResponse) => parseGeoNetworkResponse(data));
}

/**
 * Fetches the catalogue to get the details of a dataset, return them.
 */
export async function fetchGeoNetworkDataset(
  catalogueUrl: string,
  datasetId: string,
): Promise<Dataset> {
  const options = { method: 'GET', signal: AbortSignal.timeout(5000) };
  const url = new URL(`${removeLastSlash(catalogueUrl)}/q`);
  url.searchParams.set('_content_type', 'json');
  url.searchParams.set('fast', 'index');
  url.searchParams.set('_uuid_OR__id', datasetId);

  return fetch(url, options)
    .then((res) => res.json())
    .then((data: GeoNetworkResponse) => {
      const dataset = Array.isArray(data.metadata)
        ? data.metadata[0]
        : data.metadata;
      return parseGeoNetworkDataset(dataset);
    });
}
