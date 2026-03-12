import { settingsCards } from '../src/settings-sections'

describe('settings sections', () => {
  it('includes a sport configuration entry point', () => {
    const sportCard = settingsCards.find(c => c.to === '/settings/sport')
    expect(sportCard).toBeDefined()
    expect(sportCard?.status).toBe('aktiv')
  })

  it('includes a catalog management entry point', () => {
    const catalogCard = settingsCards.find(c => c.to === '/settings/catalogs')
    expect(catalogCard).toBeDefined()
    expect(catalogCard?.status).toBe('verfügbar')
  })

  it('exposes at least all sport-relevant configuration areas as linkable cards', () => {
    const linkedTargets = settingsCards.filter(c => c.to !== null).map(c => c.to)
    expect(linkedTargets).toEqual(expect.arrayContaining(['/settings/sport', '/settings/catalogs']))
  })

  it('has a title and description for every card', () => {
    for (const card of settingsCards) {
      expect(card.title.length).toBeGreaterThan(0)
      expect(card.description.length).toBeGreaterThan(0)
    }
  })
})
