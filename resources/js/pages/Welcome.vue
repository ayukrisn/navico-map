<script setup>
import { Head, Link } from '@inertiajs/vue3';
import { onMounted, ref } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const mapContainer = ref(null);
let map = ref(null);

onMounted(() => {
  if (mapContainer.value) {
    map.value = L.map(mapContainer.value).setView([-8.65842, 115.213969], 10); // Default coordinates

    // Create green icon
    const greenIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
    });
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map.value);
    
    // Add a sample marker
    L.marker([-8.65842, 115.213969], {icon: greenIcon,}).addTo(map.value)
      .bindPopup('Welcome to Navico GIS');
  }
});

</script>

<template>
    <Head title="Welcome">
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" crossorigin="anonymous"/>
    </Head>
    <div class="flex min-h-screen flex-col items-center bg-[#FDFDFC] p-6 text-[#1b1b18] dark:bg-[#0a0a0a] lg:justify-center lg:p-8">
        <header class="not-has-[nav]:hidden mb-6 w-full max-w-[335px] text-sm lg:max-w-4xl">
            <nav class="flex items-center justify-end gap-4">
                <Link
                    v-if="$page.props.auth.user"
                    :href="route('maps')"
                    class="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                >
                    Maps
                </Link>
                <template v-else>
                    <Link
                        :href="route('login')"
                        class="inline-block rounded-sm border border-transparent px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#19140035] dark:text-[#EDEDEC] dark:hover:border-[#3E3E3A]"
                    >
                        Log in
                    </Link>
                    <Link
                        :href="route('register')"
                        class="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                    >
                        Register
                    </Link>
                </template>
            </nav>
        </header>
        <div class="duration-750 starting:opacity-0 flex w-full items-center justify-center opacity-100 transition-opacity lg:grow">
            <main class="flex w-full max-w-[335px] flex-col-reverse overflow-hidden rounded-lg lg:max-w-4xl lg:flex-row">
                <div class="flex flex-col items-center justify-center gap-8 p-8 text-center lg:w-1/2 lg:items-start lg:text-left">
                    <div>
                        <h1 class="mb-4 text-4xl font-bold tracking-tight text-[#1b1b18] dark:text-[#EDEDEC]">Navico</h1>
                        <p class="text-lg text-[#1b1b18]/80 dark:text-[#EDEDEC]/80">
                            Log in to start your Geography Information System Journey!
                        </p>
                    </div>
                </div>
                <div class="hidden lg:block lg:w-1/2">
                    <div 
                        ref="mapContainer" 
                        class="h-full w-full rounded-lg bg-[#1b1b18]/5 dark:bg-[#EDEDEC]/5 leaflet-map"
                    ></div>
                </div>
            </main>
        </div>
        <div class="h-14.5 hidden lg:block"></div>
    </div>
</template>

<style scoped>
/* Leaflet map container styling */
.leaflet-map {
    min-height: 400px;
    z-index: 0;
}

/* Dark mode adjustments for Leaflet */
.dark .leaflet-tile {
    filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
}

.dark .leaflet-control {
    background-color: #1f2937;
    color: #f3f4f6;
}

.dark .leaflet-bar a {
    background-color: #1f2937;
    color: #f3f4f6;
    border-bottom-color: #374151;
}

.dark .leaflet-popup-content-wrapper,
.dark .leaflet-popup-tip {
    background-color: #1f2937;
    color: #f3f4f6;
}
</style>