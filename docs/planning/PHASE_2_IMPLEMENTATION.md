# Phase 2 UI Framework Decision & Implementation Plan

**Decision Date:** January 16, 2026  
**Status:** Ready for execution  
**Estimated Duration:** 1-2 weeks

---

## Executive Summary

**Recommendation: Vue 3 (Web-First)**

**Rationale:**
1. ✅ Scaffold already exists (3-day head start)
2. ✅ TypeScript support excellent
3. ✅ Matches offline-first data model
4. ✅ Simpler for team learning
5. ✅ Deployable immediately (no build step required)
6. ✅ iPadOS Safari compatible (no File API issues)

**Deployment:** Static HTML + CSS + JS (works offline, no server)

---

## Framework Comparison Deep Dive

### Option A: Vue 3 ✅ RECOMMENDED

**Current State:**
- Scaffold exists: `apps/teacher-ui/`
- Vite config working: `vite.config.ts`
- TypeScript configs present
- Main.ts ready for mounting
- Empty App.vue component

**Advantages:**
1. **Fastest Start:** Scaffold saves ~3 days
2. **Type Safety:** Full TypeScript with strict mode
3. **Reactivity:** Composition API matches our reactive data model
4. **Learning:** Agents familiar with TypeScript can learn Vue quickly
5. **Performance:** Small bundle size, fast startup
6. **Offline:** No special requirements, works with IndexedDB
7. **Deployment:** `npm run build` → static files → deploy anywhere

