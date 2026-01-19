# Criteria-Based Grading Engine

A robust and flexible grading calculation engine for weighted criteria-based assessments with slider input (0-100 scale).

## Features

- ✅ **Weighted Criteria Calculation**: Support for up to 8 criteria per category with customizable weights
- ✅ **Slider-Based Input**: Handles 0-100 scale input from sliders
- ✅ **German Grading System**: Automatic conversion to grades 1-6
- ✅ **Adjustable Weights**: Dynamically update criterion importance
- ✅ **Comprehensive Validation**: Input validation and error handling
- ✅ **Edge Case Handling**: Robust handling of boundary conditions
- ✅ **Detailed Breakdown**: Per-criterion scoring breakdown for transparency

## Installation

The grading engine is part of the `@viccoboard/sport` module:

```bash
npm install @viccoboard/sport
```

## Basic Usage

```typescript
import { CriteriaGradingEngine } from '@viccoboard/sport';
import { Sport } from '@viccoboard/core';

const engine = new CriteriaGradingEngine();

// Define criteria
const criteria: Sport.Criterion[] = [
  {
    id: 'technique',
    name: 'Technique',
    weight: 2,
    minValue: 0,
    maxValue: 100
  },
  {
    id: 'endurance',
    name: 'Endurance',
    weight: 1,
    minValue: 0,
    maxValue: 100
  }
];

// Student scores from sliders (0-100)
const scores = [
  { criterionId: 'technique', value: 85 },
  { criterionId: 'endurance', value: 90 }
];

// Calculate grade
const result = engine.calculateGrade({ criteria, scores });

console.log(`Grade: ${result.displayValue}`);
console.log(`Score: ${result.totalWeightedScore}%`);
```

## API Reference

### `CriteriaGradingEngine`

#### `calculateGrade(input: CriteriaGradingInput): CriteriaGradingResult`

Calculates a weighted grade from criteria scores.

**Parameters:**
- `input.criteria`: Array of criterion definitions (max 8)
- `input.scores`: Array of score values (0-100)

**Returns:**
- `value`: Numeric weighted score (0-100)
- `displayValue`: German grade (1-6)
- `percentage`: Same as value
- `breakdown`: Detailed per-criterion breakdown
- `totalWeightedScore`: Final calculated score

**Example:**
```typescript
const result = engine.calculateGrade({
  criteria: [
    { id: 'c1', name: 'Skill A', weight: 2, minValue: 0, maxValue: 100 },
    { id: 'c2', name: 'Skill B', weight: 1, minValue: 0, maxValue: 100 }
  ],
  scores: [
    { criterionId: 'c1', value: 80 },
    { criterionId: 'c2', value: 90 }
  ]
});

// result.totalWeightedScore: 83.33
// result.displayValue: "2"
```

#### `updateWeights(criteria: Criterion[], newWeights: Map<string, number>): Criterion[]`

Updates the weights for criteria and returns the modified array.

**Parameters:**
- `criteria`: Original criteria array
- `newWeights`: Map of criterion IDs to new weight values

**Returns:** Updated criteria array

**Throws:** Error if weights are invalid (negative or total is zero)

**Example:**
```typescript
const updated = engine.updateWeights(criteria, new Map([
  ['c1', 3],  // Increase importance
  ['c2', 1]
]));
```

#### `validateCriteria(criteria: Criterion[]): { valid: boolean; errors: string[] }`

Validates a criteria configuration.

**Parameters:**
- `criteria`: Array of criteria to validate

**Returns:**
- `valid`: Whether configuration is valid
- `errors`: Array of validation error messages

**Example:**
```typescript
const validation = engine.validateCriteria(criteria);
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
```

## Validation Rules

The engine enforces the following rules:

1. **Criteria Count**: 1-8 criteria required
2. **Score Range**: Each score must be 0-100
3. **Weights**: All weights must be non-negative
4. **Total Weight**: Sum of weights must be > 0
5. **Complete Scores**: All criteria must have scores
6. **Unique Names**: No duplicate criterion names
7. **Named Criteria**: All criteria must have non-empty names

## Grade Conversion

The engine uses the German grading system:

| Percentage | Grade | Description |
|-----------|-------|-------------|
| 92-100%   | 1     | Sehr gut (Very Good) |
| 81-91%    | 2     | Gut (Good) |
| 67-80%    | 3     | Befriedigend (Satisfactory) |
| 50-66%    | 4     | Ausreichend (Sufficient) |
| 30-49%    | 5     | Mangelhaft (Poor) |
| 0-29%     | 6     | Ungenügend (Insufficient) |

Note: Grade ranges use an inclusive lower bound and an exclusive upper bound, except for the top range which includes 100%. For example, grade 3 applies for 67% ≤ percentage < 81%.
Note: Grade ranges use an inclusive lower bound and an exclusive upper bound, except for the top range which includes 100%. For example, grade 3 applies for 67% ≤ percentage < 81%.

## Calculation Method

The weighted average is calculated as:

```
Weighted Score = Σ(score_i × weight_i) / Σ(weight_i)
```

Where:
- `score_i` is the score for criterion i (0-100)
- `weight_i` is the weight for criterion i
- The sum is over all criteria

The final score is rounded to 2 decimal places.

## Examples

### Physical Education - Basketball Assessment

```typescript
const criteria = [
  { id: 'shooting', name: 'Shooting', weight: 2, minValue: 0, maxValue: 100 },
  { id: 'dribbling', name: 'Dribbling', weight: 1, minValue: 0, maxValue: 100 },
  { id: 'defense', name: 'Defense', weight: 1, minValue: 0, maxValue: 100 },
  { id: 'teamwork', name: 'Teamwork', weight: 1, minValue: 0, maxValue: 100 }
];

const scores = [
  { criterionId: 'shooting', value: 85 },
  { criterionId: 'dribbling', value: 78 },
  { criterionId: 'defense', value: 72 },
  { criterionId: 'teamwork', value: 90 }
];

const result = engine.calculateGrade({ criteria, scores });
// Result: 81% (Grade 2)
```

### Detailed Breakdown

```typescript
result.breakdown.forEach(item => {
  console.log(`${item.criterionName}:`);
  console.log(`  Score: ${item.score}/100`);
  console.log(`  Weight: ${item.weight}`);
  console.log(`  Normalized Weight: ${(item.normalizedScore * 100).toFixed(1)}%`);
  console.log(`  Weighted Score: ${item.weightedScore.toFixed(2)}`);
});
```

## Error Handling

The engine throws descriptive errors for invalid inputs:

```typescript
try {
  const result = engine.calculateGrade({ criteria, scores });
} catch (error) {
  if (error.message.includes('Maximum 8 criteria allowed')) {
    // Handle too many criteria
  } else if (error.message.includes('Score value must be between')) {
    // Handle invalid score range
  }
}
```

## Testing

The engine includes comprehensive unit tests covering:

- ✅ Weighted average calculations
- ✅ Grade conversion boundaries
- ✅ Validation rules
- ✅ Edge cases (min/max scores, single criterion, etc.)
- ✅ Weight updates
- ✅ Error conditions

Run tests:

```bash
npm test -- criteria-grading.engine.test.ts
```

## License

Part of the ViccoBoard project.
