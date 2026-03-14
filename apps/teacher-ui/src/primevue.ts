import { definePreset } from '@primeuix/themes'
import Nora from '@primeuix/themes/nora'

export const viccoThemePreset = definePreset(Nora, {
  semantic: {
    focusRing: {
      width: '2px',
      style: 'solid',
      color: '{primary.color}',
      offset: '2px'
    }
  }
})

export const primeVueOptions = {
  ripple: true,
  inputVariant: 'filled' as const,
  theme: {
    preset: viccoThemePreset,
    options: {
      darkModeSelector: 'none',
      cssLayer: false
    }
  }
}