**Disadvantages:**
1. **Web-Only:** Not native iOS/Android (doesn't matter for Phase 2-9)
2. **SPA Complexity:** Routing and state management needed
3. **Testing:** Vue component testing requires setup

**Ecosystem:**
- Routing: Vue Router (official)
- State: Pinia (official, simpler than Vuex)
- UI Components: Headless UI, shadcn-vue, or custom
- HTTP: Fetch API (no external library needed)

**Getting Started:**
```bash
cd apps/teacher-ui
npm install  # Install dependencies from package.json
npm run dev  # Start dev server (Vite)
# Visit: http://localhost:5173
```

**Phase 2 Build Plan:**
1. Set up Vue Router for navigation
2. Create layout shell (header, sidebar, main content)
3. Build 5 core screens:
   - Dashboard (class list)
   - Class Detail (students, lessons)
   - Student Profile
   - Attendance Entry
   - Grading Entry (placeholder for Phase 3)
4. Wire to existing use cases from @viccoboard/sport
5. Test offline functionality
6. Deploy to static host

---

### Option B: React Native + Expo

**Current State:** None (would need to create new app)

**Installation:** ~3 days (project setup, learning, initial screens)

**Advantages:**
1. **Cross-Platform:** Same code → iOS, Android, web
2. **Native Feel:** Uses native components (better on iPad)
3. **Offline:** Excellent offline-first libraries (React Query, SQLite)
4. **Ecosystem:** Massive (everything is a library)
5. **Mobile-First:** Designed for touch from day one

**Disadvantages:**
1. **Learning Curve:** React patterns different from Vue (Hooks, functional components)
2. **Setup Time:** Expo CLI, emulator/device setup takes time
3. **Build Complexity:** More moving parts (Metro bundler, native modules)
4. **Deployment:** App Store/Google Play process
5. **Bundle Size:** Larger than web (70-100MB compiled app)

**Ecosystem:**
- Routing: React Navigation
- State: Redux or Zustand
- HTTP: Fetch API or axios
- Storage: React Native AsyncStorage or SQLite

**Getting Started:**
```bash
npx create-expo-app viccoboard-rn
cd viccoboard-rn
expo run:ios  # Run on simulator
```

**When to Choose:** Phase 10+ (after web version proves features)

---

### Option C: Flutter

**Current State:** None (would need to completely rewrite)

**Installation:** ~5 days (Dart learning, project setup)

**Advantages:**
1. **Best iPad Support:** Native animations, responsive design
2. **Hot Reload:** Fastest iteration
3. **Single Codebase:** iOS, Android, web from one language
4. **Performance:** Compiled to native (blazing fast)
5. **Offline:** Excellent offline support via Hive/Drift

**Disadvantages:**
1. **Dart Language:** Not TypeScript (lose type skills, new learning)
2. **Unfamiliar to Team:** No existing Dart expertise
3. **Ecosystem Smaller:** Fewer libraries than React/Vue
4. **Build Process:** Complex Dart/native compilation
5. **Skill Transfer:** Can't use learned skills elsewhere

**When to Choose:** Only if you want "the best" iPad experience and have Dart expertise

---

## Recommendation Analysis

### Scoring Framework (100 points)

| Criterion | Weight | Vue 3 | React Native | Flutter |
|-----------|--------|-------|--------------|---------|
| Existing Scaffold | 20 pts | 20 | 0 | 0 |
| Team TypeScript Skills | 15 pts | 15 | 12 | 0 |
| Time to First Screen | 15 pts | 15 | 10 | 5 |
| iPad/Safari Support | 20 pts | 14 | 16 | 20 |
| Offline-First Capability | 15 pts | 13 | 15 | 15 |
| Deployment Simplicity | 15 pts | 15 | 8 | 5 |
| **TOTAL** | **100** | **92** | **61** | **45** |

### Recommendation: Vue 3 ✅

**Score: 92/100** — Best overall for Phase 2-9

**Decision Rationale:**
1. Existing scaffold is 3-day advantage
2. Team can learn Vue + TypeScript simultaneously
3. Web deployment validates features quickly
4. Offline works natively with IndexedDB
5. Can iterate on features fast
6. Optional React Native port in Phase 10

**Alternative Path:**
- Phase 2-9: Build feature-complete Vue web app
- Phase 10: Evaluate React Native port for native mobile
- Choose based on teacher feedback and budget

---

## Phase 2 Implementation Plan

### Milestone P2-1: Vue Setup & Navigation (Days 1-2)

**Tasks:**
1. Install dependencies
   ```bash
   cd apps/teacher-ui
   npm install
   npm run build  # Verify build works
   ```

2. Set up Vue Router for screen navigation
   ```typescript
   // src/router.ts
   import { createRouter, createWebHistory } from 'vue-router';
   
   const routes = [
     { path: '/', component: Dashboard },
     { path: '/classes/:id', component: ClassDetail },
     { path: '/students/:id', component: StudentProfile },
     { path: '/attendance', component: AttendanceEntry },
     { path: '/grading', component: GradingEntry }
   ];
   
   export const router = createRouter({
     history: createWebHistory(),
     routes
   });
   ```

3. Create layout shell
   ```vue
   <!-- App.vue -->
   <template>
     <div class="app-container">
       <header class="app-header">
         <h1>ViccoBoard</h1>
         <nav>...</nav>
       </header>
       <aside class="sidebar">
         <!-- Navigation links -->
       </aside>
       <main class="content">
         <RouterView />
       </main>
     </div>
   </template>
   ```

4. Responsive CSS for iPad
   ```css
   .app-container {
     display: grid;
     grid-template-columns: 200px 1fr;
     grid-template-rows: 60px 1fr;
     height: 100vh;
   }
   
   /* Responsive for split-view */
   @media (max-width: 600px) {
     .app-container {
       grid-template-columns: 1fr;
     }
     .sidebar { display: none; } /* Hide on small screens */
   }
   ```

**Definition of Done:**
- [ ] Can navigate between all screens
- [ ] Layout responsive on iPad (portrait/landscape)
- [ ] Sidebar and header visible
- [ ] Works offline (no network required)

---

### Milestone P2-2: Dashboard Screen (Days 3-4)

**Features:**
1. Load and display class list
2. Quick action buttons (New Class, New Exam)
3. Recent activity summary
4. Search/filter classes

**Implementation:**
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ClassGroupRepository } from '@viccoboard/sport';

const classes = ref<ClassGroup[]>([]);
const repository = inject('classGroupRepository');

onMounted(async () => {
  classes.value = await repository.findAll();
});

async function createClass(name: string) {
  const useCase = inject('createClassUseCase');
  const newClass = await useCase.execute({ name });
  classes.value.push(newClass);
}
</script>

