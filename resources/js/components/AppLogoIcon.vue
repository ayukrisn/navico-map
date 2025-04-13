<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
const logoSrc = '/assets/navico-logo.svg';

defineOptions({
    inheritAttrs: false,
});

interface Props {
    className?: HTMLAttributes['class'];
}

defineProps<Props>();
</script>

<template>
    <img :src="logoSrc" :class="className" v-bind="$attrs" />
</template>
