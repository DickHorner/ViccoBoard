import { buildCorrectionSessionDownloads } from '../src/utils/kbr-correction-export'

describe('buildCorrectionSessionDownloads', () => {
  it('separates contract, prompt, and internal session map artifacts with clear labels', () => {
    const downloads = buildCorrectionSessionDownloads(
      {
        sessionId: 'session-2026-04-17',
        artifact: {
          contractFile: {
            fileName: 'kbr-correction-session-2026-04-17-contract.md',
            content: '# Contract'
          },
          promptFile: {
            fileName: 'kbr-correction-session-2026-04-17-prompt.md',
            content: '# Prompt'
          },
          localReferenceMap: {
            candidateIdByChatRef: {
              'chat-0001': 'candidate-1'
            },
            taskIdByRef: {
              'task-1': 'task-internal-1'
            }
          }
        }
      },
      'exam-1'
    )

    expect(downloads).toHaveLength(3)
    expect(downloads.map((artifact) => artifact.label)).toEqual([
      'Contract',
      'Prompt',
      'Session-Map (intern)'
    ])
    expect(downloads.map((artifact) => artifact.audience)).toEqual([
      'chatgpt',
      'chatgpt',
      'internal'
    ])
    expect(downloads[2].fileName).toBe('kbr-correction-session-2026-04-17-session-map-internal.json')
    expect(JSON.parse(downloads[2].content)).toEqual({
      examId: 'exam-1',
      sessionId: 'session-2026-04-17',
      candidateIdByChatRef: {
        'chat-0001': 'candidate-1'
      },
      taskIdByRef: {
        'task-1': 'task-internal-1'
      }
    })
  })
})