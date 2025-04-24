<script setup>
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useCustomZoom } from '@/composables/useCustomZoom';
import { useMapLayers } from '@/composables/useMapLayers';
import { useMapStore } from '@/stores/map';
import { useMarkerToolStore } from '@/stores/markerToolStore';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

// Props
const props = defineProps({
    selectedMap: String, // Receives selected map type from parent
    initialFeatures: Array, // Receives features from parent
});

// Stores
const mapStore = useMapStore();
const markerToolStore = useMarkerToolStore();

// Refs
const mapContainer = ref(null); // ref(null) ensures the element is ready after mounting.
const temporaryMarkers = ref([]);

// Map and Layers
let map;
let currentLayer;
const featureLayer = L.layerGroup();
const { baseLayers } = useMapLayers();
const { CustomZoom } = useCustomZoom();

// Icons
const icons = {
    red: new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
    }),
    green: new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
    }),
};

/***
 * MARKER FUNCTIONS
 */

/**
 * HANDLE MAP CLICK
 * Check if user clicking when add marker is active.
 * If it is active, the  call addTemporaryMarker()
 * @param e
 */
const handleMapClick = (e) => {
    if (markerToolStore.isAddingMarker) {
        addTemporaryMarker(e); // add TEMPORARY marker
    }
};

/**
 * ADD TEMPORARY MARKER
 * Called when user want to add marker. It is not yet saved to db.
 * @param e
 */
const addTemporaryMarker = (e) => {
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
    const marker = L.marker(e.latlng, { draggable: markerToolStore.isEditingMarker, icon: icons.red }).addTo(map);
    // Store reference to temporary marker
    temporaryMarkers.value.push({
        marker,
        feature: temporaryFeature,
    });
    // Setup popup and events for this temporary marker
    setupTemporaryMarker(marker, temporaryFeature);
};

/**
 * SETUP TEMPORARY MARKER
 * Configure popup and dragging events for a temporary marker
 * @param marker
 * @param feature
 */
const setupTemporaryMarker = (marker, feature) => {
    // Handle marker on click
    marker.on('click', () => {
        if (markerToolStore.isDeletingMarker) {
            if (confirm('Are you sure you want to delete this marker?')) {
                removeTemporaryMarker(marker);
            }
        }
    });

    // Handle marker dragging
    marker.on('dragend', (event) => {
        const newLatLng = event.target.getLatLng();
        feature.geometry.coordinates = [newLatLng.lng, newLatLng.lat];
        updateTemporaryMarkerPopup(marker, feature);
    });

    // Create popup content
    const popupContent = createTemporaryMarkerPopupContent(feature);
    const popup = L.popup().setContent(popupContent);

    // Bind popup to marker
    marker.bindPopup(popup).openPopup();

    // Handle popup open to attach event listeners
    // Open popup after a slight delay to ensure DOM is ready
    setTimeout(() => {
        marker.openPopup();
        // Attach events immediately after opening
        attachTemporaryMarkerPopupEvents(marker, feature);
    }, 50);
};

/**
 * CREATE TEMPORARY MARKER POP UP CONTENT
 * Create the HTML for the pop up content in temporary marker.
 * It is different from the permanent marker.
 * @param feature
 */
