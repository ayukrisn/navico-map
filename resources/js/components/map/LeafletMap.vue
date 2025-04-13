<script setup>
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useMarkerToolStore } from '@/stores/markerToolStore';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { useMapStore } from '@/stores/map';

import axios from 'axios';

const mapStore = useMapStore();
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
    map = L.map(mapContainer.value, { zoomControl: false }).setView([-8.65842, 115.213969], 10);

    // Default map layer
    const defaultMap = props.selectedMap || 'OpenStreetMap';
    currentLayer = baseMap[defaultMap].addTo(map);

    // Initialize feature layer
    featureLayer.addTo(map);

    // Load initial features
    loadFeatures(props.initialFeatures);
    console.log('initial features:', props.initialFeatures);

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

// Add this method to your component
function findMarkerByFeature(feature) {
    let foundMarker = null;
    featureLayer.eachLayer((layer) => {
        if (layer.feature?.id === feature.id) {
            foundMarker = layer;
        }
    });
    return foundMarker;
}

/***
 * MARKER FUNCTIONS
 */

// Load saved features from backend
const loadFeatures = (features) => {
    featureLayer.clearLayers();
    features.forEach((feature) => {
        addSavedFeatureToMap(feature);
    });
};

const createFeaturePopup = (feature, layer, isEditMode = false) => {
    const currentLatLng = layer.getLatLng();
    const currentCoords = [currentLatLng.lng, currentLatLng.lat];

    const coords = currentCoords;

    const content = isEditMode
        ? `
        <div class="feature-popup">
            <h4><strong>Edit Marker</strong></h4>
            <small class="instruction-text">For editing position, just enable edit mode and drag the marker.</small>
            <input type="text" class="title-input" value="${feature.properties.title || ''}">
            <textarea class="description-input" placeholder="Add detailed description here...">${feature.properties.description || ''}</textarea>
            <small class="position-text">Position: ${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}</small>
            <div class="popup-actions">
                <button class="save-btn btn-text">Save</button>
                <button class="cancel-btn btn-text">Cancel</button>
            </div>
        </div>
    `
        : `
        <div class="feature-popup">
            <h4><strong>${feature.properties.title || 'Untitled Marker'}</strong></h4>
            <p>${feature.properties.description || ''}</p>
            <small class="position-text">Position: ${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}</small>
            <div class="popup-actions">
                <button class="edit-btn btn-text">Edit</button>
                ${markerToolStore.isDeletingMarker ? '<button class="delete-btn btn-text">Delete</button>' : ''}
            </div>
        </div>
    `;

    // Check if popup already exists
    if (layer.getPopup()) {
        // Update existing popup content
        layer.getPopup().setContent(content);
    } else {
        // Create new popup
        layer.bindPopup(content);
    }

    // Open popup if not already open
    // if (!layer.getPopup().isOpen()) {
    //     layer.openPopup();
    // }

    // Attach appropriate event handlers
    if (isEditMode) {
        attachEditPopupEvents(feature, layer);
    } else {
        attachViewPopupEvents(feature, layer);
    }
};

// Event handlers for view mode
const attachViewPopupEvents = (feature, layer) => {
    layer.off('popupopen'); // Remove previous handlers

    layer.on('popupopen', (e) => {
        e.originalEvent?.preventDefault(); // Prevent default closing behavior

        const content = layer.getPopup().getElement();
        content.querySelector('.edit-btn.btn-text')?.addEventListener('click', (btnEvent) => {
            btnEvent.preventDefault();
            createFeaturePopup(feature, layer, true);
        });
    });
};

// Event handlers for edit mode
const attachEditPopupEvents = (feature, layer) => {
    layer.off('popupopen'); // Remove previous handlers

    layer.on('popupopen', (e) => {
        e.originalEvent?.preventDefault(); // Prevent default closing behavior

        const content = layer.getPopup().getElement();
        content.querySelector('.save-btn.btn-text')?.addEventListener('click', (btnEvent) => {
            btnEvent.preventDefault();
            const updatedFeature = {
                ...feature,
                properties: {
                    ...feature.properties,
                    title: content.querySelector('.title-input').value,
                    description: content.querySelector('.description-input').value,
                },
            };
            updateFeature(updatedFeature, layer);
            createFeaturePopup(updatedFeature, layer, false);
        });

        content.querySelector('.cancel-btn.btn-text')?.addEventListener('click', async (btnEvent) => {
            btnEvent.preventDefault();
            createFeaturePopup(feature, layer, false);
        });
    });
};

