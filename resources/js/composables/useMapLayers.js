import L from 'leaflet';

export function useMapLayers() {
    const baseLayers = {
        'OpenStreetMap': createOSMLayer(),
        'OpenStreetMap HOT': createHOTLayer(),
        'Esri World Imagery': createEsriLayer(),
        'Carto Light': createCartoLayer(),
        'Google Satellite': createGoogleSatelliteLayer(),
        'Google Hybrid': createGoogleHybridLayer()
    };

    function createOSMLayer() {
        return L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        });
    }

    function createHOTLayer() {
        return L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team hosted by OpenStreetMap France'
        });
    }

    function createEsriLayer() {
        return L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
        });
    }

    function createCartoLayer() {
        return L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20,
        });
    }

    function createGoogleSatelliteLayer() {
        return L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
            attribution: '&copy; Google',
        });
    }

    function createGoogleHybridLayer() {
        return L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
            attribution: '&copy; Google',
        });
    }

    return {
        baseLayers,
    };
}