import { Exams } from '@viccoboard/core';

const EPSILON = 1e-6;

export interface DeductionJustificationReview {
  requiresManualReview: boolean;
  missingDefectStatement: boolean;
  missingEvidence: boolean;
  isMinimumDeductionStep: boolean;
  message: string;
}

function hasText(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasStructuredPayload(value: Record<string, unknown> | undefined): boolean {
  return Boolean(value && Object.keys(value).length > 0);
}

function isReliableEvidence(evidence: Exams.KbrCorrectionEvidence | undefined): boolean {
  if (!evidence) {
    return false;
  }

  return hasText(evidence.value) || hasText(evidence.uri) || hasStructuredPayload(evidence.metadata);
}

function buildReasonMessage(review: Omit<DeductionJustificationReview, 'requiresManualReview' | 'message'>): string {
  const reasons: string[] = [];

  if (review.missingDefectStatement) {
    reasons.push('konkreter Mangel fehlt');
  }

  if (review.missingEvidence) {
    reasons.push('belastbarer Beleg fehlt');
  }

  const suffix = review.isMinimumDeductionStep
    ? ' Auch der kleinste zulässige Abzugsschritt erfordert Begründung und Beleg.'
    : '';

  return `Punktabzug nicht ausreichend begründet (${reasons.join(', ')}).${suffix}`;
}

export function reviewImportedDeduction(
  taskScore: Pick<Exams.KbrCorrectionImportedTaskScore, 'points' | 'comment' | 'evidenceIds'>,
  maxPoints: number,
  allowedPointStep: number,
  evidenceById: ReadonlyMap<string, Exams.KbrCorrectionEvidence>
): DeductionJustificationReview | undefined {
  const deduction = maxPoints - taskScore.points;
  if (deduction <= EPSILON) {
    return undefined;
  }

  const missingDefectStatement = !hasText(taskScore.comment);
  const missingEvidence = !((taskScore.evidenceIds ?? []).some((evidenceId) => isReliableEvidence(evidenceById.get(evidenceId))));

  if (!missingDefectStatement && !missingEvidence) {
    return undefined;
  }

  const isMinimumDeductionStep = Math.abs(deduction - allowedPointStep) <= EPSILON;
  const partialReview = {
    missingDefectStatement,
    missingEvidence,
    isMinimumDeductionStep
  };

  return {
    requiresManualReview: true,
    ...partialReview,
    message: buildReasonMessage(partialReview)
  };
}

export function buildDeductionManualReviewComment(
  taskId: string,
  review: DeductionJustificationReview
): Exams.CorrectionComment {
  return {
    id: crypto.randomUUID(),
    taskId,
    level: 'task',
    text: `Manuelle Prüfung erforderlich: ${review.message}`,
    printable: false,
    availableAfterReturn: false,
    timestamp: new Date()
  };
}