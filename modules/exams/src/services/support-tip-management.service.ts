/**
 * Support Tips Management Service
 * Business logic for managing supporttips (Fördertipps)
 * Handles searching, filtering, assigning, and tracking usage
 */

import { Exams } from '@viccoboard/core';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

/**
 * QR Code generator options
 * In production, would use a library like 'qrcode'
 */
interface QRCodeOptions {
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
}

export class SupportTipManagementService {
  /**
   * Create a new support tip
   */
  static createSupportTip(
    title: string,
    shortDescription: string,
    options: {
      category?: string;
      tags?: string[];
      links?: Exams.SupportTipLink[];
      priority?: number;
      weight?: number;
    } = {}
  ): Exams.SupportTip {
    return {
      id: uuidv4(),
      title,
      shortDescription,
      category: options.category,
      tags: options.tags || [],
      links: options.links || [],
      priority: options.priority ?? 0,
      weight: options.weight ?? 1,
      usageCount: 0,
      createdAt: new Date(),
      lastModified: new Date()
    };
  }

  /**
   * Update a support tip
   */
  static updateSupportTip(
    tip: Exams.SupportTip,
    updates: Partial<Exams.SupportTip>
  ): Exams.SupportTip {
    return {
      ...tip,
      ...updates,
      id: tip.id, // preserve ID
      createdAt: tip.createdAt, // preserve creation date
      lastModified: new Date()
    };
  }

  /**
   * Add a link to a support tip
   */
  static addLink(
    tip: Exams.SupportTip,
    title: string,
    url: string,
    linkType: 'video' | 'article' | 'exercise' | 'tool' = 'article'
  ): Exams.SupportTip {
    if (tip.links.length >= 3) {
      throw new Error('Maximum 3 links per support tip');
    }

    const newLink: Exams.SupportTipLink = {
      title,
      url
    };

    return {
      ...tip,
      links: [...tip.links, newLink],
      lastModified: new Date()
    };
  }

  /**
   * Remove a link from a support tip
   */
  static removeLink(tip: Exams.SupportTip, linkId: string): Exams.SupportTip {
    return {
      ...tip,
      links: tip.links.filter(l => l.url !== linkId && l.title !== linkId),
      lastModified: new Date()
    };
  }

  /**
   * Validate support tip
   */
  static validateSupportTip(tip: Exams.SupportTip): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!tip.title || tip.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (tip.title && tip.title.length > 200) {
      errors.push('Title must not exceed 200 characters');
    }

    if (!tip.shortDescription || tip.shortDescription.trim().length === 0) {
      errors.push('Short description is required');
    }

    if (tip.shortDescription && tip.shortDescription.length > 500) {
      errors.push('Short description must not exceed 500 characters');
    }

    if (tip.links && tip.links.length > 3) {
      errors.push('Maximum 3 links allowed');
    }

    for (const link of tip.links || []) {
      if (!link.url.startsWith('http://') && !link.url.startsWith('https://')) {
        errors.push(`Invalid URL: ${link.url}`);
      }
    }

