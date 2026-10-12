import { parseAnswers, parseNumber, RawAnswers } from './answers';

describe('parseNumber', () => {
  it.each([
    ['25000', 25000],
    ['25.000', 25000],
    ['1.250.000', 1250000],
    ['25.000,50', 25000.5],
    ['12,5', 12.5],
    ['1.5', 1.5],
    ['  € 7 000 ', 7000],
  ])('reads %s as %d', (text, expected) => {
    expect(parseNumber(text)).toBe(expected);
  });

  it.each(['', '   ', 'abc', '-5', '12a', '1,2,3'])('rejects %j', (text) => {
    expect(parseNumber(text)).toBeNull();
  });
});

const base: RawAnswers = {
  householdType: 'couple',
  children: '1',
  ageA: '34',
  ageB: '31',
  income: '30.000',
  propertyValue: '180.000',
  area: '85',
  buildingYear: '1998',
  ownsSuitableHome: 'no',
  residency: 'greek-eu',
};

describe('parseAnswers', () => {
  it('parses a complete couple household', () => {
    const r = parseAnswers(base);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.answers).toEqual({
        householdType: 'couple',
        applicantAges: [34, 31],
        children: 1,
        annualIncome: 30000,
        propertyValue: 180000,
        propertyAreaSqm: 85,
        buildingYear: 1998,
        ownsSuitableHome: false,
        residency: 'greek-eu',
      });
    }
  });

  it('ignores the second age and children for a single applicant', () => {
    const r = parseAnswers({ ...base, householdType: 'single', children: '', ageB: '' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.answers.applicantAges).toEqual([34]);
      expect(r.answers.children).toBe(0);
    }
  });

  it('requires at least one child for a single-parent household', () => {
    const r = parseAnswers({ ...base, householdType: 'singleParent', children: '0', ageB: '' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors['children']).toMatch(/τουλάχιστον ένα παιδί/);
  });

  it('requires the second age only for couples', () => {
    const r = parseAnswers({ ...base, ageB: '' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors['ageB']).toBeDefined();
  });

  it('reports every missing field on an empty form', () => {
    const r = parseAnswers({
      householdType: '',
      children: '',
      ageA: '',
      ageB: '',
      income: '',
      propertyValue: '',
      area: '',
      buildingYear: '',
      ownsSuitableHome: '',
      residency: '',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(Object.keys(r.errors).sort()).toEqual(
        ['ageA', 'area', 'buildingYear', 'householdType', 'income', 'ownsSuitableHome', 'propertyValue', 'residency'].sort(),
      );
    }
  });

  it('rejects out-of-range values', () => {
    const r = parseAnswers({ ...base, ageA: '12', buildingYear: '1700', area: '0', propertyValue: '-1' });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(Object.keys(r.errors).sort()).toEqual(['ageA', 'area', 'buildingYear', 'propertyValue']);
    }
  });
});
