export interface CorrectionSessionFileArtifact {
  fileName: string;
  content: string;
}

export interface CorrectionSessionLocalReferenceMapArtifact {
  contractId: string;
  contractChatRef: string;
  contractSnapshotId: string;
  sessionChatRef: string;
  exportId: string;
  targetSessionId: string;
  candidateIdByChatRef: Record<string, string>;
  taskIdByRef: Record<string, string>;
}

export interface CorrectionSessionExportResultArtifact {
  contractFile: CorrectionSessionFileArtifact;
  contractJsonFile: CorrectionSessionFileArtifact;
  promptFile: CorrectionSessionFileArtifact;
  localReferenceMap: CorrectionSessionLocalReferenceMapArtifact;
}

export interface CorrectionSessionExportResultLike {
  sessionId: string;
  artifact: CorrectionSessionExportResultArtifact;
}

export interface CorrectionSessionDownloadArtifact extends CorrectionSessionFileArtifact {
  label: 'Contract' | 'Contract JSON' | 'Prompt' | 'Session-Map (intern)';
  audience: 'chatgpt' | 'internal';
  description: string;
}

function buildSessionMapFileName(promptFileName: string, sessionId: string): string {
  if (promptFileName.endsWith('-prompt.md')) {
    return promptFileName.replace(/-prompt\.md$/, '-session-map-internal.json');
  }

  const normalizedSessionId = sessionId.replace(/^session-/, '') || sessionId;
  return `kbr-correction-session-${normalizedSessionId}-session-map-internal.json`;
}

export function buildCorrectionSessionDownloads(
  result: CorrectionSessionExportResultLike,
  examId: string
): CorrectionSessionDownloadArtifact[] {
  const sessionMapContent = JSON.stringify(
    {
      examId,
      sessionId: result.sessionId,
      contractId: result.artifact.localReferenceMap.contractId,
      contractChatRef: result.artifact.localReferenceMap.contractChatRef,
      contractSnapshotId: result.artifact.localReferenceMap.contractSnapshotId,
      sessionChatRef: result.artifact.localReferenceMap.sessionChatRef,
      exportId: result.artifact.localReferenceMap.exportId,
      targetSessionId: result.artifact.localReferenceMap.targetSessionId,
      candidateIdByChatRef: result.artifact.localReferenceMap.candidateIdByChatRef,
      taskIdByRef: result.artifact.localReferenceMap.taskIdByRef
    },
    null,
    2
  );

  return [
    {
      label: 'Contract',
      audience: 'chatgpt',
      description: 'Markdown-Datei mit dem Korrekturvertrag fur die KI-Sitzung.',
      fileName: result.artifact.contractFile.fileName,
      content: result.artifact.contractFile.content
    },
    {
      label: 'Contract JSON',
      audience: 'chatgpt',
      description: 'Kanonische JSON-Datei des Korrekturvertrags fur maschinenlesbare Re-Exporte.',
      fileName: result.artifact.contractJsonFile.fileName,
      content: result.artifact.contractJsonFile.content
    },
    {
      label: 'Prompt',
      audience: 'chatgpt',
      description: 'Markdown-Datei mit der Startanweisung fur ChatGPT.',
      fileName: result.artifact.promptFile.fileName,
      content: result.artifact.promptFile.content
    },
    {
      label: 'Session-Map (intern)',
      audience: 'internal',
      description: 'Technische Zuordnung fur Re-Import uber chatRef; nicht in ChatGPT hochladen.',
      fileName: buildSessionMapFileName(result.artifact.promptFile.fileName, result.sessionId),
      content: sessionMapContent
    }
  ];
}