import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { formatDateEl, formatEuro } from '../rules/format';
import { SPITI_MOU_3_RULES } from '../rules/spiti-mou-3.rules';
import { Field } from '../ui/field';
import { Notice } from '../ui/notice';
import { SiteHeader } from '../ui/site-header';
import { StatusBadge } from '../ui/status-badge';
import { FieldErrors, FieldId, parseAnswers, RawAnswers } from './answers';
import { evaluate } from './evaluate';

const EMPTY: RawAnswers = {
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
};

/** The questions, in order. Index `STEPS.length` is the result. */
const STEPS: { fields: FieldId[] }[] = [
  { fields: ['householdType'] },
  { fields: ['ageA', 'ageB', 'children'] },
  { fields: ['income'] },
  { fields: ['propertyValue', 'area', 'buildingYear'] },
  { fields: ['residency'] },
  { fields: ['ownsSuitableHome'] },
];

const RESULT = STEPS.length;

const INPUT_BASE =
  'w-full rounded-md border bg-surface-raised px-4 py-3 text-lg text-ink tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aegean';

/**
 * Where each layer of the deck rests. The two back layers are drawn with these
 * same poses in the template, so a card that lands on a slot is seamless.
 */
const STACK = {
  top: { x: 0, y: 0, scale: 1, rotation: 0, backgroundColor: '#ffffff' },
  second: { x: 0, y: 14, scale: 0.965, rotation: -2.5, backgroundColor: '#fbfaf6' },
  third: { x: 0, y: 28, scale: 0.93, rotation: 2, backgroundColor: '#f0ede3' },
};
const SHADOW_REST = '0 8px 24px rgba(16, 38, 63, 0.12)';
const SHADOW_LIFTED = '0 28px 56px rgba(16, 38, 63, 0.24)';
const SHADOW_SLIGHT = '0 1px 2px rgba(16, 38, 63, 0.08)';
/** A card further back is slightly out of focus, and sharpens as it comes forward. */
const BLUR_BACK = 'blur(3px)';
const BLUR_NONE = 'blur(0px)';

/** Delay that lets the chosen card show before the next question slides in. */
const AUTO_ADVANCE_MS = 180;

const HOUSEHOLD_OPTIONS = [
  { value: 'single', label: 'Άγαμος/η ή διαζευγμένος/η, χωρίς παιδιά' },
  { value: 'couple', label: 'Έγγαμοι ή σε σύμφωνο συμβίωσης' },
  { value: 'singleParent', label: 'Μονογονεϊκή οικογένεια' },
];

const RESIDENCY_OPTIONS = [
  { value: 'greek-eu', label: 'Ελληνική ή άλλης χώρας της ΕΕ' },
  { value: 'non-eu-permit', label: 'Χώρας εκτός ΕΕ, με άδεια παραμονής σε ισχύ' },
  { value: 'non-eu-no-permit', label: 'Χώρας εκτός ΕΕ, χωρίς άδεια παραμονής' },
];

const YES_NO_OPTIONS = [
  { value: 'no', label: 'Όχι, δεν έχω' },
  { value: 'yes', label: 'Ναι, έχω' },
];

@Component({
  selector: 'app-checker',
  imports: [NgTemplateOutlet, RouterLink, Field, Notice, SiteHeader, StatusBadge],
  templateUrl: './checker.html',
})
export class Checker {
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private timer: ReturnType<typeof setTimeout> | undefined;

  /** The stack wrapper and the card on top of it. Absent while the result shows. */
  private readonly deck = viewChild<ElementRef<HTMLElement>>('deck');
  private readonly card = viewChild<ElementRef<HTMLElement>>('card');
  private timeline: gsap.core.Timeline | undefined;
  private ghost: HTMLElement | undefined;

  protected readonly form = signal<RawAnswers>({ ...EMPTY });
  protected readonly step = signal(0);
  protected readonly direction = signal<'forward' | 'back'>('forward');
  protected readonly showErrors = signal(false);
  /** Set when a step is opened from the result, so Continue goes straight back. */
  private readonly returnToResult = signal(false);

  protected readonly totalSteps = STEPS.length;
  protected readonly isResult = computed(() => this.step() === RESULT);
  protected readonly lastVerified = formatDateEl(SPITI_MOU_3_RULES.lastVerified);

