// stores/markerToolStore.js
import { defineStore } from 'pinia';

export const useMarkerToolStore = defineStore('markerTool', {
  state: () => ({
    showTools: false,
    isAddingMarker: false,
    isDeletingMarker: false,
    isEditingMarker: false,
    markers: JSON.parse(localStorage.getItem('markers')) || [], // Load saved markers from localStorage
  }),
  actions: {
    toggleTools() {
      this.showTools = !this.showTools;
    },
    toggleAddMarker() {
      this.isAddingMarker = !this.isAddingMarker;
      this.isDeletingMarker = false;
      this.isEditingMarker = false;
    },
    toggleDeleteMarker() {
      this.isDeletingMarker = !this.isDeletingMarker;
      this.isAddingMarker = false;
      this.isEditingMarker = false;
    },
    toggleEditMarker() {
      this.isEditingMarker = !this.isEditingMarker;
      this.isAddingMarker = false;
      this.isDeletingMarker = false;
    },
    addMarker(title, description, latlng) {
      const newMarker = { id: Date.now(), title, description, latlng } // Assign unique ID
      this.markers.push(newMarker);
      this.saveMarkersToStorage() // Save to localStorage
    },
    removeMarker(id) {
      this.markers = this.markers.filter((m) => m.id !== id)
      this.saveMarkersToStorage() // Save updated list
    },
    loadMarkers() {
      this.markers = JSON.parse(localStorage.getItem('markers')) || [];
    },
    updateMarker(id, newLatLng) {
      console.log("Update marker is called")
      const marker = this.markers.find((m) => m.id === id)
      if (marker) {
        marker.latlng = newLatLng
        this.saveMarkersToStorage()
        console.log("Marker is saved")
      }
    },
    saveMarkersToStorage() {
      localStorage.setItem('markers', JSON.stringify(this.markers))
    }
  },
});
