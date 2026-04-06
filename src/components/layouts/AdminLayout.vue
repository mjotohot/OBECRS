<script setup lang="ts">
import { ref } from 'vue'
import Sidebar from '@/components/navigations/Sidebar.vue'

const sidebarOpen = ref(true)
</script>

<template>
  <div class="flex h-screen bg-gray-50">
    <Sidebar :isOpen="sidebarOpen" @toggle="sidebarOpen = !sidebarOpen" />

    <main
      :class="[
        'flex flex-1 flex-col overflow-auto transition-all duration-300',
        sidebarOpen ? 'ml-64' : 'ml-20',
      ]"
    >
      <div class="bg-base-200 p-8">
        <slot></slot>
      </div>
    </main>
  </div>
</template>
