import type { IControl, LayerSpecification, Map } from 'maplibre-gl';

export type MapLibreLayerFactoryOrientation = 'horizontal' | 'vertical';

export interface MapLibreLayerFactoryOptions {
    orientation?: MapLibreLayerFactoryOrientation;
}

export interface MapLibreLayerMetadata {
    placeholder?: string;
}

export class MapLibreLayerFactory implements IControl {
    private _map?: Map;
    private _container?: HTMLDivElement;
    private _panel?: HTMLDivElement;
    private _isOpen: boolean = false;
    private _orientation: MapLibreLayerFactoryOrientation;

    #boundUpdate: () => void;

    constructor(options: MapLibreLayerFactoryOptions = {}) {
        this._orientation = options.orientation || 'vertical';
        this.#boundUpdate = this.#updateLayerList.bind(this);
    }

    onAdd(map: Map): HTMLElement {
        this._map = map;

        this._container = document.createElement('div');
        this._container.className = 'maplibregl-ctrl';
        Object.assign(this._container.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            boxShadow: 'none'
        });

        requestAnimationFrame(() => {
            if (!this._container || !this._container.parentElement) return;
            const isLeft = this._container.parentElement.className.includes('left');
            this._container.style.alignItems = isLeft ? 'flex-start' : 'flex-end';
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

        this._panel = document.createElement('div');
        this._panel.className = 'maplibregl-ctrl-group';
        Object.assign(this._panel.style, {
            display: 'none',
            flexDirection: this._orientation === 'vertical' ? 'column' : 'row',
            width: 'auto',
            gap: '8px',
            maxHeight: '200px',
            overflowY: 'auto',
            margin: '0'
        });

        this._container.appendChild(btnGroup);
        this._container.appendChild(this._panel);

        this._map.on('styledata', this.#boundUpdate);

        if (this._map.isStyleLoaded()) {
            this.#enforceOneLayerSelection();
            this.#updateLayerList();
        } else {
            this._map.once('load', () => {
                this.#enforceOneLayerSelection();
                this.#updateLayerList();
            });
        }

        return this._container;
    }

    #updateLayerList() {
        if (!this._map || !this._panel) return;
        const style = this._map.getStyle();
        if (!style) return;

        this._panel.innerHTML = '';
        const layers = style.layers ?? [];

        // Apply shared panel styling based on orientation
        Object.assign(this._panel.style, {
            display: this._isOpen ? 'flex' : 'none',
            flexDirection: this._orientation === 'vertical' ? 'column' : 'row',
            gap: '8px',
            padding: '4px',
        });

        layers.forEach((layer) => {
            const metadata = (layer.metadata || {}) as MapLibreLayerMetadata;
            const placeholder = metadata.placeholder;

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.setAttribute('data-id', layer.id);
            btn.title = layer.id;

            this.#setButtonContent(layer, btn, placeholder);

            const visibility = this._map!.getLayoutProperty(layer.id, 'visibility') ?? 'visible';
            const isSelected = visibility === 'visible';

            // Set initial ARIA state
            btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');

            Object.assign(btn.style, {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: placeholder ? '0' : '4px 8px',
                width: '42px',
                height: '42px',
                border: isSelected ? '2px solid #007cbf' : 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: 'bold',
                backgroundColor: isSelected ? '#e0f0ff' : '#f5f5f5',
                color: isSelected ? '#007cbf' : '#666',
                whiteSpace: 'nowrap',
                boxSizing: 'border-box'
            });

            btn.onclick = () => this.#toggleLayer(layer.id);
            this._panel!.appendChild(btn);
        });
    }

    #setButtonContent(layer: LayerSpecification, btn: HTMLButtonElement, placeholder?: string) {
        if (placeholder) {
            const img = document.createElement('img');
            img.src = placeholder;
            Object.assign(img.style, {
                width: '100%',
                height: '100%',
                display: 'block',
                objectFit: 'cover',
                borderRadius: '2px',
                pointerEvents: 'none'
            });

            const visibility = this._map?.getLayoutProperty(layer.id, 'visibility') ?? 'visible';
            img.style.opacity = visibility === 'visible' ? '1' : '0.6';

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
        if (!this._map || !this._panel) return;

        const style = this._map.getStyle();
        if (!style || !style.layers) return;

        style.layers.forEach((layer) => {
            const isSelected = layer.id === layerId;
            const visibility = isSelected ? 'visible' : 'none';

            // 1. Update Map
            this._map!.setLayoutProperty(layer.id, 'visibility', visibility);

            // 2. Update existing Button in DOM (No re-render needed!)
            const btn = this._panel!.querySelector(`[data-id="${layer.id}"]`) as HTMLButtonElement;
            if (btn) {
                btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');

                Object.assign(btn.style, {
                    border: isSelected ? '2px solid #007cbf' : 'none',
                    backgroundColor: isSelected ? '#e0f0ff' : '#f5f5f5',
                    color: isSelected ? '#007cbf' : '#666'
                });

                const img = btn.querySelector('img');
                if (img) img.style.opacity = isSelected ? '1' : '0.6';
            }
        });

        // REMOVED: this.#updateLayerList(); // Calling this was deleting your aria-pressed attributes!
    }

    #enforceOneLayerSelection() {
        if (!this._map) return;
        const layers = this._map.getStyle()?.layers;
        if (!layers || layers.length === 0) return;

        const firstLayerId = layers[0]?.id;
        layers.forEach((layer) => {
            const isVisible = layer.id === firstLayerId ? 'visible' : 'none';
            this._map!.setLayoutProperty(layer.id, 'visibility', isVisible);
        });
    }

    #togglePanel() {
        this._isOpen = !this._isOpen;
        if (this._panel) {
            this._panel.style.display = this._isOpen ? 'flex' : 'none';
        }
    }

    onRemove(): void {
        this._map?.off('styledata', this.#boundUpdate);
        this._container?.remove();
        this._map = undefined;
    }
}
