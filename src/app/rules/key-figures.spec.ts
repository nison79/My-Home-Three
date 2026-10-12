import { keyFigures } from './key-figures';
import { SPITI_MOU_3_RULES } from './spiti-mou-3.rules';

describe('keyFigures', () => {
  const figures = keyFigures(SPITI_MOU_3_RULES);

  it('only exposes criteria reported for Σπίτι μου 3', () => {
    expect(figures.length).toBeGreaterThan(0);
    expect(figures.every((f) => f.status === 'reported')).toBe(true);
  });

  it('never exposes a criterion that is not reported, even if present in the rules', () => {
    const rules = {
      ...SPITI_MOU_3_RULES,
      maxLoan: { ...SPITI_MOU_3_RULES.maxLoan, status: 'assumed' as const },
    };
    expect(keyFigures(rules).map((f) => f.id)).not.toContain('maxLoan');
  });

  it('formats the maximum loan and property value in euros', () => {
    const byId = Object.fromEntries(figures.map((f) => [f.id, f.value]));
    expect(byId['maxLoan']).toBe('€ 230.000');
    expect(byId['maxPropertyValue']).toBe('€ 300.000');
  });

  it('formats the age range', () => {
    const age = figures.find((f) => f.id === 'age');
    expect(age?.value).toBe('25–55 ετών');
  });

  it('gives every figure a source link', () => {
    expect(figures.every((f) => f.source.url.startsWith('https://'))).toBe(true);
  });
});