<template>
  <div class="dashboard">
    <h2>My Classes</h2>
    <button @click="createClass">+ New Class</button>
    <div class="class-list">
      <div v-for="cls in classes" :key="cls.id" class="class-card">
        <h3>{{ cls.name }}</h3>
        <p>{{ cls.student_count }} students</p>
        <router-link :to="`/classes/${cls.id}`">View →</router-link>
      </div>
    </div>
  </div>
</template>
```

**Definition of Done:**
- [ ] Can see all classes
- [ ] Can create new class from button
- [ ] Data loads from storage
- [ ] Works offline
- [ ] Touch targets ≥ 44px

---

### Milestone P2-3: Class Detail Screen (Days 5-6)

**Features:**
1. View class info (name, grade level, students)
2. List students in class
3. Edit class information
4. View lessons
5. Quick link to attendance entry

**Implementation:**
```vue
<script setup lang="ts">
const route = useRoute();
const classId = route.params.id;
const classGroup = ref<ClassGroup>();
const students = ref<Student[]>([]);

const classRepo = inject('classGroupRepository');
const studentRepo = inject('studentRepository');

onMounted(async () => {
  classGroup.value = await classRepo.read(classId);
  students.value = await studentRepo.queryByClass(classId);
});
</script>

<template>
  <div class="class-detail">
    <h2>{{ classGroup?.name }}</h2>
    <p>Grade {{ classGroup?.grade_level }}, Year {{ classGroup?.school_year }}</p>
    
    <section class="students">
      <h3>Students ({{ students.length }})</h3>
      <router-link to="/attendance" class="btn-primary">
        Record Attendance →
      </router-link>
      
      <ul class="student-list">
        <li v-for="student in students" :key="student.id">
          <router-link :to="`/students/${student.id}`">
            {{ student.first_name }} {{ student.last_name }}
          </router-link>
        </li>
      </ul>
    </section>
  </div>
</template>
```

**Definition of Done:**
- [ ] Can view class details
- [ ] Can see list of students
- [ ] Can navigate to student profiles
- [ ] Can access attendance entry
- [ ] Works offline

---

### Milestone P2-4: Student Profile & Attendance (Days 7-8)

**Features:**
1. Student info (name, birth year, contact)
2. Photo display
3. Attendance history
4. Edit student info

**Implementation:**
```vue
<script setup lang="ts">
const studentId = route.params.id;
const student = ref<Student>();
const attendance = ref<AttendanceRecord[]>([]);

onMounted(async () => {
  student.value = await studentRepo.read(studentId);
  attendance.value = await attendanceRepo.queryByStudent(studentId);
});
</script>

<template>
  <div class="student-profile">
    <img v-if="student?.photo" :src="student.photo" class="student-photo" />
    <h2>{{ student?.first_name }} {{ student?.last_name }}</h2>
    <p>Birth: {{ student?.birth_year }}</p>
    
    <section class="attendance">
      <h3>Attendance Record</h3>
      <table>
        <tr>
          <th>Date</th>
          <th>Status</th>
          <th>Lesson</th>
        </tr>
        <tr v-for="record in attendance" :key="record.id">
          <td>{{ new Date(record.created_at).toLocaleDateString() }}</td>
          <td :class="record.status">{{ record.status }}</td>
          <td>{{ record.lesson_id }}</td>
        </tr>
      </table>
    </section>
  </div>
</template>
```

**Definition of Done:**
- [ ] Can view student profile
- [ ] Attendance history displayed
- [ ] Can edit student info
- [ ] Photos load correctly
- [ ] Works offline

---

### Milestone P2-5: Attendance Entry Form (Days 9-10)

**Features:**
1. Quick attendance recording for all students
2. Status buttons (Present, Absent, Passive, Late, Excused)
3. Reason field for absences
4. Summary display
5. Save button

**Implementation:**
```vue
<script setup lang="ts">
const students = ref<Student[]>([]);
const attendance = reactive({}); // { studentId: 'present' | 'absent' | ... }

