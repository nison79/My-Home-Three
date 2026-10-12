import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Landing } from './landing';
import { keyFigures } from '../rules/key-figures';
import { SPITI_MOU_3_RULES } from '../rules/spiti-mou-3.rules';

describe('Landing', () => {
  async function render() {
    await TestBed.configureTestingModule({
      imports: [Landing],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(Landing);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('has exactly one h1', async () => {
    const el = await render();
    expect(el.querySelectorAll('h1')).toHaveLength(1);
  });

  it('says the programme has not launched yet, with the last-verified date', async () => {
    const el = await render();
    const note = el.querySelector('[role="note"]')?.textContent ?? '';
    expect(note).toContain('δεν έχει ξεκινήσει');
    expect(note).toContain('12 Οκτωβρίου 2026');
  });

  it('has a primary button to the checker', async () => {
    const el = await render();
    const link = Array.from(el.querySelectorAll('a')).find((a) =>
      a.textContent?.includes('Έλεγχος επιλεξιμότητας'),
    );
    expect(link?.getAttribute('href')).toBe('/elegxos');
  });

  it('renders one row per reported key figure, each with a status word and a source', async () => {
    const el = await render();
    const rows = el.querySelectorAll('ul li');
    expect(rows).toHaveLength(keyFigures(SPITI_MOU_3_RULES).length);
    rows.forEach((row) => {
      expect(row.textContent).toContain('Αναφερόμενο');
      expect(row.querySelector('a')?.getAttribute('href')).toMatch(/^https:\/\//);
    });
  });

  it('never claims entitlement or approval', async () => {
    const el = await render();
    const text = el.textContent ?? '';
    expect(text).not.toMatch(/Δικαιούστε|εγκρίθηκε|εγγυημένο/);
  });
});
