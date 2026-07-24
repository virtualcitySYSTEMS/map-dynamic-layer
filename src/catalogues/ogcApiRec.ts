import { requestJson } from '@vcmap/core';
import type {
  CatalogueData,
  CatalogueOptions,
  Dataset,
  Facet,
} from './catalogues.js';
import {
  camelCaseToWords,
  catalogueTimeout,
  datasetTimeout,
  enforceCatalogueUrl,
  getDistributionType,
} from './catalogues.js';

type OgcApiRecLink = {
  href: string;
  rel?: string;
  type?: string;
  title?: string;
  description?: string;
};

/** Base facet definition properties common to all facet types */
type OgcApiRecFacetBase = {
  type: 'term' | 'histogram' | 'filter';
  property: string;
  sortedBy: 'value' | 'count';
};

/** Term facet with buckets for categorical values */
type OgcApiRecTermFacet = OgcApiRecFacetBase & {
  type: 'term';
  minOccurs?: number;
  buckets?: Array<{ value: string; count: number }>;
};

/** Histogram facet with numeric buckets */
type OgcApiRecHistogramFacet = OgcApiRecFacetBase & {
  type: 'histogram';
  bucketType: 'fixedInterval' | 'fixedBucketCount';
  buckets?: Array<{ value: string; count: number }>;
};

/** Filter facet with predefined filter buckets */
type OgcApiRecFilterFacet = OgcApiRecFacetBase & {
  type: 'filter';
  filters: Record<string, string>;
  buckets?: Array<{ value: string; count: number }>;
};

type OgcApiRecFacetDefinition =
  | OgcApiRecTermFacet
  | OgcApiRecHistogramFacet
  | OgcApiRecFilterFacet;

type OgcApiRecFacets = Record<string, OgcApiRecFacetDefinition>;

type OgcApiRecFeature = {
  id: string;
  properties?: {
    title?: string;
    description?: string;
    keywords?: Array<string>;
    created?: string;
    issued?: string;
    updated?: string;
    modified?: string;
    publisher?:
      | string
      | {
          name?: string;
          title?: string;
          url?: string;
          homepage?: string;
        };
  };
  links?: Array<OgcApiRecLink>;
};

type OgcApiRecResponse = {
  numberMatched?: number;
  features?: Array<OgcApiRecFeature>;
  links?: Array<OgcApiRecLink>;
  facets?: OgcApiRecFacets;
  defaultBucketCount?: number;
};

const nonDistributionRels = new Set([
  'self',
  'collection',
  'items',
  'item',
  'root',
  'parent',
  'child',
  'next',
  'prev',
  'previous',
  'first',
  'last',
  'search',
  'describedby',
  'service-desc',
  'service-doc',
  'conformance',
]);

function isDistributionLink(link: OgcApiRecLink): boolean {
  const normalizedRel = link.rel?.trim().toLowerCase();
  return (
    !!link.href && !(!!normalizedRel && nonDistributionRels.has(normalizedRel))
  );
}

function parseDataset(feature: OgcApiRecFeature): Dataset {
  const { properties } = feature;
  const title = properties?.title || feature.id;
  const description = properties?.description;
  const publisher = properties?.publisher;

  return {
    id: feature.id,
    title,
    ...(description && { description }),
    ...(publisher &&
      (typeof publisher === 'string'
        ? { publisher: { title: publisher } }
        : {
            publisher: {
              title: publisher.name ?? publisher.title ?? '',
              url: publisher.url ?? publisher.homepage,
            },
          })),
    ...((properties?.created || properties?.issued) && {
      created: new Date(
        properties?.created ?? properties?.issued ?? '',
      ).toDateString(),
    }),
    ...((properties?.updated || properties?.modified) && {
      modified: new Date(
        properties?.updated ?? properties?.modified ?? '',
      ).toDateString(),
    }),
    keywords: properties?.keywords,
    distributions: feature.links
      ?.filter(isDistributionLink)
      .map((link, index) => {
        const type = getDistributionType(link.type ?? link.href);
        return {
          id: `${feature.id}-${index}`,
          title: link.title ?? link.rel ?? link.href,
          ...(link.description && { description: link.description }),
          type,
          format: type?.slice(0, -5) ?? '',
          [!type ? 'downloadUrl' : 'accessUrl']: link.href,
        };
      })
      .filter((distribution) => distribution.title.length > 0),
  };
}

function parseOgcApiRecFacets(facetsData?: OgcApiRecFacets): Array<Facet> {
  if (!facetsData || Object.keys(facetsData).length === 0) {
    return [];
  }

  return Object.entries(facetsData)
    .map(([facetId, facetDef]) => ({
      id: facetId,
      title: camelCaseToWords(facetDef.property || facetId),
      values: (facetDef.buckets || [])
        .filter((bucket) => !!bucket.value && bucket.count > 0)
        .map((bucket) => ({
          id: bucket.value,
          title: `${bucket.value} (${bucket.count})`,
        })),
    }))
    .filter((facet) => facet.values.length > 0);
}

function resolveLinkHref(href: string, baseUrl: URL): string | undefined {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return undefined;
  }
}

/**
 * Fetches OGC API Records items from the given collection URL.
 * The `options.url` should point to the collection endpoint; `/items` is appended automatically.
 */
export async function fetchOgcApiRec(
  options: CatalogueOptions,
): Promise<CatalogueData> {
  const init: RequestInit = {
    method: 'GET',
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(catalogueTimeout),
  };
  const url = enforceCatalogueUrl(options.url);

  if (options.query && !url.searchParams.has('q')) {
    url.searchParams.append('q', options.query);
  }
  if (!url.searchParams.has('limit')) {
    url.searchParams.append('limit', options.itemsPerPage.toString());
  }
  if (options.fetchFacets) {
    if (!url.searchParams.has('facets')) {
      url.searchParams.append('facets', 'true');
    }
    Object.entries(options.facets).forEach(([id, value]) => {
      url.searchParams.append(id, value);
    });
  }

  return requestJson<OgcApiRecResponse>(url.toString(), init).then((data) => {
    const paginationLinks = (data.links ?? [])
      .filter((link) => link.rel === 'prev' || link.rel === 'next')
      .map((link) => {
        const href = resolveLinkHref(link.href, url);
        if (!href) {
          return undefined;
        }
        const rel: 'previous' | 'next' =
          link.rel === 'next' ? 'next' : 'previous';

        return { href, rel };
      })
      .filter((link) => !!link);
    return {
      count: data.numberMatched ?? data.features?.length ?? 0,
      datasets: data.features?.map(parseDataset) ?? [],
      facets: parseOgcApiRecFacets(data.facets),
      links: paginationLinks,
    };
  });
}

/**
 * Fetches a single OGC API Records dataset by ID.
 * The `url` should point to the collection endpoint; `/items/{datasetId}` is appended automatically.
 */
export async function fetchOgcApiRecDataset(
  rawUrl: string,
  datasetId: string,
): Promise<Dataset> {
  const init: RequestInit = {
    method: 'GET',
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(datasetTimeout),
  };
  const url = enforceCatalogueUrl(rawUrl, datasetId);
  return requestJson<OgcApiRecFeature>(url.toString(), init).then(parseDataset);
}
