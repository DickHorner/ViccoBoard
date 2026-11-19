<template>
  <section class="app-form-grid">
    <h1>Einstellungen</h1>
    <Panel header="Bereiche">
      <div class="app-form-grid">
        <div v-for="card in settingsCards" :key="card.title" class="app-actions-row">
          <Button
            v-if="card.to"
            as="router-link"
            :to="card.to"
            :label="card.title"
            severity="secondary"
            outlined
            size="small"
          />
          <span v-else>{{ card.title }}</span>
          <Tag v-if="!card.to" :value="card.status" severity="secondary" />
        </div>
      </div>
    </Panel>
  </section>
</template>

<script setup lang="ts">
import Button from 'openvue/button'
import Panel from 'openvue/panel'
import Tag from 'openvue/tag'
import { settingsCards } from '../settings-sections'
</script>
