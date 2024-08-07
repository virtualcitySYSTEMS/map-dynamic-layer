# @vcmap/dynamic-layer

> Part of the [VC Map Project](https://github.com/virtualcitySYSTEMS/map-ui)

The Dynamic Layer plugin can be used to dynamically add layers to a Map, without editing its configuration.

Currently supported sources are:

- Web Data
  - [Web Map Service (WMS)](https://www.ogc.org/standard/wms/)
  - [3D Tiles](https://www.ogc.org/standard/3dtiles/)
  - [Cesium 3D Terrain](https://cesium.com/learn/cesiumjs-learn/cesiumjs-terrain/)
- Catalogues
  - Work in progress
- My Data
  - Work in progress

## Web Data

> Web Data layers added to the Map through this plugin will be shared when a Map share link is created.

#### Add a new web data source:

A new web data source can be added by clicking the "+" icon. It requires to select the type of the source and to provide the URL of the service. The source will be added to the content tree.

#### View layer information and add it to the Map:

All layers of the plugin's content tree can be selected to view their information. If a layer includes nested children, all of them can be added at once, or each layer can be added independently.

Once added, the layer appears in the Map content tree, and its attributions are added to those of the Map. If the layer comes with a legend, this is added to the Map legend.

## Catalogues

Work in progress

## My Data

Work in progress

## Edit the parameters of an added layer:

> User-defined settings will not be shared when a Map share link is created.

The 'Added layers' section of the plugin shows all layers added to the Map, sorted by type. Editing parameters (such as its name in the content tree or parameters specific to a layer type) is possible by selecting the layer in this section.

## Configuration

| Property           | Type     | Default    | Description                                  | Allowed values                                    |
| ------------------ | -------- | ---------- | -------------------------------------------- | ------------------------------------------------- |
| defaultTab         | `string` | 'webdata'  | The tab to open when the plugin is opened    | 'webdata', 'catalogue', 'mydata', 'added'         |
| webdataDefaultType | `string` | 'WMSLayer' | The type of webdata source preselected       | 'WMSLayer', 'CesiumTilesetLayer' , 'TerrainLayer' |
| webdataDefaultUrl  | `string` | ''         | The pre-filled URL for adding source webdata | _any_                                             |
