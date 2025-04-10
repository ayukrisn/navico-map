<script setup>
import 'leaflet/dist/leaflet.css'

import { onBeforeUnmount, onMounted, watch, ref } from 'vue'
import { useMarkerToolStore } from '@/stores/markerToolStore'
import { useLineToolStore } from '@/stores/lineToolStore'
import L from 'leaflet'

const props = defineProps({
  selectedMap: String, // Receives selected map type from parent
})

const markerToolStore = useMarkerToolStore()
const lineToolStore = useLineToolStore()

const mapContainer = ref(null) // ref(null) ensures the element is ready after mounting.
let map
let currentLayer
const markers = ref([]) // Store markers
const temporaryMarkers = ref([])
const markerLayer = L.layerGroup()

let currentPolyline = null
let currentPolylinePoints = [] // Stores the clicked points

/***
 * TILES
 */
var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap',
})

var osmHOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution:
    '© OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team hosted by OpenStreetMap France',
})

var esriWorldImagery = L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
  },
)

var cartoLight = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 20,
})

var googleSatellite = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
  attribution: '&copy; Google',
})

var googleHybrid = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
  attribution: '&copy; Google',
})

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
}

/***
 * ON MOUNTED
 */
onMounted(() => {
  // mapContainer.value gives access to the actual DOM element.
  // This avoids issues where Leaflet tries to attach to a null element.
  map = L.map(mapContainer.value, { zoomControl: false }).setView([-8.65842, 115.213969], 13)

  // Default map layer
  const defaultMap = props.selectedMap || 'OpenStreetMap'
  currentLayer = baseMap[defaultMap].addTo(map)

  // Load saved markers from localStorage
  loadMarkersFromStore()
  markerLayer.addTo(map)

  // Custom Zoom Control
  var CustomZoom = L.Control.extend({
    options: {
      position: 'topright', // Position of the control
    },

    onAdd: function (map) {
      var container = L.DomUtil.create('div', 'custom-zoom') // Create a div for the buttons

      // Zoom In Button
      let zoomIn = L.DomUtil.create('button', 'btn custom-zoom-in', container)
      zoomIn.innerHTML = '<i class="pi pi-plus"></i>'
      zoomIn.onclick = function (e) {
        e.preventDefault()
        map.zoomIn()
      }

      // Zoom Out Button
      let zoomOut = L.DomUtil.create('button', 'btn custom-zoom-out', container)
      zoomOut.innerHTML = '<i class="pi pi-minus"></i>'
      zoomOut.onclick = function (e) {
        e.preventDefault()
        map.zoomOut()
      }

      // Click Events
      L.DomEvent.on(zoomIn, 'click', function (e) {
        L.DomEvent.stopPropagation(e)
        L.DomEvent.preventDefault(e)
        map.zoomIn()
      })

      L.DomEvent.on(zoomOut, 'click', function (e) {
        L.DomEvent.stopPropagation(e)
        L.DomEvent.preventDefault(e)
        map.zoomOut()
      })

      return container
    },
  })

  // Add Custom Zoom Control to Map
  map.addControl(new CustomZoom())

  // Handle map click event
  map.on('click', handleMapClick)
  document.addEventListener('keydown', handleKeyPress)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeyPress)
})

/***
 * MARKER FUNCTIONS
 */
// handle map click
const handleMapClick = (e) => {
  if (markerToolStore.isAddingMarker) {
    addTemporaryMarker(e.latlng) // add TEMPORARY marker
  }

  if (lineToolStore.isAddingLine) {
    addPolylinePoint(e.latlng)
  }
}

// Load markers function
const loadMarkersFromStore = () => {
  markerLayer.clearLayers()
  markers.value = []

  markerToolStore.markers.forEach((marker) => {
    addMarker(marker)
  })

  if (!map.hasLayer(markerLayer)) {
    console.log('We touched this')
    markerLayer.addTo(map)
  }
}

