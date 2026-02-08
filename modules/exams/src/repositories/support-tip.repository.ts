/**
 * Support Tips Repository
 * Handles persistence of support tips (Fördertipps)
 */

import { AdapterRepository } from '@viccoboard/storage';
import { Exams, safeJsonParse, safeJsonStringify } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

export class SupportTipRepository extends AdapterRepository<Exams.SupportTip> {
  constructor(adapter: StorageAdapter) {
    super(adapter, 'support_tips');
  }

  mapToEntity(row: any): Exams.SupportTip {
    return {
      id: row.id,
      title: row.title,
      shortDescription: row.short_description,
      category: row.category ?? undefined,
      tags: safeJsonParse(row.tags, [], 'SupportTip.tags'),
      links: safeJsonParse(row.links, [], 'SupportTip.links'),
      qrCode: row.qr_code ?? undefined,
      priority: row.priority ?? 0,
      weight: row.weight ?? 1,
      usageCount: row.usage_count ?? 0,
      createdAt: new Date(row.created_at),
      lastModified: new Date(row.last_modified),
      lastUsed: row.last_used ? new Date(row.last_used) : undefined
    };
  }

  mapToRow(entity: Partial<Exams.SupportTip>): any {
    const row: any = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.title !== undefined) row.title = entity.title;
    if (entity.shortDescription !== undefined) row.short_description = entity.shortDescription;
    if (entity.category !== undefined) row.category = entity.category;
    if (entity.tags !== undefined) row.tags = safeJsonStringify(entity.tags, 'SupportTip.tags');
    if (entity.links !== undefined) row.links = safeJsonStringify(entity.links, 'SupportTip.links');
    if (entity.qrCode !== undefined) row.qr_code = entity.qrCode;
    if (entity.priority !== undefined) row.priority = entity.priority;
    if (entity.weight !== undefined) row.weight = entity.weight;
    if (entity.usageCount !== undefined) row.usage_count = entity.usageCount;
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt.toISOString();
    if (entity.lastModified !== undefined) row.last_modified = entity.lastModified.toISOString();
    if (entity.lastUsed !== undefined) row.last_used = entity.lastUsed.toISOString();

    return row;
  }

  async findByCategory(category: string): Promise<Exams.SupportTip[]> {
    return this.find({ category });
  }

  async findByTag(tag: string): Promise<Exams.SupportTip[]> {
    const all = await this.findAll();
    return all.filter((tip: Exams.SupportTip) => tip.tags.includes(tag));
  }

  async findByUsage(limit: number = 10): Promise<Exams.SupportTip[]> {
    const all = await this.findAll();
    return all.sort((a: Exams.SupportTip, b: Exams.SupportTip) => (b.usageCount || 0) - (a.usageCount || 0)).slice(0, limit);
  }

  async incrementUsage(id: string): Promise<void> {
    const tip = await this.findById(id);
    if (tip) {
      tip.usageCount = (tip.usageCount || 0) + 1;
      tip.lastUsed = new Date();
      tip.lastModified = new Date();
      await this.update(id, tip);
    }
  }
}