async function recordAttendance() {
  const useCase = inject('recordAttendanceUseCase');
  const lesson = { lesson_id: currentLessonId };
  
  for (const [studentId, status] of Object.entries(attendance)) {
    await useCase.execute({
      lesson_id: lesson.lesson_id,
      student_id: studentId,
      status,
      reason: attendance[studentId].reason || null
    });
  }
  
  showSuccess('Attendance recorded');
}
</script>

<template>
  <div class="attendance-form">
    <h2>Record Attendance</h2>
    
    <div class="status-summary">
      <span>Present: {{ countByStatus('present') }}</span>
      <span>Absent: {{ countByStatus('absent') }}</span>
    </div>
    
    <table class="attendance-table">
      <tr>
        <th>Student</th>
        <th>Status</th>
        <th>Reason</th>
      </tr>
      <tr v-for="student in students" :key="student.id">
        <td>{{ student.first_name }} {{ student.last_name }}</td>
        <td>
          <div class="status-buttons">
            <button 
              v-for="status in ['present', 'absent', 'passive', 'late', 'excused']"
              :key="status"
              @click="attendance[student.id] = status"
              :class="{ active: attendance[student.id] === status }"
            >
              {{ status }}
            </button>
          </div>
        </td>
        <td v-if="attendance[student.id] === 'absent'">
          <input 
            v-model="attendance[student.id].reason"
            placeholder="Reason..."
            type="text"
          />
        </td>
      </tr>
    </table>
    
    <button @click="recordAttendance" class="btn-primary">Save Attendance</button>
  </div>
</template>

<style scoped>
.status-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.status-buttons button {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  min-width: 50px;
  touch-action: manipulation;
}

.status-buttons button.active {
  background-color: #4CAF50;
  color: white;
  border-color: #4CAF50;
}
</style>
```

**Definition of Done:**
- [ ] Can record attendance for all students
- [ ] Status buttons work correctly
- [ ] Data saves to storage
- [ ] Works offline
- [ ] Touch targets ≥ 44px

---

### Milestone P2-6: Integration with Use Cases (Days 11-12)

**Tasks:**
1. Create Vue composable for each use case
   ```typescript
   // src/composables/useSport.ts
   export function useCreateClass() {
     const createClassUseCase = new CreateClassUseCase(repository);
     
     return {
       async createClass(input: CreateClassInput) {
         try {
           return await createClassUseCase.execute(input);
         } catch (error) {
           // Handle error
         }
       }
     };
   }
   ```

2. Wire storage initialization
   ```typescript
   // main.ts
   import { IndexedDBStorage } from '@viccoboard/storage';
   
   const storage = await IndexedDBStorage.create({
     dbName: 'viccoboard',
     password: await getAppPassword()
   });
   
   const classRepository = new ClassGroupRepository(storage.adapter);
   const createClassUseCase = new CreateClassUseCase(classRepository);
   
   app.provide('createClassUseCase', createClassUseCase);
   ```

3. Add error handling and notifications
4. Test all workflows offline

**Definition of Done:**
- [ ] All screens wired to use cases
- [ ] Can create class → add students → record attendance
- [ ] All data persists offline
- [ ] Error messages display correctly
- [ ] No console errors

---

### Milestone P2-7: Testing & Refinement (Days 13-14)

**Tasks:**
1. Test on iPad (landscape, portrait, split-view)
2. Verify offline functionality
3. Test on slow network (throttle in DevTools)
4. Refinement: fonts, spacing, colors
5. Accessibility check

**Checklist:**
- [ ] Works on iPad (portrait/landscape/split)
- [ ] Touch targets ≥ 44px
- [ ] Works without network
- [ ] No console errors
- [ ] Load time < 2 seconds
- [ ] Storage persists data correctly

---

## Vue 3 Scaffolding Checklist

Before starting: Verify existing structure

```bash
cd apps/teacher-ui

# Check files exist
ls -la  # Should show:
# ├── index.html
# ├── package.json
# ├── src/
# │   ├── App.vue
# │   ├── main.ts
# │   └── style.css
# ├── tsconfig.json
# └── vite.config.ts

# Install dependencies
npm install

# Start dev server
npm run dev
# Expected: "Local: http://localhost:5173"

