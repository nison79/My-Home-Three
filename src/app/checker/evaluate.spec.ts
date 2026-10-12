import { evaluate } from './evaluate';
import { HouseholdAnswers } from './answers';
import { SPITI_MOU_3_RULES } from '../rules/spiti-mou-3.rules';

const eligible: HouseholdAnswers = {
  householdType: 'couple',
  applicantAges: [34, 31],
  children: 1,
  annualIncome: 30000,
  propertyValue: 180000,
  propertyAreaSqm: 85,
  buildingYear: 1998,
  ownsSuitableHome: false,
  residency: 'greek-eu',
};

const run = (overrides: Partial<HouseholdAnswers>) =>
  evaluate({ ...eligible, ...overrides }, SPITI_MOU_3_RULES);

const criterion = (r: ReturnType<typeof run>, id: string) => {
  const c = r.criteria.find((x) => x.id === id);
  if (!c) throw new Error(`no criterion ${id}`);
  return c;
};

describe('evaluate', () => {
  it('appears eligible when every criterion is met', () => {
    const r = run({});
    expect(r.verdict.kind).toBe('appears-eligible');
    expect(r.verdict.assumedFailures).toEqual([]);
    expect(r.criteria.every((c) => c.outcome === 'met')).toBe(true);
  });

  it('always states that the verdict relies on assumptions while some criteria are assumed', () => {
    expect(run({}).verdict.reliesOnAssumptions).toBe(true);
  });

  it('lists the criteria that are not published, without evaluating them', () => {
    const r = run({});
    expect(r.unknown.length).toBeGreaterThan(0);
    expect(r.unknown.map((u) => u.id)).toContain('assetCaps');
    expect(r.criteria.map((c) => c.id)).not.toContain('assetCaps');
  });

  describe('age', () => {
    it('is reported and fails for a single applicant outside 25–55', () => {
      const r = run({ householdType: 'single', children: 0, applicantAges: [56] });
      expect(criterion(r, 'age')).toMatchObject({ outcome: 'not-met', status: 'reported' });
      expect(r.verdict.kind).toBe('not-eligible');
    });

    it('is met and reported when both partners are in range', () => {
      expect(criterion(run({ applicantAges: [30, 40] }), 'age')).toMatchObject({
        outcome: 'met',
        status: 'reported',
      });
    });

    it('is met but only assumed when one partner is out of range', () => {
      const r = run({ applicantAges: [30, 60] });
      expect(criterion(r, 'age')).toMatchObject({ outcome: 'met', status: 'assumed' });
      expect(r.verdict.kind).toBe('appears-eligible');
    });

    it('fails with a reported status when neither partner is in range', () => {
      const r = run({ applicantAges: [60, 61] });
      expect(criterion(r, 'age')).toMatchObject({ outcome: 'not-met', status: 'reported' });
      expect(r.verdict.kind).toBe('not-eligible');
    });
  });

  describe('income cap', () => {
    it('uses the single cap for a single applicant', () => {
      const ok = run({ householdType: 'single', children: 0, applicantAges: [30], annualIncome: 25000 });
      const over = run({ householdType: 'single', children: 0, applicantAges: [30], annualIncome: 25001 });
      expect(criterion(ok, 'income').outcome).toBe('met');
      expect(criterion(over, 'income')).toMatchObject({ outcome: 'not-met', status: 'reported' });
    });

    it('adds the per-child amount for couples', () => {
      const ok = run({ children: 2, annualIncome: 49000 });
      const over = run({ children: 2, annualIncome: 49001 });
      expect(criterion(ok, 'income').outcome).toBe('met');
      expect(criterion(over, 'income').outcome).toBe('not-met');
    });

    it('counts per-child amounts only beyond the first child for single parents', () => {
      const base = { householdType: 'singleParent' as const, applicantAges: [38], children: 3 };
      expect(criterion(run({ ...base, annualIncome: 53000 }), 'income').outcome).toBe('met');
      expect(criterion(run({ ...base, annualIncome: 53001 }), 'income').outcome).toBe('not-met');
    });

    it('mentions the assumed 3-year average when the cap is exceeded', () => {
      const r = run({ annualIncome: 60000 });
      expect(criterion(r, 'income').note).toMatch(/τριών/);
    });
  });

  describe('property', () => {
    it('fails above the reported maximum value', () => {
      const r = run({ propertyValue: 300001 });
      expect(criterion(r, 'propertyValue')).toMatchObject({ outcome: 'not-met', status: 'reported' });
      expect(r.verdict.kind).toBe('not-eligible');
    });

    it('allows the maximum value itself', () => {
      expect(criterion(run({ propertyValue: 300000 }), 'propertyValue').outcome).toBe('met');
    });
  });

  describe('assumed criteria', () => {
    it('warn without rejecting', () => {
      const r = run({ buildingYear: 2010 });
      expect(r.verdict.kind).toBe('appears-eligible');
      expect(criterion(r, 'buildingYear')).toMatchObject({ outcome: 'not-met', status: 'assumed' });
      expect(r.verdict.assumedFailures.map((c) => c.id)).toEqual(['buildingYear']);
    });

    it('flag an income below the assumed minimum', () => {
      const r = run({ annualIncome: 8000 });
      expect(r.verdict.assumedFailures.map((c) => c.id)).toContain('minimumIncome');
    });

    it('flag a non-EU applicant without a residence permit', () => {
      const r = run({ residency: 'non-eu-no-permit' });
      expect(r.verdict.assumedFailures.map((c) => c.id)).toContain('residency');
    });

    it('flag owning a suitable home', () => {
      const r = run({ ownsSuitableHome: true });
      expect(r.verdict.assumedFailures.map((c) => c.id)).toContain('suitableHome');
    });

    it('raise the area limit by 10 m² per child beyond the fourth', () => {
      expect(criterion(run({ children: 6, propertyAreaSqm: 170 }), 'area').outcome).toBe('met');
      expect(criterion(run({ children: 6, propertyAreaSqm: 171 }), 'area').outcome).toBe('not-met');
      expect(criterion(run({ children: 1, propertyAreaSqm: 151 }), 'area').outcome).toBe('not-met');
    });
  });

  it('does not let an assumed failure hide a reported one', () => {
    const r = run({ propertyValue: 400000, buildingYear: 2015 });
    expect(r.verdict.kind).toBe('not-eligible');
    expect(r.verdict.assumedFailures.map((c) => c.id)).toContain('buildingYear');
  });
});
