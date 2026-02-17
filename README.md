# maplibre-layer-factory

MapLibre Layer Factory is a tool to customise layers in MapLibre GL JS, in a simple but flexible way.

The style is based on squared buttons that can be selected/deselected to show/hide layers, only one at the time.

## Features

- Orientation of layers buttons (horizontal, vertical)
- Placeholder support for layers buttons

## Installation

```bash
npm install maplibre-layer-factory
```

## Usage

The example below shows how to use the MapLibre Layer Factory to create a control with a horizontal orientation and a placeholder for the first layer.

```javascript
const layerFactory = new MapLibreLayerFactory({ orientation: "horizontal" });
map.addControl(layerFactory, 'top-left');
```
