import type { IControl, Map } from 'maplibre-gl';

export type MapLibreLayerFactoryOrientation = 'horizontal' | 'vertical';

export interface MapLibreLayerFactoryOptions {
    orientation?: MapLibreLayerFactoryOrientation;
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

        // 1. Transparent Parent Container
        this._container = document.createElement('div');
        this._container.className = 'maplibregl-ctrl'; // Base class for positioning
        Object.assign(this._container.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            boxShadow: 'none'
        });

        // AUTO-DETECTION: Wait until the element is added to the DOM
        requestAnimationFrame(() => {
            if (!this._container || !this._container.parentElement) return;

            // MapLibre control containers have classes like 'maplibregl-ctrl-top-left'
            const parentClasses = this._container.parentElement.className;
            const isLeft = parentClasses.includes('left');

            // Apply alignment based on which side of the map we are on
            this._container.style.alignItems = isLeft ? 'flex-start' : 'flex-end';
        });

        // 2. Button Group (Standard MapLibre look)
        const btnGroup = document.createElement('div');
        btnGroup.className = 'maplibregl-ctrl-group';

        const button = document.createElement('button');
        button.type = 'button';
        button.style.width = '29px'; // Standard MapLibre button size
        button.style.height = '29px';
        button.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: auto;">
                <path d="M11.99 19.0048L4.62 13.2748L3 14.5348L12 21.5348L21 14.5348L19.37 13.2648L11.99 19.0048ZM12 16.4648L19.36 10.7348L21 9.46484L12 2.46484L3 9.46484L4.63 10.7348L12 16.4648ZM12 4.99484L17.74 9.46484L12 13.9348L6.26 9.46484L12 4.99484Z" fill="currentColor"/>
            </svg>`;

        button.onclick = () => this.#togglePanel();
        btnGroup.appendChild(button);

        // 3. Panel Group (Detached)
        this._panel = document.createElement('div');
        this._panel.className = 'maplibregl-ctrl-group'; // Gives it the same shadow/bg as buttons
        Object.assign(this._panel.style, {
            display: 'none',
            flexDirection: this._orientation === 'vertical' ? 'column' : 'row', // column or row
            // width: '35px',
            width: 'auto',
            gap: '8px',
            maxHeight: '200px',
            overflowY: 'auto',
            margin: '0'
        });

        this._container.appendChild(btnGroup);
        this._container.appendChild(this._panel);

        this._map.on('styledata', this.#boundUpdate);

        // if (this._map.isStyleLoaded()) {
        //     this.#updateLayerList();
        // } else {
        //     this._map.once('load', () => this.#updateLayerList());
        // }

        if (this._map.isStyleLoaded()) {
            this.#enforceOneLayerSelection(); // Fix initial state
            this.#updateLayerList();
        } else {
            this._map.once('load', () => {
                this.#enforceOneLayerSelection(); // Fix initial state
                this.#updateLayerList();
            });
        }

        return this._container;
    }

    #updateLayerList() {
        this._orientation === 'vertical' ? this.#updateLayerListVertically() : this.#updateLayerListHorizontally();
    }


    #updateLayerListVertically() {
        if (!this._map || !this._panel) return;
        const style = this._map.getStyle();
        if (!style) return;

        this._panel.innerHTML = '';
        const layers = style.layers ?? [];

        // 1. Update Panel for Vertical Layout
        Object.assign(this._panel.style, {
            display: this._isOpen ? 'flex' : 'none',
            flexDirection: 'column',       // Buttons side-by-side
            gap: '4px',                 // Space between buttons
            padding: '4px',
            width: 'auto',              // Allow it to grow wider than the toggle
            // minWidth: '29px',           // At least as wide as the toggle
            // maxWidth: '300px',          // Prevent it from crossing the whole map
            // overflowX: 'auto',          // Scroll horizontally if too many layers
            // overflowY: 'hidden'
        });

        layers.forEach((layer) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.innerText = layer.id.substring(0, 3).toUpperCase();
            btn.title = layer.id;

            const visibility = this._map!.getLayoutProperty(layer.id, 'visibility') ?? 'visible';
            const isVisible = visibility === 'visible';

            Object.assign(btn.style, {
                flex: '0 0 auto',       // Prevent buttons from shrinking
                padding: '4px 8px',     // Horizontal padding for the 3 letters
                width: '42px',
                height: '42px',
                border: 'none',
                borderRadius: '4px',    // Rounded look for horizontal chips
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: 'bold',
                backgroundColor: isVisible ? '#e0f0ff' : '#f5f5f5',
                color: isVisible ? '#007cbf' : '#666',
                whiteSpace: 'nowrap'    // Keep text on one line
            });

            btn.onclick = () => this.#toggleLayer(layer.id);
            this._panel!.appendChild(btn);
        });
    }

    #updateLayerListHorizontally() {
        if (!this._map || !this._panel) return;
        const style = this._map.getStyle();
        if (!style) return;

        this._panel.innerHTML = '';
        const layers = style.layers ?? [];

        // 1. Update Panel for Horizontal Layout
        Object.assign(this._panel.style, {
            display: this._isOpen ? 'flex' : 'none',
            flexDirection: 'row',       // Buttons side-by-side
            gap: '4px',                 // Space between buttons
            padding: '4px',
            width: 'auto',              // Allow it to grow wider than the toggle
            // minWidth: '29px',           // At least as wide as the toggle
            // maxWidth: '300px',          // Prevent it from crossing the whole map
            // overflowX: 'auto',          // Scroll horizontally if too many layers
            // overflowY: 'hidden'
        });

        layers.forEach((layer) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.innerText = layer.id.substring(0, 3).toUpperCase();
            btn.title = layer.id;

            const visibility = this._map!.getLayoutProperty(layer.id, 'visibility') ?? 'visible';
            const isVisible = visibility === 'visible';

            // 2. Button Styling for Horizontal Row
            Object.assign(btn.style, {
                flex: '0 0 auto',       // Prevent buttons from shrinking
                padding: '4px 8px',     // Horizontal padding for the 3 letters
                width: '42px',
                height: '42px',
                border: 'none',
                borderRadius: '4px',    // Rounded look for horizontal chips
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: 'bold',
                backgroundColor: isVisible ? '#e0f0ff' : '#f5f5f5',
                color: isVisible ? '#007cbf' : '#666',
                whiteSpace: 'nowrap'    // Keep text on one line
            });

            btn.onclick = () => this.#toggleLayer(layer.id);
            this._panel!.appendChild(btn);
        });
    }

    #toggleLayer(layerId: string) {
        if (!this._map) return;

        const style = this._map.getStyle();
        if (!style || !style.layers) return;

        // Loop through all layers in the map
        style.layers.forEach((layer) => {
            // If it's the one we clicked, set to visible, otherwise hide it
            const visibility = (layer.id === layerId) ? 'visible' : 'none';
            this._map!.setLayoutProperty(layer.id, 'visibility', visibility);
        });

        // Refresh the UI to update button colors
        this.#updateLayerList();
    }

    #togglePanel() {
        this._isOpen = !this._isOpen;
        if (this._panel) {
            this._panel.style.display = this._isOpen ? 'flex' : 'none';
        }
    }

    #enforceOneLayerSelection() {
        if (!this._map) return;
        const layers = this._map.getStyle()?.layers;
        if (!layers || layers.length === 0) return;

        // The "First" layer becomes our master selection
        const firstLayerId = layers[0]?.id;

        layers.forEach((layer) => {
            const visibility = (layer.id === firstLayerId) ? 'visible' : 'none';
            this._map!.setLayoutProperty(layer.id, 'visibility', visibility);
        });
    }

    onRemove(): void {
        this._map?.off('styledata', this.#boundUpdate);
        this._container?.remove();
        this._map = undefined;
    }
}
