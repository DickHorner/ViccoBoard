import { definePreset } from '@openvue/themes'
import Nora from '@openvue/themes/nora'

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

export const openVueOptions = {
  ripple: false,
  inputVariant: 'filled' as const,
  theme: {
    preset: viccoThemePreset,
    options: {
      darkModeSelector: 'none',
      cssLayer: false
    }
  }
}
