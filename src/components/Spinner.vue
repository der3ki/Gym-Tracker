<template>
  <span class="spinner" :style="sizeStyle" role="status" aria-label="Cargando"></span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    size?: number
  }>(),
  { size: 14 },
)

const sizeStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  borderWidth: `${Math.max(2, Math.round(props.size / 8))}px`,
}))
</script>

<style scoped>
.spinner {
  display: inline-block;
  border-style: solid;
  border-color: currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spinner-rotate 0.7s linear infinite;
  vertical-align: -2px;
  margin-right: 6px;
  opacity: 0.85;
}

@keyframes spinner-rotate {
  to {
    transform: rotate(360deg);
  }
}
</style>
