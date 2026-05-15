import { v4 as uuid } from 'uuid';
import type {
  CatalogueData,
  CatalogueOptions,
  Dataset,
  Distribution,
} from './catalogues.js';
import {
  camelCaseToWords,
  CataloguesTypes,
  enforceCatalogueUrl,
  getDistributionType,
} from './catalogues.js';

/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/naming-convention */

type GeonetworkDistribution = {
  descriptionObject: { default: string };
  mimeType: string;
  urlObject: { default: string };
  hash: string;
  /*
  protocol: string;
  function: string;
  applicationProfile: string;
  idx: number;
  group: number;
  */
};

type AggregationBucket = {
  key: string;
  doc_count: number;
};

type TermsAggregation = {
  buckets?: AggregationBucket[];
  doc_count_error_upper_bound?: number;
  sum_other_doc_count?: number;
  meta?: { field: string };
};

/** GeoNetwork API types of a dataset. */
type GeoNetworkDataset = {
  _id: string;
  _source: {
    resourceTitleObject: { default: string };
    resourceDate: Array<{ type: string; date: string }>;
    resourceAbstractObject: { default: string };
    contactForResource: Array<{
      organisationObject: { default: string };
      website: string;
    }>;
    tag: Array<{ default: string; key?: string }>;
    link: Array<GeonetworkDistribution>;
    recordOwner: string;
    // And other properites not used, so not typed
  };
  /*
  _index: string;
  _score: number;
  _type: string;
  edit: boolean;
  canReview: boolean;
  owner: boolean;
  isPublishedToAll: boolean;
  view: boolean;
  notify: boolean;
  download: boolean;
  dynamic: boolean;
  featured: boolean;
  selected: boolean;
  */
};

type GeoNetworkResponse = {
  took: number;
  timed_out: boolean;
  _shards: {
    total: number;
    successful: number;
    skipped: number;
    failed: number;
  };
  hits: {
    max_score: number;
    total: {
      value: number;
      relation: string;
    };
    hits: Array<GeoNetworkDataset>;
  };
  aggregations?: Record<string, TermsAggregation>;
};

export enum GeoNetworkSortingOptions {
  relevance = 'relevance',
  rating = 'rating',
  popularity = 'popularity',
  lastModified = 'dateStamp',
  lastCreated = 'createDate',
  nameAsc = 'resourceTitleObject.default.sort',
}

function parseGeoNetworkDistribution(
  data: GeonetworkDistribution,
): Distribution {
  const type = getDistributionType(data.urlObject.default);

  return {
    id: data.hash || uuid(),
    title: data.hash,
    description: data.descriptionObject?.default,
    type,
    [!type ? 'downloadUrl' : 'accessUrl']: data.urlObject.default,
    format: data.mimeType || type?.slice(0, -5),
  };
}

function parseGeoNetworkDataset(data: GeoNetworkDataset): Dataset {
  const dataset: Dataset = {
    id: data._id,
    title: data._source.resourceTitleObject?.default,
    description: data._source.resourceAbstractObject?.default,
  };
  if (data._source.contactForResource?.[0]?.organisationObject?.default) {
    dataset.source = {
      title: data._source.contactForResource[0].organisationObject?.default,
      ...(data._source.contactForResource[0].website
        ? { url: data._source.contactForResource[0].website }
        : {}),
    };
  }
  if (data._source.recordOwner) {
    dataset.owner = {
      title: data._source.recordOwner,
    };
  }
  const creationDate = data._source.resourceDate?.find(
    (d) => d.type === 'creation',
  );
  if (creationDate) {
    dataset.created = new Date(creationDate.date).toDateString();
  }
  const revisionDate = data._source.resourceDate?.find(
    (d) => d.type === 'revision',
  );
  if (revisionDate && revisionDate !== creationDate) {
    dataset.modified = new Date(revisionDate.date).toDateString();
  }
  if (data._source.tag?.length > 0) {
    dataset.keywords = data._source.tag.map((t) => t.default);
  }
  if (data._source.link?.length > 0) {
    dataset.distributions = (
      Array.isArray(data._source.link) ? data._source.link : [data._source.link]
    ).map(parseGeoNetworkDistribution);
  }
  return dataset;
}

