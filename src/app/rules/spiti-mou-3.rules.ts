import { RuleSource, Spiti3Rules } from './rules.model';

const CAPITAL: RuleSource = {
  label: 'capital.gr, 11 Οκτ 2026',
  url: 'https://www.capital.gr/oikonomia/4022673/spiti-mou-3-ola-osa-allazoun-gia-ilikies-eisodimata-kai-oria-xrimatodotisis/',
};

const OT: RuleSource = {
  label: 'ot.gr, 6 Σεπ 2026',
  url: 'https://www.ot.gr/2026/09/06/oikonomia/akinita/spiti-mou-3-ayksanetai-to-orio-aksias-akinitou-ta-kritiria/',
};

/** Σπίτι μου 2 sources: used only for values marked `assumed`. */
const SM2_STEGASI: RuleSource = {
  label: 'Σπίτι μου 2, stegasi.gov.gr',
  url: 'https://stegasi.gov.gr/programs/spiti-mou-ii/',
};

const SM2_GREECE20: RuleSource = {
  label: 'Σπίτι μου 2, greece20.gov.gr',
  url: 'https://greece20.gov.gr/en/?p=35231',
};

const SM2_GUIDE: RuleSource = {
  label: 'Σπίτι μου 2, πληροφοριακό υλικό',
  url: 'https://e-stegastiko.gr/assets/uploads/2025/01/Πρόγραμμα-Σπίτι-μου-II.pdf',
};

/**
 * Σπίτι μου 3 rules. Every value here is preliminary: the programme is
 * announced but not launched, and no ΚΥΑ/ΦΕΚ exists yet.
 *
 * - `reported`: from Greek press reports about Σπίτι μου 3.
 * - `assumed`: carried over from Σπίτι μου 2 because Σπίτι μου 3 has not
 *   published its own value.
 *
 * Update `lastVerified` whenever values are re-checked against sources.
 */
export const SPITI_MOU_3_RULES: Spiti3Rules = {
  lastVerified: '2026-10-12',
  age: { value: { min: 25, max: 55 }, status: 'reported', source: CAPITAL },
  coupleAgeOneApplicantEnough: { value: true, status: 'assumed', source: SM2_GREECE20 },
  incomeCaps: {
    value: {
      single: 25000,
      couple: 35000,
      perChildCouple: 7000,
      singleParent: 39000,
      perChildSingleParent: 7000,
    },
    status: 'reported',
    source: CAPITAL,
  },
  minimumIncome: { value: 10000, status: 'assumed', source: SM2_GREECE20 },
  maxPropertyValue: { value: 300000, status: 'reported', source: OT },
  maxLoan: { value: 230000, status: 'reported', source: CAPITAL },
  maxFinancingShare: { value: 0.9, status: 'reported', source: CAPITAL },
  maxArea: {
    value: { sqm: 150, afterChildren: 4, extraSqmPerChild: 10 },
    status: 'assumed',
    source: SM2_STEGASI,
  },
  maxBuildingYear: { value: 2007, status: 'assumed', source: SM2_STEGASI },
  mustNotOwnSuitableHome: { value: true, status: 'assumed', source: SM2_GUIDE },
  nonEuNeedsResidencePermit: { value: true, status: 'assumed', source: SM2_GUIDE },
  unknownCriteria: [
    {
      id: 'assetCaps',
      label: 'Όρια κινητής και ακίνητης περιουσίας',
      note: 'Δεν έχουν ανακοινωθεί.',
    },
    {
      id: 'relatedParty',
      label: 'Αγορά από συγγενείς ή σύζυγο',
      note: 'Δεν έχει ανακοινωθεί αν ισχύει περιορισμός.',
    },
    {
      id: 'documents',
      label: 'Δικαιολογητικά',
      note: 'Θα οριστούν πριν την έναρξη του προγράμματος.',
    },
    {
      id: 'platform',
      label: 'Πλατφόρμα αιτήσεων και ημερομηνία έναρξης',
      note: 'Δεν έχουν ανακοινωθεί.',
    },
  ],
};
