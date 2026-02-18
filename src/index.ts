import type { IControl, LayerSpecification, Map } from 'maplibre-gl';

export type MapLibreLayerFactoryOrientation = 'horizontal' | 'vertical';

export interface MapLibreLayerFactoryOptions {
    orientation?: MapLibreLayerFactoryOrientation;
}

export interface MapLibreLayerMetadata {
    placeholder?: string;
}

export class MapLibreLayerFactory implements IControl {
    #map?: Map;
    #container?: HTMLDivElement;
    #panel?: HTMLDivElement;
    #isOpen: boolean = false;
    #orientation: MapLibreLayerFactoryOrientation;
    #boundUpdate: () => void;

    constructor(options: MapLibreLayerFactoryOptions = {}) {
        this.#orientation = options.orientation || 'vertical';
        this.#boundUpdate = this.#updateLayerList.bind(this);
    }

    #updateLayerList() {
        if (!this.#map || !this.#panel) {
            return;
        }

        const style = this.#map.getStyle();
        if (!style) {
            return;
        }

        this.#panel.innerHTML = '';
        const layers = style.layers ?? [];

        Object.assign(this.#panel.style, {
            display: this.#isOpen ? 'flex' : 'none',
            flexDirection: this.#orientation === 'vertical' ? 'column' : 'row',
        });

        layers.forEach((layer) => {
            const metadata = (layer.metadata || {}) as MapLibreLayerMetadata;
            const placeholder = metadata.placeholder;

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.title = layer.id;
            btn.className = 'layer-factory-panel-button';
            btn.setAttribute('data-id', layer.id);

            this.#setButtonContent(layer, btn, placeholder);

            const visibility = this.#map!.getLayoutProperty(layer.id, 'visibility') ?? 'visible';
            const isSelected = visibility === 'visible';

            Object.assign(btn.style, {
                backgroundColor: isSelected ? '#e0f0ff' : '#f5f5f5',
                border: isSelected ? '2px solid #007cbf' : 'none',
                color: isSelected ? '#007cbf' : '#666',
                padding: placeholder ? '0' : '4px 8px',

            });

            btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');

            btn.onclick = () => this.#toggleLayer(layer.id);
            this.#panel!.appendChild(btn);
        });
    }

    #setButtonContent(layer: LayerSpecification, btn: HTMLButtonElement, placeholder?: string) {
        if (placeholder) {
            const img = document.createElement('img');
            img.src = placeholder;
            img.className = 'layer-factory-panel-image';

            const visibility = this.#map?.getLayoutProperty(layer.id, 'visibility') ?? 'visible';
            const isVisible = visibility === 'visible';

            Object.assign(img.style, {
                opacity: isVisible ? '1' : '0.6',
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

    #toggleLayer(layerId: string) {
        if (!this.#map || !this.#panel) return;

        const style = this.#map.getStyle();
        if (!style || !style.layers) return;

        style.layers.forEach((layer) => {
            const isSelected = layer.id === layerId;
            const visibility = isSelected ? 'visible' : 'none';

            this.#map!.setLayoutProperty(layer.id, 'visibility', visibility);

            const btn = this.#panel!.querySelector(`[data-id="${layer.id}"]`) as HTMLButtonElement;
            if (btn) {
                btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');

                Object.assign(btn.style, {
                    backgroundColor: isSelected ? '#e0f0ff' : '#f5f5f5',
                    border: isSelected ? '2px solid #007cbf' : 'none',
                    color: isSelected ? '#007cbf' : '#666'
                });

                const img = btn.querySelector('img');
                if (img) {
                    img.style.opacity = isSelected ? '1' : '0.6';
                }
            }
        });
    }

    #enforceOneLayerSelection() {
        if (!this.#map) {
            return;
        }

        const layers = this.#map.getStyle()?.layers;
        if (!layers || layers.length === 0) {
            return;
        }

        const firstLayerId = layers[0]?.id;
        layers.forEach((layer) => {
            const isSelected = layer.id === firstLayerId;
            const visibility = isSelected ? 'visible' : 'none';
            this.#map!.setLayoutProperty(layer.id, 'visibility', visibility);
        });
    }

    #togglePanel() {
        this.#isOpen = !this.#isOpen;
        if (this.#panel) {
            this.#panel.style.display = this.#isOpen ? 'flex' : 'none';
        }
    }

    onAdd(map: Map): HTMLElement {
        this.#map = map;

        this.#container = document.createElement('div');
        this.#container.className = 'maplibregl-ctrl layer-factory-container';

        requestAnimationFrame(() => {
            if (!this.#container || !this.#container.parentElement) {
                return;
            }

            const parentClasses = this.#container.parentElement.className;

            const isLeft = parentClasses.includes('left');
            this.#container.style.alignItems = isLeft ? 'flex-start' : 'flex-end';

            const isBottom = parentClasses.includes('bottom');
            this.#container.style.flexDirection = isBottom ? 'column-reverse' : 'column';
            this.#container.style.justifyContent = isBottom ? 'flex-end' : 'flex-start';
        });

        const btnGroup = document.createElement('div');
        btnGroup.className = 'maplibregl-ctrl-group';

        const button = document.createElement('button');
        button.type = 'button';
        button.style.width = '29px';
        button.style.height = '29px';
        button.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: auto;">
                <path d="M11.99 19.0048L4.62 13.2748L3 14.5348L12 21.5348L21 14.5348L19.37 13.2648L11.99 19.0048ZM12 16.4648L19.36 10.7348L21 9.46484L12 2.46484L3 9.46484L4.63 10.7348L12 16.4648ZM12 4.99484L17.74 9.46484L12 13.9348L6.26 9.46484L12 4.99484Z" fill="currentColor"/>
            </svg>`;

        button.onclick = () => this.#togglePanel();
        btnGroup.appendChild(button);

        this.#panel = document.createElement('div');
        this.#panel.className = 'maplibregl-ctrl-group layer-factory-panel';

        Object.assign(this.#panel.style, {
            flexDirection: this.#orientation === 'vertical' ? 'column' : 'row',
        });

        this.#container.appendChild(btnGroup);
        this.#container.appendChild(this.#panel);

        this.#map.on('styledata', this.#boundUpdate);

        if (this.#map.isStyleLoaded()) {
            this.#enforceOneLayerSelection();
            this.#updateLayerList();
        } else {
            this.#map.once('load', () => {
                this.#enforceOneLayerSelection();
                this.#updateLayerList();
            });
        }

        return this.#container;
    }

    onRemove(): void {
        this.#map?.off('styledata', this.#boundUpdate);
        this.#container?.remove();
        this.#map = undefined;
    }
}
