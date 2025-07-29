/* eslint-disable @typescript-eslint/naming-convention */
import { GeoJSONLayer, VectorStyleItem, Viewpoint } from '@vcmap/core';
import {
  LayerContentTreeItem,
  NotificationType,
  type VcsUiApp,
} from '@vcmap/ui';
import { getLogger } from '@vcsuite/logger';
import { Point } from 'ol/geom.js';
import Feature from 'ol/Feature.js';
import { Style } from 'ol/style.js';
import { reactive } from 'vue';
import { createContentTreeName } from '../helper.js';
import { name } from '../../package.json';
import {
  camelCaseToWords,
  CataloguesTypes,
  getCatalogueIcon,
  removeLastSlash,
} from './catalogues.js';
import type { CatalogueData, Dataset, Distribution } from './catalogues.js';

enum NBSCritera {
  CLIMATE_ZONES = 'climateZoneIds',
  PILOTS = 'pilotIds',
  KEYWORD_IDS = 'keywordIds',
  PROBLEM_IDS = 'problemIds',
}

type Basic<T> = {
  data: T;
  message?: string;
  success?: boolean;
  timestamp?: Date;
};

type RegistryFilter = Basic<{
  climateZones: Array<{ id: string; label: string }>;
  keywords: Array<{ id: string; label: string; pilotIds: number[] }>;
  pilots: Array<{ id: string; label: string; pilotIds: number }>;
  problems: Array<{ id: string; label: string; pilotIds: number[] }>;
}>;
type RegistryResponse = Basic<
  {
    id: number;
    title: string;
    geoLocation: GeoLocationDto;
  }[]
>;

type GeoLocationDto = {
  latitude: number;
  longitude: number;
  address?: string;
};

type RegistryDataset = Basic<{
  areaCharacterization: string;
  challenges: string;
  climateZone: string;
  dateCreated: number;
  geoLocation: GeoLocationDto;
  id: number;
  idraDatasets: [];
  images: [];
  isUrbreathNbs: boolean;
  keywords: string[];
  kpis: [];
  lessonsLearnt: string;
  mainImage: string;
  objective: string;
  pilot: string;
  potentialImpactsAndBenefits: string;
  problems: string[];
  relatedMaterial: [];
  status: string;
  title: string;
  videos: [];
}>;

export enum RegistrySortingOptions {
  relevance = 'relevance+desc',
  nameAsc = 'title.$locale$+asc',
  nameDesc = 'title.$locale$+desc',
  lastModified = 'modified+desc',
  lastCreated = 'issued+desc',
}

function parseRegistryDataset(data: RegistryDataset): Dataset {
  return {
    id: data.data.id.toString(),
    title: data.data.title,
    description: `${data.data.areaCharacterization}\n${data.data.challenges}`,
    ...(data.data.dateCreated && {
      created: new Date(data.data.dateCreated).toDateString(),
    }),
    keywords: data.data.keywords,
    distributions: [
      {
        id: data.data.id.toString(),
        title: data.data.title,
        type: 'feature',
        feature: new Feature({
          geometry: new Point([
            data.data.geoLocation.longitude,
            data.data.geoLocation.latitude,
          ]),
          title: data.data.title,
          climateZone: data.data.climateZone,
          pilot: data.data.pilot,
          status: data.data.status,
          isUrbreathNbs: data.data.isUrbreathNbs,
          keywords: data.data.keywords,
          objective: data.data.objective,
          problems: data.data.problems,
          mainImage: data.data.mainImage,
          images: data.data.images,
          challenges: data.data.challenges,
          relatedMaterial: data.data.relatedMaterial,
          videos: data.data.videos,
        }),
      },
    ],
  };
}

/**
 * Fetches the catalogue to get the details of a dataset, return them.
 */
export async function fetchRegistryDataset(
  catalogueUrl: string,
  nbsId: string,
): Promise<Dataset> {
  const url = new URL(`${removeLastSlash(catalogueUrl)}/api/nbs/${nbsId}`);
  const options = {
    method: 'GET',
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(5000),
  };

  return fetch(url, options)
    .then((res) => res.json())
    .then((data: RegistryDataset) => parseRegistryDataset(data));
}

