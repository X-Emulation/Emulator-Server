<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Rom {
  name: string
  size: number
  path: string
}

interface RecentRom extends Rom {
  addedAt: number
}

const currentTab = ref('dashboard')
const roms = ref<Rom[]>([])
const recentRoms = ref<RecentRom[]>([])
const loading = ref(false)
const error = ref('')
const MAX_RECENT_ROMS = 5

const switchTab = (tab: string): void => {
  currentTab.value = tab
  if (tab === 'roms' || tab === 'dashboard') {
    void loadRoms()
  }
}

const loadRoms = async (): Promise<void> => {
  loading.value = true
  error.value = ''
  try {
    const response = await fetch('http://localhost:1248/api/roms')
    if (!response.ok) throw new Error('Failed to fetch ROMs')
    const loadedRoms = await response.json()
    roms.value = loadedRoms
    
    // Update recent roms
    const currentTime = Date.now()
    recentRoms.value = loadedRoms
      .map((rom: Rom) => ({ ...rom, addedAt: currentTime }))
      .sort((a: RecentRom, b: RecentRom) => b.addedAt - a.addedAt)
      .slice(0, MAX_RECENT_ROMS)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load ROMs'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (currentTab.value === 'roms' || currentTab.value === 'dashboard') {
    void loadRoms()
  }
})
</script>

<template>
  <div class="container">
    <header>
      <h1>EmulatorX</h1>
      <nav>
        <a 
          @click="switchTab('dashboard')" 
          :class="['nav-link', { active: currentTab === 'dashboard' }]"
        >Dashboard</a>
        <a 
          @click="switchTab('roms')" 
          :class="['nav-link', { active: currentTab === 'roms' }]"
        >ROMs</a>
        <a 
          @click="switchTab('settings')" 
          :class="['nav-link', { active: currentTab === 'settings' }]"
        >Settings</a>
      </nav>
    </header>

    <main>
      <div class="content-area">
        <div v-if="currentTab === 'dashboard'">
          <h2>Dashboard</h2>
          <div class="dashboard-content">
            <div class="welcome-section">
              <p>Welcome to EmulatorX Dashboard</p>
            </div>
            
            <div class="recent-games">
              <h3>Recently Added Games</h3>
              <div v-if="recentRoms.length > 0" class="recent-roms-slider">
                <div class="slider-container">
                  <div v-for="rom in recentRoms" :key="rom.path" class="recent-rom-card">
                    <div class="rom-info">
                      <span class="rom-name">{{ rom.name }}</span>
                      <span class="rom-size">{{ (rom.size / 1024 / 1024).toFixed(2) }} MB</span>
                    </div>
                  </div>
                </div>
              </div>
              <p v-else class="no-roms">No games added yet.</p>
            </div>
          </div>
        </div>
        
        <div v-if="currentTab === 'roms'" class="roms-section">
          <h2>ROMs Library</h2>
          
          <div v-if="loading" class="loading">Loading ROMs...</div>
          <div v-else-if="error" class="error">{{ error }}</div>
          <div v-else-if="roms.length > 0" class="rom-list">
            <div v-for="rom in roms" :key="rom.path" class="rom-item">
              <span class="rom-name">{{ rom.name }}</span>
              <span class="rom-size">{{ (rom.size / 1024 / 1024).toFixed(2) }} MB</span>
            </div>
          </div>
          <p v-else class="no-roms">No ROMs found in the ROMs directory.</p>
        </div>
        
        <div v-if="currentTab === 'settings'">
          <h2>Settings</h2>
          <p>Configure your emulator</p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.container {
  width: 100vw;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  background: var(--color-background);
  color: var(--color-text);
  display: flex;
  flex-direction: column;
}

header {
  background: var(--color-background-soft);
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-border);
  height: 60px;
}

h1 {
  color: var(--color-heading);
  font-size: 2rem;
  font-weight: 600;
}

nav {
  display: flex;
  gap: 2rem;
}

.nav-link {
  color: var(--color-text);
  text-decoration: none;
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  transition: background-color 0.3s;
  font-size: 1.1rem;
  cursor: pointer;
  user-select: none;
}

.nav-link:hover {
  background-color: var(--color-background-mute);
}

.nav-link.active {
  background-color: var(--color-background-mute);
  font-weight: bold;
}

main {
  flex: 1;
  padding: 2rem;
  height: calc(100vh - 60px);
  overflow-y: auto;
}

.content-area {
  width: 100%;
  height: 100%;
}

h2 {
  font-size: 2.5rem;
  color: var(--color-heading);
  margin-bottom: 1rem;
}

p {
  color: var(--color-text);
  font-size: 1.2rem;
}

.roms-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.rom-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.file-input-label {
  background: var(--vt-c-indigo);
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: opacity 0.2s;
}

.file-input-label:hover {
  opacity: 0.9;
}

.file-input-label input {
  display: none;
}

.rom-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rom-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--color-background-soft);
  border-radius: 8px;
  border: 1px solid var(--color-border);
  transition: transform 0.2s, border-color 0.2s;
}

.rom-item:hover {
  transform: translateX(4px);
  border-color: var(--color-border-hover);
}

.rom-name {
  font-size: 1.1rem;
  color: var(--color-heading);
}

.rom-size {
  color: var(--color-text);
  opacity: 0.8;
}

.no-roms {
  text-align: center;
  color: var(--color-text);
  opacity: 0.7;
  padding: 2rem;
  background: var(--color-background-soft);
  border-radius: 8px;
}

.loading, .error {
  text-align: center;
  padding: 2rem;
  background: var(--color-background-soft);
  border-radius: 8px;
}

.error {
  color: #ef4444;
}

.dashboard-content {
  display: grid;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-section {
  background: var(--color-background-soft);
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.recent-games {
  background: var(--color-background-soft);
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  overflow: hidden;
}

h3 {
  font-size: 1.5rem;
  color: var(--color-heading);
  margin-bottom: 1rem;
}

.recent-roms-slider {
  margin: 0 -1rem;
  padding: 0 1rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}

.recent-roms-slider::-webkit-scrollbar {
  height: 8px;
}

.recent-roms-slider::-webkit-scrollbar-track {
  background: var(--color-background);
  border-radius: 4px;
}

.recent-roms-slider::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}

.slider-container {
  display: flex;
  gap: 1rem;
  padding: 0.5rem 0;
  min-width: min-content;
}

.recent-rom-card {
  flex: 0 0 200px;
  background: var(--color-background);
  border-radius: 8px;
  border: 1px solid var(--color-border);
  overflow: hidden;
  transition: transform 0.2s, border-color 0.2s;
}

.recent-rom-card:hover {
  transform: translateY(-4px);
  border-color: var(--color-border-hover);
}

.rom-info {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rom-name {
  font-size: 1rem;
  color: var(--color-heading);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rom-size {
  font-size: 0.9rem;
  color: var(--color-text);
  opacity: 0.8;
}
</style>

