<script setup>
import AppLayout from '@/layouts/AppLayout.vue';
import { Head, usePage } from '@inertiajs/vue3';
import { ref, watchEffect } from 'vue';
import LeafletMap from '../components/map/LeafletMap.vue';
import MapSwitcher from '../components/map/MapSwitcher.vue';
import Marker from '../components/map/Marker.vue';

const selectedMap = ref('OpenStreetMap'); // Default map type
const features = ref([]);

// Load initial features from Inertia props
watchEffect(() => {
    features.value = usePage().props.features || [];
});

const updateMap = (newMap) => {
    console.log('Switching to:', newMap);
    selectedMap.value = newMap; // Update selected map
};
</script>

<template>
    <Head title="Maps" />

    <AppLayout>
        <div class="map-view">
            <Marker class="marker" />
            <MapSwitcher @updateMap="updateMap" class="map-switcher" />
            <LeafletMap :selectedMap="selectedMap" :initialFeatures="features" ref="mapRef" class="map" />
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
</style>