const createTemporaryMarkerPopupContent = (feature) => {
    return `
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
};

/**
 * ATTACH TEMPORARY MARKER POP UP EVENTS
 * Attach event listeners to temporary marker popup
 * @param marker
 * @param feature
 */
const attachTemporaryMarkerPopupEvents = (marker, feature) => {
    const popup = marker.getPopup();
    const content = popup.getElement();

    if (!content) return;

    console.log('i am here too!');
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

/**
 * UPDATE TEMPORARY MARKER POP UP
 * update the pop up when marker gets dragged or the title/description has been changed.
 * @param marker
 * @param feature
 */
const updateTemporaryMarkerPopup = (marker, feature) => {
    const popup = marker.getPopup();
    if (popup) {
        popup.setContent(createTemporaryMarkerPopupContent(feature));
        // Wait until the popup re-opens before attaching the event
        marker.off('popupopen'); // Clear previous handlers
        marker.on('popupopen', () => {
            console.log('popup reopened after update');
            attachTemporaryMarkerPopupEvents(marker, feature);
        });

        // Re-open popup to trigger `popupopen` again
        marker.openPopup();
    }
};

/**
 * SAVE TEMPORARY MARKER
 * Save a temporary marker to backend
 * @param feature
 * @param marker
 */
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

/**
 * REMOVE TEMPORARY MARKER
 * Remove a temporary marker from map
 * @param marker
 */
const removeTemporaryMarker = (marker) => {
    map.removeLayer(marker);
    temporaryMarkers.value = temporaryMarkers.value.filter((m) => m.marker !== marker);
    map.closePopup(marker.getPopup());
};

/**
 * ADD SAVED FEATURE TO MAP
 * Add features that has been saved to map.
 * @param featureData
 */
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
                icon: icons.green,
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

/**
 * LOAD FEATURES
 * used to load features from props.
 * add the features to the map using addSavedFeaturetoMap
 */
const loadFeatures = (features) => {
    featureLayer.clearLayers();
    features.forEach((feature) => {
        addSavedFeatureToMap(feature);
    });
};

/**
 * CREATE POP UP FOR FEATURE
 * createFeaturePopup used to create pop up for features.
 * @param feature
 * @param layer
 * @param isEditMode
 * It will only create and bind the pop up. attachViewPopupEvents()
 * and attachEditPopupEvents() will be called
 * to attach the appropriate event handlers.
 */
const createFeaturePopup = (feature, layer, isEditMode = false) => {
    const currentLatLng = layer.getLatLng();
    const currentCoords = [currentLatLng.lng, currentLatLng.lat];
    const coords = currentCoords;

    // Add two content, for edit mode and for view mode.
    // By default, isEditMode will be false
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

    // Check if popup already exists.
    // If pop up is already exists, then unbind the old pop up.
    if (layer.getPopup()) {
        layer.closePopup();
        layer.unbindPopup();
    }

    // Bind the new pop up with the new content.
    layer.bindPopup(content);

    // Attach appropriate event handlers based on the mode.
    if (isEditMode) {
        attachEditPopupEvents(feature, layer);
    } else {
        attachViewPopupEvents(feature, layer);
    }
};

/**
 * ATTACH VIEW POPUP EVENTS
 * Attach event handlers if the content is in view mode.
 */
const attachViewPopupEvents = (feature, layer) => {
    layer.off('popupopen'); // Remove previous handlers

    layer.on('popupopen', (e) => {
        e.originalEvent?.preventDefault(); // Prevent default closing behavior
        const content = layer.getPopup().getElement(); // Save the content
        // Search for edit button. If it is get clicked, then change the pop up content using
        // createFeaturePopup and reopen the pop up.
        content.querySelector('.edit-btn.btn-text')?.addEventListener('click', (btnEvent) => {
            createFeaturePopup(feature, layer, true);
            layer.openPopup();
        });
    });
};

/**
 * ATTACH EDIT POPUP EVENTS
 * Attach event handlers if the content is in edit mode.
 */
const attachEditPopupEvents = (feature, layer) => {
    layer.off('popupopen'); // Remove previous handlers

    layer.on('popupopen', (e) => {
        e.originalEvent?.preventDefault(); // Prevent default closing behavior
        const content = layer.getPopup().getElement(); // Save the content

        // Search for save button. If it is get clicked, then update the feature,
        // call updateFeature() and ccall createFeaturePopup to change it back to view mode with updated feature.
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

        // Search for cancle button. If it is get clicked, then call createFeaturePopup to
        // switch to view mode.
        content.querySelector('.cancel-btn.btn-text')?.addEventListener('click', async (btnEvent) => {
            btnEvent.preventDefault();
            createFeaturePopup(feature, layer, false);
        });
    });
};

/**
 * BIND FEATURE EVENTS
 * bindFeatureEvents is used to bind event handlers to the feature,
 * especially marker. It gets called whenever marker is made.
 * @param feature
 * @param layer
 */
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

/**
 * UPDATE FEATURE
 * Update feature to the database and update local preference.
 * @param feature
 * @param layer
 */
const updateFeature = async (feature, layer) => {
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
    } catch (error) {
        console.error('Error updating feature:', error);
        // Revert position if update fails
        layer.setLatLng([feature.geometry.coordinates[1], feature.geometry.coordinates[0]]);
    }
};

/**
 * DELETE FEATURE
 * Delete feature from database and local preference
 * @param feature
 * @param layer
 */
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

/**
 * FIND FEATURE IN LAYER
 * Helper function to find the full feature with ID
 * @param layer
 */
function findFeatureInLayer(layer) {
    // Check if we have a feature reference with ID
    if (layer.feature?.id) {
        return layer.feature;
    }

    // Fallback: search through initialFeatures
    if (props.initialFeatures) {
        return props.initialFeatures.find(
            (f) =>
                f.geometry.coordinates[0] === layer.feature.geometry.coordinates[0] &&
                f.geometry.coordinates[1] === layer.feature.geometry.coordinates[1],
        );
    }
    return null;
}

/**
 * FLY TO MARKER
 * Find and fly to a marker
 * @param featureId
 */
 const flyToMarker = (featureId) => {
    let found = false;

    // First check the featureLayer
    featureLayer.eachLayer((layer) => {
        const marker = findMarkerInLayer(layer);
        if (marker && marker.feature?.id === featureId) {
            const [lng, lat] = marker.feature.geometry.coordinates;
            map.flyTo([lat, lng], 10);
            marker.openPopup();
            found = true;
            return; // Exit early if found
        }
    });

    if (!found) {
        console.warn(`Marker with ID ${featureId} not found`);
    }
};

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

/***
 * ON MOUNTED
 */
 onMounted(() => {
    // mapContainer.value gives access to the actual DOM element.
    map = L.map(mapContainer.value, { zoomControl: false }).setView([-8.65842, 115.213969], 10);
    // Default map layer
    const defaultMap = props.selectedMap || 'OpenStreetMap';
    currentLayer = baseLayers[defaultMap].addTo(map);
    // Initialize feature layer
    featureLayer.addTo(map);
    // Load initial features
    loadFeatures(props.initialFeatures);
    // Handle map click event
    map.on('click', handleMapClick);
    // Add Custom Zoom Control to Map
    map.addControl(new CustomZoom());
});

// Cleanup temporary markers when component unmounts
onBeforeUnmount(() => {
    temporaryMarkers.value.forEach(({ marker }) => {
        map.removeLayer(marker);
    });
    if (map) map.remove();
});

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

// Watch for map switch updates
watch(
    () => props.selectedMap,
    (newMap) => {
        if (currentLayer) {
            map.removeLayer(currentLayer);
        }
        if (baseLayers[newMap]) {
            currentLayer = baseLayers[newMap].addTo(map);
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
