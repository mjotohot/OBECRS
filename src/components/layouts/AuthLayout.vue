<script lang="ts" setup>
import bgImg from '../../assets/images/hero.jpg'
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center relative overflow-hidden"
    :style="{
      backgroundImage: `url(${bgImg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }"
  >
    <div class="absolute inset-0 bg-black/40 pointer-events-none"></div>
    <div class="w-full max-w-md relative z-10">
      <slot></slot>
    </div>
  </div>
</template>
