<script setup>
import 'leaflet/dist/leaflet.css';

import { useMarkerToolStore } from '@/stores/markerToolStore';
import L from 'leaflet';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

import axios from 'axios';

const props = defineProps({
    selectedMap: String, // Receives selected map type from parent
    initialFeatures: Array, // Receives features from parent
});

const markerToolStore = useMarkerToolStore();

const mapContainer = ref(null); // ref(null) ensures the element is ready after mounting.
let map;
let currentLayer;
const temporaryMarkers = ref([]);
const featureLayer = L.layerGroup();

/***
 * TILES
 */
var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap',
});

var osmHOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team hosted by OpenStreetMap France',
});

var esriWorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
});

var cartoLight = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20,
});

var googleSatellite = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    attribution: '&copy; Google',
});

var googleHybrid = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
    attribution: '&copy; Google',
});

/***
 * MAP LAYER OPTIONS
 */
const baseMap = {
    OpenStreetMap: osm,
    'OpenStreetMap HOT': osmHOT,
    'Esri World Imagery': esriWorldImagery,
    'Carto Light': cartoLight,
    'Google Satellite': googleSatellite,
    'Google Hybrid': googleHybrid,
};

/***
 * ON MOUNTED
 */
onMounted(() => {
    // mapContainer.value gives access to the actual DOM element.
    // This avoids issues where Leaflet tries to attach to a null element.
    map = L.map(mapContainer.value, { zoomControl: false }).setView([-8.65842, 115.213969], 13);

    // Default map layer
    const defaultMap = props.selectedMap || 'OpenStreetMap';
    currentLayer = baseMap[defaultMap].addTo(map);

    // Initialize feature layer
    featureLayer.addTo(map);

    // Load initial features
    loadFeatures(props.initialFeatures);

    // Handle map click event
    map.on('click', handleMapClick);

    // Custom Zoom Control
    var CustomZoom = L.Control.extend({
        options: {
            position: 'topright', // Position of the control
        },

        onAdd: function (map) {
            var container = L.DomUtil.create('div', 'custom-zoom'); // Create a div for the buttons

            // Zoom In Button
            let zoomIn = L.DomUtil.create('button', 'btn custom-zoom-in', container);
            zoomIn.innerHTML = '<i class="pi pi-plus"></i>';
            zoomIn.onclick = function (e) {
                e.preventDefault();
                map.zoomIn();
            };

            // Zoom Out Button
            let zoomOut = L.DomUtil.create('button', 'btn custom-zoom-out', container);
            zoomOut.innerHTML = '<i class="pi pi-minus"></i>';
            zoomOut.onclick = function (e) {
                e.preventDefault();
                map.zoomOut();
            };

            // Click Events
            L.DomEvent.on(zoomIn, 'click', function (e) {
                L.DomEvent.stopPropagation(e);
                L.DomEvent.preventDefault(e);
                map.zoomIn();
            });

            L.DomEvent.on(zoomOut, 'click', function (e) {
                L.DomEvent.stopPropagation(e);
                L.DomEvent.preventDefault(e);
                map.zoomOut();
            });

            return container;
        },
    });

    // Add Custom Zoom Control to Map
    map.addControl(new CustomZoom());
});

/***
 * MARKER FUNCTIONS
 */

// Load saved features from backend
const loadFeatures = (features) => {
    featureLayer.clearLayers();

    features.forEach((feature) => {
        const layer = L.geoJSON(feature, {
            pointToLayer: (geoJsonPoint, latlng) => {
                return L.marker(latlng, {
                    draggable: markerToolStore.isEditingMarker,
                    autoPan: true,
                });
            },
            onEachFeature: (feature, layer) => {
                bindFeatureEvents(feature, layer);
                createFeaturePopup(feature, layer);
            },
        }).addTo(featureLayer);
    });
};

// Create popup for saved features
const createFeaturePopup = (feature, layer) => {
    const coords = feature.geometry.coordinates;
    const content = `
    <div class="feature-popup">
      <h4>${feature.properties.title || 'Untitled Marker'}</h4>
      <p>${feature.properties.description || ''}</p>
      <small>${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}</small>
    </div>
  `;

    layer.bindPopup(content);
};

