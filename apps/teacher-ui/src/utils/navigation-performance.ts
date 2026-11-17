let activeNavigation: { name: string; startedAt: number } | null = null

export function startRouteTiming(name: string): void {
  activeNavigation = { name, startedAt: performance.now() }
}

function recordRoutePhase(name: string, phase: string): void {
  const navigation = activeNavigation
  if (navigation?.name !== name) return

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      if (activeNavigation !== navigation) return
      try {
        performance.measure(`ViccoBoard/${name}/${phase}`, {
          start: navigation.startedAt,
          end: performance.now()
        })
      } catch {
        // Timing support must not affect navigation.
      }
    })
  })
}

export function recordRoutePaint(name: string): void {
  recordRoutePhase(name, 'first-paint')
}

export function recordRouteContentReady(name: string): void {
  recordRoutePhase(name, 'content-ready')
}
