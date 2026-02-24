import './index.css';
import type { IControl, LayerSpecification, Map } from 'maplibre-gl';

export type MapLibreLayerFactoryOrientation = 'horizontal' | 'vertical';

export interface MapLibreLayerFactoryOptions {
    orientation?: MapLibreLayerFactoryOrientation;
    panelStyle?: Partial<CSSStyleDeclaration>;
    layerButtonStyle?: {
        default?: Partial<CSSStyleDeclaration>;
        selected?: Partial<CSSStyleDeclaration>;
    };
    labelStyle?: {
        element?: Partial<CSSStyleDeclaration>;
        tag?: Partial<CSSStyleDeclaration>;
        text?: Partial<CSSStyleDeclaration>;
        caption?: Partial<CSSStyleDeclaration>;
    };
    withLabel?: boolean;
}

export interface MapLibreLayerMetadata {
    name?: string;
    caption?: string;
    placeholder?: string;
}

export class MapLibreLayerFactory implements IControl {
    #map?: Map;
    #container?: HTMLDivElement;
    #toggle?: HTMLDivElement;
    #panel?: HTMLDivElement;
    #panelLayers?: HTMLDivElement;
    #panelLabel?: HTMLDivElement;
    #isOpen: boolean = false;
    #orientation: MapLibreLayerFactoryOrientation;
    #panelStyle: Partial<CSSStyleDeclaration>;
    #layerButtonStyle: {
        default?: Partial<CSSStyleDeclaration>;
        selected?: Partial<CSSStyleDeclaration>;
    };
    #labelStyle: {
        element?: Partial<CSSStyleDeclaration>;
        tag?: Partial<CSSStyleDeclaration>;
        text?: Partial<CSSStyleDeclaration>;
        caption?: Partial<CSSStyleDeclaration>;
    };
    #withLabel: boolean;
    #boundUpdate: () => void;

    constructor(options: MapLibreLayerFactoryOptions = {}) {
        this.#orientation = options.orientation || 'vertical';
        this.#panelStyle = options.panelStyle || {};
        this.#layerButtonStyle = options.layerButtonStyle || {
            default: {},
            selected: {}
        };
        this.#labelStyle = options.labelStyle || {
            element: {},
            tag: {},
            text: {},
            caption: {}
        };
        this.#withLabel = options.withLabel || false;
        this.#boundUpdate = this.#setLayerList.bind(this);
    }

    #createContainer() {
        const container = document.createElement('div');
        container.id = 'layer-factory-container';
        container.className = 'maplibregl-ctrl';

        Object.assign(container.style, {
            backgroundColor: 'transparent',
            border: 'none',
            boxShadow: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
        });

        requestAnimationFrame(() => {
            if (!container || !container.parentElement) {
                return;
            }

            const parentClasses = container.parentElement.className;

            const isLeft = parentClasses.includes('left');
            container.style.alignItems = isLeft ? 'flex-start' : 'flex-end';

            const isBottom = parentClasses.includes('bottom');
            container.style.flexDirection = isBottom ? 'column-reverse' : 'column';
            container.style.justifyContent = isBottom ? 'flex-end' : 'flex-start';
        });

        return container;
    }

    #createToggle() {
        const toggle = document.createElement('div');
        toggle.id = 'layer-factory-toggle';
        toggle.className = 'maplibregl-ctrl-group';

        const toggleButton = document.createElement('button');
        toggleButton.type = 'button';
        toggleButton.style.width = '29px';
        toggleButton.style.height = '29px';
        toggleButton.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: auto;">
                <path d="M11.99 19.0048L4.62 13.2748L3 14.5348L12 21.5348L21 14.5348L19.37 13.2648L11.99 19.0048ZM12 16.4648L19.36 10.7348L21 9.46484L12 2.46484L3 9.46484L4.63 10.7348L12 16.4648ZM12 4.99484L17.74 9.46484L12 13.9348L6.26 9.46484L12 4.99484Z" fill="currentColor"/>
            </svg>`;

        toggleButton.onclick = () => this.#togglePanel();
        toggle.appendChild(toggleButton);

        return toggle;
    }

    #createPanel() {
        const panel = document.createElement('div');
        panel.id = 'layer-factory-panel';
        panel.className = 'maplibregl-ctrl-group';

        Object.assign(panel.style,
            {
                gap: '8px',
                padding: '4px',
            },
            this.#panelStyle,
            {
                display: 'none',
                flexDirection: 'column',
                maxWidth: '220px',
                overflowY: 'auto',
                width: 'auto'
            },
        );

        return panel;
    }

    #createPanelLayers() {
        const panelLayers = document.createElement('div');
        panelLayers.id = 'layer-factory-panel-layers';

        Object.assign(panelLayers.style, {
            display: 'flex',
            flexDirection: this.#orientation === 'vertical' ? 'column' : 'row',
            gap: '8px',
            margin: '0',
            maxHeight: '200px',
            overflowY: 'auto',
            width: 'auto'
        });

        return panelLayers;
    }

    #createPanelLabel() {
        const panelLabel = document.createElement('div');
        panelLabel.id = 'layer-factory-panel-label';
        Object.assign(panelLabel.style,
            {
                backgroundColor: '#007cbf',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '600',
                margin: '0',
                padding: '8px',
            },
            this.#labelStyle.element,
            {
                maxWidth: '100%',
            }
        );

        const panelLabelContent = document.createElement('div');
        panelLabelContent.id = 'layer-factory-panel-label-content';
        Object.assign(panelLabelContent.style, {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
        });

        const panelLabelTag = document.createElement('span');
        panelLabelTag.id = 'layer-factory-panel-label-tag';
        Object.assign(panelLabelTag.style,
            {
                backgroundColor: "#eee",
                borderRadius: "4px",
                color: "#000",
                fontWeight: "500",
                padding: "4px",
            },
            this.#labelStyle.tag,
            {
                display: 'inline-block',
            }
        );

        const panelLabelText = document.createElement('span');
        panelLabelText.id = 'layer-factory-panel-label-text';
        Object.assign(panelLabelText.style,
            {
                paddingLeft: '8px'
            },
            this.#labelStyle.text,
            {
                flex: '0 0 auto',
            }
        );

        const panelLabelCaption = document.createElement('span');
        panelLabelCaption.id = 'layer-factory-panel-label-caption';
        Object.assign(panelLabelCaption.style,
            {
                fontWeight: '500',
                paddingLeft: '8px'
            },
            this.#labelStyle.caption,
            {
                flex: '1 1 auto',
                minWidth: '0',
            }
        );

        panelLabel.appendChild(panelLabelContent);
        panelLabelContent.appendChild(panelLabelTag);
        panelLabelContent.appendChild(panelLabelText);
        panelLabelContent.appendChild(panelLabelCaption);

        return panelLabel;
    }

    #togglePanel() {
        this.#isOpen = !this.#isOpen;
        if (this.#panel) {
            this.#panel.style.display = this.#isOpen ? 'flex' : 'none';
        }
    }

    #enforceOneLayerSelection() {
        if (!this.#map) {
            return;
        }

        const layers = this.#map.getStyle()?.layers;
        if (!layers || layers.length === 0) {
            return;
        }

        const selectedLayer = layers.find(layer => this.#map!.getLayoutProperty(layer.id, 'visibility') === 'visible') || layers[0];
        if (selectedLayer) {
            this.#selectLayer(selectedLayer.id);
        }
    }

    #setLayerList() {
        if (!this.#map || !this.#panel || !this.#panelLayers) {
            return;
        }

        const style = this.#map.getStyle();
        if (!style) {
            return;
        }

        this.#panelLayers.innerHTML = '';
        const layers = style.layers ?? [];

        Object.assign(this.#panelLayers.style,
            {
                gap: '8px',
            },
            this.#panelStyle,
        );

        layers.forEach((layer) => {
            const metadata = (layer.metadata || {}) as MapLibreLayerMetadata;
            const placeholder = metadata.placeholder;

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.title = metadata.name || layer.id;
            btn.setAttribute('data-id', layer.id);

            this.#setButtonContent(layer, btn, placeholder);

            const visibility = this.#map!.getLayoutProperty(layer.id, 'visibility') ?? 'visible';
            const isSelected = visibility === 'visible';

            btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');

            Object.assign(btn.style,
                {
                    backgroundColor: isSelected ? '#e0f0ff' : '#f5f5f5',
                    border: isSelected ? '2px solid #007cbf' : 'none',
                    borderRadius: '4px',
                    color: isSelected ? '#007cbf' : '#666',
                    fontSize: '10px',
                    fontWeight: 'bold',
                },
                isSelected ? this.#layerButtonStyle.selected : this.#layerButtonStyle.default,
                {
                    alignItems: 'center',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    display: 'flex',
                    height: '42px',
                    justifyContent: 'center',
                    padding: placeholder ? '0' : '4px 8px',
                    whiteSpace: 'nowrap',
                    width: '42px'
                }
            );

            btn.onclick = () => this.#selectLayer(layer.id);
            this.#panelLayers!.appendChild(btn);
        });
    }

    #setButtonContent(layer: LayerSpecification, btn: HTMLButtonElement, placeholder?: string) {
        if (placeholder) {
            const img = document.createElement('img');
            img.src = placeholder;

            const visibility = this.#map?.getLayoutProperty(layer.id, 'visibility') ?? 'visible';
            const isVisible = visibility === 'visible';

            Object.assign(img.style, {
                borderRadius: '2px',
                display: 'block',
                height: '100%',
                objectFit: 'cover',
                opacity: isVisible ? '1' : '0.6',
                pointerEvents: 'none',
                width: '100%'
            });

            img.onerror = () => {
                img.remove();
                btn.innerText = layer.id.substring(0, 3).toUpperCase();
            };
            btn.appendChild(img);
        } else {
            btn.innerText = layer.id.substring(0, 3).toUpperCase();
        }
    }

    #selectLayer(layerId: string) {
        if (!this.#map || !this.#panel || !this.#panelLayers) {
            return;
        }

        const style = this.#map.getStyle();
        if (!style || !style.layers) {
            return;
        }

        style.layers.forEach((layer) => {
            const isSelected = layer.id === layerId;
            const visibility = isSelected ? 'visible' : 'none';

            this.#map!.setLayoutProperty(layer.id, 'visibility', visibility);

            if (isSelected && this.#withLabel && this.#panelLabel) {
                const metadata = (layer.metadata || {}) as MapLibreLayerMetadata;
                this.#panelLabel.querySelector('[id="layer-factory-panel-label-tag"]')!.innerHTML = metadata.name ? layer.id : "";
                this.#panelLabel.querySelector('[id="layer-factory-panel-label-text"]')!.innerHTML = metadata.name ?? layer.id;
                this.#panelLabel.querySelector('[id="layer-factory-panel-label-caption"]')!.innerHTML = metadata.caption ? ` (${metadata.caption})` : "";
            }

            const btn = this.#panelLayers!.querySelector(`[data-id="${layer.id}"]`) as HTMLButtonElement;
            if (btn) {
                btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');

                const img = btn.querySelector('img');
                if (img) {
                    img.style.opacity = isSelected ? '1' : '0.6';
                }
            }
        });
    }

    #initializePanelLayers() {
        this.#enforceOneLayerSelection();
        this.#setLayerList();
    }

    onAdd(map: Map): HTMLElement {
        this.#map = map;
        this.#container = this.#createContainer();

        this.#toggle = this.#createToggle();
        this.#container.appendChild(this.#toggle);

        this.#panel = this.#createPanel();
        this.#container.appendChild(this.#panel);

        this.#panelLayers = this.#createPanelLayers();
        this.#panel.appendChild(this.#panelLayers);

        if (this.#withLabel) {
            this.#panelLabel = this.#createPanelLabel();
            this.#panel.appendChild(this.#panelLabel);
        }

        this.#map.on('styledata', this.#boundUpdate);

        if (this.#map.isStyleLoaded()) {
            this.#initializePanelLayers();
        } else {
            this.#map.once('load', this.#initializePanelLayers.bind(this));
        }

        return this.#container;
    }

    onRemove(): void {
        this.#map?.off('styledata', this.#boundUpdate);
        this.#container?.remove();
        this.#map = undefined;
    }
}
