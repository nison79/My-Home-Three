import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Checker } from './checker';

describe('Checker', () => {
  async function render() {
    await TestBed.configureTestingModule({
      imports: [Checker],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(Checker);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const type = async (id: string, value: string) => {
      const input = el.querySelector<HTMLInputElement>(`#${id}`);
      if (!input) throw new Error(`no input #${id}`);
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await fixture.whenStable();
    };
    const choose = async (name: string, value: string) => {
      const radio = el.querySelector<HTMLInputElement>(`input[name="${name}"][value="${value}"]`);
      if (!radio) throw new Error(`no radio ${name}=${value}`);
      radio.click();
      await fixture.whenStable();
    };
    const submit = async () => {
      el.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));
      await fixture.whenStable();
    };
    const fillSingle = async (overrides: Record<string, string> = {}) => {
      await choose('householdType', 'single');
      const values: Record<string, string> = {
        ageA: '30',
        income: '20000',
        propertyValue: '150000',
        area: '70',
        buildingYear: '2000',
        ...overrides,
      };
      for (const [id, value] of Object.entries(values)) await type(id, value);
      await choose('ownsSuitableHome', 'no');
      await choose('residency', 'greek-eu');
    };
    return { el, type, choose, submit, fillSingle };
  }

  it('starts with the form and no result', async () => {
    const { el } = await render();
    expect(el.querySelector('h1')?.textContent).toContain('Έλεγχος επιλεξιμότητας');
    expect(el.querySelector('[data-testid="result"]')).toBeNull();
  });

  it('shows a required-field error for each empty field on submit and no result', async () => {
    const { el, submit } = await render();
    await submit();
    expect(el.querySelectorAll('[data-testid="field-error"]').length).toBeGreaterThan(3);
    expect(el.querySelector('[data-testid="result"]')).toBeNull();
  });

  it('never reuses an id, so every label points at its own input', async () => {
    const { el, choose } = await render();
    await choose('householdType', 'couple');
    const ids = Array.from(el.querySelectorAll('[id]')).map((n) => n.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    el.querySelectorAll('label[for]').forEach((label) => {
      const target = el.querySelector(`#${label.getAttribute('for')}`);
      expect(target?.tagName).toBe('INPUT');
    });
  });

  it('asks for a second age only for couples', async () => {
    const { el, choose } = await render();
    await choose('householdType', 'single');
    expect(el.querySelector('#ageB')).toBeNull();
    await choose('householdType', 'couple');
    expect(el.querySelector('#ageB')).not.toBeNull();
  });

  it('shows "Φαίνεται κατάλληλος" with every criterion, its status and the disclaimer', async () => {
    const { el, fillSingle, submit } = await render();
    await fillSingle();
    await submit();
    const result = el.querySelector('[data-testid="result"]');
    expect(result?.textContent).toContain('Φαίνεται κατάλληλος');
    expect(el.querySelectorAll('[data-testid="criterion"]')).toHaveLength(8);
    expect(result?.textContent).toContain('Αναφερόμενο');
    expect(result?.textContent).toContain('Παραδοχή');
    expect(result?.textContent).toContain('Άγνωστο');
    expect(result?.textContent).toContain('ενδεικτικό');
  });

  it('says the criteria are not met when a reported limit is exceeded', async () => {
    const { el, fillSingle, submit } = await render();
    await fillSingle({ income: '26.000' });
    await submit();
    const result = el.querySelector('[data-testid="result"]');
    expect(result?.textContent).toContain('Δεν φαίνεται να πληροίτε όλα τα κριτήρια');
    expect(result?.textContent).toContain('Δεν πληρούται');
  });

  it('warns, without rejecting, when only an assumed criterion fails', async () => {
    const { el, fillSingle, submit } = await render();
    await fillSingle({ buildingYear: '2015' });
    await submit();
    const result = el.querySelector('[data-testid="result"]');
    expect(result?.textContent).toContain('με επιφυλάξεις');
    expect(result?.textContent).not.toContain('Δεν φαίνεται να πληροίτε');
  });

  it('never claims entitlement or approval', async () => {
    const { el, fillSingle, submit } = await render();
    await fillSingle();
    await submit();
    expect(el.textContent).not.toMatch(/Δικαιούστε|εγκρίθηκε|εγγυημένο/);
  });
});
