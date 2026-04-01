# maplibre-layer-factory
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-2-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

MapLibre Layer Factory is a plugin to customise layers in MapLibre GL JS, in a simple but flexible way.

The style is based on squared buttons that can be selected/deselected to show/hide layers, only one at the time.

## Features

- Orientation of layers buttons (horizontal, vertical)
- Placeholder support for layers buttons
- Custom styling for panel and layer buttons
- Label and caption for layer metadata

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
import { MapLibreLayerFactory } from "maplibre-layer-factory";
import "maplibre-layer-factory/style.css";

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

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="http://www.alessandrorabitti.com/"><img src="https://avatars.githubusercontent.com/u/6851815?v=4?s=100" width="100px;" alt="Alessandro Rabitti"/><br /><sub><b>Alessandro Rabitti</b></sub></a><br /><a href="https://github.com/silversonicaxel/maplibre-layer-factory/commits?author=silversonicaxel" title="Code">💻</a> <a href="#a11y-silversonicaxel" title="Accessibility">️️️️♿️</a> <a href="https://github.com/silversonicaxel/maplibre-layer-factory/commits?author=silversonicaxel" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://studiorabota.com"><img src="https://avatars.githubusercontent.com/u/8339389?v=4?s=100" width="100px;" alt="Vincent Kranendonk"/><br /><sub><b>Vincent Kranendonk</b></sub></a><br /><a href="#design-studiorabota" title="Design">🎨</a> <a href="#ideas-studiorabota" title="Ideas, Planning, & Feedback">🤔</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!