// Bind events to feature layers
const bindFeatureEvents = (feature, layer) => {
    // Initialize in view mode
    createFeaturePopup(feature, layer, false);

    layer.on('click', () => {
        if (markerToolStore.isDeletingMarker) {
            if (confirm('Are you sure you want to delete this marker?')) {
                deleteFeature(feature, layer);
            }
        }
    });

    layer.on('dragend', (e) => {
        const newLatLng = e.target.getLatLng();
        const updatedFeature = {
            ...feature,
            geometry: {
                ...feature.geometry,
                coordinates: [newLatLng.lng, newLatLng.lat],
            },
        };
        // Update both DB and local reference
        updateFeature(updatedFeature, layer).then(() => {
            feature = updatedFeature; // Update local reference
        });
    });
};

// Handle saved feature updates
const updateFeature = async (feature, layer) => {
    console.log(feature);
    try {
        // First find the database ID from your featureLayer
        const dbFeature = findFeatureInLayer(layer);
        if (!dbFeature?.id) {
            throw new Error('Feature ID not found');
        }

        // Create clean GeoJSON without ID
        const cleanFeature = {
            type: feature.type,
            geometry: feature.geometry,
            properties: feature.properties,
        };

        const response = await axios.put(`/features/${dbFeature.id}`, {
            feature: cleanFeature,
        });
        console.log(response.data);

        // Update local reference (keeping ID if needed)
        layer.feature = {
            ...response.data.feature,
            id: dbFeature.id, // Preserve ID locally if necessary
        };

        createFeaturePopup(response.data.feature, layer, false); // Refresh popup
    } catch (error) {
        console.error('Error updating feature:', error);
        // Revert position if update fails
        layer.setLatLng([feature.geometry.coordinates[1], feature.geometry.coordinates[0]]);
    }
};

// Handle saved feature deletion
const deleteFeature = async (feature, layer) => {
    console.log(feature);
    try {
        const dbFeature = findFeatureInLayer(layer);
        if (!dbFeature?.id) {
            throw new Error('Feature ID not found');
        }

        await axios.delete(`/features/${feature.id}`);
        // Double-ensure removal
        if (featureLayer.hasLayer(layer)) {
            console.log('has layer');
            featureLayer.removeLayer(layer);
        }

        if (map.hasLayer(layer)) {
            console.log('Removing directly from map');
            map.removeLayer(layer);
        }
    } catch (error) {
        console.error('Error deleting feature:', error);
    }
};

// Add this helper function to find the full feature with ID:
function findFeatureInLayer(layer) {
    // Check if we have a feature reference with ID
    if (layer.feature?.id) {
        console.log('first:' + layer.feature?.id);
        return layer.feature;
    }

    // Fallback: search through initialFeatures
    if (props.initialFeatures) {
        console.log(
            'second' +
                props.initialFeatures.find(
                    (f) =>
                        f.geometry.coordinates[0] === layer.feature.geometry.coordinates[0] &&
                        f.geometry.coordinates[1] === layer.feature.geometry.coordinates[1],
                ),
        );
        return props.initialFeatures.find(
            (f) =>
                f.geometry.coordinates[0] === layer.feature.geometry.coordinates[0] &&
                f.geometry.coordinates[1] === layer.feature.geometry.coordinates[1],
        );
    }

    return null;
}

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
    // Open popup after a slight delay to ensure DOM is ready
    setTimeout(() => {
        marker.openPopup();
        // Attach events immediately after opening
        attachTemporaryMarkerPopupEvents(marker, feature);
    }, 50);
};

