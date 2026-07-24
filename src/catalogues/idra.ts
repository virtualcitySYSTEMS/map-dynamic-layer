import { requestJson } from '@vcmap/core';
import type {
  CatalogueData,
  CatalogueOptions,
  Dataset,
  Distribution,
} from './catalogues.js';
import {
  CataloguesTypes,
  catalogueTimeout,
  datasetTimeout,
  enforceCatalogueUrl,
  getDistributionType,
} from './catalogues.js';

/* eslint-disable @typescript-eslint/naming-convention */

type IdraDistribution = {
  id: string;
  accessURL: string;
  description: string;
  downloadURL: string;
  format: string;
  license: { name: string; type: string; uri: string; versionInfo: string };
  releaseDate: string;
  title: string;
  updateDate: string;
  // byteSize: string;documentation: Array<string>;hasDatalets: boolean;identifier: string;language: Array<string>; linkedSchemas:any; mediaType: string;rights: string;storedRDF: boolean;
};

type IdraDataset = {
  description: string;
  distributions: Array<IdraDistribution>;
  id: string;
  keywords: Array<string>;
  releaseDate: string;
  title: string;
  updateDate: string;
  publisher: {
    name: string;
    homepage: string;
    // id: string;identifier: string;mbox: string;propertyUri: string;resourceUri: string;type: string;
  };
  // accessRights: string;conformsTo: Array<string>;documentation: Array<string>;frequency: string;hasStoredRDF: boolean;hasVersion: Array<string>;identifier: string;  isVersionOf: any;landingPage: string;language: Array<string>;nodeID: string;nodeName: string;type: string;version: string;versionNotes: Array<string>;
  // contactPoint: Array<{id: string;propertyUrl: string;nodeId: string;hasUrl: string; missing properties}>;
  // theme: Array<{id: string;propertyUri: string;resourceUri: string;prefLabel: Array<{ language: string; value: string }>}>;
};

enum IdraFederationLevel {
  LEVEL_0 = 'LEVEL_0',
  LEVEL_1 = 'LEVEL_1',
  LEVEL_2 = 'LEVEL_2',
  LEVEL_3 = 'LEVEL_3',
  LEVEL_4 = 'LEVEL_4',
}

type IdraCataloguesInfo = Array<{
  id: string;
  name: string;
  federationLevel: IdraFederationLevel;
}>;

type IdraResponse = {
  count: number;
  results: Array<IdraDataset>;
  facets: Array<{
    search_parameter: string;
    displayName: string;
    values: Array<{ facet: string; keyword: string; search_value: string }>;
  }>;
};

export enum IdraSortingOptions {
  nameAsc = 'nameAsc',
  nameDesc = 'nameDesc',
  lastModified = 'lastModified',
  lastCreated = 'lastCreated',
}

function parseIdraDistribution(data: IdraDistribution): Distribution {
  const distribution: Distribution = {
    id: data.id,
    title: data.title,
    description: data.description,
    type: getDistributionType(data.format),
    format: data.format,
    ...(data.releaseDate && {
      created: new Date(data.releaseDate).toDateString(),
    }),
    ...(data.updateDate && {
      modified: new Date(data.updateDate).toDateString(),
    }),
    license: data.license.name,
  };
  if (data.accessURL) {
    distribution.accessUrl = data.accessURL;
  }
  if (data.downloadURL) {
    distribution.downloadUrl = data.downloadURL;
  }
  return distribution;
}

function parseIdraDataset(data: IdraDataset): Dataset {
  const dataset: Dataset = {
    id: data.id,
    title: data.title,
    description: data.description,
    ...(data.releaseDate && {
      created: new Date(data.releaseDate).toDateString(),
    }),
    ...(data.updateDate && {
      modified: new Date(data.updateDate).toDateString(),
    }),
    keywords: data.keywords,
    distributions: data.distributions?.map(parseIdraDistribution),
  };
  if (data.publisher?.name) {
    dataset.publisher = {
      title: data.publisher.name,
      url: data.publisher?.homepage,
    };
  }
  return dataset;
}

