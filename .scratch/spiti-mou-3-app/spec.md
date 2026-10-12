# Spec: Σπίτι μου 3 eligibility checker and loan calculator

Status: agreed in grilling session, 2026-10-12. Terms below are preliminary: Σπίτι μου 3 is announced but not launched and no ΚΥΑ/ΦΕΚ exists.

## Problem

People considering the Σπίτι μου 3 housing loan cannot easily tell whether they would qualify or what the loan would cost. Official terms are unpublished, and press coverage is scattered and partial.

## Goal

A Greek-language, unofficial, informational web app with two parts:

1. **Eligibility checker**: does the Household appear to meet the Κριτήρια, and which ones fail or are unconfirmed.
2. **Affordability calculator**: loan amount, own funds, the interest-free / bank split, and an estimated monthly instalment.

## Non-goals

- Other programmes in the UI (Σπίτι μου 1/2 are research background only)
- Documents checklist
- Accounts, backend, persistence, analytics of user answers
- Real bank quotes or rate lookups per bank
- A guarantee of eligibility

## Principles

- **Client-side only.** No backend; answers live in memory and never leave the browser.
- **Honest about certainty.** Every Κριτήριο and every calculator output shows where its value comes from.
- **Rules are data.** Rules live in one versioned file, separate from UI and logic.
- **Unofficial.** Prominent disclaimer; results say "Φαίνεται κατάλληλος", never "eligible", and point to the official platform and the user's bank.
- **Publishable.** Built as a static site on free hosting.

## Rules model

One data file holds the Σπίτι μου 3 rules. Each value carries: `status` (`reported` | `assumed` | `unknown`), `source` (URL and short label), and the file has a `lastVerified` date shown to the user. `assumed` values are labelled "Παραδοχή από Σπίτι μου 2".

### Verdict logic

- "Φαίνεται κατάλληλος" only if no `reported` Κριτήριο fails.
- Failing `assumed` criteria are shown as a warning, not a rejection.
- `unknown` criteria are listed, not evaluated.
- The verdict carries a note whenever it relies on assumptions.

### Criteria

| Status | Criterion |
|---|---|
| reported | Age 25–55 |
| reported | Income caps: €25,000 single; €35,000 married/civil partners, +€7,000 per child; €39,000 single parent, +€7,000 per child beyond the first |
| reported | Property contract value ≤ €300,000 |
| reported | Loan ≤ €230,000; up to 90% of value; own funds ≥ 10%; 50% interest-free, 50% bank |
| assumed | For couples, one Αιτών meeting the age range is enough; age counted at 31 Dec of the application year |
| assumed | Minimum annual income €10,000 |
| assumed | Income from latest tax year, or 3-year average if over the cap; family income regardless of separate returns |
| assumed | Property area ≤ 150 m²; built by 31/12/2007 (flagged "may have changed"); single independent property; energy ID |
| assumed | Residency: valid residence permit if non-EU; no residence-years test |
| assumed | Minimum loan €20,000 |
| assumed | First home: self-declaration "do you own a property suitable as a main residence?" |
| unknown | Asset caps; related-party purchase; base area for large families (reported +10 m² per child beyond four); interest subsidy; bank rate cap; documents list; application platform; start date |

## Calculator

- Loan = min(€230,000, 90% of Συμβατική αξία); Ίδια συμμετοχή = value − loan; must satisfy loan ≥ €20,000.
- Split: 50% Άτοκο τμήμα, 50% Τραπεζικό τμήμα.
- Term: 3–30 years, default 25.
- Άτοκο τμήμα is repaid within the same term at 0% (assumption from Σπίτι μου 2).
- Τραπεζικό τμήμα rate: user-editable, default = current 3M Euribor + 1.70%, with the Euribor value and its date stored in the rules file (to be looked up when building).
- Interest subsidy (Σπίτι μου 2: 50% on the bank half for 3+ children) is **excluded** from numbers and shown only as an `unknown` note.
- Every output is labelled an estimate.

## Inputs

- 1 or 2 Αιτούντες, each with an age.
- Household status (single / married or civil partners / single parent) and number of children.
- One annual Οικογενειακό εισόδημα figure, with a tooltip pointing to the tax return (εκκαθαριστικό) without claiming which line.
- Συμβατική αξία, property area, building year, self-declaration of owning a suitable home, residency status.

## Technical approach

- Angular 22, signals, Tailwind CSS, plain components (no UI library).
- Eligibility and calculator logic as pure functions with no Angular dependency, driven by the rules file; unit-tested test-first with Vitest.
- Components are thin: collect inputs, call the functions, render results with status badges.

## Open risks

- Σπίτι μου 3 values are from Greek press (capital.gr, Naftemporiki, ot.gr; Sep–Oct 2026), not a ΚΥΑ. The rules file should be expected to change at launch.
- Σπίτι μου 2 assumptions come from hdb.gr, stegasi.gov.gr, bank pages and an undated informational PDF, not the legal text.
- Reported beneficiary target conflicts (20,000 vs 40,000) and the start date is uncertain (late Dec 2026 to 2027).

## Sources

- capital.gr, 11 Oct 2026: https://www.capital.gr/oikonomia/4022673/spiti-mou-3-ola-osa-allazoun-gia-ilikies-eisodimata-kai-oria-xrimatodotisis/
- Naftemporiki, 7 Sep 2026: https://www.naftemporiki.gr/finance/economy/2158040/spiti-moy-3-poioi-mpainoyn-sto-neo-programma-ta-nea-oria-gia-eisodima-ilikia-kai-akinito/
- ot.gr, 6 Sep 2026: https://www.ot.gr/2026/09/06/oikonomia/akinita/spiti-mou-3-ayksanetai-to-orio-aksias-akinitou-ta-kritiria/
- Σπίτι μου 2: https://hdb.gr/spiti-ii/ , https://stegasi.gov.gr/programs/spiti-mou-ii/ , https://greece20.gov.gr/en/?p=35231
