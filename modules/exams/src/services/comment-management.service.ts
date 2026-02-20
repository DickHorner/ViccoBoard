/**
 * Comment Management Service for Exam Corrections
 * Handles comment CRUD, reuse, and filtering
 */

import { Exams } from '@viccoboard/core';
import { v4 as uuidv4 } from 'uuid';

export interface CommentTemplate {
  id: string;
  text: string;
  category?: string;
  usageCount: number;
  lastUsed?: Date;
}

export class CommentManagementService {
  // Storage for comment templates (could be from db in real implementation)
  private static templates: Map<string, CommentTemplate> = new Map();

  /**
   * Create a new correction comment
   */
  static createComment(
    text: string,
    taskId?: string,
    level: 'exam' | 'task' | 'subtask' = 'task',
    printable: boolean = true,
    availableAfterReturn: boolean = true
  ): Exams.CorrectionComment {
    return {
      id: uuidv4(),
      taskId,
      level,
      text,
      printable,
      availableAfterReturn,
      timestamp: new Date()
    };
  }

  /**
   * Update an existing comment
   */
  static updateComment(
    comment: Exams.CorrectionComment,
    updates: Partial<Omit<Exams.CorrectionComment, 'id' | 'timestamp'>>
  ): Exams.CorrectionComment {
    return {
      ...comment,
      ...updates,
      timestamp: new Date()
    };
  }

  /**
   * Get all printable comments
   */
  static getPrintableComments(comments: Exams.CorrectionComment[]): Exams.CorrectionComment[] {
    return comments.filter(c => c.printable);
  }

  /**
   * Get all comments available after return
   */
  static getPostReturnComments(comments: Exams.CorrectionComment[]): Exams.CorrectionComment[] {
    return comments.filter(c => c.availableAfterReturn);
  }

  /**
   * Get comments for a specific level
   */
  static getCommentsByLevel(
    comments: Exams.CorrectionComment[],
    level: 'exam' | 'task' | 'subtask'
  ): Exams.CorrectionComment[] {
    return comments.filter(c => c.level === level);
  }

  /**
   * Get comments for a specific task
   */
  static getTaskComments(
    comments: Exams.CorrectionComment[],
    taskId: string
  ): Exams.CorrectionComment[] {
    return comments.filter(c => c.taskId === taskId);
  }

  /**
   * Get exam-level comments (no task specified)
   */
  static getExamLevelComments(comments: Exams.CorrectionComment[]): Exams.CorrectionComment[] {
    return comments.filter(c => c.level === 'exam' && !c.taskId);
  }

  /**
   * Save a comment as template for reuse
   */
  static saveAsTemplate(
    comment: Exams.CorrectionComment,
    category?: string
  ): CommentTemplate {
    const template: CommentTemplate = {
      id: uuidv4(),
      text: comment.text,
      category,
      usageCount: 1,
      lastUsed: new Date()
    };
    this.templates.set(template.id, template);
    return template;
  }

  /**
   * Get all comment templates
   */
  static getTemplates(category?: string): CommentTemplate[] {
    const all = Array.from(this.templates.values());
    if (category) {
      return all.filter(t => t.category === category).sort((a, b) => b.usageCount - a.usageCount);
    }
    return all.sort((a, b) => b.usageCount - a.usageCount);
  }

  /**
   * Use a template (increment usage counter)
   */
  static useTemplate(templateId: string): CommentTemplate | null {
    const template = this.templates.get(templateId);
    if (template) {
      template.usageCount++;
      template.lastUsed = new Date();
    }
    return template || null;
  }

  /**
   * Delete a template
   */
  static deleteTemplate(templateId: string): boolean {
    return this.templates.delete(templateId);
  }

  /**
   * Search templates
   */
  static searchTemplates(query: string): CommentTemplate[] {
    const lower = query.toLowerCase();
    return Array.from(this.templates.values()).filter(t =>
      t.text.toLowerCase().includes(lower) || (t.category?.toLowerCase().includes(lower) ?? false)
    );
  }

