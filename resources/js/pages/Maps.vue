<script setup>
import AppLayout from '@/layouts/AppLayout.vue';
import { useMapStore } from '@/stores/map';
import { Head, usePage } from '@inertiajs/vue3';
import { ref, watchEffect } from 'vue';
import LeafletMap from '../components/map/LeafletMap.vue';
import MapSwitcher from '../components/map/MapSwitcher.vue';
import Marker from '../components/map/Marker.vue';
import MarkerList from '../components/map/MarkerList.vue';

const selectedMap = ref('OpenStreetMap'); // Default map type
const features = ref([]);
const mapRef = ref(null);
const mapStore = useMapStore();

// Load initial features from Inertia props
watchEffect(() => {
    features.value = usePage().props.features || [];
});

// Expose map ref to store
watchEffect(() => {
    if (mapRef.value?.leafletObject) {
        mapStore.setMapRef(mapRef.value.leafletObject);
    }
});

const updateMap = (newMap) => {
    console.log('Switching to:', newMap);
    selectedMap.value = newMap; // Update selected map
};

// Handle feature created event
const handleFeatureCreated = (newFeature) => {
    features.value = [...features.value, newFeature];
};

// Handle feature updated event
const handleFeatureUpdated = (updatedFeature) => {
    features.value = features.value.map((feature) => (feature.id === updatedFeature.id ? updatedFeature : feature));
};

// Handle feature deleted event
const handleFeatureDeleted = (featureId) => {
    features.value = features.value.filter((feature) => feature.id !== featureId);
};
</script>

<template>
    <Head title="Maps" />

    <AppLayout>
        <div class="map-view">
            <Marker class="marker" />
            <MapSwitcher @updateMap="updateMap" class="map-switcher" />
            <LeafletMap
                :selectedMap="selectedMap"
                :initialFeatures="features"
                ref="mapRef"
                class="map"
                @featureCreated="handleFeatureCreated"
                @featureUpdated="handleFeatureUpdated"
                @featureDeleted="handleFeatureDeleted"
            />
            <MarkerList :features="features" class="marker-list" />
        </div>
    </AppLayout>
</template>

<style scoped>
.map-view {
    position: relative;
    display: flex;
    flex: 1;
    width: 100%;
    height: 100%;
}

.map-switcher {
    position: absolute;
    bottom: 20px;
    right: 12px;
    z-index: 1;
}

.map {
    z-index: 0;
}

.marker-list {
    position: absolute;
    bottom: 20px;
    left: 12px;
    z-index: 1000;
    background: white;
    padding: 0.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    max-height: 70vh;
    overflow-y: auto;
    width: 280px;
}
</style>
