<template>
  <section class="support-tip-library">
    <header class="page-header">
      <div>
        <h1>Fördertipps</h1>
        <p>Persönliche Tippdatenbank für Korrektur und Rückmeldebögen.</p>
      </div>
      <button class="btn-primary" @click="startCreate">Neuen Tipp anlegen</button>
    </header>

    <div class="toolbar">
      <input v-model="query" type="search" placeholder="Titel, Beschreibung oder Tag suchen …" />
      <select v-model="categoryFilter"><option value="">Alle Kategorien</option><option v-for="category in categories" :key="category" :value="category">{{ category }}</option></select>
      <select v-model="sortBy"><option value="usage">Häufig verwendet</option><option value="weight">Gewichtung</option><option value="title">Titel</option><option value="recent">Zuletzt geändert</option></select>
    </div>

    <p v-if="loading">Fördertipps werden geladen …</p>
    <p v-else-if="filteredTips.length === 0" class="empty">Noch keine passenden Fördertipps vorhanden.</p>
    <div v-else class="tip-grid">
      <article v-for="tip in filteredTips" :key="tip.id" class="tip-card">
        <div class="tip-card-header"><div><h2>{{ tip.title }}</h2><p>{{ tip.category || 'Ohne Kategorie' }} · {{ tip.usageCount }}× verwendet</p></div><span>Prio {{ tip.priority }} · Gewicht {{ tip.weight }}</span></div>
        <p>{{ tip.shortDescription }}</p>
        <p v-if="tip.tags.length" class="tags">{{ tip.tags.join(' · ') }}</p>
        <ul v-if="tip.links.length"><li v-for="link in tip.links" :key="link.url"><a :href="link.url" target="_blank" rel="noopener">{{ link.title }}</a></li></ul>
        <div class="card-actions"><button @click="edit(tip)">Bearbeiten</button><button @click="showQr(tip)">QR-Code</button><button class="danger" @click="remove(tip)">Löschen</button></div>
      </article>
    </div>

    <div v-if="editing" class="dialog-backdrop" @click.self="editing = null">
      <form class="dialog" @submit.prevent="save">
        <h2>{{ editing.id ? 'Fördertipp bearbeiten' : 'Fördertipp anlegen' }}</h2>
        <label>Titel<input v-model.trim="editing.title" required maxlength="200" /></label>
        <label>Kurzbeschreibung<textarea v-model.trim="editing.shortDescription" required maxlength="500" rows="4"></textarea></label>
        <div class="form-grid"><label>Kategorie<input v-model.trim="editing.category" /></label><label>Tags (kommagetrennt)<input v-model="tagsText" /></label><label>Priorität<input v-model.number="editing.priority" type="number" min="0" max="10" /></label><label>Gewichtung<input v-model.number="editing.weight" type="number" min="0" max="10" /></label></div>
        <fieldset><legend>Links (max. 3)</legend><div v-for="(link, index) in editing.links" :key="index" class="link-row"><input v-model.trim="link.title" placeholder="Linktitel" required /><input v-model.trim="link.url" type="url" placeholder="https://…" required /><button type="button" @click="editing!.links.splice(index, 1)">Entfernen</button></div><button v-if="editing.links.length < 3" type="button" @click="editing.links.push({ title: '', url: '' })">Link hinzufügen</button></fieldset>
        <p v-if="formError" class="error">{{ formError }}</p>
        <div class="card-actions"><button type="button" @click="editing = null">Abbrechen</button><button class="btn-primary" type="submit">Speichern</button></div>
      </form>
    </div>
    <div v-if="qrTip" class="dialog-backdrop" @click.self="qrTip = null"><div class="dialog qr-dialog"><h2>{{ qrTip.title }}</h2><img :src="SupportTipManagementService.generateQRCode(qrTip)" alt="QR-Code für diesen Fördertipp" /><button @click="qrTip = null">Schließen</button></div></div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Exams } from '@viccoboard/core'
import { SupportTipManagementService } from '@viccoboard/exams'
import { useExamsBridge } from '../composables/useExamsBridge'
import { useToast } from '../composables/useToast'

