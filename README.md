# maplibre-layer-factory

MapLibre Layer Factory is a tool to customise layers in MapLibre GL JS, in a simple but flexible way.

The style is based on squared buttons that can be selected/deselected to show/hide layers, only one at the time.

## Features

- Orientation of layers buttons (horizontal, vertical)
- Placeholder support for layers buttons
- Custom styling for panel and layer buttons

## Installation

```bash
npm install maplibre-layer-factory
```

## Usage

The example below shows how to use the MapLibre Layer Factory to create a control with all available options.

```javascript
const layerFactory = new MapLibreLayerFactory({
    orientation: "vertical",
    panelStyle: {
        backgroundColor: "red"
    },
    layerButtonStyle: {
        default: {
            backgroundColor: "green",
            border: "none",
            color: "green"
        },
        selected: {
            backgroundColor: "blue",
            border: "2px solid blue",
            color: "blue"
        }
    }
});
map.addControl(layerFactory, 'top-left');
```
