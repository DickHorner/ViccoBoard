import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { createAppI18n } from './i18n'
import { initializeStorage } from './services/storage.service'
import './style.css'

const app = createApp(App)
const pinia = createPinia()
const i18n = createAppI18n()

const bootstrap = async () => {
	try {
		await initializeStorage()
	} catch (error) {
		console.error('Failed to initialize storage:', error)
	}

	app.use(pinia)
	app.use(i18n)
	app.use(router)
	app.mount('#app')
}

void bootstrap()