  protected readonly householdOptions = HOUSEHOLD_OPTIONS;
  protected readonly residencyOptions = RESIDENCY_OPTIONS;
  protected readonly yesNoOptions = YES_NO_OPTIONS;

  private readonly parsed = computed(() => parseAnswers(this.form()));

  /** Errors that belong to the current step only. */
  private readonly stepErrors = computed<FieldErrors>(() => {
    const p = this.parsed();
    const step = STEPS[this.step()];
    if (p.ok || !step) return {};
    const errors: FieldErrors = {};
    for (const f of step.fields) if (p.errors[f]) errors[f] = p.errors[f];
    return errors;
  });

  protected readonly errors = computed<FieldErrors>(() =>
    this.showErrors() ? this.stepErrors() : {},
  );

  protected readonly result = computed(() => {
    const p = this.parsed();
    return p.ok ? evaluate(p.answers, SPITI_MOU_3_RULES) : null;
  });

  protected readonly householdType = computed(() => this.form().householdType);

  protected readonly title = computed(() => {
    switch (this.step()) {
      case 0:
        return 'Ποια είναι η οικογενειακή σας κατάσταση;';
      case 1:
        return this.householdType() === 'single'
          ? 'Ποια είναι η ηλικία σας;'
          : this.householdType() === 'couple'
            ? 'Ποιες είναι οι ηλικίες σας και πόσα παιδιά έχετε;'
            : 'Ποια είναι η ηλικία σας και πόσα παιδιά έχετε;';
      case 2:
        return 'Ποιο είναι το ετήσιο οικογενειακό εισόδημά σας;';
      case 3:
        return 'Ποιο ακίνητο θέλετε να αγοράσετε;';
      case 4:
        return 'Ποια είναι η ιθαγένειά σας;';
      default:
        return 'Έχετε ήδη ακίνητο κατάλληλο για κύρια κατοικία;';
    }
  });

