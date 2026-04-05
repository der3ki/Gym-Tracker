<template>
  <nav class="bottom-nav" aria-label="Navegación principal">
    <router-link :to="{ name: 'routines' }">
      <span class="nav-icon">&#128170;</span>
      Rutinas
    </router-link>
    <router-link :to="{ name: 'profile' }">
      <span class="nav-icon">&#128100;</span>
      Perfil
    </router-link>
  </nav>
</template>
