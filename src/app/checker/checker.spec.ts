import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Checker } from './checker';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('Checker', () => {
  async function render() {
    await TestBed.configureTestingModule({
      imports: [Checker],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(Checker);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const stable = () => fixture.whenStable();
    const radio = (name: string, value: string) => {
      const r = el.querySelector<HTMLInputElement>(`input[name="${name}"][value="${value}"]`);
      if (!r) throw new Error(`no radio ${name}=${value}`);
      return r;
    };
    /** Keyboard-style choice: sets the value without a pointer click. */
    const choose = async (name: string, value: string) => {
      radio(name, value).click();
      await stable();
    };
    /** Pointer-style choice: a real click has detail > 0 and auto-advances. */
    const tap = async (name: string, value: string) => {
      radio(name, value).dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
      await stable();
      await sleep(260);
      await stable();
    };
    const type = async (id: string, value: string) => {
      const i = el.querySelector<HTMLInputElement>(`#${id}`);
      if (!i) throw new Error(`no input #${id}`);
      i.value = value;
      i.dispatchEvent(new Event('input', { bubbles: true }));
      await stable();
    };
    const next = async () => {
      el.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));
      await stable();
    };
    const back = async () => {
      el.querySelector<HTMLButtonElement>('[data-testid="back"]')?.click();
      await stable();
    };
    const title = () => el.querySelector('#step-title')?.textContent?.trim() ?? '';
    const progress = () => el.querySelector('[data-testid="progress"]')?.textContent?.trim() ?? '';

    const fillSingle = async (o: Record<string, string> = {}) => {
      await choose('householdType', 'single');
      await next();
      await type('ageA', o['ageA'] ?? '30');
      await next();
      await type('income', o['income'] ?? '20000');
      await next();
      await type('propertyValue', o['propertyValue'] ?? '150000');
      await type('area', o['area'] ?? '70');
      await type('buildingYear', o['buildingYear'] ?? '2000');
      await next();
      await choose('residency', 'greek-eu');
      await next();
      await choose('ownsSuitableHome', 'no');
      await next();
    };
    return { el, stable, choose, tap, type, next, back, title, progress, fillSingle };
  }

  it('starts on the first question with a progress label and no result', async () => {
    const { el, title, progress } = await render();
    expect(title()).toContain('οικογενειακή σας κατάσταση');
    expect(progress()).toContain('Βήμα 1 από 6');
    expect(el.querySelector('[data-testid="result"]')).toBeNull();
  });

  it('shows one question at a time', async () => {
    const { el } = await render();
    expect(el.querySelectorAll('input[type="radio"]').length).toBe(3);
    expect(el.querySelector('#income')).toBeNull();
  });

  it('asks for an answer before continuing', async () => {
    const { el, next, title } = await render();
    await next();
    expect(el.querySelectorAll('[data-testid="field-error"]')).toHaveLength(1);
    expect(title()).toContain('οικογενειακή σας κατάσταση');
  });

  it('continues to the next question after an answer', async () => {
    const { choose, next, title, progress } = await render();
    await choose('householdType', 'single');
    await next();
    expect(title()).toContain('ηλικία');
    expect(progress()).toContain('Βήμα 2 από 6');
  });

  it('advances automatically after a pointer click on a choice', async () => {
    const { tap, title } = await render();
    await tap('householdType', 'couple');
    expect(title()).toMatch(/ηλικίες/);
  });

  it('does not advance automatically for keyboard-style selection', async () => {
    const { choose, title } = await render();
    await choose('householdType', 'couple');
    await sleep(260);
    expect(title()).toContain('οικογενειακή σας κατάσταση');
  });

  it('goes back and keeps the answer', async () => {
    const { el, choose, next, back, title } = await render();
    await choose('householdType', 'couple');
    await next();
    await back();
    expect(title()).toContain('οικογενειακή σας κατάσταση');
    expect(el.querySelector<HTMLInputElement>('input[value="couple"]')?.checked).toBe(true);
  });

  it('asks for a second age and children only when relevant', async () => {
    const { el, choose, next, back } = await render();
    await choose('householdType', 'single');
    await next();
    expect(el.querySelector('#ageB')).toBeNull();
    expect(el.querySelector('#children')).toBeNull();
    await back();
    await choose('householdType', 'couple');
    await next();
    expect(el.querySelector('#ageB')).not.toBeNull();
    expect(el.querySelector('#children')).not.toBeNull();
  });

  it('keeps the user on a step with an invalid answer', async () => {
    const { el, choose, next, type, progress } = await render();
    await choose('householdType', 'single');
    await next();
    await type('ageA', '12');
    await next();
    expect(progress()).toContain('Βήμα 2 από 6');
    expect(el.querySelectorAll('[data-testid="field-error"]')).toHaveLength(1);
  });

  it('shows "Φαίνεται κατάλληλος" with every criterion, its status and the disclaimer', async () => {
    const { el, fillSingle } = await render();
    await fillSingle();
    const result = el.querySelector('[data-testid="result"]');
    expect(result?.textContent).toContain('Φαίνεται κατάλληλος');
    expect(el.querySelectorAll('[data-testid="criterion"]')).toHaveLength(8);
    expect(result?.textContent).toContain('Αναφερόμενο');
    expect(result?.textContent).toContain('Παραδοχή');
    expect(result?.textContent).toContain('Άγνωστο');
    expect(result?.textContent).toContain('ενδεικτικό');
  });

  it('says the criteria are not met when a reported limit is exceeded', async () => {
    const { el, fillSingle } = await render();
    await fillSingle({ income: '26.000' });
    const result = el.querySelector('[data-testid="result"]');
    expect(result?.textContent).toContain('Δεν φαίνεται να πληροίτε όλα τα κριτήρια');
    expect(result?.textContent).toContain('Δεν πληρούται');
  });

  it('warns, without rejecting, when only an assumed criterion fails', async () => {
    const { el, fillSingle } = await render();
    await fillSingle({ buildingYear: '2015' });
    const result = el.querySelector('[data-testid="result"]');
    expect(result?.textContent).toContain('με επιφυλάξεις');
    expect(result?.textContent).not.toContain('Δεν φαίνεται να πληροίτε');
  });

  it('lets the user change one answer from the result and return to it', async () => {
    const { el, fillSingle, next, type, title } = await render();
    await fillSingle();
    expect(el.querySelector('[data-testid="result"]')?.textContent).toContain('Φαίνεται κατάλληλος');

    el.querySelector<HTMLButtonElement>('[data-testid="edit-2"]')?.click();
    await new Promise((r) => setTimeout(r, 0));
    expect(title()).toContain('οικογενειακό εισόδημ');

    await type('income', '40000');
    await next();
    const result = el.querySelector('[data-testid="result"]');
    expect(result?.textContent).toContain('Δεν φαίνεται να πληροίτε όλα τα κριτήρια');
  });

  it('never claims entitlement or approval', async () => {
    const { el, fillSingle } = await render();
    await fillSingle();
    expect(el.textContent).not.toMatch(/Δικαιούστε|εγκρίθηκε|εγγυημένο/);
  });

  it('never reuses an id, on any step', async () => {
    const { el, choose, next } = await render();
    const check = () => {
      const ids = Array.from(el.querySelectorAll('[id]')).map((n) => n.id);
      expect(new Set(ids).size).toBe(ids.length);
      el.querySelectorAll('label[for]').forEach((label) => {
        expect(el.querySelector(`#${label.getAttribute('for')}`)?.tagName).toBe('INPUT');
      });
    };
    check();
    await choose('householdType', 'couple');
    await next();
    check();
  });
});
