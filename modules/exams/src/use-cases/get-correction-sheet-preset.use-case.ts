import { Exams } from '@viccoboard/core';
import {
  CorrectionSheetPresetRepository,
  createDefaultCorrectionSheetPreset
} from '../repositories/correction-sheet-preset.repository';

export class GetCorrectionSheetPresetUseCase {
  constructor(
    private readonly presetRepository: CorrectionSheetPresetRepository
  ) {}

  async execute(examId: string): Promise<Exams.CorrectionSheetPreset> {
    const preset = await this.presetRepository.findByExamId(examId);
    return preset ?? createDefaultCorrectionSheetPreset(examId);
  }
}
