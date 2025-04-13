import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useMapStore = defineStore('map', () => {
  const flyToRequest = ref(null);
  
  function requestFlyTo(featureId) {
    flyToRequest.value = {
      featureId,
      timestamp: Date.now() // Ensures reactivity even for same ID
    };
  }
  
  return { flyToRequest, requestFlyTo };
});