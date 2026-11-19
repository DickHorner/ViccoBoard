import { ref } from 'vue'

const STORAGE_KEY = 'viccoboard-color-scheme'
const isDark = ref(false)

export const initializeColorScheme = () => {
  let saved: string | null = null
  try {
    saved = window.localStorage.getItem(STORAGE_KEY)
  } catch (error) {
    console.warn('Farbschema-Einstellung kann nicht gelesen werden:', error)
  }

  const prefersDark = typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-color-scheme: dark)').matches
  isDark.value = saved === 'dark' || (saved !== 'light' && prefersDark)
  document.documentElement.classList.toggle('app-dark', isDark.value)
}

export const useColorScheme = () => {
  const toggleColorScheme = () => {
    isDark.value = !isDark.value
    document.documentElement.classList.toggle('app-dark', isDark.value)
    try {
      window.localStorage.setItem(STORAGE_KEY, isDark.value ? 'dark' : 'light')
    } catch (error) {
      console.warn('Farbschema-Einstellung kann nicht gespeichert werden:', error)
    }
  }

  return { isDark, toggleColorScheme }
}
