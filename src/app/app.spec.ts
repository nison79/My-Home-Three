import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App routing', () => {
  async function render(url: string) {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl(url);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the landing page at /', async () => {
    const el = await render('/');
    expect(el.querySelector('h1')?.textContent).toContain('φαίνεστε κατάλληλοι');
  });

  it('shows the first checker question at /elegxos', async () => {
    const el = await render('/elegxos');
    expect(el.querySelector('h1')?.textContent).toContain('οικογενειακή σας κατάσταση');
  });

  it('shows the calculator at /ypologismos', async () => {
    const el = await render('/ypologismos');
    expect(el.querySelector('h1')?.textContent).toContain('Εκτίμηση δανείου');
  });

  it('sends unknown paths to the landing page', async () => {
    const el = await render('/xyz');
    expect(el.querySelector('h1')?.textContent).toContain('φαίνεστε κατάλληλοι');
  });
});