    if (tip.weight < 0 || tip.weight > 10) {
      errors.push('Weight must be between 0 and 10');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate QR code for a support tip
   * Returns a simple URL-encoded QR code data URI
   */
  static generateQRCode(
    tip: Exams.SupportTip,
    options: QRCodeOptions = {}
  ): string {
    const data = JSON.stringify({
      id: tip.id,
      title: tip.title,
      description: tip.shortDescription,
      category: tip.category,
      links: tip.links.map(l => ({ title: l.title, url: l.url }))
    });

    const margin = options.margin ?? 2;
    const renderedSize = options.size || 200;
    const qrCode = QRCode.create(data, {
      errorCorrectionLevel: options.level ?? 'M'
    });
    const moduleSize = qrCode.modules.size;
    const viewBoxSize = moduleSize + margin * 2;
    const rects: string[] = [];

    for (let y = 0; y < moduleSize; y++) {
      for (let x = 0; x < moduleSize; x++) {
        if (qrCode.modules.get(x, y)) {
          rects.push(`<rect x="${x + margin}" y="${y + margin}" width="1" height="1" fill="#000"/>`);
        }
      }
    }

    const svg = [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" width="${renderedSize}" height="${renderedSize}" shape-rendering="crispEdges">`,
      `<rect width="${viewBoxSize}" height="${viewBoxSize}" fill="#fff"/>`,
      ...rects,
      '</svg>'
    ].join('');

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  /**
   * Search support tips by query
   */
  static searchSupportTips(
    tips: Exams.SupportTip[],
    query: string,
    options: {
      category?: string;
      tags?: string[];
      sortBy?: 'title' | 'usage' | 'weight' | 'recent';
      limit?: number;
    } = {}
  ): Exams.SupportTip[] {
    const queryLower = query.toLowerCase();

    let filtered = tips.filter(tip => {
      const matchesQuery =
        tip.title.toLowerCase().includes(queryLower) ||
        tip.shortDescription.toLowerCase().includes(queryLower) ||
        tip.tags.some(t => t.toLowerCase().includes(queryLower));

      const matchesCategory = !options.category || tip.category === options.category;

      const matchesTags =
        !options.tags || options.tags.length === 0 || options.tags.some(t => tip.tags.includes(t));

      return matchesQuery && matchesCategory && matchesTags;
    });

    // Sort
    switch (options.sortBy) {
      case 'usage':
        filtered.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
        break;
      case 'weight':
        filtered.sort((a, b) => b.weight - a.weight);
        break;
      case 'recent':
        filtered.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
        break;
      case 'title':
      default:
        filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    // Limit
    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  /**
   * Get most frequently used support tips
   */
  static getMostUsedTips(tips: Exams.SupportTip[], limit: number = 10): Exams.SupportTip[] {
    return [...tips]
      .filter(tip => (tip.usageCount || 0) > 0)
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, limit);
  }

  /**
   * Get tips by category with usage count
   */
  static getTipsByCategory(tips: Exams.SupportTip[]): Map<string | undefined, Exams.SupportTip[]> {
    const categories = new Map<string | undefined, Exams.SupportTip[]>();

    for (const tip of tips) {
      const cat = tip.category || 'Uncategorized';
      if (!categories.has(cat)) {
        categories.set(cat, []);
      }
      categories.get(cat)!.push(tip);
    }

    return categories;
  }

  /**
   * Assign support tip to a correction
   */
  static assignTipToCorrection(
    correction: Exams.CorrectionEntry,
    tipId: string,
    taskId?: string
  ): Exams.CorrectionEntry {
    const existingTip = correction.supportTips.find(st => st.supportTipId === tipId);
    if (existingTip) {
      return correction; // Already assigned
    }

    const newAssignment: Exams.AssignedSupportTip = {
      supportTipId: tipId,
      assignedAt: new Date(),
      taskId
    };

    return {
      ...correction,
      supportTips: [...correction.supportTips, newAssignment],
      lastModified: new Date()
    };
  }

  /**
   * Remove support tip from correction
   */
  static removeTipFromCorrection(
    correction: Exams.CorrectionEntry,
    tipId: string
  ): Exams.CorrectionEntry {
    return {
      ...correction,
      supportTips: correction.supportTips.filter(st => st.supportTipId !== tipId),
      lastModified: new Date()
    };
  }

  /**
   * Get tips assigned to a correction
   */
  static getTipsForCorrection(
    tips: Exams.SupportTip[],
    correction: Exams.CorrectionEntry,
    taskId?: string
  ): Exams.SupportTip[] {
    return tips.filter(tip => {
      const assignment = correction.supportTips.find(st => st.supportTipId === tip.id);
      if (!assignment) return false;

      if (taskId) {
        return !assignment.taskId || assignment.taskId === taskId;
      }

      return true;
    });
  }

  /**
   * Copy tips from one student to another (for reuse across similar mistakes)
   */
  static copyTipsFromCorrection(
    fromCorrection: Exams.CorrectionEntry,
    toCorrection: Exams.CorrectionEntry,
    tipIds?: string[]
  ): Exams.CorrectionEntry {
    let tips = fromCorrection.supportTips;
    if (tipIds) {
      tips = tips.filter(t => tipIds.includes(t.supportTipId));
    }

    const newTips = tips.map(t => ({
      ...t,
      assignedAt: new Date()
    }));

    return {
      ...toCorrection,
      supportTips: [
        ...toCorrection.supportTips,
        ...newTips.filter(
          newTip =>
            !toCorrection.supportTips.some(existingTip => existingTip.supportTipId === newTip.supportTipId)
        )
      ],
      lastModified: new Date()
    };
  }

  /**
   * Get summary of support tips usage for aclass/exam
   */
  static getSummaryForExam(
    tips: Exams.SupportTip[],
    corrections: Exams.CorrectionEntry[]
  ): {
    totalTipsAssigned: number;
    tipsByUsage: Array<{ tip: Exams.SupportTip; assignedCount: number }>;
    mostUsedTip: Exams.SupportTip | null;
    averageTipsPerStudent: number;
  } {
    const tipUsage = new Map<string, number>();

    for (const correction of corrections) {
      for (const assignment of correction.supportTips) {
        const count = tipUsage.get(assignment.supportTipId) || 0;
        tipUsage.set(assignment.supportTipId, count + 1);
      }
    }

    const tipsByUsage = Array.from(tipUsage.entries())
      .map(([tipId, count]) => ({
        tip: tips.find(t => t.id === tipId)!,
        assignedCount: count
      }))
      .filter(item => item.tip)
      .sort((a, b) => b.assignedCount - a.assignedCount);

    const totalAssignments = corrections.reduce((sum, c) => sum + c.supportTips.length, 0);

    return {
      totalTipsAssigned: tipUsage.size,
      tipsByUsage,
      mostUsedTip: tipsByUsage[0]?.tip || null,
      averageTipsPerStudent: corrections.length > 0 ? totalAssignments / corrections.length : 0
    };
  }

  /**
   * Batch assign tips to corrections
   */
  static batchAssignTips(
    corrections: Exams.CorrectionEntry[],
    tipIds: string[],
    filter?: (correction: Exams.CorrectionEntry) => boolean
  ): Exams.CorrectionEntry[] {
    return corrections.map(correction => {
      if (filter && !filter(correction)) {
        return correction;
      }

      let updated = correction;
      for (const tipId of tipIds) {
        updated = this.assignTipToCorrection(updated, tipId);
      }
      return updated;
    });
  }
}

/**
 * UI Helper for support tips
 */
export class SupportTipUIHelper {
  /**
   * Format support tip for display
   */
  static formatTipForDropdown(tip: Exams.SupportTip): {
    label: string;
    description: string;
    metadata: string;
    icon: string;
  } {
    const usageText = tip.usageCount === 0 ? 'NEW' : `Used ${tip.usageCount}x`;
    const category = tip.category ? `[${tip.category}]` : '';

    return {
      label: `${tip.title}`,
      description: tip.shortDescription,
      metadata: `${usageText} ${category}`,
      icon: tip.usageCount >= 5 ? '⭐' : tip.usageCount > 0 ? '📌' : '+'
    };
  }

  /**
   * Get color indicator for weight
   */
  static getWeightColor(weight: number): string {
    if (weight >= 8) return '#dc3545'; // Red - high priority
    if (weight >= 5) return '#ffc107'; // Orange - medium priority
    return '#28a745'; // Green - low priority
  }

  /**
   * Format weight as visual indicator
   */
  static formatWeight(weight: number): string {
    return '★'.repeat(weight) + '☆'.repeat(10 - weight);
  }

  /**
   * Get link type icon
   */
  static getLinkTypeIcon(linkType: string): string {
    switch (linkType) {
      case 'video':
        return '▶️';
      case 'article':
        return '📄';
      case 'exercise':
        return '✏️';
      case 'tool':
        return '🛠️';
      default:
        return '🔗';
    }
  }
}