function parseIdraResponse(data: IdraResponse): CatalogueData {
  return {
    count: data.count,
    datasets: data.results.map(parseIdraDataset),
    facets: data.facets
      .filter((f) => f.values.length)
      .map((f) => ({
        id: f.search_parameter,
        title: f.displayName,
        values: f.values.map((v) => ({ id: v.search_value, title: v.facet })),
      })),
  };
}
/**
 * Creates the filters according based on the passed query and filters.
 * @param facets The facets to create filters from.
 * @param query The user query.
 * @returns An Array of filters.
 */
function createFilteringObject(
  facets: Record<string, string>,
  query: string,
): Array<object> {
  const filters = Object.entries(facets);
  const search = { field: 'ALL', value: query.replaceAll(' ', ',') };
  if (filters.length) {
    return [...filters.map((f) => ({ field: f[0], value: f[1] })), search];
  }
  return [search];
}

function getIdraSortingMode(sortBy: IdraSortingOptions): object {
  switch (sortBy) {
    case IdraSortingOptions.lastCreated:
      return { field: 'releaseDate', mode: 'desc' };
    case IdraSortingOptions.lastModified:
      return { field: 'updateDate', mode: 'desc' };
    case IdraSortingOptions.nameAsc:
      return { field: 'title', mode: 'asc' };
    case IdraSortingOptions.nameDesc:
      return { field: 'title', mode: 'desc' };
    default:
      return { field: 'title', mode: 'asc' };
  }
}

/**
 * Fetches an Idra Catalogue.
 * @param item The CatalogueItem to fetch.
 * @param itemsPerPage The number of datasets to return.
 * @param page The page to fetch.
 * @param query The user query.
 * @param sortBy The sorting order.
 * @param facets The filters to apply.
 * @returns The results from the Idra Catalogue.
 */
export async function fetchIdra(
  options: CatalogueOptions,
): Promise<CatalogueData> {
  // 1. Get CataloguesInfo to retrieve catalogues that allows the search operation.
  // see https://idraopendata.docs.apiary.io/#reference/end-user-api/catalogues-info/get
  const init: RequestInit = {
    method: 'GET',
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(catalogueTimeout),
  };
  const infoUrl = enforceCatalogueUrl(
    options.url,
    CataloguesTypes.IDRA,
    'cataloguesInfo',
  );
  const nodes = await requestJson<IdraCataloguesInfo>(
    infoUrl.toString(),
    init,
  ).then((data) => data.map((c) => c.id));

  // 2. Fetches the catalogues using the nodesIds
  // see https://idraopendata.docs.apiary.io/#reference/end-user-api/metadata-search/post
  const postBody = {
    filters: createFilteringObject(options.facets, options.query),
    sort: getIdraSortingMode(
      IdraSortingOptions[options.sortBy as keyof typeof IdraSortingOptions],
    ),
    live: false,
    rows: options.itemsPerPage.toString(),
    start: (options.itemsPerPage * options.page).toString(),
    nodes,
    euroVocFilter: { euroVoc: false, sourceLanguage: '', targetLanguages: [] },
  };
  const searchOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(catalogueTimeout),
    body: JSON.stringify(postBody),
  };
  const searchUrl = enforceCatalogueUrl(
    options.url,
    CataloguesTypes.IDRA,
    'search',
  );

  return requestJson<IdraResponse>(searchUrl.toString(), searchOptions).then(
    parseIdraResponse,
  );
}

export async function fetchIdraDataset(
  catalogueUrl: string,
  datasetId: string,
): Promise<Dataset> {
  const init: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(datasetTimeout),
  };
  const datasetUrl = enforceCatalogueUrl(
    catalogueUrl,
    CataloguesTypes.IDRA,
    `dataset/${datasetId}`,
  );
  return requestJson<IdraResponse>(datasetUrl.toString(), init).then((json) =>
    parseIdraDataset(json.results?.[0]),
  );
}
