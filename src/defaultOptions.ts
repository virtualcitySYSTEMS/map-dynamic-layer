import type { CataloguesTypes } from './catalogues/catalogues.js';
import { CategoryType } from './constants.js';
import { WebdataTypes } from './webdata/webdataConstants.js';

export type CataloguePreset = {
  url: string;
  type: CataloguesTypes;
  title?: string;
  logo?: string;
  subtitle?: string;
  description?: string;
  defaultSorting?: string;
  filter?: Record<string, string>;
};

export type DynamicLayerConfig = {
  defaultTab: CategoryType;
  enabledTabs: Array<CategoryType>;
  webdata: {
    defaultType: WebdataTypes;
    defaultUrl: string;
  };
  catalogues: {
    itemsPerPage: number;
    presets: Array<CataloguePreset>;
  };
};
export function getDefaultOptions(): DynamicLayerConfig {
  return {
    defaultTab: CategoryType.WEBDATA,
    enabledTabs: [CategoryType.WEBDATA, CategoryType.CATALOGUES],
    webdata: {
      defaultType: WebdataTypes.WMS,
      defaultUrl: '',
    },
    catalogues: {
      itemsPerPage: 14,
      presets: [],
    },
  };
}
