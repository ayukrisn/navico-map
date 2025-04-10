<script setup>
import { ref } from 'vue'
import { useMarkerToolStore } from '@/stores/markerToolStore'

const markerToolStore = useMarkerToolStore()
</script>

<template>
  <div>
    <button
      class="marker btn"
      :class="{ active: markerToolStore.showTools }"
      @click="markerToolStore.toggleTools"
    >
      <i class="pi pi-map-marker"></i>
    </button>

    <div v-if="markerToolStore.showTools" class="marker-tools">
      <button
        class="add btn"
        :class="{ active: markerToolStore.isAddingMarker }"
        @click="markerToolStore.toggleAddMarker"
      >
        <i class="pi pi-plus"></i>
      </button>
      <button class="save btn"><i class="pi pi-bookmark"></i></button>
      <button
        class="delete btn"
        :class="{ active: markerToolStore.isDeletingMarker }"
        @click="markerToolStore.toggleDeleteMarker"
      >
        <i class="pi pi-trash"></i>
      </button>
      <button
        class="edit btn"
        :class="{ active: markerToolStore.isEditingMarker }"
        @click="markerToolStore.toggleEditMarker"
      >
        <i class="pi pi-arrows-alt"></i>
      </button>
    </div>
  </div>
</template>

<style scoped>
.active {
  background-color: #006a71; /* Green when active */
  color: white;
}

.marker {
  position: absolute;
  z-index: 1;
  top: 6px;
  left: 6px;
}

.marker-tools {
  display: flex;
  position: absolute;
  gap: 5px;
  position: absolute;
  top: 6px;
  left: 64px;
  z-index: 1;
}
</style>