// Bind events to feature layers
const bindFeatureEvents = (feature, layer) => {
    layer.on('popupopen', () => {
        // Attach event listeners when popup opens
        setTimeout(() => {
            const popup = layer.getPopup();
        }, 0);
    });
};

// Handle Map Click
const handleMapClick = (e) => {
    if (markerToolStore.isAddingMarker) {
        addTemporaryMarker(e); // add TEMPORARY marker
    }
};

// Add TEMPORARY marker
const addTemporaryMarker = (e) => {
    // Create red icon
    const redIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
    });

    // Create the feature
    const temporaryFeature = {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [e.latlng.lng, e.latlng.lat],
        },
        properties: {
            isTemporary: true,
            title: 'Unsaved Marker',
            description: '',
        },
    };

    // Add marker
    const marker = L.marker(e.latlng, { draggable: markerToolStore.isEditingMarker, icon: redIcon }).addTo(map);

    // Handle marker on click
    marker.on('click', () => {
        if (markerToolStore.isDeletingMarker) {
            if (confirm('Are you sure you want to delete this marker?')) {
                removeTemporaryMarker(marker);
            }
        }
    });

    // Store reference to temporary marker
    temporaryMarkers.value.push({
        marker,
        feature: temporaryFeature,
    });

    // Setup popup and events for this temporary marker
    setupTemporaryMarker(marker, temporaryFeature);
};

// Configure popup and events for a temporary marker
const setupTemporaryMarker = (marker, feature) => {
    // Create popup content
    const popupContent = createTemporaryMarkerPopupContent(feature);
    const popup = L.popup().setContent(popupContent);

    // Bind popup to marker
    marker.bindPopup(popup).openPopup();

    // Handle marker dragging
    marker.on('dragend', (event) => {
        const newLatLng = event.target.getLatLng();
        feature.geometry.coordinates = [newLatLng.lng, newLatLng.lat];
        updateTemporaryMarkerPopup(marker, feature);
    });

    // Handle popup open to attach event listeners
    marker.on('popupopen', () => {
        attachTemporaryMarkerPopupEvents(marker, feature);
    });
};

// Create HTML content for temporary marker popup
const createTemporaryMarkerPopupContent = (feature) => {
    const content = document.createElement('div');
    content.innerHTML = `
    <div class="temporary-popup">
      <h4>New Marker</h4>
      <p>Position: ${feature.geometry.coordinates[1].toFixed(5)}, ${feature.geometry.coordinates[0].toFixed(5)}</p>
      <input type="text" class="title-input" placeholder="Marker title" value="${feature.properties.title}">
      <textarea class="description-input" placeholder="Marker description">${feature.properties.description}</textarea>
      <div class="popup-actions">
        <button class="save-btn">Save</button>
      </div>
    </div>
  `;
    return content;
};

// Attach event listeners to temporary marker popup
const attachTemporaryMarkerPopupEvents = (marker, feature) => {
    const popup = marker.getPopup();
    const content = popup.getElement();

    if (!content) return;

    // Handle save button click
    content.querySelector('.save-btn').addEventListener('click', () => {
        console.log('Save button is clicked');
        const title = content.querySelector('.title-input').value;
        const description = content.querySelector('.description-input').value;

        const featureToSave = {
            ...feature,
            properties: {
                ...feature.properties,
                title,
                description,
                isTemporary: false,
            },
        };

        saveTemporaryMarker(featureToSave, marker);
    });
};

// Update popup content when marker is dragged
const updateTemporaryMarkerPopup = (marker, feature) => {
    const popup = marker.getPopup();
    if (popup) {
        popup.setContent(createTemporaryMarkerPopupContent(feature));
        // Reattach events after content update
        attachTemporaryMarkerPopupEvents(marker, feature);
    }
};

// Save a temporary marker to backend
const saveTemporaryMarker = async (feature, marker) => {
    try {
        const response = await axios.post(route('store'), {
            feature: feature,
        });
        console.log('Backend response:', response.data);

        // Verify the returned data matches what you expect
        if (response.data && response.data.feature) {
            // Remove temporary marker
            removeTemporaryMarker(marker);

            // Add the newly saved feature to the map
            addSavedFeatureToMap(response.data.feature);
        } else {
            console.error('Unexpected response format:', response.data);
        }
    } catch (error) {
        console.error('Error saving feature:', error);
        console.log(feature);
    }
};