# Build for production
npm run build
# Expected: dist/ folder created with HTML/CSS/JS
```

---

## Success Criteria for Phase 2

**Functional:**
- ✅ Can navigate between all screens
- ✅ Can create a class
- ✅ Can add students to class
- ✅ Can record attendance for lesson
- ✅ All data persists to encrypted storage
- ✅ Works offline without network

**Technical:**
- ✅ Vue 3 project building cleanly
- ✅ TypeScript strict mode passing
- ✅ All dependencies resolved
- ✅ No console errors

**User Experience:**
- ✅ Responsive on iPad (44px+ touch targets)
- ✅ Navigation intuitive
- ✅ Forms validate input
- ✅ Success/error messages clear

**Testability:**
- ✅ Can test all workflows manually
- ✅ Data export for debugging
- ✅ Console logs for troubleshooting

---

## Deployment Plan

### Development
```bash
npm run dev          # Hot-reload dev server
# Visit: http://localhost:5173
```

### Production Build
```bash
npm run build        # Optimize for production
# Creates: dist/ folder with optimized assets
# Size: ~200KB gzipped (efficient for iPad)
```

### Deployment Options

**Option 1: GitHub Pages (Free)**
```bash
npm run build
git add dist/
git commit -m "Deploy Phase 2"
# Push to gh-pages branch
```

**Option 2: School Server (Private)**
```bash
npm run build
scp -r dist/* teacher@school-server:/var/www/viccoboard/
```

**Option 3: USB Drive (Offline)**
```bash
npm run build
# Copy dist/ to USB
# Open index.html in Safari on iPad
# Works offline from local files!
```

---

## Timeline

| Milestone | Duration | Start | End |
|-----------|----------|-------|-----|
| P2-1: Setup & Nav | 2 days | Jan 16 | Jan 17 |
| P2-2: Dashboard | 2 days | Jan 18 | Jan 19 |
| P2-3: Class Detail | 2 days | Jan 20 | Jan 21 |
| P2-4: Student Profile | 2 days | Jan 22 | Jan 23 |
| P2-5: Attendance Form | 2 days | Jan 24 | Jan 25 |
| P2-6: Integration | 2 days | Jan 26 | Jan 27 |
| P2-7: Testing | 2 days | Jan 28 | Jan 29 |
| **TOTAL** | **14 days** | **Jan 16** | **Jan 29** |

**Faster Option:** 2-person team → 7 days  
**Slower Option:** With heavy testing → 21 days

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|---|---|---|
| Vite build issues | LOW | MEDIUM | Use working package.json; rebuild from scratch if needed |
| Vue Router complexity | MEDIUM | LOW | Start simple; refactor if needed |
| IndexedDB quota exceeded | LOW | HIGH | Monitor storage; plan archival for old data |
| Touch UX issues on iPad | MEDIUM | MEDIUM | Test on device early; iterate UI |
| Performance degradation | LOW | MEDIUM | Profile with DevTools; optimize before Phase 3 |

---

## Next Steps (Immediately After Decision)

1. **Day 1:**
   - [ ] Confirm Vue 3 decision with team
   - [ ] Review existing scaffold
   - [ ] Start Milestone P2-1 (Setup & Nav)

2. **Week 1:**
   - [ ] Complete P2-1 through P2-4
   - [ ] Daily testing on iPad
   - [ ] Daily build verification

3. **Week 2:**
   - [ ] Complete P2-5 through P2-7
   - [ ] Final testing and refinement
   - [ ] Deployment to static host

4. **Week 3:**
   - [ ] Gather feedback
   - [ ] Minor fixes
   - [ ] Prepare for Phase 3 (Grading Engine)

---

## Phase 3 Preparation

Once Phase 2 is complete:
- ✅ UI framework validated
- ✅ Navigation proven
- ✅ Sport module integration verified
- ✅ Offline functionality confirmed

Ready to start Phase 3 tasks:
- Grading scheme repositories
- Criteria-based calculation logic
- Time-based grading logic
- Grading entry UI

---

**Decision Made:** Vue 3 (Web-First)  
**Status:** Ready for execution  
**Next Action:** Begin Phase 2-1 immediately
