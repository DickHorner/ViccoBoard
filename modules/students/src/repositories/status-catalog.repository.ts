/**
 * Status Catalog Repository
 * Handles persistence of configurable status catalogs
 */

import { AdapterRepository } from '@viccoboard/storage';
import { StatusCatalog, StatusOption, DEFAULT_ATTENDANCE_STATUSES } from '@viccoboard/core';
import type { StorageAdapter } from '@viccoboard/storage';

export class StatusCatalogRepository extends AdapterRepository<StatusCatalog> {
  constructor(adapter: StorageAdapter) {
    super(adapter, 'status_catalogs');
  }

  /**
   * Map database row to StatusCatalog entity
   */
  mapToEntity(row: any): StatusCatalog {
    return {
      id: row.id,
      classGroupId: row.class_group_id,
      context: row.context,
      statuses: row.statuses ? JSON.parse(row.statuses) : [],
      createdAt: new Date(row.created_at),
      lastModified: new Date(row.last_modified)
    };
  }

  /**
   * Map StatusCatalog entity to database row
   */
  mapToRow(entity: Partial<StatusCatalog>): any {
    const row: any = {};

    if (entity.id !== undefined) row.id = entity.id;
    if (entity.classGroupId !== undefined) row.class_group_id = entity.classGroupId;
    if (entity.context !== undefined) row.context = entity.context;
    if (entity.statuses !== undefined) row.statuses = JSON.stringify(entity.statuses);
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt.toISOString();
    if (entity.lastModified !== undefined) row.last_modified = entity.lastModified.toISOString();

    return row;
  }

  /**
   * Find status catalog for a specific class group and context
   */
  async findByClassGroupAndContext(
    classGroupId: string,
    context: 'attendance' | 'participation' | 'behavior'
  ): Promise<StatusCatalog | null> {
    const catalogs = await this.find({
      class_group_id: classGroupId,
      context
    });
    return catalogs.length > 0 ? catalogs[0] : null;
  }

  /**
   * Get or create status catalog with defaults
   * If catalog doesn't exist, creates one with default statuses
   */
  async getOrCreateForClassGroup(
    classGroupId: string,
    context: 'attendance' | 'participation' | 'behavior' = 'attendance'
  ): Promise<StatusCatalog> {
    let catalog = await this.findByClassGroupAndContext(classGroupId, context);

    if (!catalog) {
      // Create new catalog with default statuses
      const defaultStatuses = context === 'attendance' ? DEFAULT_ATTENDANCE_STATUSES : [];

      catalog = await this.create({
        classGroupId,
        context,
        statuses: defaultStatuses
      });
    }

    return catalog;
  }

  /**
   * Add a new status option to a catalog
   */
  async addStatus(
    catalogId: string,
    statusInput: Omit<StatusOption, 'id' | 'metadata'>
  ): Promise<StatusCatalog> {
    const catalog = await this.findById(catalogId);
    if (!catalog) {
      throw new Error(`Catalog with ID "${catalogId}" not found`);
    }

    const newStatus: StatusOption = {
      ...statusInput,
      id: `status-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      metadata: {}
    };

    catalog.statuses.push(newStatus);
    catalog.lastModified = new Date();

    return this.update(catalogId, catalog);
  }

  /**
   * Update an existing status option
   */
  async updateStatus(
    catalogId: string,
    statusId: string,
    updates: Partial<Omit<StatusOption, 'id'>>
  ): Promise<StatusCatalog> {
    const catalog = await this.findById(catalogId);
    if (!catalog) {
      throw new Error(`Catalog with ID "${catalogId}" not found`);
    }

    const statusIndex = catalog.statuses.findIndex(s => s.id === statusId);
    if (statusIndex === -1) {
      throw new Error(`Status with ID "${statusId}" not found in catalog`);
    }

    // Update the status
    catalog.statuses[statusIndex] = {
      ...catalog.statuses[statusIndex],
      ...updates
    };

    catalog.lastModified = new Date();

    return this.update(catalogId, catalog);
  }

  /**
   * Delete a status option (soft delete - just mark inactive)
   */
  async deleteStatus(catalogId: string, statusId: string): Promise<StatusCatalog> {
    // We do soft delete (mark as inactive) rather than hard delete
    // to preserve historical data
    return this.updateStatus(catalogId, statusId, { active: false });
  }

  /**
   * Permanently remove a status option (hard delete)
   * Use with caution - this breaks referential integrity
   */
  async hardDeleteStatus(catalogId: string, statusId: string): Promise<StatusCatalog> {
    const catalog = await this.findById(catalogId);
    if (!catalog) {
      throw new Error(`Catalog with ID "${catalogId}" not found`);
    }

    catalog.statuses = catalog.statuses.filter(s => s.id !== statusId);
    catalog.lastModified = new Date();

    return this.update(catalogId, catalog);
  }

  /**
   * Reorder status options
   */
  async reorderStatus(
    catalogId: string,
    statusId: string,
    newOrder: number
  ): Promise<StatusCatalog> {
    const catalog = await this.findById(catalogId);
    if (!catalog) {
      throw new Error(`Catalog with ID "${catalogId}" not found`);
    }

    const status = catalog.statuses.find(s => s.id === statusId);
    if (!status) {
      throw new Error(`Status with ID "${statusId}" not found in catalog`);
    }

    // Clamp order to valid range
    const clampedOrder = Math.max(0, Math.min(newOrder, catalog.statuses.length - 1));

    // Remove from current position
    catalog.statuses = catalog.statuses.filter(s => s.id !== statusId);

    // Insert at new position
    status.order = clampedOrder;
    catalog.statuses.splice(clampedOrder, 0, status);

    // Update all order values to be sequential
    catalog.statuses.forEach((s, i) => {
      s.order = i;
    });

    catalog.lastModified = new Date();

    return this.update(catalogId, catalog);
  }

  /**
   * Get all active status options for a catalog
   */
  async getActiveStatuses(catalogId: string): Promise<StatusOption[]> {
    const catalog = await this.findById(catalogId);
    if (!catalog) {
      throw new Error(`Catalog with ID "${catalogId}" not found`);
    }

    return catalog.statuses
      .filter(s => s.active)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Get all status options (including inactive)
   */
  async getAllStatuses(catalogId: string): Promise<StatusOption[]> {
    const catalog = await this.findById(catalogId);
    if (!catalog) {
      throw new Error(`Catalog with ID "${catalogId}" not found`);
    }

    return catalog.statuses.sort((a, b) => a.order - b.order);
  }
}