// Remove a temporary marker from map
const removeTemporaryMarker = (marker) => {
    map.removeLayer(marker);
    temporaryMarkers.value = temporaryMarkers.value.filter((m) => m.marker !== marker);
    map.closePopup(marker.getPopup());
};

// Check if it is a valid JSON or not
const isValidGeoJSON = (feature) => {
    return (
        feature &&
        feature.type === 'Feature' &&
        feature.geometry &&
        feature.geometry.type &&
        feature.geometry.coordinates &&
        Array.isArray(feature.geometry.coordinates)
    );
};

// Add a saved feature to the map
const addSavedFeatureToMap = (feature) => {
    if (!isValidGeoJSON(feature)) {
        console.error('Invalid GeoJSON received:', feature);
        return;
    }
    const layer = L.geoJSON(feature, {
        pointToLayer: (geoJsonPoint, latlng) => {
            return L.marker(latlng, {
                draggable: markerToolStore.isEditingMarker,
            });
        },
        onEachFeature: (feature, layer) => {
            // setupSavedFeatureEvents(feature, layer);
            createSavedFeaturePopup(feature, layer);
        },
    }).addTo(featureLayer);
};

// Create popup for saved features
const createSavedFeaturePopup = (feature, layer) => {
    const coords = feature.geometry.coordinates;
    const content = `
    <div class="feature-popup">
      <h4>${feature.properties.title || 'Untitled Marker'}</h4>
      <p>${feature.properties.description || ''}</p>
      <small>${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}</small>
    </div>
  `;

    layer.bindPopup(content);
};

// Configure events for saved features
const setupSavedFeatureEvents = (feature, layer) => {
    layer.on('popupopen', () => {
        attachSavedFeaturePopupEvents(feature, layer);
    });
};

// Attach event listeners to saved feature popup
const attachSavedFeaturePopupEvents = (feature, layer) => {
    const popup = layer.getPopup();
    const content = popup.getElement();

    if (!content) return;
};

// Cleanup temporary markers when component unmounts
onBeforeUnmount(() => {
    temporaryMarkers.value.forEach(({ marker }) => {
        map.removeLayer(marker);
    });
    if (map) map.remove();
});

// Watch for editing mode changes
watch(
    () => markerToolStore.isEditingMarker,
    (newEditingState) => {
        // 1. Handle saved features in featureLayer
        featureLayer.eachLayer((layer) => {
            console.log('Layer type:', layer.constructor.name);
            console.log('Layer feature:', layer.feature?.geometry?.type);
            if (layer.feature?.geometry?.type === 'Point') {
                if (layer.setDraggable) {
                    // Check if this is a marker with draggable capability
                    layer.setDraggable(newEditingState);
                } else if (layer.dragging) {
                    // Fallback for standard markers
                    newEditingState ? layer.dragging.enable() : layer.dragging.disable();
                }
            }
            console.log('Dragging available:', !!layer.dragging);
        });

        // 2. Handle temporary markers
        temporaryMarkers.value.forEach(({ marker }) => {
            // newEditingState ? marker.dragging.enable() : marker.dragging.disable();
            if (marker.dragging) {
                newEditingState ? marker.dragging.enable() : marker.dragging.disable();
            }
        });
    },
);

// Watch for map switch updates
watch(
    () => props.selectedMap,
    (newMap) => {
        if (currentLayer) {
            map.removeLayer(currentLayer);
        }
        if (baseMap[newMap]) {
            currentLayer = baseMap[newMap].addTo(map);
        } else {
            console.warn(`Map type "${newMap}" is not found in baseMap`);
        }
    },
);

// Watch for initial features changes
watch(
    () => props.initialFeatures,
    (newFeatures) => {
        loadFeatures(newFeatures);
    },
);
</script>

<template>
    <div ref="mapContainer" class="map-container"></div>
</template>

<style scoped>
.map-container {
    width: 100%;
    height: 100%;
}

/* Custom Zoom Control */
.custom-zoom {
    display: flex !important;
    flex-direction: column !important;
    gap: 5px !important;
}
</style>
