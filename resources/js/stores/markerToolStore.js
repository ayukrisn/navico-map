// stores/markerToolStore.js
import { defineStore } from 'pinia';

export const useMarkerToolStore = defineStore('markerTool', {
  state: () => ({
    showTools: false,
    isAddingMarker: false,
    isDeletingMarker: false,
    isEditingMarker: false,
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
  },
});