  /**
   * Get most frequently used comments
   */
  static getMostUsedComments(limit: number = 10): CommentTemplate[] {
    return Array.from(this.templates.values())
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  /**
   * Merge comments from multiple sources
   */
  static mergeComments(
    ...commentLists: Exams.CorrectionComment[][]
  ): Exams.CorrectionComment[] {
    const merged = new Map<string, Exams.CorrectionComment>();
    for (const list of commentLists) {
      for (const comment of list) {
        merged.set(comment.id, comment);
      }
    }
    return Array.from(merged.values());
  }

  /**
   * Export comments for a candidate
   */
  static exportCommentsForCandidate(
    correction: Exams.CorrectionEntry,
    includeNonPrintable: boolean = false
  ): Exams.CorrectionComment[] {
    let comments = correction.comments;
    if (!includeNonPrintable) {
      comments = this.getPrintableComments(comments);
    }
    return comments;
  }

  /**
   * Copy selected comments from one correction entry to another.
   * New IDs are generated for the copies so both entries remain independent.
   *
   * Deduplication: a comment is skipped if a comment with the same
   * `level` + `taskId` + `text` already exists in the target.
   *
   * @param source - The source correction entry to copy comments from.
   * @param target - The target correction entry to copy comments to.
   * @param commentIds - Optional list of comment IDs to copy. If omitted, all comments are copied.
   */
  static copyCommentsToCandidate(
    source: Exams.CorrectionEntry,
    target: Exams.CorrectionEntry,
    commentIds?: string[]
  ): Exams.CorrectionEntry {
    const toCopy = commentIds
      ? source.comments.filter(c => commentIds.includes(c.id))
      : source.comments;

    const copies: Exams.CorrectionComment[] = toCopy.map(c => ({
      ...c,
      id: uuidv4(),
      timestamp: new Date()
    }));

    // Merge without duplicating by text+taskId+level
    const makeKey = (comment: Exams.CorrectionComment): string =>
      JSON.stringify([comment.level, comment.taskId ?? null, comment.text]);

    const existingKeys = new Set(target.comments.map(c => makeKey(c)));
    const fresh = copies.filter(c => !existingKeys.has(makeKey(c)));
    return {
      ...target,
      comments: [...target.comments, ...fresh],
      lastModified: new Date()
    };
  }

  /**
   * Validate comment before saving
   */
  static validateComment(comment: Exams.CorrectionComment): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!comment.text || comment.text.trim().length === 0) {
      errors.push('Comment text cannot be empty');
    }
    if (comment.text.length > 500) {
      errors.push('Comment text exceeds 500 characters');
    }
    if (!['exam', 'task', 'subtask'].includes(comment.level)) {
      errors.push('Invalid comment level');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Service for managing comment-related operations in corrections
 */
export class CorrectionCommentUseCase {
  /**
   * Add or update a comment in a correction entry
   */
  static addCommentToCorrection(
    correction: Exams.CorrectionEntry,
    comment: Exams.CorrectionComment
  ): Exams.CorrectionEntry {
    const validation = CommentManagementService.validateComment(comment);
    if (!validation.valid) {
      throw new Error(`Invalid comment: ${validation.errors.join(', ')}`);
    }

    // Remove old comment with same id if exists
    const updatedComments = correction.comments.filter(c => c.id !== comment.id);
    updatedComments.push(comment);

    return {
      ...correction,
      comments: updatedComments,
      lastModified: new Date()
    };
  }

  /**
   * Remove a comment from correction
   */
  static removeCommentFromCorrection(
    correction: Exams.CorrectionEntry,
    commentId: string
  ): Exams.CorrectionEntry {
    return {
      ...correction,
      comments: correction.comments.filter(c => c.id !== commentId),
      lastModified: new Date()
    };
  }

  /**
   * Get all task comments for correction
   */
  static getTaskComments(correction: Exams.CorrectionEntry, taskId: string): Exams.CorrectionComment[] {
    return CommentManagementService.getTaskComments(correction.comments, taskId);
  }

  /**
   * Get exam-level comments
   */
  static getExamComments(correction: Exams.CorrectionEntry): Exams.CorrectionComment[] {
    return CommentManagementService.getExamLevelComments(correction.comments);
  }

  /**
   * Prepare comments for printing
   */
  static getPrintableComments(correction: Exams.CorrectionEntry): Exams.CorrectionComment[] {
    return CommentManagementService.getPrintableComments(correction.comments);
  }

  /**
   * Get comments available to student after return
   */
  static getPostReturnComments(correction: Exams.CorrectionEntry): Exams.CorrectionComment[] {
    return CommentManagementService.getPostReturnComments(correction.comments);
  }
}
