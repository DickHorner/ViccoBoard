import { Exams } from '@viccoboard/core'

export interface QRCodeOptions {
  size?: number
  level?: 'L' | 'M' | 'Q' | 'H'
  margin?: number
}

export class SupportTipUIHelper {
  static formatTipForDropdown(tip: Exams.SupportTip): {
    label: string
    description: string
    metadata: string
    icon: string
  } {
    const usageText = tip.usageCount === 0 ? 'NEW' : `Used ${tip.usageCount}x`
    const category = tip.category ? `[${tip.category}]` : ''
    return {
      label: tip.title,
      description: tip.shortDescription,
      metadata: `${usageText} ${category}`,
      icon: tip.usageCount >= 5 ? '⭐' : tip.usageCount > 0 ? '📌' : '+'
    }
  }

  static getWeightColor(weight: number): string {
    if (weight >= 8) return '#dc3545'
    if (weight >= 5) return '#ffc107'
    return '#28a745'
  }

  static formatWeight(weight: number): string {
    return '★'.repeat(weight) + '☆'.repeat(10 - weight)
  }

  static getLinkTypeIcon(linkType: string): string {
    switch (linkType) {
      case 'video':
        return '▶️'
      case 'article':
        return '📄'
      case 'exercise':
        return '✏️'
      case 'tool':
        return '🛠️'
      default:
        return '🔗'
    }
  }
}
