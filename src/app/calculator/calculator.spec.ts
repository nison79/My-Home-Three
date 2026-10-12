import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Calculator } from './calculator';
import { calculate } from './calculate';
import { formatEuro } from '../rules/format';
import { SPITI_MOU_3_RULES } from '../rules/spiti-mou-3.rules';

describe('Calculator', () => {
  async function render() {
    await TestBed.configureTestingModule({
      imports: [Calculator],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(Calculator);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const input = (id: string) => {
      const i = el.querySelector<HTMLInputElement>(`#${id}`);
      if (!i) throw new Error(`no input #${id}`);
      return i;
    };
    const type = async (id: string, value: string) => {
      const i = input(id);
      i.value = value;
      i.dispatchEvent(new Event('input', { bubbles: true }));
      await fixture.whenStable();
    };
    const blur = async (id: string) => {
      input(id).dispatchEvent(new Event('blur'));
      await fixture.whenStable();
    };
    const result = () => el.querySelector('[data-testid="result"]');
    return { el, input, type, blur, result };
  }

  it('pre-fills the term and the assumed bank rate, and shows no figures yet', async () => {
    const { input, result, el } = await render();
    expect(input('termYears').value).toBe('25');
    expect(input('bankRate').value).toBe('4,33');
    expect(result()).toBeNull();
    expect(el.textContent).toContain('Συμπληρώστε την αξία');
  });

  it('explains where the default rate comes from', async () => {
    const { el } = await render();
    expect(el.textContent).toContain('Euribor');
    expect(el.textContent).toContain('Παραδοχή');
  });

  it('updates the figures live as the value is typed, with no submit', async () => {
    const { type, result } = await render();
    await type('propertyValue', '200.000');
    const est = calculate({ propertyValue: 200000, termYears: 25, bankRatePercent: 4.33 }, SPITI_MOU_3_RULES);
    if (est.kind !== 'estimate') throw new Error('expected an estimate');
    expect(result()?.textContent).toContain(formatEuro(est.monthlyTotal, true));
    expect(result()?.textContent).toContain(formatEuro(180000));
    expect(result()?.textContent).toContain(formatEuro(20000));
    expect(result()?.textContent).toContain('εκτίμηση');

    await type('propertyValue', '100.000');
    expect(result()?.textContent).toContain(formatEuro(90000));
  });

  it('recalculates when the term slider moves', async () => {
    const { input, type, result } = await render();
    await type('propertyValue', '200000');
    expect(input('termYears').type).toBe('range');
    await type('termYears', '30');
    expect(result()?.textContent).toContain('360 δόσεις');
    expect(result()?.textContent).toContain('30 έτη');
  });

  it('shows an error for an invalid field only after it was visited', async () => {
    const { el, type, blur, result } = await render();
    await type('bankRate', '20');
    expect(el.querySelectorAll('[data-testid="field-error"]')).toHaveLength(0);
    await blur('bankRate');
    expect(el.querySelectorAll('[data-testid="field-error"]')).toHaveLength(1);
    await type('propertyValue', '200000');
    expect(result()).toBeNull();
  });

  it('tells the user when the value is above the programme maximum', async () => {
    const { el, type, result } = await render();
    await type('propertyValue', '350.000');
    expect(el.textContent).toContain('ξεπερνά το ανώτατο όριο');
    expect(result()).toBeNull();
  });

  it('notes that the interest subsidy is not applied', async () => {
    const { el, type } = await render();
    await type('propertyValue', '200000');
    expect(el.textContent).toContain('επιδότηση');
  });

  it('never claims entitlement or approval', async () => {
    const { el, type } = await render();
    await type('propertyValue', '200000');
    expect(el.textContent).not.toMatch(/Δικαιούστε|εγκρίθηκε|εγγυημένο/);
  });

  it('never reuses an id', async () => {
    const { el, type } = await render();
    await type('propertyValue', '200000');
    const ids = Array.from(el.querySelectorAll('[id]')).map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
