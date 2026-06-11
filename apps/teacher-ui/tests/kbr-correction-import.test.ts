import { describe, expect, it } from '@jest/globals'

import { normalizeCorrectionImportPayload } from '../src/utils/kbr-correction-import'

describe('kbr-correction-import', () => {
  it('keeps a single bundle as object payload', () => {
    const bundle = { chatRef: 'chat-0001', importedTaskScores: [] }

    expect(normalizeCorrectionImportPayload([bundle])).toEqual(bundle)
  })

  it('flattens multiple individual bundle files into one batch payload', () => {
    const bundleA = { chatRef: 'chat-0001', importedTaskScores: [] }
    const bundleB = { chatRef: 'chat-0002', importedTaskScores: [] }

    expect(normalizeCorrectionImportPayload([bundleA, bundleB])).toEqual([bundleA, bundleB])
  })

  it('flattens exported array payloads and standalone files together', () => {
    const bundleA = { chatRef: 'chat-0001', importedTaskScores: [] }
    const bundleB = { chatRef: 'chat-0002', importedTaskScores: [] }
    const bundleC = { chatRef: 'chat-0003', importedTaskScores: [] }

    expect(normalizeCorrectionImportPayload([[bundleA, bundleB], bundleC])).toEqual([
      bundleA,
      bundleB,
      bundleC
    ])
  })

  it('rejects empty imports', () => {
    expect(() => normalizeCorrectionImportPayload([])).toThrow('Die Importdatei enthält keine Korrekturdaten.')
  })
})