// Add marker THAT HAS ALREADY BEEN SAVED
const addMarker = (markerData) => {
  if (
    !markerData.latlng ||
    typeof markerData.latlng.lat !== 'number' ||
    typeof markerData.latlng.lng !== 'number'
  ) {
    console.warn('Invalid marker data:', markerData)
    return
  }
  const marker = L.marker(markerData.latlng, { draggable: markerToolStore.isEditingMarker }).addTo(
    map,
  )
  const updatePopupContent = () => {
    const popupContent = `
    <h3><b>${markerData.title}</b></h3>
    <p>${markerData.description}</p>
    <hr>
    <p>Marker saved at ${markerData.latlng.lat.toFixed(5)}, ${markerData.latlng.lng.toFixed(5)}</p>
  `
    marker.bindPopup(popupContent).openPopup()
  }

  // Enable dragging if isEditingMarker is active
  marker.on('dragend', (event) => {
    console.log(markerToolStore.isEditingMarker)
    const newLatLng = event.target.getLatLng()
    markerToolStore.updateMarker(markerData.id, newLatLng) // Update by ID
    console.log('Marker moved to:', newLatLng)
    updatePopupContent()
  })

  // Add event listener to handle marker deletion
  marker.on('click', () => {
    if (markerToolStore.isDeletingMarker) {
      if (confirm('Are you sure you want to delete this marker?')) {
        map.removeLayer(marker)
        markerToolStore.removeMarker(markerData.id) // Remove by ID
      } else {
        updatePopupContent()
      }
    } else {
      updatePopupContent()
    }
  })

  markers.value.push({ id: markerData.id, marker })
  markerLayer.addLayer(marker)
}

// Add TEMPORARY marker
const addTemporaryMarker = (latlng) => {
  const marker = L.marker(latlng, { draggable: markerToolStore.isEditingMarker }).addTo(map)
  // Function to update the pop-up content
  const updatePopupContent = (marker) => {
    const { lat, lng } = marker.getLatLng()
    const popupContent = `
      <p>Temporary Marker at ${lat.toFixed(5)}, ${lng.toFixed(5)}</p>
      <button id="saveMarkerBtn">Save</button>
    `
    marker.bindPopup(popupContent).openPopup()
  }

  marker.on('dragend', (event) => {
    const newLatLng = event.target.getLatLng()
    marker.setLatLng(newLatLng) // Update position without saving
    updatePopupContent(marker)
  })

  marker.on('click', () => {
    if (markerToolStore.isDeletingMarker) {
      if (confirm('Are you sure you want to delete this marker?')) {
        map.removeLayer(marker)
        temporaryMarkers.value = temporaryMarkers.value.filter((m) => m !== marker)
      }
    } else {
      updatePopupContent(marker)
      // Add click event for Save button
      setTimeout(() => {
        const saveBtn = document.getElementById('saveMarkerBtn')
        if (saveBtn) {
          saveBtn.onclick = () => {
            console.log('test')
            const title = prompt('Set marker title')
            const description = prompt('Set marker description')
            markerToolStore.addMarker(title, description, latlng)
            loadMarkersFromStore()
            map.removeLayer(marker)
            temporaryMarkers.value = temporaryMarkers.value.filter((m) => m !== marker)
          }
        }
      }, 0)
    }
  })
  temporaryMarkers.value.push(marker)
}

// Watch for editing mode changes
watch(
  () => markerToolStore.isEditingMarker,
  (newEditingState) => {
    markers.value.forEach((markerObj) => {
      const marker = markerObj.marker
      if (marker.dragging) {
        if (newEditingState) {
          marker.dragging.enable()
        } else {
          marker.dragging.disable()
        }
        console.log(`Marker ID ${markerObj.id} dragging: ${marker.dragging._enabled}`)
      } else {
        console.warn('Dragging is not available or not initialized for this marker:', markerObj)
      }
    })
    // Update temporary markers
    temporaryMarkers.value.forEach((marker) => {
      if (marker.dragging) {
        newEditingState ? marker.dragging.enable() : marker.dragging.disable()
      }
    })
  },
)

// Add polyline points
const addPolylinePoint = (latlng) => {
  currentPolylinePoints.push(latlng)

  if (!currentPolyline) {
    currentPolyline = L.polyline(currentPolylinePoints, { color: 'blue' }).addTo(map)
  } else {
    currentPolyline.setLatLngs(currentPolylinePoints)
  }
}

// Handle Enter key press to finalize polyline
const handleKeyPress = (e) => {
  if (e.key === 'Enter' && lineToolStore.isAddingLine) {
    console.log('Finalizing polyline:', currentPolylinePoints)

    lineToolStore.isAddingLine = false // Stop adding points
    currentPolyline = null
    currentPolylinePoints = []
  }
}

// Watch for isAddingLine changes
watch(
  () => lineToolStore.isAddingLine,
  (isAdding) => {
    if (!isAdding && currentPolyline) {
      currentPolyline = null
      currentPolylinePoints = []
    }
  },
)

// Watch for map switch updates
watch(
  () => props.selectedMap,
  (newMap) => {
    if (currentLayer) {
      map.removeLayer(currentLayer)
    }
    if (baseMap[newMap]) {
      currentLayer = baseMap[newMap].addTo(map)
    } else {
      console.warn(`Map type "${newMap}" is not found in baseMap`)
    }
  },
)
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
