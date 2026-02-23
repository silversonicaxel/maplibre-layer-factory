# maplibre-layer-factory

MapLibre Layer Factory is a plugin to customise layers in MapLibre GL JS, in a simple but flexible way.

The style is based on squared buttons that can be selected/deselected to show/hide layers, only one at the time.

## Features

- Orientation of layers buttons (horizontal, vertical)
- Placeholder support for layers buttons
- Custom styling for panel and layer buttons

## Installation

```bash
npm install maplibre-layer-factory
```

## Api

### Layer Factory Options

| Option | Type | Default | Description | Mandatory |
| - | - | - | - | - |
| `orientation` | "horizontal" \| "vertical" | "vertical" | Orientation of layers buttons | No |
| `panelStyle` | CSSStyleDeclaration | {} | Custom styling for panel | No |
| `layerButtonStyle.default`| CSSStyleDeclaration | {} | Custom styling for layer buttons in default state | No |
| `layerButtonStyle.selected`| CSSStyleDeclaration | {} | Custom styling for layer buttons in selected state | No |
| `labelStyle.element`| CSSStyleDeclaration | {} | Custom styling for label element | No |
| `labelStyle.tag`| CSSStyleDeclaration | {} | Custom styling for label tag | No |
| `labelStyle.text`| CSSStyleDeclaration | {} | Custom styling for label text | No |
| `labelStyle.caption`| CSSStyleDeclaration | {} | Custom styling for label caption | No |
| `withLabel`| boolean | false | Show label | No |

### Layer Configuration Object

| Property | Type | Default | Description | Mandatory |
| - | - | - | - | - |
| `metadata.placeholder` | string | undefined | URL to placeholder image for layer button | No |
| `metadata.name` | string | undefined | Name of the layer | No |
| `metadata.caption` | string | undefined | Caption of the layer | No |

## Plugin Html Structure

- container
    - toggle
    - panel
        - panel layers
        - panel label

## Example

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
    },
    labelStyle: {
        element: {
            backgroundColor: "blue"
        },
        tag: {
            backgroundColor: "grey"
        },
        text: {
            color: "white"
        },
        caption: {
            color: "white"
        }
    },
    withLabel: true
});
map.addControl(layerFactory, 'top-left');
```
