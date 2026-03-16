import { onMounted, ref } from 'vue'

import type { Sport } from '@viccoboard/core'

import { getSportBridge } from './useSportBridge'
import { useToast } from './useToast'

export function useTableManagementView() {
  const toast = useToast()

  const loading = ref(false)
  const saving = ref(false)
  const deleting = ref<string | null>(null)
  const loadError = ref('')

  const tables = ref<Sport.TableDefinition[]>([])
  const previewId = ref<string | null>(null)
  const showModal = ref(false)
  const editingTable = ref<Sport.TableDefinition | null>(null)
  const deleteTarget = ref<Sport.TableDefinition | null>(null)
  const fileInputRef = ref<HTMLInputElement | null>(null)
  const modalError = ref('')

  const form = ref({
    name: '',
    type: 'simple' as 'simple' | 'complex',
    description: ''
  })

  onMounted(async () => {
    await loadTables()
  })

  async function loadTables(): Promise<void> {
    loading.value = true
    loadError.value = ''
    try {
      const bridge = getSportBridge()
      tables.value = await bridge.tableDefinitionRepository.findAll()
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : 'Tabellen konnten nicht geladen werden.'
    } finally {
      loading.value = false
    }
  }

  function typeLabel(type: string): string {
    return type === 'complex' ? 'Komplex' : 'Einfach'
  }

  function sourceLabel(source: string): string {
    const map: Record<string, string> = {
      local: 'Lokal',
      imported: 'Importiert',
      downloaded: 'Heruntergeladen'
    }
    return map[source] ?? source
  }

  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('de-DE')
  }

  function formatEntryValue(value: unknown): string {
    if (value === null || value === undefined) return '—'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  function togglePreview(id: string): void {
    previewId.value = previewId.value === id ? null : id
  }

  function openCreateModal(): void {
    editingTable.value = null
    form.value = { name: '', type: 'simple', description: '' }
    modalError.value = ''
    showModal.value = true
  }

  function openEditModal(table: Sport.TableDefinition): void {
    editingTable.value = table
    form.value = {
      name: table.name,
      type: table.type,
      description: table.description ?? ''
    }
    modalError.value = ''
    showModal.value = true
  }

  function closeModal(): void {
    showModal.value = false
    editingTable.value = null
    modalError.value = ''
  }

  async function saveModal(): Promise<void> {
    saving.value = true
    modalError.value = ''
    try {
      const bridge = getSportBridge()
      if (editingTable.value) {
        await bridge.saveTableDefinitionUseCase.execute({
          id: editingTable.value.id,
          name: form.value.name,
          type: form.value.type,
          description: form.value.description || undefined,
          source: editingTable.value.source,
          dimensions: editingTable.value.dimensions,
          mappingRules: editingTable.value.mappingRules,
          entries: editingTable.value.entries
        })
        toast.success('Tabelle aktualisiert.')
      } else {
        await bridge.saveTableDefinitionUseCase.execute({
          name: form.value.name,
          type: form.value.type,
          description: form.value.description || undefined,
          source: 'local',
          dimensions: [],
          mappingRules: [],
          entries: []
        })
        toast.success('Tabelle erstellt.')
      }
      closeModal()
      await loadTables()
    } catch (error) {
      modalError.value = error instanceof Error ? error.message : 'Fehler beim Speichern.'
    } finally {
      saving.value = false
    }
  }

  function confirmDelete(table: Sport.TableDefinition): void {
    deleteTarget.value = table
  }

  async function executeDelete(): Promise<void> {
    if (!deleteTarget.value) return
    deleting.value = deleteTarget.value.id
    try {
      const bridge = getSportBridge()
      await bridge.deleteTableDefinitionUseCase.execute(deleteTarget.value.id)
      toast.success('Tabelle gelöscht.')
      deleteTarget.value = null
      await loadTables()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Fehler beim Löschen.')
    } finally {
      deleting.value = null
    }
  }

  function triggerImport(): void {
    fileInputRef.value?.click()
  }

  async function handleFileImport(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    input.value = ''

    const ext = file.name.split('.').pop()?.toLowerCase()
    try {
      if (ext === 'csv') {
        await importFromCsv(file)
      } else if (ext === 'json') {
        await importFromJson(file)
      } else {
        toast.error('Nur CSV- oder JSON-Dateien werden unterstützt.')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Import fehlgeschlagen.')
    }
  }

  function parseCsvRow(line: string): string[] {
    const cols: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (ch === ',' && !inQuotes) {
        cols.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    cols.push(current.trim())
    return cols
  }

  async function importFromCsv(file: File): Promise<void> {
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0)
    if (lines.length < 2) {
      toast.error('CSV-Datei enthält keine Daten.')
      return
    }

    const headers = parseCsvRow(lines[0])
    if (headers.length < 2) {
      toast.error('CSV muss mindestens zwei Spalten haben.')
      return
    }

    const dimNames = headers.slice(0, headers.length - 1)
    const valueHeader = headers[headers.length - 1]
    const entries: Sport.TableEntry[] = []
    const errors: string[] = []

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvRow(lines[i])
      if (cols.length !== headers.length) {
        errors.push(`Zeile ${i + 1}: falsche Spaltenanzahl`)
        continue
      }
      const key: Record<string, string> = {}
      dimNames.forEach((dim, idx) => { key[dim] = cols[idx] })
      const rawValue = cols[cols.length - 1]
      const value = rawValue !== '' && !isNaN(Number(rawValue)) ? Number(rawValue) : rawValue
      entries.push({ key, value })
    }

    if (errors.length > 0) {
      toast.error(`Import mit Fehlern: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? ' …' : ''}`)
      if (entries.length === 0) return
    }

    const dimensions: Sport.TableDimension[] = dimNames.map(name => ({
      name: name as Sport.TableDimension['name'],
      values: [...new Set(entries.map(entry => String(entry.key[name])))]
    }))

    const bridge = getSportBridge()
    await bridge.saveTableDefinitionUseCase.execute({
      name: file.name.replace(/\.[^.]+$/, ''),
      type: 'simple',
      source: 'imported',
      dimensions,
      mappingRules: [],
      entries,
      description: `Importiert aus ${file.name} (${valueHeader})`
    })

    toast.success(`${entries.length} Einträge importiert.`)
    await loadTables()
  }

  async function importFromJson(file: File): Promise<void> {
    const text = await file.text()
    let data: Record<string, unknown>
    try {
      data = JSON.parse(text) as Record<string, unknown>
    } catch {
      toast.error('Ungültige JSON-Datei.')
      return
    }

    const name = typeof data.name === 'string' ? data.name : file.name.replace(/\.[^.]+$/, '')
    const type: 'simple' | 'complex' = data.type === 'complex' ? 'complex' : 'simple'
    const entries = Array.isArray(data.entries) ? data.entries as Sport.TableEntry[] : []
    const dimensions = Array.isArray(data.dimensions) ? data.dimensions as Sport.TableDimension[] : []

    const bridge = getSportBridge()
    await bridge.saveTableDefinitionUseCase.execute({
      name,
      type,
      source: 'imported',
      description: typeof data.description === 'string' ? data.description : undefined,
      dimensions,
      mappingRules: Array.isArray(data.mappingRules) ? data.mappingRules as Sport.MappingRule[] : [],
      entries
    })

    toast.success(`Tabelle „${name}" importiert.`)
    await loadTables()
  }

  return {
    closeModal,
    confirmDelete,
    deleteTarget,
    deleting,
    editingTable,
    executeDelete,
    fileInputRef,
    formatDate,
    formatEntryValue,
    form,
    handleFileImport,
    loadError,
    loading,
    modalError,
    openCreateModal,
    openEditModal,
    previewId,
    saveModal,
    saving,
    showModal,
    sourceLabel,
    tables,
    togglePreview,
    triggerImport,
    typeLabel
  }
}
