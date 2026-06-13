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
          contractJsonFile: {
            fileName: 'kbr-correction-session-2026-04-17-contract.json',
            content: '{\"id\":\"contract-1\"}'
          },
          promptFile: {
            fileName: 'kbr-correction-session-2026-04-17-prompt.md',
            content: '# Prompt'
          },
          localReferenceMap: {
            contractId: 'contract-1',
            contractChatRef: 'contract-1',
            contractSnapshotId: 'contract-1',
            sessionChatRef: 'session-session-2026-04-17',
            exportId: 'session-2026-04-17',
            targetSessionId: 'session-2026-04-17',
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

    expect(downloads).toHaveLength(4)
    expect(downloads.map((artifact) => artifact.label)).toEqual([
      'Contract',
      'Contract JSON',
      'Prompt',
      'Session-Map (intern)'
    ])
    expect(downloads.map((artifact) => artifact.audience)).toEqual([
      'chatgpt',
      'chatgpt',
      'chatgpt',
      'internal'
    ])
    expect(downloads[3].fileName).toBe('kbr-correction-session-2026-04-17-session-map-internal.json')
    expect(JSON.parse(downloads[3].content)).toEqual({
      examId: 'exam-1',
      sessionId: 'session-2026-04-17',
      contractId: 'contract-1',
      contractChatRef: 'contract-1',
      contractSnapshotId: 'contract-1',
      sessionChatRef: 'session-session-2026-04-17',
      exportId: 'session-2026-04-17',
      targetSessionId: 'session-2026-04-17',
      candidateIdByChatRef: {
        'chat-0001': 'candidate-1'
      },
      taskIdByRef: {
        'task-1': 'task-internal-1'
      }
    })
  })
})