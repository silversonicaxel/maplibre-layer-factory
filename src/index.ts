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
    overlayStyle?: {
        panel?: Partial<CSSStyleDeclaration>;
        row?: Partial<CSSStyleDeclaration>;
        label?: Partial<CSSStyleDeclaration>;
        groupHeader?: Partial<CSSStyleDeclaration>;
    };
}

export interface MapLibreLayerMetadata {
    name?: string;
    caption?: string;
    placeholder?: string;
    ignore?: boolean;
    overlay?: boolean;
    group?: string;
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
    #panelOverlays?: HTMLDivElement;
    #overlayStyle: {
        panel?: Partial<CSSStyleDeclaration>;
        row?: Partial<CSSStyleDeclaration>;
        label?: Partial<CSSStyleDeclaration>;
        groupHeader?: Partial<CSSStyleDeclaration>;
    };
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
        this.#overlayStyle = options.overlayStyle || {};
        this.#boundUpdate = this.#updatePanel.bind(this);
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
                minWidth: '220px',
                padding: '4px',
            },
            this.#panelStyle,
            {
                display: 'none',
                flexDirection: 'column',
                maxWidth: 'none',
                overflowY: 'hidden',
                width: 'max-content'
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
            flexWrap: 'nowrap',
            gap: '8px',
            margin: '0',
            maxHeight: '200px',
            overflowX: 'hidden',
            overflowY: 'auto',
            width: 'auto'
        });

        return panelLayers;
    }

    #createPanelOverlays() {
        const panelOverlays = document.createElement('div');
        panelOverlays.id = 'layer-factory-panel-overlays';
        Object.assign(panelOverlays.style, {
            gap: '4px',
            padding: '4px 0',
        }, this.#overlayStyle.panel, {
            display: 'none',
            flexDirection: 'column',
        });
        return panelOverlays;
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
                boxSizing: 'border-box',
                contain: 'inline-size',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                width: '100%',
            }
        );

        const panelLabelContent = document.createElement('div');
        panelLabelContent.id = 'layer-factory-panel-label-content';
        Object.assign(panelLabelContent.style, {
            flex: '1',
            minWidth: '0',
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

    #getSelectableLayers() {
        const allLayers = this.#map?.getStyle()?.layers ?? [];
        return allLayers.filter(layer => {
            const metadata = (layer.metadata || {}) as MapLibreLayerMetadata;
            return !metadata.ignore && !metadata.overlay;
        });
    }

    #enforceOneLayerSelection() {
        if (!this.#map) {
            return;
        }

        const layers = this.#getSelectableLayers();
        if (layers.length === 0) {
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
            const { placeholder, ignore = false, overlay = false } = metadata;
            if (ignore || overlay) {
                return;
            }

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
                    flexShrink: '0',
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

    #createOverlayRow(layer: LayerSpecification) {
        const metadata = (layer.metadata || {}) as MapLibreLayerMetadata;
        const visibility = this.#map!.getLayoutProperty(layer.id, 'visibility') ?? 'visible';

        const rowLabel = document.createElement('label');
        Object.assign(rowLabel.style, {
            alignItems: 'center',
            cursor: 'pointer',
            display: 'flex',
            fontSize: '13px',
            gap: '8px',
            padding: '4px 8px',
        }, this.#overlayStyle.row);

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = visibility === 'visible';
        checkbox.setAttribute('data-id', layer.id);
        checkbox.onchange = () => {
            if (!this.#map) return;
            this.#map.setLayoutProperty(layer.id, 'visibility', checkbox.checked ? 'visible' : 'none');
        };

        const nameSpan = document.createElement('span');
        nameSpan.textContent = metadata.name || layer.id;
        Object.assign(nameSpan.style, this.#overlayStyle.label);

        rowLabel.appendChild(checkbox);
        rowLabel.appendChild(nameSpan);

        return rowLabel;
    }

    #setOverlayList() {
        if (!this.#map || !this.#panelOverlays) {
            return;
        }

        const style = this.#map.getStyle();
        if (!style) {
            return;
        }

        // Save which groups the user has expanded before clearing DOM
        const openGroups = new Set<string>();
        this.#panelOverlays.querySelectorAll('details[data-group]').forEach(el => {
            if ((el as HTMLDetailsElement).open) {
                openGroups.add(el.getAttribute('data-group')!);
            }
        });

        this.#panelOverlays.innerHTML = '';

        const allLayers = style.layers ?? [];
        const overlayLayers = allLayers.filter(layer => {
            const metadata = (layer.metadata || {}) as MapLibreLayerMetadata;
            return !metadata.ignore && metadata.overlay === true;
        });

        if (overlayLayers.length === 0) {
            this.#panelOverlays.style.display = 'none';
            return;
        }

        this.#panelOverlays.style.display = 'flex';

        // Divider — first child, appears/disappears with section
        const divider = document.createElement('hr');
        Object.assign(divider.style, {
            border: 'none',
            borderTop: '1px solid #ddd',
            margin: '4px 0',
            width: '100%',
        });
        this.#panelOverlays.appendChild(divider);

        // Ungrouped overlays first (flat, always visible)
        overlayLayers
            .filter(layer => !(layer.metadata as MapLibreLayerMetadata)?.group)
            .forEach(layer => this.#panelOverlays!.appendChild(this.#createOverlayRow(layer)));

        // Grouped overlays — one <details> per unique group name, preserving layer order
        const groups: Record<string, LayerSpecification[]> = {};
        overlayLayers.forEach(layer => {
            const group = (layer.metadata as MapLibreLayerMetadata)?.group;
            if (!group) return;
            groups[group] ??= [];
            groups[group]!.push(layer);
        });

        Object.entries(groups).forEach(([groupName, layers]) => {
            const details = document.createElement('details');
            details.setAttribute('data-group', groupName);
            if (openGroups.has(groupName)) details.open = true;

            const summary = document.createElement('summary');
            summary.textContent = groupName;
            Object.assign(summary.style, {
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                listStyle: 'none',
                padding: '4px 8px',
                userSelect: 'none',
            }, this.#overlayStyle.groupHeader);
            details.appendChild(summary);

            layers.forEach(layer => details.appendChild(this.#createOverlayRow(layer)));

            this.#panelOverlays!.appendChild(details);
        });
    }

    #selectLayer(layerId: string) {
        if (!this.#map || !this.#panel || !this.#panelLayers) {
            return;
        }

        this.#getSelectableLayers().forEach((layer) => {
            const isSelected = layer.id === layerId;
            const visibility = isSelected ? 'visible' : 'none';

            this.#map!.setLayoutProperty(layer.id, 'visibility', visibility);

            if (isSelected && this.#withLabel && this.#panelLabel) {
                const metadata = (layer.metadata || {}) as MapLibreLayerMetadata;
                this.#panelLabel.querySelector('[id="layer-factory-panel-label-tag"]')!.innerHTML = metadata.name ? layer.id : "";
                this.#panelLabel.querySelector('[id="layer-factory-panel-label-text"]')!.innerHTML = metadata.name ?? layer.id;
                this.#panelLabel.querySelector('[id="layer-factory-panel-label-caption"]')!.innerHTML = metadata.caption ? `(${metadata.caption})` : "";
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
        this.#setOverlayList();
    }

    #updatePanel() {
        this.#setLayerList();
        this.#setOverlayList();
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

        this.#panelOverlays = this.#createPanelOverlays();
        this.#panel.appendChild(this.#panelOverlays);

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
