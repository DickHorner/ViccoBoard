import { createApp } from 'vue'
import SportHub from '../src/views/SportHub.vue'

jest.mock('vue-router', () => {
  const { defineComponent, h } = jest.requireActual<typeof import('vue')>('vue')

  return {
    RouterLink: defineComponent({
      props: {
        to: { type: String, required: true }
      },
      setup(props, { slots }) {
        return () => h('a', { href: props.to }, slots.default?.())
      }
    })
  }
})

jest.mock('../src/composables/useSportBridge', () => ({
  useClassGroups: () => ({
    findAll: jest.fn().mockResolvedValue([])
  }),
  getSportBridge: () => ({
    gradeCategoryRepository: { findAll: jest.fn().mockResolvedValue([]) },
    tableDefinitionRepository: { findAll: jest.fn().mockResolvedValue([]) },
    toolSessionRepository: { findAll: jest.fn().mockResolvedValue([]) },
    sportabzeichenStandardRepository: { findAll: jest.fn().mockResolvedValue([]) }
  })
}))

describe('sport hub navigation', () => {
  it('links team building and tournament planning to separate tools', () => {
    const container = document.createElement('div')
    const app = createApp(SportHub)
    app.mount(container)

    const links = [...container.querySelectorAll('a')]
    const teamLink = links.find(link => link.textContent?.includes('Teams bilden'))
    const tournamentLink = links.find(link => link.textContent?.includes('Turnierplaner'))

    expect(teamLink?.getAttribute('href')).toBe('/tools/teams')
    expect(tournamentLink?.getAttribute('href')).toBe('/tools/tournaments')

    app.unmount()
  })
})
