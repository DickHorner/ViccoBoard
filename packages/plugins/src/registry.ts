/**
 * Plugin Registry Implementation
 * Manages registration and lifecycle of all plugins
 */

import {
  Plugin,
  PluginRegistry as IPluginRegistry,
  AssessmentType,
  ToolPlugin,
  ExporterPlugin,
  IntegrationPlugin
} from '@viccoboard/core';

export class PluginRegistry implements IPluginRegistry {
  private plugins: Map<string, Plugin> = new Map();
  private pluginsByType: Map<string, Set<string>> = new Map([
    ['assessment', new Set()],
    ['tool', new Set()],
    ['exporter', new Set()],
    ['integration', new Set()]
  ]);

  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin with id '${plugin.id}' is already registered`);
    }

    this.plugins.set(plugin.id, plugin);
    
    // Add to type-specific index
    const type = (plugin as any).type;
    if (this.pluginsByType.has(type)) {
      this.pluginsByType.get(type)!.add(plugin.id);
    }
  }

  unregister(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return;
    }

    // Remove from type-specific index
    const type = (plugin as any).type;
    if (this.pluginsByType.has(type)) {
      this.pluginsByType.get(type)!.delete(pluginId);
    }

    this.plugins.delete(pluginId);
  }

  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  getPluginsByType(type: 'assessment' | 'tool' | 'exporter' | 'integration'): Plugin[] {
    const pluginIds = this.pluginsByType.get(type);
    if (!pluginIds) {
      return [];
    }

    return Array.from(pluginIds)
      .map(id => this.plugins.get(id))
      .filter((plugin): plugin is Plugin => plugin !== undefined);
  }

  setPluginEnabled(pluginId: string, enabled: boolean): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin with id '${pluginId}' not found`);
    }

    plugin.enabled = enabled;
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getEnabledPlugins(): Plugin[] {
    return Array.from(this.plugins.values()).filter(p => p.enabled);
  }

  getAssessmentTypes(): AssessmentType[] {
    return this.getPluginsByType('assessment') as AssessmentType[];
  }

  getTools(): ToolPlugin[] {
    return this.getPluginsByType('tool') as ToolPlugin[];
  }

  getExporters(): ExporterPlugin[] {
    return this.getPluginsByType('exporter') as ExporterPlugin[];
  }

  getIntegrations(): IntegrationPlugin[] {
    return this.getPluginsByType('integration') as IntegrationPlugin[];
  }
}

// Singleton instance
export const pluginRegistry = new PluginRegistry();
