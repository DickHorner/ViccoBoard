import { Exams } from '@viccoboard/core';
import { CorrectionSheetPresetRepository } from '../repositories/correction-sheet-preset.repository';

export type SaveCorrectionSheetPresetInput =
  Omit<Exams.CorrectionSheetPreset, 'updatedAt'> & {
    updatedAt?: Date;
  };

export class SaveCorrectionSheetPresetUseCase {
  constructor(
    private readonly presetRepository: CorrectionSheetPresetRepository
  ) {}

  async execute(
    input: SaveCorrectionSheetPresetInput
  ): Promise<Exams.CorrectionSheetPreset> {
    return this.presetRepository.save(input);
  }
}
