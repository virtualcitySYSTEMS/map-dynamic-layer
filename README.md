# @vcmap/dynamic-layer

> Part of the [VC Map Project](https://github.com/virtualcitySYSTEMS/map-ui)

The Dynamic Layer plugin can be used to dynamically add layers to a Map, without editing its configuration.

Currently supported sources are:

- Web Data
  - [3D Tiles](https://www.ogc.org/standard/3dtiles/)
  - [Cesium PointCloud](https://cesium.com/platform/cesium-ion/3d-tiling-pipeline/point-clouds/)
  - [Cesium Terrain](https://cesium.com/learn/cesiumjs-learn/cesiumjs-terrain/)
  - [CZML](https://github.com/AnalyticalGraphicsInc/czml-writer/wiki/CZML-Guide)
  - [GeoJSON](https://www.ogc.org/standard/eo-geojson/)
  - [Web Feature Service (WFS)](https://www.ogc.org/standard/wfs/)
  - [Web Map Service (WMS)](https://www.ogc.org/standard/wms/)
  - [Web Map Tile Service (WMTS)](https://www.ogc.org/standard/wmts/)
- Catalogues
  - [GeoNetwork](https://geonetwork-opensource.org/)
  - [Idra](https://github.com/OPSILab/Idra/)
  - [NBS Registry](https://nbs.dashboard.urbreath.modapto.atc.gr/home)
  - [Piveau](https://www.piveau.de/)

## Web Data

> Web Data layers added to the Map through this plugin will be shared when a Map share link is created.

#### Add a new web data source:

A new web data source can be added by clicking the "+" icon. It requires to select the type of the source and to provide the URL of the service. The source will be added to the content tree.

#### View layer information and add it to the Map:

All layers of the plugin's content tree can be selected to view their information. If a layer includes nested children, all of them can be added at once, or each layer can be added independently.

Once added, the layer appears in the Map content tree, and its attributions are added to those of the Map. If the layer comes with a legend, this is added to the Map legend.

## Catalogues

#### Preset a catalogue to make it accessible to users:

To be accessible, a catalogue must be predefined in the plugin configuration. An URL and one of the supported catalogue types must be specified. Optionally, a title can be supplied to identify the catalogue, as well as a subtitle which is displayed in the catalogue overview, visible when multiple catalogues are predefined. You can also specify a Markdown description, which will be displayed when a catalogue is opened but no dataset is selected (otherwise, the default description is an explanation of the use of a catalogue within the plugin).

### Usage of a catalogue:

When opened, a catalogue displays the first datasets, sorted by relevance and unfiltered in the list on the left. Above this, a search bar allows you to search for a dataset by name. The sorting icon lets you choose the display order (relevance, asc./desc. name, creation or modification date). The filter icon lets you apply filters based on those available in the catalogue. Below the list, pagination allows you to move between results pages. The right-hand side of the catalogue shows the catalogue description (when configured, otherwise a default description explains how catalogues work).

When a dataset is selected, its details are displayed instead of the catalogue description. At the bottom of the presentation is a list of its distributions. Each one can be expanded to see its details, and when it is compatible with the VC Map, a button offers to add it to the map. Compatible datasets are those presented in the list of Web Data sources.

## Edit the parameters of an added layer:

> User-defined settings will not be shared when a Map share link is created.

The 'Added layers' section of the plugin shows all layers added to the Map, sorted by type. Editing parameters (such as its name in the content tree or parameters specific to a layer type) is possible by selecting the layer in this section.

## Configuration

| Property    | Type     | Default                   | Description                                         | Allowed values          |
| ----------- | -------- | ------------------------- | --------------------------------------------------- | ----------------------- |
| defaultTab  | `string` | 'webdata'                 | The default tab opened when the plugin is launched. | 'webdata', 'catalogues' |
| enabledTabs | `Array`  | ['webdata', 'catalogues'] | The enabled tabs in the plugin.                     | 'webdata', 'catalogues' |
| webdata     | `object` |                           | The webdata configuration.                          | _See below._            |
| catalogues  | `object` |                           | The catalogues configuration.                       | _See below._            |

### Webdata configuration

| Property    | Type     | Default    | Description                                   | Allowed values                                                                                                            |
| ----------- | -------- | ---------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| defaultType | `string` | 'WMSLayer' | The type of webdata source preselected.       | 'CesiumTilesetLayer', 'CzmlLayer', 'GeoJSONLayer', 'PointCloudLayer', 'TerrainLayer', 'WFSLayer', 'WMSLayer', 'WMSTLayer' |
| defaultUrl  | `string` | ''         | The pre-filled URL for adding source webdata. | _any_                                                                                                                     |

### Catalogues configuration

| Property     | Type     | Default | Description                                                                                                     | Allowed values             |
| ------------ | -------- | ------- | --------------------------------------------------------------------------------------------------------------- | -------------------------- |
| itemsPerPage | `number` | 14      | The number of datasets to be displayed. 14 is the value used to display the list of datasets without scrolling. | _any_                      |
| presets      | `Array`  | []      | The presets catalogues.                                                                                         | _See configuration below._ |

#### Catalogue presets configuration

| Property    | Type     | Default                                 | Description                                                                                                                                                         | Allowed values                                |
| ----------- | -------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| url         | `string` | `required`                              | The URL of the catalogue.                                                                                                                                           | _any_                                         |
| type        | `string` | `required`                              | The type of the catalogue.                                                                                                                                          | 'idra', 'geonetwork', 'nbsRegistry', 'piveau' |
| title       | `string` | Domain name                             | The title of the catalogue.                                                                                                                                         | _any_                                         |
| logo        | `string` | Catalogue type logo                     | The logo of the catalogue, as a base64 image.                                                                                                                       | _any_                                         |
| filter      | `string` | ''                                      | An optional filter key (e.g. 'dataset'), supported by Piveau and GeoNetwork catalogues. When not used for Piveau catalogues, the service does not return any facet. | _any_                                         |
| subtitle    | `string` | Catalogue type                          | The catalogue subtitle.                                                                                                                                             | _any_                                         |
| description | `string` | An explanation of how the catalogs work | The catalogue description. Is rendered as MarkDown when no dataset is selected.                                                                                     | _any_                                         |

A config entry could for example look like:

```json
{
  "name": "@vcmap/dynamic-layer",
  "defaultTab": "webdata",
  "enabledTabs": ["webdata", "catalogues"],
  "webdata": {
    "defaultType": "WMSLayer",
    "defaultUrl": "https://sgx.geodatenzentrum.de/wms_topplus_open"
  },
  "catalogues": {
    "presets": [
      {
        "url": "https://data.europa.eu/api/hub/search/",
        "type": "piveau",
        "title": "Data Europa",
        "subtitle": "The official portal for European data"
      },
      {
        "url": "https://open.bydata.de/api/hub/search/",
        "type": "piveau",
        "title": "Offene Daten aus Bayern",
        "description": "# Offene Daten aus Bayern\nHier finden Datenbegeisterte freie Datensätze und Unterstützung, um noch mehr Daten zu teilen. Damit schaffen wir gemeinsam – Verwaltung, Unternehmen, aber auch Wissenschaft und Zivilgesellschaft – Mehrwert für uns alle.\n"
      }
    ]
  }
}
```