/**
 * Fetches a Registry catalogue and returns its response parsed.
 */
export async function fetchRegistry(
  catalogueUrl: string,
  filter: Record<string, string[]>,
): Promise<CatalogueData> {
  const criteria = Object.values(NBSCritera).reduce(
    (acc, key) => {
      const facetKey = `${key.slice(0, -3)}s`;
      if (filter[facetKey]) {
        (acc as Record<NBSCritera, string[]>)[key] = filter[facetKey];
      }
      return acc;
    },
    {
      [NBSCritera.CLIMATE_ZONES]: [],
      [NBSCritera.PILOTS]: [],
      [NBSCritera.KEYWORD_IDS]: [],
      [NBSCritera.PROBLEM_IDS]: [],
    } satisfies Record<NBSCritera, string[]>,
  );
  const body = JSON.stringify({ ...criteria, onlyUrbreathNbs: false });
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    signal: AbortSignal.timeout(30000),
  };
  const url = `${removeLastSlash(catalogueUrl)}/api/nbs/map`;

  return fetch(url, options)
    .then((res) => res.json())
    .then(async (data: RegistryResponse) => {
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch registry data');
      }
      const datasets = await Promise.all(
        data.data.map(async (entry) =>
          fetchRegistryDataset(catalogueUrl, entry.id.toString()),
        ),
      );
      const filters = await fetch(
        `${removeLastSlash(catalogueUrl)}/api/filters/`,
      )
        .then((res) => res.json() as Promise<RegistryFilter>)
        .catch((error: unknown) => {
          getLogger(name).error(
            `Failed to fetch registry filters from ${url}: ${String(error)}`,
          );
          return null;
        });

      const facets = [];
      if (!filters?.success) {
        getLogger(name).error(
          filters?.message || 'Failed to fetch registry filters',
        );
      } else {
        facets.push(
          ...Object.entries(filters.data).map(([key, values]) => ({
            id: key,
            title: camelCaseToWords(key),
            values: values.map((value) => ({
              id: value.id,
              title: `${value.label} `,
            })),
          })),
        );
      }

      return { count: data.data.length, datasets, facets };
    });
}

const nbsRegistryLayerId = 'nbsRegistryLayer';
export function addNBSToMap(app: VcsUiApp, item: Distribution): void {
  let layer = app.layers.getByKey(nbsRegistryLayerId) as GeoJSONLayer;
  if (!layer) {
    layer = new GeoJSONLayer({
      name: nbsRegistryLayerId,
      properties: {
        featureInfo: 'NbsRegistryFeatureInfo',
        title: 'Nature-Based Solutions',
      },
    });
    layer.activate().catch(() => {});
    app.layers.add(layer);
    const contentTreeName = createContentTreeName(layer.name);
    const contentTreeItem = new LayerContentTreeItem(
      {
        name: contentTreeName,
        layerName: layer.name,
        title: 'Nature-Based Solutions',
      },
      app,
    );
    contentTreeItem.addAction(
      reactive({
        name: 'dynamicLayer.actions.zoomToExtent',
        callback: async () => {
          const vp = Viewpoint.createViewpointFromExtent(
            layer.getZoomToExtent()!,
          );
          if (vp) {
            await app.maps.activeMap?.gotoViewpoint(vp);
          }
        },
      }),
    );
    contentTreeItem.addAction(
      reactive({
        name: 'dynamicLayer.actions.layer.remove',
        callback: () => {
          app.layers.remove(layer);
          layer.destroy();
          app.contentTree.remove(contentTreeItem);
        },
      }),
    );
    app.contentTree.add(contentTreeItem);
  }
  item.feature!.setStyle(
    new Style(
      new VectorStyleItem({
        image: { src: getCatalogueIcon(app, CataloguesTypes.NBS), scale: 0.05 },
      }),
    ),
  );
  layer.addFeatures([item.feature!]);
  app.notifier.add({
    type: NotificationType.SUCCESS,
    message: app.vueI18n.t('dynamicLayer.catalogues.nbsAddedToMap'),
  });
}
