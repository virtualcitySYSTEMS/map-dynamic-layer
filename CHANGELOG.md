# v3.0.0

- Updated @vcmap/core and @vcmap/ui to versions 6.3

# v2.0.3

- Redesigned the UI for small screens: the sidebar is now collapsible

# v2.0.2

- Fixed a bug where catalogues descritpion would not be translated when using a user-defined i18n key

# v2.0.1

- Fixed a bug where Authentication headers would not be used when fetching WFS, WMS and WMTS capabilities
- Fixed a bug where setting `defaultSorting` for a catalogue preset would not be reflected in the UI

# v2.0.0

- Changed `filter` property of catalogues presets: a JSON object can now be passed to prefilter catalogue entries, using all available filtering options
- Added `defaultSorting` option to catalogue configuration, allowing to set a sorting option per catalogue
- Added an Authentication inputfield in the Webdata tab
- Fixed a bug where the default tab selector in the ConfigEditor would not work properly

# v1.0.7

- Fixed a bug where fetching a WMS service would fail because of a missing `GetFeatureInfo` description in its capabilities
- Fixed a bug where the `BBOX` would be wrong for WMS layers
- Fixed a bug where the legend of an added layer would not appear immediately

# v1.0.6

- Fixed a bug where clicking on the 'Catalogue' tab would open catalogues overview even when only one catalogue is configured

# v1.0.5

- Added a missing translation key
- Added prefiltering options to Piveau and GeoNetwork catalogues
- Fixed a bug where a NBS Registry would not load because of an invalid dataset
- Fixed a pagination bug for NBS Registry catalogues
- Fixed a bug where all entries were not shown for GeoNetwork catalogues

# v1.0.3

- Added a new 'Remove all' action to group items in Web Data
- Added attributes to NBS Registry's features
- Fixed some styling issues
- Fixed a bug where multiple selection in Added Data would not work

# v1.0.0

Dynamic Layer plugin
