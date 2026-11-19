import { Exams } from '@viccoboard/core';
import type { ExamRepository } from './exam.repository';
import type { CorrectionSheetTemplateRepository } from './correction-sheet-template.repository';

const CORRECTION_SHEET_PRESET_KIND = 'correction-sheet-preset';

function createFeedbackContent(preset: Exams.CorrectionSheetPreset): Exams.FeedbackContent {
  return {
    showTaskBreakdown: preset.showTaskPoints,
    showCriteria: false,
    showPercentages: false,
    showPointDeductions: false,
    showComments: preset.showTaskComments || preset.showGeneralComment,
    showSupportTips: preset.showSupportTips,
    formatCriteriaText: false,
    italicizeComments: false
  };
}

function createFeedbackLayout(
  preset: Exams.CorrectionSheetPreset
): Exams.FeedbackLayout {
  return {
    id: `${preset.id}-layout`,
    name: preset.layoutMode === 'compact' ? 'Kompakt' : 'Standard',
    type: preset.layoutMode === 'compact' ? 'compact' : 'detailed',
    pageSize: 'A4',
    orientation: 'portrait'
  };
}

function createDefaultName(): string {
  return 'Rückmeldebogen';
}

export function createDefaultCorrectionSheetPreset(
  examId: string,
  timestamp: Date = new Date()
): Exams.CorrectionSheetPreset {
  return {
    id: `correction-sheet-preset:${examId}`,
    examId,
    name: createDefaultName(),
    layoutMode: 'standard',
    showHeader: true,
    showOverallPoints: true,
    showGrade: true,
    showTaskPoints: true,
    showTaskComments: true,
    showGeneralComment: true,
    showSupportTips: true,
    showTaskPercentages: false,
    italicizeFeedback: true,
    showPointDeductions: false,
    showExamParts: true,
    showSignatureArea: false,
    showSignatureDate: true,
    signaturePositionX: 0,
    signaturePositionY: 0,
    headerText: '',
    footerText: '',
    updatedAt: timestamp
  };
}

export class CorrectionSheetPresetRepository {
  constructor(
    private readonly examRepository: ExamRepository,
    private readonly templateRepository: CorrectionSheetTemplateRepository
  ) {}

  async findByExamId(examId: string): Promise<Exams.CorrectionSheetPreset | null> {
    const exam = await this.examRepository.findById(examId);
    if (!exam) {
      throw new Error(`Exam ${examId} not found`);
    }

    const presetEntry = exam.printPresets.find((preset) => {
      return preset.metadata?.kind === CORRECTION_SHEET_PRESET_KIND;
    });

    if (!presetEntry) {
      return null;
    }

    const templateId = presetEntry.metadata?.correctionSheetTemplateId;
    if (typeof templateId === 'string' && templateId) {
      const template = await this.templateRepository.findById(templateId);
      if (!template) throw new Error('Die verknüpfte Druckbogenvorlage wurde nicht gefunden.');
      return {
        ...template.preset,
        id: presetEntry.id,
        examId,
        templateId,
        updatedAt: template.lastModified
      };
    }

    const metadata = presetEntry.metadata?.correctionSheetPreset;
    if (!metadata || typeof metadata !== 'object') {
      return null;
    }

    const raw = metadata as Partial<Exams.CorrectionSheetPreset>;
    return {
      ...createDefaultCorrectionSheetPreset(examId),
      ...raw,
      id: raw.id ?? presetEntry.id ?? `correction-sheet-preset:${examId}`,
      name: raw.name ?? presetEntry.name ?? createDefaultName(),
      examId,
      updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date()
    };
  }

  async save(
    presetInput: Omit<Exams.CorrectionSheetPreset, 'updatedAt'> & { updatedAt?: Date }
  ): Promise<Exams.CorrectionSheetPreset> {
    const exam = await this.examRepository.findById(presetInput.examId);
    if (!exam) {
      throw new Error(`Exam ${presetInput.examId} not found`);
    }

    const templateId = presetInput.templateId;
    const template = templateId
      ? await this.templateRepository.findById(templateId)
      : null;
    if (templateId && !template) {
      throw new Error('Die verknüpfte Druckbogenvorlage wurde nicht gefunden.');
    }

    const preset: Exams.CorrectionSheetPreset = template
      ? {
          ...template.preset,
          id: `correction-sheet-preset:${exam.id}`,
          examId: exam.id,
          templateId,
          updatedAt: template.lastModified
        }
      : {
          ...createDefaultCorrectionSheetPreset(presetInput.examId),
          ...presetInput,
          templateId: undefined,
          updatedAt: presetInput.updatedAt ?? new Date()
        };

    const persistedPreset: Exams.PrintPreset = {
      id: preset.id,
      name: preset.name,
      layout: createFeedbackLayout(preset),
      header: {
        examTitle: exam.title,
        examDate: exam.date,
        customFields: {
          headerText: preset.headerText ?? ''
        }
      },
      content: createFeedbackContent(preset),
      footer: {
        customText: preset.footerText ?? '',
        signatureType: preset.showSignatureArea ? 'empty' : 'empty'
      },
      isDefault: true,
      metadata: templateId
        ? {
            kind: CORRECTION_SHEET_PRESET_KIND,
            correctionSheetTemplateId: templateId
          }
        : {
            kind: CORRECTION_SHEET_PRESET_KIND,
            correctionSheetPreset: {
              ...preset,
              updatedAt: preset.updatedAt.toISOString()
            }
          }
    };

    const remainingPresets = exam.printPresets.filter((entry) => {
      return entry.metadata?.kind !== CORRECTION_SHEET_PRESET_KIND;
    });

    await this.examRepository.update(exam.id, {
      printPresets: [persistedPreset, ...remainingPresets]
    });

    return preset;
  }
}
