import { Exams } from '@viccoboard/core';
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
    private readonly renderer: CorrectionSheetPdfRenderer = new CorrectionSheetPdfRenderer()
  ) {}

  async exportCurrentCandidatePdf(
    examId: string,
    candidateId: string
  ): Promise<Exams.CorrectionSheetPdfDocument> {
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

    const projections: Exams.CorrectionSheetProjection[] = [];
    for (const candidate of exam.candidates) {
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
