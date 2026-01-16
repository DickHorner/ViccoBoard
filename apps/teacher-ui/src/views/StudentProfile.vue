<template>
  <div class="student-profile-view">
    <div class="page-header">
      <button class="back-button" @click="$router.back()">← Back</button>
      <h2>Student Profile</h2>
      <p class="page-description">View student information, attendance history, and performance.</p>
    </div>
    
    <div class="profile-layout">
      <section class="card profile-card">
        <div class="student-header">
          <div class="student-avatar">👤</div>
          <div class="student-info">
            <h3>Student Name</h3>
            <p>Loading student information...</p>
          </div>
        </div>
      </section>
      
      <section class="card">
        <h3>Attendance Record</h3>
        <div class="card-content">
          <p class="empty-state">No attendance records yet.</p>
        </div>
      </section>
      
      <section class="card">
        <h3>Performance Summary</h3>
        <div class="card-content">
          <p class="empty-state">No performance data available.</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
// Placeholder component
</script>

<style scoped>
.student-profile-view {
  max-width: 1200px;
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

.profile-layout {
  display: grid;
  gap: 1.5rem;
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
  margin: 0 0 1rem 0;
  border-bottom: 2px solid #667eea;
  padding-bottom: 0.5rem;
}

.profile-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.student-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.student-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  flex-shrink: 0;
}

.student-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  border: none;
  padding: 0;
}

.student-info p {
  margin: 0;
  opacity: 0.9;
  font-size: 0.95rem;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.empty-state {
  color: #999;
  font-style: italic;
  text-align: center;
  padding: 2rem 1rem;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .student-header {
    flex-direction: column;
    text-align: center;
  }
  
  .student-avatar {
    width: 64px;
    height: 64px;
    font-size: 2rem;
  }
}
</style>
