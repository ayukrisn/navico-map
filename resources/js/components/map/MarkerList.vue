<script setup>
import { useMapStore } from '@/stores/map';
import { computed } from 'vue';
import { usePage } from '@inertiajs/vue3';

const mapStore = useMapStore();
const page = usePage();

const props = defineProps({
  features: {
    type: Array,
    required: true,
    default: () => []
  }
});

const isDarkMode = computed(() => page.props.theme === 'dark');

const handleMarkerClick = (feature) => {
  mapStore.requestFlyTo(feature.id);
};
</script>

<template>
  <div class="marker-list" :class="{ 'dark-mode': isDarkMode }">
    <h3 class="title">Saved Markers</h3>
    <ul class="marker-items">
      <li 
        v-for="feature in features" 
        :key="feature.id"
        class="marker-item"
        @click="handleMarkerClick(feature)"
      >
        <div class="marker-title">
          {{ feature.properties?.title || `Marker ${feature.id}` }}
        </div>
        <div 
          v-if="feature.properties?.description" 
          class="marker-description"
          :title="feature.properties.description"
        >
          {{ feature.properties.description }}
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
/* Light mode (default) */
.marker-list {
  padding: 0.75rem;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #1f2937; /* gray-800 */
}

small {
    color: #1f2937;
}

.marker-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.marker-item {
  padding: 0.75rem;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  background-color: white;
  cursor: pointer;
}

.marker-item:hover {
  background-color: #f3f4f6; /* gray-100 */
}

.marker-title {
  font-weight: 500;
  color: #111827; /* gray-900 */
}

.marker-description {
  font-size: 0.875rem;
  color: #6b7280; /* gray-500 */
  margin-top: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Dark mode */
.marker-list.dark-mode {
  background: #1f2937; /* gray-800 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.dark-mode .title {
  color: #f9fafb; /* gray-50 */
}

.dark-mode small {
 color: #f9fafb;
}

.dark-mode .marker-item {
  background-color: #374151; /* gray-700 */
}

.dark-mode .marker-item:hover {
  background-color: #4b5563; /* gray-600 */
}

.dark-mode .marker-title {
  color: #f9fafb; /* gray-50 */
}

.dark-mode .marker-description {
  color: #9ca3af; /* gray-400 */
}
</style>