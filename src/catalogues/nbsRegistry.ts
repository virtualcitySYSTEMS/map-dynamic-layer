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
  enforceCatalogueUrl,
  getCatalogueIcon,
} from './catalogues.js';
import type {
  CatalogueData,
  CatalogueOptions,
  Dataset,
  Distribution,
} from './catalogues.js';

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
  id?: number;
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

function parseRegistryDataset(data: RegistryDataset): Dataset | undefined {
  if (!data.data?.id) {
    return undefined;
  }
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
        featureProperties: {
          longitude: data.data.geoLocation.longitude,
          latitude: data.data.geoLocation.latitude,
          id: data.data.id,
          geoLocation: data.data.geoLocation,
          areaCharacterization: data.data.areaCharacterization,
          dateCreated: data.data.dateCreated,
          lessonsLearnt: data.data.lessonsLearnt,
          potentialImpactsAndBenefits: data.data.potentialImpactsAndBenefits,
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
          idraDatasets: data.data.idraDatasets,
          kpis: data.data.kpis,
        },
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
): Promise<Dataset | undefined> {
  const url = enforceCatalogueUrl(catalogueUrl, CataloguesTypes.NBS);
  url.pathname = `${url.pathname}/nbs/${nbsId}`;
  const init: RequestInit = {
    method: 'GET',
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(5000),
  };

  return fetch(url, init)
    .then((res) => res.json())
    .then((data: RegistryDataset) => parseRegistryDataset(data));
}

/**
 * Fetches a Registry catalogue and returns its response parsed.
 */
export async function fetchRegistry(
  options: CatalogueOptions,
): Promise<CatalogueData> {
  const criteria = Object.values(NBSCritera).reduce(
    (acc, key) => {
      const facetKey = `${key.slice(0, -3)}s`;
      if (options.facets[facetKey]) {
        (acc as Record<NBSCritera, string[]>)[key] = [options.facets[facetKey]];
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
  const init: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    signal: AbortSignal.timeout(30000),
  };
  const url = enforceCatalogueUrl(options.url, CataloguesTypes.NBS);
  url.pathname = `${url.pathname}/nbs/map`;

  return fetch(url, init)
    .then((res) => res.json())
    .then(async (data: RegistryResponse) => {
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch registry data');
      }
      const datasets = (
        await Promise.all(
          data.data.map(async (entry) =>
            fetchRegistryDataset(options.url, entry.id.toString()),
          ),
        )
      )
        .filter((d) => !!d)
        .slice(
          options.page * options.itemsPerPage,
          (options.page + 1) * options.itemsPerPage,
        );

      const filterUrl = enforceCatalogueUrl(options.url, CataloguesTypes.NBS);
      filterUrl.pathname = `${filterUrl.pathname}/filters/`;
      const filters = await fetch(filterUrl)
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
  const feature = new Feature({
    geometry: new Point([
      item.featureProperties!.longitude as number,
      item.featureProperties!.latitude as number,
    ]),
    ...item.featureProperties,
  });
  feature.setStyle(
    new Style(
      new VectorStyleItem({
        image: { src: getCatalogueIcon(app, CataloguesTypes.NBS), scale: 0.05 },
      }),
    ),
  );
  layer.addFeatures([feature]);
  app.notifier.add({
    type: NotificationType.SUCCESS,
    message: app.vueI18n.t('dynamicLayer.catalogues.nbsAddedToMap'),
  });
}
