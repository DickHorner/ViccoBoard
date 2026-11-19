import Aura from '@openvue/themes/aura'

export const openVueOptions = {
  ripple: false,
  inputVariant: 'filled' as const,
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.app-dark',
      cssLayer: false
    }
  }
}
