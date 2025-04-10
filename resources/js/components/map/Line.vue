<script setup>
import { useLineToolStore } from '@/stores/lineToolStore'

const lineToolStore = useLineToolStore()
</script>

<template>
  <div>
    <button
      class="line btn"
      :class="{ active: lineToolStore.showTools }"
      @click="lineToolStore.toggleTools"
    >
      <v-icon name="io-analytics" />
    </button>

    <div v-if="lineToolStore.showTools" class="line-tools">
      <button
        class="add btn"
        :class="{ active: lineToolStore.isAddingLine }"
        @click="lineToolStore.toggleAddLine"
      >
        <i class="pi pi-plus"></i>
      </button>
      <button class="save btn"><i class="pi pi-bookmark"></i></button>
      <button
        class="delete btn"
        :class="{ active: lineToolStore.isDeletingLine }"
        @click="lineToolStore.toggleDeleteLine"
      >
        <i class="pi pi-trash"></i>
      </button>
      <button
        class="edit btn"
        :class="{ active: lineToolStore.isEditingLine }"
        @click="lineToolStore.toggleEditLine"
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

.line {
  position: absolute;
  z-index: 1;
  top: 32px;
  left: 6px;
}

.line-tools {
  display: flex;
  position: absolute;
  gap: 5px;
  position: absolute;
  top: 32px;
  left: 64px;
  z-index: 1;
}
</style>
