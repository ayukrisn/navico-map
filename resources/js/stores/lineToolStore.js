// stores/lineToolStore.js
import { defineStore } from 'pinia';

export const useLineToolStore = defineStore('lineTool', {
  state: () => ({
    showTools: false,
    isAddingLine: false,
    isDeletingLine: false,
    isEditingLine: false,
  }),
  actions: {
    toggleTools() {
      this.showTools = !this.showTools;
    },
    toggleAddLine() {
      this.isAddingLine = !this.isAddingLine;
      this.isDeletingLine = false;
      this.isEditingLine = false;
    },
    toggleDeleteLine() {
      this.isDeletingLine = !this.isDeletingLine;
      this.isAddingLine = false;
      this.isEditingLine = false;
    },
    toggleEditLine() {
      this.isEditingLine = !this.isEditingLine;
      this.isAddingLine = false;
      this.isDeletingLine = false;
    },
  },
});
