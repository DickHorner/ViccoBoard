/**
 * Criteria-Based Grading Engine Example
 * 
 * This example demonstrates how to use the CriteriaGradingEngine
 * to calculate grades based on weighted criteria.
 */

import { CriteriaGradingEngine } from '../src/grading/criteria-grading.engine';
import { Sport} from '@viccoboard/core';

// Example: Physical Education - Basketball Skills Assessment

const engine = new CriteriaGradingEngine();

// Define criteria for basketball skills
const criteria: Sport.Criterion[] = [
  {
    id: 'technique',
    name: 'Shooting Technique',
    description: 'Proper form and mechanics',
    weight: 2, // Higher weight = more important
    minValue: 0,
    maxValue: 100
  },
  {
    id: 'accuracy',
    name: 'Shooting Accuracy',
    description: 'Percentage of successful shots',
    weight: 2,
    minValue: 0,
    maxValue: 100
  },
  {
    id: 'dribbling',
    name: 'Dribbling Skills',
    description: 'Ball control and handling',
    weight: 1,
    minValue: 0,
    maxValue: 100
  },
  {
    id: 'defense',
    name: 'Defensive Positioning',
    description: 'Understanding of defensive concepts',
    weight: 1,
    minValue: 0,
    maxValue: 100
  },
  {
    id: 'teamwork',
    name: 'Teamwork & Communication',
    description: 'Cooperation with teammates',
    weight: 1,
    minValue: 0,
    maxValue: 100
  }
];

// Validate criteria configuration
const validation = engine.validateCriteria(criteria);
if (!validation.valid) {
  console.error('Criteria validation failed:');
  validation.errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log('✓ Criteria configuration is valid\n');
console.log('Criteria:', criteria.map(c => `${c.name} (weight: ${c.weight})`).join(', '));
console.log();

// Example student scores (from slider input 0-100)
const scores = [
  { criterionId: 'technique', value: 85 },
  { criterionId: 'accuracy', value: 78 },
  { criterionId: 'dribbling', value: 92 },
  { criterionId: 'defense', value: 70 },
  { criterionId: 'teamwork', value: 88 }
];

// Calculate grade
const result = engine.calculateGrade({ criteria, scores });

console.log('=== Grade Calculation Result ===\n');
console.log('Student Performance Breakdown:');
result.breakdown.forEach(item => {
  console.log(`  ${item.criterionName}:`);
  console.log(`    Score: ${item.score}/100`);
  console.log(`    Weight: ${item.weight} (${(item.normalizedScore * 100).toFixed(1)}%)`);
  console.log(`    Weighted Score: ${item.weightedScore.toFixed(2)}`);
  console.log();
});

console.log(`Total Weighted Score: ${result.totalWeightedScore}%`);
console.log(`German Grade: ${result.displayValue}`);
console.log();

// Example: Updating weights
console.log('=== Updating Weights ===\n');
console.log('Adjusting importance of shooting accuracy...');

const newWeights = new Map([
  ['technique', 2],
  ['accuracy', 3], // Increased from 2 to 3
  ['dribbling', 1],
  ['defense', 1],
  ['teamwork', 1]
]);

const updatedCriteria = engine.updateWeights(criteria, newWeights);

// Recalculate with new weights
const updatedResult = engine.calculateGrade({
  criteria: updatedCriteria,
  scores
});

console.log(`New Total Weighted Score: ${updatedResult.totalWeightedScore}%`);
console.log(`New German Grade: ${updatedResult.displayValue}`);
console.log();

// Example: Edge cases
console.log('=== Edge Cases ===\n');

// Perfect score
const perfectScores = criteria.map(c => ({ criterionId: c.id, value: 100 }));
const perfectResult = engine.calculateGrade({ criteria, scores: perfectScores });
console.log(`Perfect Performance: ${perfectResult.totalWeightedScore}% (Grade ${perfectResult.displayValue})`);

// Minimal score
const minimalScores = criteria.map(c => ({ criterionId: c.id, value: 0 }));
const minimalResult = engine.calculateGrade({ criteria, scores: minimalScores });
console.log(`Minimal Performance: ${minimalResult.totalWeightedScore}% (Grade ${minimalResult.displayValue})`);

// Grade boundaries
console.log();
console.log('Grade Boundaries (German System):');
console.log('  1 (Sehr gut):     92-100%');
console.log('  2 (Gut):          81-91%');
console.log('  3 (Befriedigend): 67-80%');
console.log('  4 (Ausreichend):  50-66%');
console.log('  5 (Mangelhaft):   30-49%');
console.log('  6 (Ungenügend):   0-29%');
