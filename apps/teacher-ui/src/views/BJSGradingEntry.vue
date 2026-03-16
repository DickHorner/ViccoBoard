<template>
  <div class="bjs-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← {{ t('COMMON.back') }}</button>
      <h2>{{ t('BUNDESJUGENDSPIELE.info-titel') }}</h2>
      <p class="info-text">{{ t('BUNDESJUGENDSPIELE.info1') }}</p>
      <p class="info-text">{{ t('BUNDESJUGENDSPIELE.info2') }}</p>
      <a :href="t('BUNDESJUGENDSPIELE.link')" target="_blank" class="info-link">
        {{ t('BUNDESJUGENDSPIELE.link') }}
      </a>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>{{ t('COMMON.loading') }}</p>
    </div>

    <div v-else class="content">
      <!-- Discipline Inputs-->
      <section class="card">
        <h3>{{ t('BUNDESJUGENDSPIELE.disziplinen-einzeln') }}</h3>
        
        <div class="table-wrapper">
          <table class="grading-table">
            <thead>
              <tr>
                <th>{{ t('SCHUELER.name') }}</th>
                <th>{{ t('BUNDESJUGENDSPIELE.sprint') }}</th>
                <th>{{ t('BUNDESJUGENDSPIELE.sprung') }}</th>
                <th>{{ t('BUNDESJUGENDSPIELE.wurf') }}</th>
                <th>{{ t('BUNDESJUGENDSPIELE.ausdauer') }}</th>
                <th>{{ t('BUNDESJUGENDSPIELE.punkte') }}</th>
                <th>Urkunde</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in students" :key="student.id">
                <td class="student-name">
                  {{ student.firstName }} {{ student.lastName }}
                </td>
                <td>
                  <input 
                    type="number" 
                    v-model.number="performances[student.id].sprint"
                    class="perf-input"
                    step="0.01"
                    placeholder="Zeit (s)"
                    @input="calculatePoints(student.id)"
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    v-model.number="performances[student.id].sprung"
                    class="perf-input"
                    step="0.01"
                    placeholder="Weite (m)"
                    @input="calculatePoints(student.id)"
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    v-model.number="performances[student.id].wurf"
                    class="perf-input"
                    step="0.01"
                    placeholder="Weite (m)"
                    @input="calculatePoints(student.id)"
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    v-model.number="performances[student.id].ausdauer"
                    class="perf-input"
                    step="0.01"
                    placeholder="Zeit (min)"
                    @input="calculatePoints(student.id)"
                  />
                </td>
                <td class="points-cell">
                  <strong>{{ totalPoints[student.id] || 0 }}</strong>
                </td>
                <td class="certificate-cell">
                  <span 
                    v-if="getCertificateType(student.id)"
                    class="certificate-badge"
                    :class="`cert-${getCertificateType(student.id)}`"
                  >
                    {{ getCertificateLabel(getCertificateType(student.id)) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Summary -->
      <section class="card">
        <h3>Übersicht</h3>
        <div class="summary-stats">
          <div class="stat-item">
            <div class="stat-label">{{ t('BUNDESJUGENDSPIELE.ehrenurkunde') }}</div>
            <div class="stat-value">{{ getCertificateCount('ehrenurkunde') }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">{{ t('BUNDESJUGENDSPIELE.siegerurkunde') }}</div>
            <div class="stat-value">{{ getCertificateCount('siegerurkunde') }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">{{ t('BUNDESJUGENDSPIELE.teilnahmeurkunde') }}</div>
            <div class="stat-value">{{ getCertificateCount('teilnahmeurkunde') }}</div>
          </div>
        </div>
      </section>

      <!-- Actions -->
      <section class="card">
        <div class="action-buttons">
          <button 
            class="btn-primary"
            @click="saveAll"
            :disabled="saving"
          >
            {{ saving ? t('COMMON.syncing') : t('COMMON.save') }}
          </button>
          <button
            class="btn-primary"
            @click="exportPdf"
            :disabled="exporting"
          >
            {{ exporting ? t('BUNDESJUGENDSPIELE.pdf-erstelle') : t('BUNDESJUGENDSPIELE.pdf-export') }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useSportBridge } from '../composables/useSportBridge';
import { useStudents } from '../composables/useStudentsBridge';
import { useToast } from '../composables/useToast';
import type { Student } from '@viccoboard/core';
import type { BJSOverviewReportEntry } from '@viccoboard/sport';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { SportBridge, gradeCategories, performanceEntries } = useSportBridge();
const { repository: studentRepository } = useStudents();
const toast = useToast();

const categoryId = route.params.id as string;
const loading = ref(true);
const saving = ref(false);
const exporting = ref(false);
const students = ref<Student[]>([]);
const performances = reactive<Record<string, any>>({});
const totalPoints = reactive<Record<string, number>>({});
const gradingTable = ref<any>(null);
const bjsConfig = ref<any>(null);

onMounted(async () => {
  await loadData();
});

async function loadData() {
  loading.value = true;
  try {
    const category = await gradeCategories.value?.findById(categoryId);
    if (!category) {
      toast.error('Kategorie nicht gefunden');
      router.back();
      return;
    }

    bjsConfig.value = category.configuration;

    students.value = await studentRepository.value?.findByClassGroup(category.classGroupId) ?? [];

    // Load grading table if referenced in config
    if (bjsConfig.value?.gradingTable) {
      gradingTable.value = await SportBridge.value?.tableDefinitionRepository.findById(bjsConfig.value.gradingTable);
    }

    // Initialize performance objects
    students.value.forEach(student => {
      performances[student.id] = {
        sprint: null,
        sprung: null,
        wurf: null,
        ausdauer: null
      };
      totalPoints[student.id] = 0;
    });

    // Load existing entries (if any)
    const entries = await performanceEntries.value?.findByCategory(categoryId) ?? [];
    entries.forEach(entry => {
      if (entry.measurements) {
        performances[entry.studentId] = {
          sprint: entry.measurements.sprint || null,
          sprung: entry.measurements.sprung || null,
          wurf: entry.measurements.wurf || null,
          ausdauer: entry.measurements.ausdauer || null
        };
        calculatePoints(entry.studentId);
      }
    });
  } catch (error) {
    toast.error('Fehler beim Laden der Daten');
  } finally {
    loading.value = false;
  }
}

function calculatePoints(studentId: string) {
  const perf = performances[studentId];
  if (!perf) return;

  // If we have a grading table, use proper BJS scoring via the service
  if (gradingTable.value && bjsConfig.value?.disciplines) {
    try {
      const service = SportBridge.value?.bjsGradingService;
      if (service) {
        const result = service.calculateScore({
          disciplines: bjsConfig.value.disciplines,
          performances: perf,
          table: gradingTable.value,
          context: {}
        });

        totalPoints[studentId] = result.totalPoints;
        return;
      }
    } catch (error) {
    }
  }

  // Fallback: simplified point calculation (if no table available)
  // This should be replaced with actual table lookup
  let points = 0;

  if (perf.sprint > 0) {
    points += Math.max(0, Math.round(200 - perf.sprint * 10));
  }

  if (perf.sprung > 0) {
    points += Math.round(perf.sprung * 50);
  }

  if (perf.wurf > 0) {
    points += Math.round(perf.wurf * 30);
  }

  if (perf.ausdauer > 0) {
    points += Math.max(0, Math.round(300 - perf.ausdauer * 20));
  }

  totalPoints[studentId] = points;
}

function getCertificateType(studentId: string): string | null {
  const points = totalPoints[studentId] || 0;
  
  // Official BJS thresholds (simplified - actual values depend on age/gender)
  if (points >= 1000) return 'ehrenurkunde';  // Honor certificate
  if (points >= 600) return 'siegerurkunde';   // Winner certificate
  if (points > 0) return 'teilnahmeurkunde';   // Participation certificate
  return null;
}

function getCertificateLabel(type: string | null): string {
  if (!type) return '';
  const labels: Record<string, string> = {
    ehrenurkunde: t('BUNDESJUGENDSPIELE.ehrenurkunde'),
    siegerurkunde: t('BUNDESJUGENDSPIELE.siegerurkunde'),
    teilnahmeurkunde: t('BUNDESJUGENDSPIELE.teilnahmeurkunde')
  };
  return labels[type] || '';
}

function getCertificateCount(type: string): number {
  return students.value.filter(s => getCertificateType(s.id) === type).length;
}

async function saveAll() {
  saving.value = true;
  try {
    const savePromises: Promise<any>[] = [];
    
    for (const student of students.value) {
      const perf = performances[student.id];
      const points = totalPoints[student.id];
      const certType = getCertificateType(student.id);
      
      if (!perf || points === 0 || !certType) continue;
      
      const measurements = {
        sprint: perf.sprint,
        sprung: perf.sprung,
        wurf: perf.wurf,
        ausdauer: perf.ausdauer,
        totalPoints: points,
        certificateType: certType
      };
      
      savePromises.push(
        SportBridge.value?.recordGradeUseCase.execute({
          studentId: student.id,
          categoryId: categoryId,
          measurements,
          calculatedGrade: certType,
          metadata: { timestamp: new Date().toISOString() }
        }) ?? Promise.resolve()
      );
    }
    
    await Promise.all(savePromises);
    toast.success(t('COMMON.success'));
  } catch (error) {
    toast.error('Fehler beim Speichern');
  } finally {
    saving.value = false;
  }
}

async function exportPdf() {
  exporting.value = true;
  try {
    const service = SportBridge.value?.bjsGradingService;
    if (!service) {
      throw new Error('BJSGradingService not available');
    }

    const disciplineLabels: Record<string, string> = {
      sprint: t('BUNDESJUGENDSPIELE.sprint'),
      sprung: t('BUNDESJUGENDSPIELE.sprung'),
      wurf: t('BUNDESJUGENDSPIELE.wurf'),
      ausdauer: t('BUNDESJUGENDSPIELE.ausdauer')
    };

    const entries: BJSOverviewReportEntry[] = students.value.map(student => {
      const perf = performances[student.id] || {};
      const points = totalPoints[student.id] || 0;
      const certType = getCertificateType(student.id) as BJSOverviewReportEntry['certificateType'];

      // Compute per-discipline points via the service when a grading table is available
      let disciplinePointMap: Record<string, number> = {};
      if (gradingTable.value && bjsConfig.value?.disciplines) {
        try {
          const result = service.calculateScore({
            disciplines: bjsConfig.value.disciplines,
            performances: perf,
            table: gradingTable.value,
            context: {}
          });
          for (const dr of result.disciplineResults) {
            disciplinePointMap[dr.disciplineId] = dr.points;
          }
        } catch {
          // Fallback: leave per-discipline points at 0
        }
      }

      const disciplines = (['sprint', 'sprung', 'wurf', 'ausdauer'] as const)
        .filter(key => perf[key] != null && perf[key] > 0)
        .map(key => ({
          name: disciplineLabels[key] || key,
          performance: String(perf[key]),
          points: disciplinePointMap[key] ?? 0
        }));

      return {
        studentName: `${student.firstName} ${student.lastName}`,
        disciplines,
        totalPoints: points,
        certificateType: certType
      };
    });

    const pdfBytes = await service.generateOverviewPdf({
      title: t('BUNDESJUGENDSPIELE.info-titel'),
      generatedAt: new Date(),
      entries
    });

    const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BJS-${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(t('EXPORT.toast-erfolgreich'));
  } catch (error) {
    console.error('Failed to export PDF:', error);
    toast.error(t('EXPORT.toast-fehler'));
  } finally {
    exporting.value = false;
  }
}
</script>

<style scoped src="./BJSGradingEntry.css"></style>
