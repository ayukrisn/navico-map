<script setup>
import { ref } from 'vue'

const emit = defineEmits(['updateMap'])
const showPopup = ref(false)


// Available map types
const mapOptions = [
    "OpenStreetMap",
    "OpenStreetMap HOT",
    "Esri World Imagery",
    "Carto Light",
    "Google Satellite",
    "Google Hybrid"
];
const selectedMap = ref(mapOptions[0])

const selectMap = (mapType) => {
  selectedMap.value = mapType
  emit('updateMap', mapType) // Send the selected map type to parent
  showPopup.value = false // Close popup after selection
}
</script>

<template>
  <div>
    <button class="btn" @click="showPopup = true"><i class="pi pi-clone"></i></button>

    <div v-if="showPopup" class="popup">
      <div class="popup-content">
        <div class="popup-header">
          <p>Select Map Type</p>
          <button class="close-btn" @click="showPopup = false">
            <i class="pi pi-times"></i>
          </button>
        </div>
        <div style="height: 12px;"></div>
        <div v-for="map in mapOptions" :key="map" class="map-option">
          <input
            type="radio"
            :id="map"
            :value="map"
            v-model="selectedMap"
            @change="selectMap(map)"
          />
          <label :for="map">{{ map }}</label>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.popup {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #fff;
  box-shadow: 0 4px 14px 0 rgb(0 0 0 / 10%);
  color: #696969;
  padding: 16px;
  border-radius: 8px;
  text-align: left;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.popup-header p {
  font-weight:  700 !important;
}

.map-option {
  display: flex;
  align-items: center;
  gap: 10px; /* Adds space between input and label */
}

.close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 12px;
}
</style>
