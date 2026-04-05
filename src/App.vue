<template>
  <router-view />
  <BottomNav v-if="showNav" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BottomNav from '@/components/BottomNav.vue'

const route = useRoute()
const showNav = computed(() => route.name !== 'auth')
</script>
