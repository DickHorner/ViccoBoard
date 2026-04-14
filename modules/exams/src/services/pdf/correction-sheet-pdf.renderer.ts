import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from 'pdf-lib';
import { Exams } from '@viccoboard/core';

const PAGE_MARGIN = 40;
const HEADER_GAP = 20;
const NORMAL_FONT_SIZE = 11;
const SMALL_FONT_SIZE = 9;
const TITLE_FONT_SIZE = 18;
const LINE_HEIGHT = 14;

function sanitizeFileNamePart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatExamDate(date?: Date): string | null {
  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

function wrapText(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
  if (!text.trim()) {
    return [];
  }

  const words = text.replace(/\r/g, '').split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    const nextWidth = font.widthOfTextAtSize(nextLine, fontSize);

    if (nextWidth <= maxWidth || !currentLine) {
      currentLine = nextLine;
      continue;
    }

    lines.push(currentLine);
    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

export class CorrectionSheetPdfRenderer {
  async render(
    projections: Exams.CorrectionSheetProjection[],
    fileNameBase: string
  ): Promise<Exams.CorrectionSheetPdfDocument> {
    if (projections.length === 0) {
      throw new Error('At least one correction sheet projection is required');
    }

    const document = await PDFDocument.create();
    const regularFont = await document.embedFont(StandardFonts.Helvetica);
    const boldFont = await document.embedFont(StandardFonts.HelveticaBold);

    for (const projection of projections) {
      await this.renderProjection(document, projection, regularFont, boldFont);
    }

    return {
      bytes: await document.save(),
      fileName: `${sanitizeFileNamePart(fileNameBase) || 'rueckmeldeboegen'}.pdf`,
      candidateCount: projections.length
    };
  }

  private async renderProjection(
    document: PDFDocument,
    projection: Exams.CorrectionSheetProjection,
    regularFont: PDFFont,
    boldFont: PDFFont
  ): Promise<void> {
    let page = document.addPage();
    let { width, height } = page.getSize();
    let cursorY = height - PAGE_MARGIN;

    const ensureSpace = (requiredHeight: number): void => {
      if (cursorY - requiredHeight >= PAGE_MARGIN) {
        return;
      }

      page = document.addPage();
      ({ width, height } = page.getSize());
      cursorY = height - PAGE_MARGIN;
    };

    const drawTextLine = (
      text: string,
      options?: { size?: number; font?: PDFFont; x?: number; color?: { r: number; g: number; b: number } }
    ): void => {
      const size = options?.size ?? NORMAL_FONT_SIZE;
      const font = options?.font ?? regularFont;
      const x = options?.x ?? PAGE_MARGIN;
      ensureSpace(LINE_HEIGHT + 2);
      page.drawText(text, {
        x,
        y: cursorY,
        size,
        font,
        color: options?.color
          ? rgb(options.color.r, options.color.g, options.color.b)
          : undefined
      });
      cursorY -= LINE_HEIGHT + 2;
    };

    const drawParagraph = (
      text: string,
      options?: { size?: number; font?: PDFFont; indent?: number }
    ): void => {
      const size = options?.size ?? NORMAL_FONT_SIZE;
      const font = options?.font ?? regularFont;
      const indent = options?.indent ?? 0;
      const maxWidth = width - PAGE_MARGIN * 2 - indent;
      const lines = wrapText(text, maxWidth, font, size);

      for (const line of lines) {
        drawTextLine(line, { size, font, x: PAGE_MARGIN + indent });
      }
    };

    if (projection.showHeader) {
      drawTextLine(projection.examTitle, { size: TITLE_FONT_SIZE, font: boldFont });

      const metaBits = [
        projection.candidateName,
        formatExamDate(projection.examDate)
      ].filter(Boolean);
      drawTextLine(metaBits.join(' | '), { size: NORMAL_FONT_SIZE, font: regularFont });

      if (projection.headerText) {
        cursorY -= 4;
        drawParagraph(projection.headerText, { size: NORMAL_FONT_SIZE });
      }

      cursorY -= HEADER_GAP;
    }

    if (projection.showOverallPoints || projection.showGrade) {
      const summaryParts: string[] = [];

      if (projection.showOverallPoints) {
        summaryParts.push(`Gesamtpunkte: ${projection.totalPoints} / ${projection.maxPoints}`);
      }

      if (projection.showGrade && projection.grade !== undefined) {
        summaryParts.push(`Note: ${projection.grade}`);
      }

      drawTextLine(summaryParts.join('    '), { size: NORMAL_FONT_SIZE, font: boldFont });
      cursorY -= 6;
    }

    const headerLine = projection.layoutMode === 'compact'
      ? 'Aufgabe | Punkte'
      : 'Aufgabe | Punkte | Kommentar';
    drawTextLine(headerLine, { size: SMALL_FONT_SIZE, font: boldFont });
    page.drawLine({
      start: { x: PAGE_MARGIN, y: cursorY + 2 },
      end: { x: width - PAGE_MARGIN, y: cursorY + 2 },
      thickness: 1
    });
    cursorY -= 10;

    for (const row of projection.taskRows) {
      ensureSpace(60);
      const labelPrefix = row.partLabel ? `${row.partLabel} - ` : '';
      drawTextLine(`${labelPrefix}${row.label}`, { font: boldFont });

      if (projection.showTaskPoints) {
        drawTextLine(
          `${row.awardedPoints} / ${row.maxPoints} Punkte`,
          { size: SMALL_FONT_SIZE, color: { r: 0.27, g: 0.32, b: 0.39 } }
        );
      }

      if (projection.showTaskComments && row.comment) {
        drawParagraph(row.comment, {
          size: projection.layoutMode === 'compact' ? SMALL_FONT_SIZE : NORMAL_FONT_SIZE,
          indent: 12
        });
      }

      cursorY -= projection.layoutMode === 'compact' ? 6 : 10;
    }

    if (projection.showGeneralComment && projection.generalComment) {
      ensureSpace(70);
      drawTextLine('Gesamtkommentar', { font: boldFont });
      drawParagraph(projection.generalComment, {
        size: NORMAL_FONT_SIZE,
        indent: 12
      });
      cursorY -= 6;
    }

    if (projection.showSignatureArea) {
      ensureSpace(50);
      drawTextLine('Unterschrift', { font: boldFont });
      page.drawLine({
        start: { x: PAGE_MARGIN, y: cursorY - 8 },
        end: { x: PAGE_MARGIN + 180, y: cursorY - 8 },
        thickness: 0.8
      });
      cursorY -= 28;
    }

    if (projection.footerText) {
      ensureSpace(40);
      drawParagraph(projection.footerText, { size: SMALL_FONT_SIZE });
    }
  }
}

export function buildCorrectionSheetFileNameBase(
  examTitle: string,
  scope: 'single' | 'all',
  candidateName?: string
): string {
  const examSlug = sanitizeFileNamePart(examTitle) || 'pruefung';
  if (scope === 'all') {
    return `${examSlug}-rueckmeldeboegen`;
  }

  const candidateSlug = sanitizeFileNamePart(candidateName || 'kandidat');
  return `${examSlug}-${candidateSlug}-rueckmeldebogen`;
}