  /** One line per answer, each linking back to the step that asked it. */
  protected readonly summary = computed(() => {
    const p = this.parsed();
    if (!p.ok) return [];
    const a = p.answers;
    const label = (opts: { value: string; label: string }[], v: string) =>
      opts.find((o) => o.value === v)?.label ?? v;
    const ages = a.applicantAges.join(' και ');
    return [
      { step: 0, label: 'Οικογενειακή κατάσταση', value: label(HOUSEHOLD_OPTIONS, a.householdType) },
      {
        step: 1,
        label: a.applicantAges.length > 1 ? 'Ηλικίες' : 'Ηλικία',
        value:
          a.householdType === 'single'
            ? `${ages} ετών`
            : `${ages} ετών, ${a.children} ${a.children === 1 ? 'παιδί' : 'παιδιά'}`,
      },
      { step: 2, label: 'Οικογενειακό εισόδημα', value: formatEuro(a.annualIncome) },
      {
        step: 3,
        label: 'Ακίνητο',
        value: `${formatEuro(a.propertyValue)}, ${a.propertyAreaSqm} τ.μ., έτος ${a.buildingYear}`,
      },
      { step: 4, label: 'Ιθαγένεια', value: label(RESIDENCY_OPTIONS, a.residency) },
      {
        step: 5,
        label: 'Ακίνητο κατάλληλο για κύρια κατοικία',
        value: a.ownsSuitableHome ? 'Ναι, έχω' : 'Όχι, δεν έχω',
      },
    ];
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      clearTimeout(this.timer);
      this.finishMotion();
    });
  }

  protected set(field: FieldId, value: string): void {
    this.form.update((f) => ({ ...f, [field]: value }));
  }

  /**
   * A choice card was picked. A real pointer click (detail > 0) moves on by
   * itself; keyboard selection (arrow keys) waits for Continue.
   */
  protected choose(field: FieldId, value: string, event: MouseEvent): void {
    this.set(field, value);
    if (event.detail > 0) {
      const at = this.step();
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        if (this.step() === at) this.advance();
      }, AUTO_ADVANCE_MS);
    }
  }

  protected isChecked(field: FieldId, value: string): boolean {
    return this.form()[field] === value;
  }

  protected errorOf(field: FieldId): string | undefined {
    return this.errors()[field];
  }

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected inputClass(field: FieldId): string {
    const border = this.errors()[field] ? 'border-terracotta' : 'border-border-strong';
    return `${INPUT_BASE} ${border}`;
  }

  protected describedBy(field: FieldId, hasHint: boolean): string | null {
    const ids = [hasHint ? `${field}-hint` : '', this.errors()[field] ? `${field}-error` : ''];
    return ids.filter(Boolean).join(' ') || null;
  }

  /** The two ages share one hint, shown once under both inputs. */
  protected agesDescribedBy(field: 'ageA' | 'ageB'): string {
    return ['ages-hint', this.errors()[field] ? `${field}-error` : ''].filter(Boolean).join(' ');
  }

  protected next(event: Event): void {
    event.preventDefault();
    this.advance();
  }

  protected back(): void {
    if (this.step() === 0) return;
    this.showErrors.set(false);
    if (this.returnToResult()) {
      this.returnToResult.set(false);
      this.go(RESULT, 'back');
    } else {
      this.go(this.step() - 1, 'back');
    }
  }

  protected edit(step: number): void {
    this.returnToResult.set(true);
    this.showErrors.set(false);
    this.go(step, 'back');
  }

  protected restart(): void {
    clearTimeout(this.timer);
    this.form.set({ ...EMPTY });
    this.returnToResult.set(false);
    this.showErrors.set(false);
    this.go(0, 'back');
  }

  private advance(): void {
    if (this.isResult()) return;
    if (Object.keys(this.stepErrors()).length > 0) {
      this.showErrors.set(true);
      this.focusSoon();
      return;
    }
    this.showErrors.set(false);
    if (this.returnToResult()) {
      this.returnToResult.set(false);
      this.go(RESULT, 'forward');
    } else {
      this.go(this.step() + 1, 'forward');
    }
  }

  private go(step: number, direction: 'forward' | 'back'): void {
    const from = this.step();
    const animate = this.motionAllowed() && step !== from;
    // The ghost must be copied before the step changes, while the old question is still on screen.
    const ghost = animate ? this.prepareGhost(from, step) : null;

    this.direction.set(direction);
    this.step.set(step);

    if (animate) {
      afterNextRender(() => this.play(direction, step, ghost), { injector: this.injector });
    }
    this.focusSoon();
  }

  private motionAllowed(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  /**
   * Copies the card as it is now, so it can leave while the real card already
   * shows the next question. Returns null when there is no card to copy.
   */
  private prepareGhost(from: number, to: number): HTMLElement | null {
    this.finishMotion();
    const deck = this.deck()?.nativeElement;
    const card = this.card()?.nativeElement;
    if (!deck || !card || from === RESULT) return null;

    const ghost = card.cloneNode(true) as HTMLElement;
    // A copy must never take part in the page: no ids, no focus, no assistive tech.
    ghost.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
    const liveInputs = card.querySelectorAll('input');
    ghost.querySelectorAll('input').forEach((input, i) => {
      input.value = liveInputs[i].value;
      input.checked = liveInputs[i].checked;
      input.setAttribute('value', liveInputs[i].value);
      if (liveInputs[i].checked) input.setAttribute('checked', '');
    });
    ghost.setAttribute('aria-hidden', 'true');
    ghost.setAttribute('data-ghost', '');
    ghost.setAttribute('inert', '');
    ghost.removeAttribute('data-testid');

    if (to === RESULT) {
      // The card is about to be removed from the page, so the copy has to live outside it.
      const r = card.getBoundingClientRect();
      Object.assign(ghost.style, {
        position: 'fixed',
        left: `${r.left}px`,
        top: `${r.top}px`,
        width: `${r.width}px`,
        height: `${r.height}px`,
        margin: '0',
        pointerEvents: 'none',
        zIndex: '60',
      });
      document.body.appendChild(ghost);
    } else {
      Object.assign(ghost.style, {
        position: 'absolute',
        inset: '0',
        width: '100%',
        height: `${card.offsetHeight}px`,
        margin: '0',
        pointerEvents: 'none',
        zIndex: '20',
      });
      deck.appendChild(ghost);
    }
    this.ghost = ghost;
    return ghost;
  }

  /**
   * Forward: the top card lifts off, goes to the back of the deck and stays
   * solid, while the next card rises from the second slot.
   * Back: the card at the back slides out and takes the top, and the one it
   * replaces drops into the second slot.
   */
  private play(direction: 'forward' | 'back', step: number, ghost: HTMLElement | null): void {
    const card = this.card()?.nativeElement;
    const contents = Array.from(card?.children ?? []);
    // The moving card must clear the stack completely before it changes layer,
    // otherwise the overlapping area flips in a single frame and flashes.
    const exit = (this.deck()?.nativeElement.offsetWidth ?? 520) * 1.16;
    const tl = gsap.timeline({ defaults: { force3D: true }, onComplete: () => this.finishMotion() });
    this.timeline = tl;

    if (direction === 'forward') {
      if (ghost && step === RESULT) {
        tl.to(ghost, {
          y: -24,
          rotation: 3,
          scale: 1.02,
          boxShadow: SHADOW_LIFTED,
          duration: 0.25,
          ease: 'power2.out',
        }).to(ghost, { y: -64, opacity: 0, duration: 0.3, ease: 'power2.in' });
        return;
      }

      if (ghost) {
        gsap.set(ghost, { zIndex: 20 });
        tl.to(ghost, { x: exit, y: -16, rotation: 5, boxShadow: SHADOW_LIFTED, duration: 0.32, ease: 'power2.out' }, 0)
          .set(ghost, { zIndex: 1 }, 0.32)
          .to(ghost, { ...STACK.third, boxShadow: 'none', duration: 0.46, ease: 'power3.inOut' }, 0.32)
          .to(Array.from(ghost.children), { filter: BLUR_BACK, duration: 0.46, ease: 'power2.inOut' }, 0.32);
      }
      if (card) {
        gsap.set(card, { ...STACK.second, boxShadow: SHADOW_SLIGHT });
        tl.to(card, { ...STACK.top, boxShadow: SHADOW_REST, duration: 0.5, ease: 'power3.out' }, 0.2);
        // Content is visible from the start, just soft, and comes into focus on arrival.
        gsap.set(contents, { filter: BLUR_BACK });
        tl.to(contents, { filter: BLUR_NONE, duration: 0.5, ease: 'power2.out' }, 0.2);
      }
      return;
    }

    // Back
    if (ghost) {
      gsap.set(ghost, { zIndex: 5 });
      tl.to(ghost, { ...STACK.second, boxShadow: SHADOW_SLIGHT, duration: 0.45, ease: 'power3.inOut' }, 0)
        .to(Array.from(ghost.children), { filter: 'blur(1.5px)', duration: 0.45, ease: 'power2.inOut' }, 0);
    }
    if (card) {
      gsap.set(card, { ...STACK.third, zIndex: 1, boxShadow: 'none' });
      tl.to(card, { x: -exit, y: -16, rotation: -5, boxShadow: SHADOW_LIFTED, duration: 0.32, ease: 'power2.out' }, 0)
        .set(card, { zIndex: 10 }, 0.32)
        .to(card, { ...STACK.top, boxShadow: SHADOW_REST, duration: 0.46, ease: 'power3.out' }, 0.32);
      // The previous answers are visible while the card comes out, just soft.
      gsap.set(contents, { filter: BLUR_BACK });
      tl.to(contents, { filter: BLUR_NONE, duration: 0.55, ease: 'power2.out' }, 0.2);
    }
  }

  /** Stops any running motion and leaves the DOM exactly as Angular rendered it. */
  private finishMotion(): void {
    this.timeline?.kill();
    this.timeline = undefined;
    this.ghost?.remove();
    this.ghost = undefined;
    const card = this.card()?.nativeElement;
    if (card) {
      gsap.set(card, { clearProps: 'transform,opacity,zIndex,backgroundColor,boxShadow' });
      gsap.set(Array.from(card.children), { clearProps: 'filter' });
      gsap.set(card.querySelectorAll('[data-reveal]'), { clearProps: 'opacity,transform' });
    }
  }

  /** Moves focus to the first invalid or first text input, else to the question. */
  private focusSoon(): void {
    setTimeout(() => {
      const invalid = document.querySelector<HTMLElement>('[aria-invalid="true"]');
      const target =
        invalid ??
        document.querySelector<HTMLElement>('[data-autofocus]') ??
        document.getElementById('step-title');
      target?.focus({ preventScroll: true });
    }, 0);
  }
}