type EditableTip = Omit<Exams.SupportTip, 'id' | 'createdAt' | 'lastModified' | 'usageCount'> & { id?: string }
const { supportTipRepository } = useExamsBridge()
const toast = useToast()
const tips = ref<Exams.SupportTip[]>([])
const loading = ref(true)
const query = ref('')
const categoryFilter = ref('')
const sortBy = ref<'usage' | 'weight' | 'title' | 'recent'>('usage')
const editing = ref<EditableTip | null>(null)
const tagsText = ref('')
const formError = ref('')
const qrTip = ref<Exams.SupportTip | null>(null)
const categories = computed(() => [...new Set(tips.value.map((tip) => tip.category).filter(Boolean) as string[])].sort())
const filteredTips = computed(() => SupportTipManagementService.searchSupportTips(tips.value, query.value, { category: categoryFilter.value || undefined, sortBy: sortBy.value }))

async function load(): Promise<void> { tips.value = await supportTipRepository?.findAll() ?? []; loading.value = false }
function startCreate(): void { editing.value = { title: '', shortDescription: '', category: '', tags: [], links: [], priority: 0, weight: 1 }; tagsText.value = ''; formError.value = '' }
function edit(tip: Exams.SupportTip): void { editing.value = { ...tip, category: tip.category ?? '', tags: [...tip.tags], links: tip.links.map((link) => ({ ...link })) }; tagsText.value = tip.tags.join(', '); formError.value = '' }
function showQr(tip: Exams.SupportTip): void { qrTip.value = tip }
async function save(): Promise<void> {
  if (!editing.value || !supportTipRepository) return
  const draft = { ...editing.value, category: editing.value.category || undefined, tags: tagsText.value.split(',').map((tag) => tag.trim()).filter(Boolean) }
  const existing = editing.value.id ? tips.value.find((tip) => tip.id === editing.value!.id) : undefined
  const candidate = existing ? SupportTipManagementService.updateSupportTip(existing, draft) : SupportTipManagementService.createSupportTip(draft.title, draft.shortDescription, draft)
  const validation = SupportTipManagementService.validateSupportTip(candidate)
  if (!validation.valid) { formError.value = validation.errors.join(' '); return }
  if (existing) await supportTipRepository.update(existing.id, candidate); else await supportTipRepository.create(candidate)
  editing.value = null; await load(); toast.success('Fördertipp gespeichert.')
}
async function remove(tip: Exams.SupportTip): Promise<void> { if (!supportTipRepository || !window.confirm(`„${tip.title}“ wirklich löschen?`)) return; await supportTipRepository.delete(tip.id); await load(); toast.success('Fördertipp gelöscht.') }
onMounted(load)
</script>

<style scoped>
.support-tip-library { display: grid; gap: 1.25rem; } .page-header,.toolbar,.tip-card-header,.card-actions,.form-grid,.link-row { display:flex; gap:.75rem; align-items:center; } .page-header,.tip-card-header { justify-content:space-between; } .toolbar { flex-wrap:wrap; } .toolbar input { min-width:18rem; } input,textarea,select { padding:.55rem; border:1px solid #bcccdc; border-radius:4px; } .tip-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:1rem; } .tip-card,.dialog { padding:1rem; border:1px solid #d9e2ec; border-radius:8px; background:#fff; } .tip-card h2,.tip-card p { margin:.2rem 0; } .tip-card-header span,.tags { color:#52606d; font-size:.85rem; } .card-actions { margin-top:1rem; flex-wrap:wrap; } button { padding:.5rem .75rem; cursor:pointer; } .btn-primary { background:#1d4ed8; color:#fff; border:1px solid #1d4ed8; border-radius:4px; } .danger,.error { color:#b42318; } .dialog-backdrop { position:fixed; inset:0; z-index:20; display:grid; place-items:center; padding:1rem; background:rgba(15,23,42,.5); } .dialog { width:min(680px,100%); display:grid; gap:.75rem; max-height:90vh; overflow:auto; } .dialog label { display:grid; gap:.3rem; } .form-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); } .link-row input { min-width:0; flex:1; } .qr-dialog { justify-items:center; } .qr-dialog img { width:220px; height:220px; } .empty { color:#52606d; }
</style>