// Create HTML content for temporary marker popup
const createTemporaryMarkerPopupContent = (feature) => {
    const content = document.createElement('div');
    content.innerHTML = `
    <div class="temporary-popup">
      <h3><strong>New Marker</strong></h3>
      <p>Position: ${feature.geometry.coordinates[1].toFixed(5)}, ${feature.geometry.coordinates[0].toFixed(5)}</p>
      <br>
      <input type="text" class="title-input" placeholder="Insert marker title here" value="${feature.properties.title}">
      <textarea class="description-input" placeholder="Insert marker description here" style="width: 100%">${feature.properties.description}</textarea>
      <div class="popup-actions">
        <button class="save-btn btn-text">Save Marker</button>
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
    content.querySelector('.save-btn.btn-text').addEventListener('click', () => {
        console.log('Save button is clicked');
        let title = content.querySelector('.title-input').value;
        const description = content.querySelector('.description-input').value;

        // Transform "Unsaved Marker" to "Marker"
        if (title === 'Unsaved Marker') {
            title = 'Marker';
        }

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
        if (response.data && response.data.id && response.data.geometry) {
            // Remove temporary marker
            removeTemporaryMarker(marker);

            // Add the newly saved feature to the map
            addSavedFeatureToMap(response.data); // Pass the entire response
        } else {
            console.error('Unexpected response format:', response.data);
            throw new Error('Invalid feature format received from server');
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
const addSavedFeatureToMap = (featureData) => {
    // Normalize the feature structure
    const feature = {
        id: featureData.id,
        type: featureData.type,
        geometry: featureData.geometry,
        properties: {
            ...featureData.properties,
            id: featureData.id, // Ensure ID is in properties too if needed
        },
    };

    const layer = L.geoJSON(feature, {
        pointToLayer: (geoJsonPoint, latlng) => {
            return L.marker(latlng, {
                draggable: markerToolStore.isEditingMarker,
            });
        },
        onEachFeature: (feature, layer) => {
            layer.feature = feature;
            bindFeatureEvents(feature, layer);
            createFeaturePopup(feature, layer, false);
        },
    }).addTo(featureLayer);
    return layer;
};

// Cleanup temporary markers when component unmounts
onBeforeUnmount(() => {
    temporaryMarkers.value.forEach(({ marker }) => {
        map.removeLayer(marker);
    });
    if (map) map.remove();
});

// Add this method to find and fly to a marker
const flyToMarker = (featureId) => {
    let found = false;

    // First check the featureLayer
    featureLayer.eachLayer((layer) => {
        const marker = findMarkerInLayer(layer);
        if (marker && marker.feature?.id === featureId) {
            const [lng, lat] = marker.feature.geometry.coordinates;
            map.flyTo([lat, lng], 15);
            marker.openPopup();
            found = true;
            return; // Exit early if found
        }
    });

    if (!found) {
        console.warn(`Marker with ID ${featureId} not found`);
    }
};

// Watch for fly-to requests
watch(
    () => mapStore.flyToRequest,
    (newRequest) => {
        if (newRequest?.featureId) {
            flyToMarker(newRequest.featureId);
        }
    },
    { deep: true },
);

// Watch for editing mode changes
watch(
    () => markerToolStore.isEditingMarker,
    (newEditingState) => {
        // 1. Handle saved features in featureLayer
        featureLayer.eachLayer((layer) => {
            // Find the actual marker instance
            const marker = findMarkerInLayer(layer);
            if (marker) {
                setMarkerDraggable(marker, newEditingState);
            }
        });

        // 2. Handle temporary markers
        temporaryMarkers.value.forEach(({ marker }) => {
            setMarkerDraggable(marker, newEditingState);
        });
    },
    { immediate: true },
);

// Helper function to find marker in complex layers
function findMarkerInLayer(layer) {
    // Case 1: Direct marker instance
    if (layer.setLatLng && layer.getLatLng) {
        return layer;
    }

    // Case 2: Nested in _layers (for FeatureGroups)
    if (layer._layers) {
        for (const id in layer._layers) {
            const subLayer = layer._layers[id];
            if (subLayer.setLatLng && subLayer.getLatLng) {
                return subLayer;
            }
        }
    }

    return null;
}

// Unified draggable control
function setMarkerDraggable(marker, draggable) {
    // Modern Leaflet (v1.7+)
    if (typeof marker.setDraggable === 'function') {
        marker.setDraggable(draggable);
    }
    // Legacy support
    else if (marker.dragging) {
        draggable ? marker.dragging.enable() : marker.dragging.disable();
    }
}

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
