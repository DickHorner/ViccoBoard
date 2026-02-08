/**
 * Tests for Support Tip Management Service
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
// @ts-ignore - test file import resolution handled by test runner
import { SupportTipManagementService, SupportTipUIHelper } from '../services/support-tip-management.service';
import { Exams } from '@viccoboard/core';

describe('SupportTipManagementService', () => {
  let testTip: Exams.SupportTip;
  let testCorrection: Exams.CorrectionEntry;

  beforeEach(() => {
    testTip = SupportTipManagementService.createSupportTip(
      'Decimal places',
      'Practice working with decimal numbers',
      {
        category: 'Math',
        tags: ['decimals', 'arithmetic'],
        priority: 3,
        weight: 5
      }
    );

    testCorrection = {
      id: 'correction-1',
      examId: 'exam-1',
      candidateId: 'candidate-1',
      taskScores: [],
      totalPoints: 50,
      totalGrade: '2',
      percentageScore: 50,
      comments: [],
      supportTips: [],
      status: 'completed',
      lastModified: new Date()
    };
  });

  describe('createSupportTip', () => {
    it('should create a support tip', () => {
      const tip = SupportTipManagementService.createSupportTip(
        'Test Tip',
        'Test description'
      );

      expect(tip.title).toBe('Test Tip');
      expect(tip.shortDescription).toBe('Test description');
      expect(tip.id).toBeDefined();
      expect(tip.usageCount).toBe(0);
      expect(tip.weight).toBe(1);
    });

    it('should create with optional parameters', () => {
      const tip = SupportTipManagementService.createSupportTip(
        'Advanced Tip',
        'Description',
        {
          category: 'Physics',
          tags: ['forces'],
          priority: 2,
          weight: 8
        }
      );

      expect(tip.category).toBe('Physics');
      expect(tip.tags).toEqual(['forces']);
      expect(tip.priority).toBe(2);
      expect(tip.weight).toBe(8);
    });
  });

  describe('updateSupportTip', () => {
    it('should update support tip', () => {
      const updated = SupportTipManagementService.updateSupportTip(testTip, {
        title: 'Updated Title',
        weight: 8
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.weight).toBe(8);
      expect(updated.id).toBe(testTip.id);
      expect(updated.shortDescription).toBe(testTip.shortDescription);
    });

    it('should preserve creation date', () => {
      const updated = SupportTipManagementService.updateSupportTip(testTip, {
        title: 'New Title'
      });

      expect(updated.createdAt.getTime()).toBe(testTip.createdAt.getTime());
    });
  });

  describe('addLink', () => {
    it('should add link to support tip', () => {
      const updated = SupportTipManagementService.addLink(
        testTip,
        'Khan Academy',
        'https://www.khanacademy.org/math/decimals'
      );

      expect(updated.links.length).toBe(1);
      expect(updated.links[0].title).toBe('Khan Academy');
      expect(updated.links[0].url).toBe('https://www.khanacademy.org/math/decimals');
    });

    it('should not allow more than 3 links', () => {
      let updated = testTip;
      for (let i = 0; i < 3; i++) {
        updated = SupportTipManagementService.addLink(
          updated,
          `Link ${i + 1}`,
          `https://example.com/${i}`
        );
      }

      expect(updated.links.length).toBe(3);
      expect(() => {
        SupportTipManagementService.addLink(
          updated,
          'Link 4',
          'https://example.com/4'
        );
      }).toThrow();
    });
  });

  describe('removeLink', () => {
    it('should remove link from support tip', () => {
      let updated = SupportTipManagementService.addLink(
        testTip,
        'Test Link',
        'https://example.com'
      );
      const linkId = updated.links[0].url;

      updated = SupportTipManagementService.removeLink(updated, linkId);
      expect(updated.links.length).toBe(0);
    });
  });

  describe('validateSupportTip', () => {
    it('should validate valid support tip', () => {
      const result = SupportTipManagementService.validateSupportTip(testTip);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject empty title', () => {
      const invalid = { ...testTip, title: '' };
      const result = SupportTipManagementService.validateSupportTip(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('Title'))).toBe(true);
    });

    it('should reject empty description', () => {
      const invalid = { ...testTip, shortDescription: '' };
      const result = SupportTipManagementService.validateSupportTip(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('description'))).toBe(true);
    });

    it('should reject invalid URLs', () => {
      const invalid = {
        ...testTip,
        links: [
          {
            title: 'Bad Link',
            url: 'not-a-url'
          }
        ]
      };
      const result = SupportTipManagementService.validateSupportTip(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('URL'))).toBe(true);
    });
  });

  describe('searchSupportTips', () => {
    let tips: Exams.SupportTip[];

    beforeEach(() => {
      tips = [
        SupportTipManagementService.createSupportTip(
          'Decimals Basic',
          'Learn decimal basics',
          { category: 'Math', tags: ['basic', 'decimals'] }
        ),
        SupportTipManagementService.createSupportTip(
          'Fractions Advanced',
          'Advanced fraction techniques',
          { category: 'Math', tags: ['advanced', 'fractions'] }
        ),
        SupportTipManagementService.createSupportTip(
          'Article Writing',
          'Technical article writing guide',
          { category: 'English', tags: ['writing', 'articles'] }
        )
      ];
    });

    it('should search by title', () => {
      const results = SupportTipManagementService.searchSupportTips(tips, 'Decimal');
      expect(results.length).toBe(1);
      expect(results[0].title).toContain('Decimal');
    });

    it('should search by description', () => {
      const results = SupportTipManagementService.searchSupportTips(tips, 'fraction');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should filter by category', () => {
      const results = SupportTipManagementService.searchSupportTips(
        tips,
        '',
        { category: 'English' }
      );
      expect(results.length).toBe(1);
      expect(results[0].category).toBe('English');
    });

    it('should sort by usage', () => {
      tips[0].usageCount = 10;
      tips[1].usageCount = 5;
      tips[2].usageCount = 0;

      const results = SupportTipManagementService.searchSupportTips(
        tips,
        '',
        { sortBy: 'usage' }
      );

      expect(results[0].usageCount).toBeGreaterThanOrEqual(results[1].usageCount);
    });

    it('should limit results', () => {
      const results = SupportTipManagementService.searchSupportTips(
        tips,
        '',
        { limit: 2 }
      );
      expect(results.length).toBeLessThanOrEqual(2);
    });
  });

  describe('getMostUsedTips', () => {
    it('should return tips sorted by usage', () => {
      const tips = [
        { ...testTip, id: '1', usageCount: 10 },
        { ...testTip, id: '2', usageCount: 5 },
        { ...testTip, id: '3', usageCount: 0 }
      ];

      const result = SupportTipManagementService.getMostUsedTips(tips, 10);
      expect(result.length).toBe(2); // Only tips with usage > 0
      expect(result[0].usageCount).toBe(10);
      expect(result[1].usageCount).toBe(5);
    });

    it('should respect limit', () => {
      const tips = Array.from({ length: 15 }, (_, i) => ({
        ...testTip,
        id: `tip-${i}`,
        usageCount: 15 - i
      }));

      const result = SupportTipManagementService.getMostUsedTips(tips, 5);
      expect(result.length).toBeLessThanOrEqual(5);
    });
  });

  describe('assignTipToCorrection', () => {
    it('should assign tip to correction', () => {
      const updated = SupportTipManagementService.assignTipToCorrection(
        testCorrection,
        testTip.id
      );

      expect(updated.supportTips.length).toBe(1);
      expect(updated.supportTips[0].supportTipId).toBe(testTip.id);
    });

    it('should not assign same tip twice', () => {
      let updated = SupportTipManagementService.assignTipToCorrection(
        testCorrection,
        testTip.id
      );
      updated = SupportTipManagementService.assignTipToCorrection(
        updated,
        testTip.id
      );

      expect(updated.supportTips.length).toBe(1);
    });

    it('should allow task-specific assignment', () => {
      const updated = SupportTipManagementService.assignTipToCorrection(
        testCorrection,
        testTip.id,
        'task-1'
      );

      expect(updated.supportTips[0].taskId).toBe('task-1');
    });
  });

  describe('removeTipFromCorrection', () => {
    it('should remove tip from correction', () => {
      let updated = SupportTipManagementService.assignTipToCorrection(
        testCorrection,
        testTip.id
      );

      updated = SupportTipManagementService.removeTipFromCorrection(
        updated,
        testTip.id
      );

      expect(updated.supportTips.length).toBe(0);
    });
  });

  describe('getTipsForCorrection', () => {
    it('should return assigned tips', () => {
      const correction = SupportTipManagementService.assignTipToCorrection(
        testCorrection,
        testTip.id
      );

      const result = SupportTipManagementService.getTipsForCorrection(
        [testTip],
        correction
      );

      expect(result.length).toBe(1);
      expect(result[0].id).toBe(testTip.id);
    });

    it('should filter by task', () => {
      const tip2 = SupportTipManagementService.createSupportTip('Tip2', 'Desc2');
      let correction = SupportTipManagementService.assignTipToCorrection(
        testCorrection,
        testTip.id,
        'task-1'
      );
      correction = SupportTipManagementService.assignTipToCorrection(
        correction,
        tip2.id,
        undefined
      );

      const taskSpecific = SupportTipManagementService.getTipsForCorrection(
        [testTip, tip2],
        correction,
        'task-1'
      );

      expect(taskSpecific.length).toBeGreaterThan(0);
    });
  });

  describe('getSummaryForExam', () => {
    it('should calculate usage summary', () => {
      const tip2 = SupportTipManagementService.createSupportTip('Tip2', 'Desc2');
      const corrections = [
        SupportTipManagementService.assignTipToCorrection(testCorrection, testTip.id),
        SupportTipManagementService.assignTipToCorrection(
          {
            ...testCorrection,
            candidateId: 'c2'
          },
          tip2.id
        )
      ];

      const summary = SupportTipManagementService.getSummaryForExam(
        [testTip, tip2],
        corrections
      );

      expect(summary.totalTipsAssigned).toBe(2);
      expect(summary.averageTipsPerStudent).toBeGreaterThan(0);
    });
  });
});

describe('SupportTipUIHelper', () => {
  let testTip: Exams.SupportTip;

  beforeEach(() => {
    testTip = SupportTipManagementService.createSupportTip(
      'Test Tip',
      'Test description',
      { category: 'Math', weight: 5 }
    );
  });

  describe('formatTipForDropdown', () => {
    it('should format for dropdown display', () => {
      const formatted = SupportTipUIHelper.formatTipForDropdown(testTip);

      expect(formatted.label).toBe(testTip.title);
      expect(formatted.description).toBe(testTip.shortDescription);
      expect(formatted.metadata).toBeDefined();
      expect(formatted.icon).toBeDefined();
    });
  });

  describe('getWeightColor', () => {
    it('should return appropriate color for weight', () => {
      expect(SupportTipUIHelper.getWeightColor(9)).toBe('#dc3545'); // Red
      expect(SupportTipUIHelper.getWeightColor(6)).toBe('#ffc107'); // Orange
      expect(SupportTipUIHelper.getWeightColor(2)).toBe('#28a745'); // Green
    });
  });

  describe('formatWeight', () => {
    it('should format weight as stars', () => {
      const formatted = SupportTipUIHelper.formatWeight(5);
      expect(formatted).toContain('★');
      expect(formatted).toContain('☆');
    });
  });

  describe('getLinkTypeIcon', () => {
    it('should return icon for link type', () => {
      expect(SupportTipUIHelper.getLinkTypeIcon('video')).toBe('▶️');
      expect(SupportTipUIHelper.getLinkTypeIcon('article')).toBe('📄');
      expect(SupportTipUIHelper.getLinkTypeIcon('exercise')).toBe('✏️');
      expect(SupportTipUIHelper.getLinkTypeIcon('tool')).toBe('🛠️');
    });
  });
});
