/**
 * Tests for Comment Management Service
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { CommentManagementService, CorrectionCommentUseCase, type CommentTemplate } from '../src/services/comment-management.service';
import { Exams } from '@viccoboard/core';

describe('CommentManagementService', () => {
  let testComment: Exams.CorrectionComment;

  beforeEach(() => {
    testComment = {
      id: 'comment-1',
      taskId: 'task-1',
      level: 'task',
      text: 'Good attempt',
      printable: true,
      availableAfterReturn: true,
      timestamp: new Date()
    };
  });

  describe('createComment', () => {
    it('should create a comment with all required fields', () => {
      const comment = CommentManagementService.createComment('Test comment');
      expect(comment.text).toBe('Test comment');
      expect(comment.printable).toBe(true);
      expect(comment.availableAfterReturn).toBe(true);
      expect(comment.level).toBe('task');
      expect(comment.id).toBeDefined();
      expect(comment.timestamp).toBeDefined();
    });

    it('should create comment with custom parameters', () => {
      const comment = CommentManagementService.createComment(
        'Custom comment',
        'task-2',
        'subtask',
        false,
        false
      );
      expect(comment.text).toBe('Custom comment');
      expect(comment.taskId).toBe('task-2');
      expect(comment.level).toBe('subtask');
      expect(comment.printable).toBe(false);
      expect(comment.availableAfterReturn).toBe(false);
    });

    it('should generate unique IDs for each comment', () => {
      const c1 = CommentManagementService.createComment('Comment 1');
      const c2 = CommentManagementService.createComment('Comment 2');
      expect(c1.id).not.toBe(c2.id);
    });
  });

  describe('updateComment', () => {
    it('should update comment text', () => {
      const updated = CommentManagementService.updateComment(testComment, {
        text: 'Updated text'
      });
      expect(updated.text).toBe('Updated text');
      expect(updated.id).toBe(testComment.id);
    });

    it('should update printable flag', () => {
      const updated = CommentManagementService.updateComment(testComment, {
        printable: false
      });
      expect(updated.printable).toBe(false);
    });

    it('should update availability flag', () => {
      const updated = CommentManagementService.updateComment(testComment, {
        availableAfterReturn: false
      });
      expect(updated.availableAfterReturn).toBe(false);
    });

    it('should preserve id and generate new timestamp', () => {
      const originalTime = testComment.timestamp;
      const updated = CommentManagementService.updateComment(testComment, {
        text: 'New text'
      });
      expect(updated.id).toBe(testComment.id);
      expect(updated.timestamp.getTime()).toBeGreaterThanOrEqual(originalTime.getTime());
    });
  });

  describe('getPrintableComments', () => {
    it('should filter only printable comments', () => {
      const comments: Exams.CorrectionComment[] = [
        { ...testComment, id: '1', printable: true },
        { ...testComment, id: '2', printable: false },
        { ...testComment, id: '3', printable: true }
      ];
      const result = CommentManagementService.getPrintableComments(comments);
      expect(result.length).toBe(2);
      expect(result.every(c => c.printable)).toBe(true);
    });

    it('should return empty array if no printable comments', () => {
      const comments: Exams.CorrectionComment[] = [
        { ...testComment, id: '1', printable: false },
        { ...testComment, id: '2', printable: false }
      ];
      const result = CommentManagementService.getPrintableComments(comments);
      expect(result.length).toBe(0);
    });
  });

  describe('getPostReturnComments', () => {
    it('should filter only post-return comments', () => {
      const comments: Exams.CorrectionComment[] = [
        { ...testComment, id: '1', availableAfterReturn: true },
        { ...testComment, id: '2', availableAfterReturn: false },
        { ...testComment, id: '3', availableAfterReturn: true }
      ];
      const result = CommentManagementService.getPostReturnComments(comments);
      expect(result.length).toBe(2);
      expect(result.every(c => c.availableAfterReturn)).toBe(true);
    });
  });

  describe('getCommentsByLevel', () => {
    it('should filter comments by level', () => {
      const comments: Exams.CorrectionComment[] = [
        { ...testComment, id: '1', level: 'exam' },
        { ...testComment, id: '2', level: 'task' },
        { ...testComment, id: '3', level: 'task' },
        { ...testComment, id: '4', level: 'subtask' }
      ];
      const result = CommentManagementService.getCommentsByLevel(comments, 'task');
      expect(result.length).toBe(2);
      expect(result.every(c => c.level === 'task')).toBe(true);
    });
  });

  describe('getTaskComments', () => {
    it('should get comments for specific task', () => {
      const comments: Exams.CorrectionComment[] = [
        { ...testComment, id: '1', taskId: 'task-1' },
        { ...testComment, id: '2', taskId: 'task-2' },
        { ...testComment, id: '3', taskId: 'task-1' }
      ];
      const result = CommentManagementService.getTaskComments(comments, 'task-1');
      expect(result.length).toBe(2);
      expect(result.every(c => c.taskId === 'task-1')).toBe(true);
    });
  });

  describe('getExamLevelComments', () => {
    it('should get exam-level comments only', () => {
      const comments: Exams.CorrectionComment[] = [
        { ...testComment, id: '1', level: 'exam', taskId: undefined },
        { ...testComment, id: '2', level: 'task', taskId: 'task-1' },
        { ...testComment, id: '3', level: 'exam', taskId: undefined }
      ];
      const result = CommentManagementService.getExamLevelComments(comments);
      expect(result.length).toBe(2);
      expect(result.every(c => c.level === 'exam' && !c.taskId)).toBe(true);
    });
  });

  describe('saveAsTemplate', () => {
    it('should save comment as template', () => {
      const template = CommentManagementService.saveAsTemplate(testComment, 'general');
      expect(template.text).toBe(testComment.text);
      expect(template.category).toBe('general');
      expect(template.usageCount).toBe(1);
      expect(template.lastUsed).toBeDefined();
    });

    it('should generate unique template ID', () => {
      const t1 = CommentManagementService.saveAsTemplate(testComment);
      const t2 = CommentManagementService.saveAsTemplate(testComment);
      expect(t1.id).not.toBe(t2.id);
    });
  });

  describe('getTemplates', () => {
    beforeEach(() => {
      // Clear templates
      CommentManagementService['templates'].clear();
    });

    it('should get all templates', () => {
      CommentManagementService.saveAsTemplate(testComment, 'cat-1');
      CommentManagementService.saveAsTemplate(testComment, 'cat-2');
      const templates = CommentManagementService.getTemplates();
      expect(templates.length).toBe(2);
    });

    it('should filter templates by category', () => {
      CommentManagementService.saveAsTemplate(testComment, 'general');
      CommentManagementService.saveAsTemplate(testComment, 'general');
      CommentManagementService.saveAsTemplate(testComment, 'specific');
      const templates = CommentManagementService.getTemplates('general');
      expect(templates.length).toBe(2);
      expect(templates.every(t => t.category === 'general')).toBe(true);
    });

    it('should sort by usage count', () => {
      const t1 = CommentManagementService.saveAsTemplate(testComment);
      const t2 = CommentManagementService.saveAsTemplate(testComment);
      CommentManagementService.useTemplate(t2.id);
      CommentManagementService.useTemplate(t2.id);
      const templates = CommentManagementService.getTemplates();
      expect(templates[0].id).toBe(t2.id); // t2 has higher usage
    });
  });

  describe('useTemplate', () => {
    beforeEach(() => {
      CommentManagementService['templates'].clear();
    });

    it('should increment usage count and update last used', () => {
      const template = CommentManagementService.saveAsTemplate(testComment);
      const original = CommentManagementService.useTemplate(template.id);
      expect(original?.usageCount).toBe(2);
      expect(original?.lastUsed).toBeDefined();
    });

    it('should return null for non-existent template', () => {
      const result = CommentManagementService.useTemplate('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('deleteTemplate', () => {
    beforeEach(() => {
      CommentManagementService['templates'].clear();
    });

    it('should delete template', () => {
      const template = CommentManagementService.saveAsTemplate(testComment);
      const deleted = CommentManagementService.deleteTemplate(template.id);
      expect(deleted).toBe(true);
      expect(CommentManagementService.getTemplates().length).toBe(0);
    });

    it('should return false if template does not exist', () => {
      const deleted = CommentManagementService.deleteTemplate('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('searchTemplates', () => {
    beforeEach(() => {
      CommentManagementService['templates'].clear();
    });

    it('should search templates by text', () => {
      const c1 = { ...testComment, text: 'Good effort' };
      const c2 = { ...testComment, text: 'Bad grammar' };
      CommentManagementService.saveAsTemplate(c1);
      CommentManagementService.saveAsTemplate(c2);
      const results = CommentManagementService.searchTemplates('good');
      expect(results.length).toBe(1);
      expect(results[0].text).toBe('Good effort');
    });

    it('should search templates by category', () => {
      CommentManagementService.saveAsTemplate(testComment, 'spelling');
      CommentManagementService.saveAsTemplate(testComment, 'grammar');
      const results = CommentManagementService.searchTemplates('spell');
      expect(results.length).toBe(1);
    });
  });

  describe('getMostUsedComments', () => {
    beforeEach(() => {
      CommentManagementService['templates'].clear();
    });

    it('should return most used comments in order', () => {
      const t1 = CommentManagementService.saveAsTemplate(testComment);
      const t2 = CommentManagementService.saveAsTemplate(testComment);
      for (let i = 0; i < 5; i++) {
        CommentManagementService.useTemplate(t2.id);
      }
      const results = CommentManagementService.getMostUsedComments(10);
      expect(results[0].id).toBe(t2.id);
    });

    it('should respect limit parameter', () => {
      for (let i = 0; i < 15; i++) {
        CommentManagementService.saveAsTemplate(testComment);
      }
      const results = CommentManagementService.getMostUsedComments(10);
      expect(results.length).toBe(10);
    });
  });

  describe('validateComment', () => {
    it('should validate valid comment', () => {
      const result = CommentManagementService.validateComment(testComment);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject empty comment', () => {
      const invalid = { ...testComment, text: '' };
      const result = CommentManagementService.validateComment(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject comment exceeding length limit', () => {
      const invalid = { ...testComment, text: 'a'.repeat(501) };
      const result = CommentManagementService.validateComment(invalid);
      expect(result.valid).toBe(false);
    });

    it('should reject invalid level', () => {
      const invalid = { ...testComment, level: 'invalid' as any };
      const result = CommentManagementService.validateComment(invalid);
      expect(result.valid).toBe(false);
    });
  });
});

describe('CorrectionCommentUseCase', () => {
  let correction: Exams.CorrectionEntry;
  let testComment: Exams.CorrectionComment;

  beforeEach(() => {
    testComment = {
      id: 'comment-1',
      taskId: 'task-1',
      level: 'task',
      text: 'Good work',
      printable: true,
      availableAfterReturn: true,
      timestamp: new Date()
    };

    correction = {
      id: 'correction-1',
      examId: 'exam-1',
      candidateId: 'candidate-1',
      taskScores: [],
      totalPoints: 50,
      totalGrade: '2',
      percentageScore: 80,
      comments: [],
      supportTips: [],
      status: 'in-progress',
      lastModified: new Date()
    };
  });

  describe('addCommentToCorrection', () => {
    it('should add comment to correction', () => {
      const updated = CorrectionCommentUseCase.addCommentToCorrection(correction, testComment);
      expect(updated.comments.length).toBe(1);
      expect(updated.comments[0].text).toBe('Good work');
    });

    it('should update existing comment with same id', () => {
      const c1 = CorrectionCommentUseCase.addCommentToCorrection(correction, testComment);
      const updated = { ...testComment, text: 'Updated' };
      const c2 = CorrectionCommentUseCase.addCommentToCorrection(c1, updated);
      expect(c2.comments.length).toBe(1);
      expect(c2.comments[0].text).toBe('Updated');
    });

    it('should reject invalid comment', () => {
      const invalid = { ...testComment, text: '' };
      expect(() => {
        CorrectionCommentUseCase.addCommentToCorrection(correction, invalid);
      }).toThrow();
    });
  });

  describe('removeCommentFromCorrection', () => {
    it('should remove comment from correction', () => {
      const c1 = CorrectionCommentUseCase.addCommentToCorrection(correction, testComment);
      const c2 = CorrectionCommentUseCase.removeCommentFromCorrection(c1, 'comment-1');
      expect(c2.comments.length).toBe(0);
    });
  });

  describe('getTaskComments', () => {
    it('should get task comments from correction', () => {
      const c1 = CorrectionCommentUseCase.addCommentToCorrection(correction, testComment);
      const result = CorrectionCommentUseCase.getTaskComments(c1, 'task-1');
      expect(result.length).toBe(1);
    });
  });

  describe('getPrintableComments', () => {
    it('should get only printable comments', () => {
      const c1 = { ...testComment, id: '1', printable: true };
      const c2 = { ...testComment, id: '2', printable: false };
      let corr = CorrectionCommentUseCase.addCommentToCorrection(correction, c1);
      corr = CorrectionCommentUseCase.addCommentToCorrection(corr, c2);
      const result = CorrectionCommentUseCase.getPrintableComments(corr);
      expect(result.length).toBe(1);
    });
  });

  describe('getPostReturnComments', () => {
    it('should get only post-return comments', () => {
      const c1 = { ...testComment, id: '1', availableAfterReturn: true };
      const c2 = { ...testComment, id: '2', availableAfterReturn: false };
      let corr = CorrectionCommentUseCase.addCommentToCorrection(correction, c1);
      corr = CorrectionCommentUseCase.addCommentToCorrection(corr, c2);
      const result = CorrectionCommentUseCase.getPostReturnComments(corr);
      expect(result.length).toBe(1);
    });
  });
});
