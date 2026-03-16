export interface CompetencyProgress {
  competencyId: string;
  competencyName: string;
  assessments: Array<{
    date: Date;
    score: number;
    examId?: string;
  }>;
  trend: 'improving' | 'stable' | 'declining' | 'new';
  averageScore: number;
  latestScore: number;
  previousScore?: number;
  trendPercentage: number;
}

export interface StudentGrowthAnalysis {
  studentId: string;
  totalNotes: number;
  competenciesTracked: number;
  improvingCount: number;
  stableCount: number;
  decliningCount: number;
  averageTrend: number;
  strengths: string[];
  focusAreas: string[];
  recentAchievements: Array<{
    achievement: string;
    date: Date;
  }>;
  recentChallenges: Array<{
    challenge: string;
    date: Date;
  }>;
}

export class LongTermNoteUIHelper {
  static formatTrend(trend: 'improving' | 'stable' | 'declining' | 'new'): { icon: string; text: string; color: string } {
    switch (trend) {
      case 'improving':
        return { icon: '📈', text: 'Improving', color: '#28a745' };
      case 'stable':
        return { icon: '➡️', text: 'Stable', color: '#ffc107' };
      case 'declining':
        return { icon: '📉', text: 'Declining', color: '#dc3545' };
      case 'new':
        return { icon: '🆕', text: 'New', color: '#17a2b8' };
      default:
        return { icon: '❓', text: 'Unknown', color: '#999' };
    }
  }

  static getTrendColor(percentage: number): string {
    if (percentage > 10) return '#28a745';
    if (percentage > 0) return '#90ee90';
    if (percentage > -10) return '#ffc107';
    return '#dc3545';
  }

  static formatCategory(category: 'achievement' | 'challenge' | 'support' | 'observation'): { icon: string; label: string } {
    switch (category) {
      case 'achievement':
        return { icon: '⭐', label: 'Achievement' };
      case 'challenge':
        return { icon: '⚠️', label: 'Challenge' };
      case 'support':
        return { icon: '🤝', label: 'Support' };
      case 'observation':
        return { icon: '👀', label: 'Observation' };
      default:
        return { icon: '📝', label: 'Note' };
    }
  }

  static getGrowthBadgeColor(value: number): string {
    if (value > 5) return '#28a745';
    if (value > -5) return '#ffc107';
    return '#dc3545';
  }
}
