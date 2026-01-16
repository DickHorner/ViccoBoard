<template>
  <div class="attendance-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← Back</button>
      <h2>Attendance Entry</h2>
      <p class="page-description">Record student attendance for today's lesson.</p>
    </div>
    
    <div class="attendance-form">
      <section class="card">
        <h3>Attendance for: {{ currentDate }}</h3>
        
        <div class="form-section">
          <label for="class-select" class="form-label">Select Class:</label>
          <select id="class-select" class="form-select">
            <option value="">Choose a class...</option>
          </select>
        </div>
        
        <div class="card-content">
          <p class="empty-state">Select a class to begin recording attendance.</p>
          
          <div class="status-summary">
            <div class="status-item status-present">
              <span class="status-label">Present</span>
              <span class="status-count">0</span>
            </div>
            <div class="status-item status-absent">
              <span class="status-label">Absent</span>
              <span class="status-count">0</span>
            </div>
            <div class="status-item status-late">
              <span class="status-label">Late</span>
              <span class="status-count">0</span>
            </div>
            <div class="status-item status-excused">
              <span class="status-label">Excused</span>
              <span class="status-count">0</span>
            </div>
          </div>
          
          <button class="btn-primary" disabled>
            Save Attendance
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const currentDate = computed(() => {
  return new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
})
</script>

<style scoped>
.attendance-view {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.back-button {
  background: transparent;
  border: none;
  color: #667eea;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem 0;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  min-height: 44px; /* Touch target minimum */
  transition: all 0.2s ease;
}

.back-button:hover {
  color: #5568d3;
  transform: translateX(-4px);
}

.page-header h2 {
  font-size: 2rem;
  color: #333;
  margin: 0 0 0.5rem 0;
}

.page-description {
  color: #666;
  font-size: 1rem;
  margin: 0;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.card h3 {
  font-size: 1.25rem;
  color: #333;
  margin: 0 0 1.5rem 0;
  border-bottom: 2px solid #667eea;
  padding-bottom: 0.5rem;
}

.form-section {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.form-select {
  width: 100%;
  padding: 0.875rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  min-height: 44px; /* Touch target minimum */
  transition: all 0.2s ease;
}

.form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.empty-state {
  color: #999;
  font-style: italic;
  text-align: center;
  padding: 2rem 1rem;
}

.status-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  padding: 1rem 0;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 8px;
  background: #f8f9fa;
}

.status-present {
  border-left: 4px solid #4caf50;
}

.status-absent {
  border-left: 4px solid #f44336;
}

.status-late {
  border-left: 4px solid #ff9800;
}

.status-excused {
  border-left: 4px solid #2196f3;
}

.status-label {
  font-size: 0.875rem;
  color: #666;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-count {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
}

.btn-primary {
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px; /* Touch target minimum */
}

.btn-primary:hover:not(:disabled) {
  background: #5568d3;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .status-summary {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
