import { Exams } from '@viccoboard/core';
import type { CorrectionEntryRepository } from '../repositories/correction-entry.repository';
import type { ExamRepository } from '../repositories/exam.repository';
import { BuildCorrectionSheetProjectionUseCase } from './build-correction-sheet-projection.use-case';
import {
  buildCorrectionSheetFileNameBase,
  CorrectionSheetPdfRenderer
} from '../services/pdf/correction-sheet-pdf.renderer';

export class ExportCorrectionSheetsPdfUseCase {
  constructor(
    private readonly examRepository: ExamRepository,
    private readonly buildCorrectionSheetProjectionUseCase: BuildCorrectionSheetProjectionUseCase,
    private readonly correctionEntryRepository: CorrectionEntryRepository,
    private readonly renderer: CorrectionSheetPdfRenderer = new CorrectionSheetPdfRenderer()
  ) {}

  async exportCurrentCandidatePdf(
    examId: string,
    candidateId: string
  ): Promise<Exams.CorrectionSheetPdfDocument> {
    const correction = await this.correctionEntryRepository.findByExamAndCandidate(
      examId,
      candidateId
    );

    if (!correction) {
      throw new Error(
        `Keine Korrektur für Prüfling ${candidateId} vorhanden. Export nicht möglich.`
      );
    }

    if (correction.status !== 'completed') {
      throw new Error(
        `Die Korrektur für Prüfling ${candidateId} ist noch nicht abgeschlossen (Status: ${correction.status}). Nur abgeschlossene Korrekturen können exportiert werden.`
      );
    }

    const projection = await this.buildCorrectionSheetProjectionUseCase.execute(
      examId,
      candidateId
    );

    return this.renderer.render(
      [projection],
      buildCorrectionSheetFileNameBase(
        projection.examTitle,
        'single',
        projection.candidateName
      )
    );
  }

  async exportAllCandidatesPdf(
    examId: string
  ): Promise<Exams.CorrectionSheetPdfDocument> {
    const exam = await this.examRepository.findById(examId);
    if (!exam) {
      throw new Error(`Exam ${examId} not found`);
    }

    if (exam.candidates.length === 0) {
      throw new Error('Exam has no candidates');
    }

    const allCorrections = await this.correctionEntryRepository.findByExam(examId);
    const completedCandidateIds = new Set(
      allCorrections
        .filter((c) => c.status === 'completed')
        .map((c) => c.candidateId)
    );

    const completedCandidates = exam.candidates.filter((candidate) =>
      completedCandidateIds.has(candidate.id)
    );

    if (completedCandidates.length === 0) {
      throw new Error(
        'Keine abgeschlossenen Korrekturen vorhanden. Der Sammel-Export erfordert mindestens eine abgeschlossene Korrektur.'
      );
    }

    const projections: Exams.CorrectionSheetProjection[] = [];
    for (const candidate of completedCandidates) {
      projections.push(
        await this.buildCorrectionSheetProjectionUseCase.execute(examId, candidate.id)
      );
    }

    return this.renderer.render(
      projections,
      buildCorrectionSheetFileNameBase(exam.title, 'all')
    );
  }
}