function parseFacetName(name: string): string {
  if (name.startsWith('th_httpinspireeceuropaeutheme-theme_tree')) {
    return 'INSPIRE Themes';
  }
  return camelCaseToWords(name.replace(/^cl_/, '').replace(/\.key$/, ''));
}
function parseGeoNetworkResponse(data: GeoNetworkResponse): CatalogueData {
  const facets = data.aggregations
    ? Object.entries(data.aggregations)
        .map(([key, agg]) => ({
          id: key,
          title: parseFacetName(key),
          values: (agg.buckets || []).map((bucket) => ({
            id: bucket.key,
            title: `${bucket.key} (${bucket.doc_count})`,
          })),
        }))
        .filter((f) => f.values.length > 0)
    : [];

  const datasets = Array.isArray(data.hits.hits)
    ? data.hits.hits.map(parseGeoNetworkDataset)
    : [parseGeoNetworkDataset(data.hits.hits)];

  return { count: data.hits.total.value, datasets, facets };
}

export const defaultAggregationKeys = [
  'resourceType',
  'inspireTheme',
  'cl_topic',
  'format',
  'organisationNameObject',
  'groupOwner',
];
function getAggregations(
  fieldNames = defaultAggregationKeys,
): Record<string, unknown> {
  return Object.fromEntries(
    fieldNames.map((fieldName) => [fieldName, { terms: { field: fieldName } }]),
  );
}

export async function fetchGeoNetwork(
  options: CatalogueOptions,
): Promise<CatalogueData> {
  const url = enforceCatalogueUrl(options.url, CataloguesTypes.GEONETWORK);
  const sortBy =
    GeoNetworkSortingOptions[
      options.sortBy as keyof typeof GeoNetworkSortingOptions
    ] ?? GeoNetworkSortingOptions.relevance;

  const sort: Array<string | Record<string, { order: 'asc' | 'desc' }>> =
    sortBy === GeoNetworkSortingOptions.relevance
      ? ['_score']
      : [
          {
            [sortBy]: {
              order:
                sortBy === GeoNetworkSortingOptions.nameAsc ? 'asc' : 'desc',
            },
          },
          '_score',
        ];

  const body = {
    sort,
    track_total_hits: true,
    from: options.itemsPerPage * options.page,
    size: options.itemsPerPage,
    aggregations: getAggregations(options.aggregationKeys),
    query: {
      bool: {
        must: options.query ? [{ query_string: { query: options.query } }] : [],
        filter: [
          ...Object.entries({
            ...options.facets,
            ...(options.filter ?? {}),
          }).map(([k, v]) => ({
            term: { [k]: v },
          })),
        ],
      },
    },
  };

  const init: RequestInit = {
    method: 'POST',
    signal: AbortSignal.timeout(30000),
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  };

  return fetch(url, init)
    .then((res) => {
      if (!res.ok) {
        throw new Error(
          `GeoNetwork API error: ${res.status} ${res.statusText}`,
        );
      }
      return res.json();
    })
    .then((data: GeoNetworkResponse) => parseGeoNetworkResponse(data));
}

/**
 * Fetches the catalogue to get the details of a dataset, return them.
 */
export async function fetchGeoNetworkDataset(
  catalogueUrl: string,
  datasetId: string,
): Promise<Dataset> {
  const url = enforceCatalogueUrl(catalogueUrl, CataloguesTypes.GEONETWORK);
  const body = {
    query: {
      bool: {
        must: [{ multi_match: { fields: ['id', 'uuid'], query: datasetId } }],
      },
    },
  };

  const init: RequestInit = {
    method: 'POST',
    signal: AbortSignal.timeout(30000),
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };

  return fetch(url, init)
    .then((res) => {
      if (!res.ok) {
        throw new Error(
          `GeoNetwork API error: ${res.status} ${res.statusText}`,
        );
      }
      return res.json();
    })
    .then((data: GeoNetworkResponse) =>
      parseGeoNetworkDataset(data.hits.hits[0]),
    );
}
