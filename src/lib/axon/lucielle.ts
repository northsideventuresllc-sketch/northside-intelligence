import 'server-only';

/**
 * NIP-404-TOOLS — Lucielle (finance).
 *
 * HARD ARCHITECTURAL GATE, from JB's spec and the Morality Code:
 * bank balances, card numbers, credit reports and credit scores are sensitive
 * personal data. They are processed by LOCAL MODELS ONLY, encrypted at rest,
 * and never sent in plaintext to any cloud or frontier API.
 *
 * That is why this file holds no connector code. A connector that pulls real
 * bank data must run on JB's own machine and write only derived, non-identifying
 * figures back here. The portal shows those figures; it never becomes the place
 * raw statements live. Anything that would break that rule belongs on the Mac,
 * not in this repo.
 *
 * Personal and Business are hard-separated at the type level so a figure from
 * one mode can never be summed into the other.
 */

export type LucielleMode = 'business' | 'personal';

export type MoneyFigure = {
  /** Label JB reads, e.g. 'Cash available'. */
  label: string;
  /** Whole dollars. Derived figures only — never a balance tied to an account number. */
  amountUsd: number | null;
  /** Where it came from, in plain words. */
  source: string;
  /** True when nothing is connected yet and this is a placeholder. */
  pending: boolean;
};

export type LucielleSnapshot = {
  mode: LucielleMode;
  figures: MoneyFigure[];
  connectors: { name: string; connected: boolean; note: string }[];
};

const LOCAL_ONLY_NOTE =
  'Runs on your Mac only. Nothing from this connector leaves your machine in readable form.';

/**
 * Placeholder snapshot. Deliberately explicit that nothing is connected, rather
 * than showing invented numbers — a finance screen that guesses is worse than an
 * empty one.
 */
export function emptySnapshot(mode: LucielleMode): LucielleSnapshot {
  const businessFigures: MoneyFigure[] = [
    { label: 'Revenue this month', amountUsd: null, source: 'Stripe', pending: true },
    { label: 'Cash available', amountUsd: null, source: 'Bank', pending: true },
    { label: 'Money owed to you', amountUsd: null, source: 'Invoices', pending: true },
    { label: 'Recurring costs', amountUsd: null, source: 'Cards + subscriptions', pending: true },
  ];

  const personalFigures: MoneyFigure[] = [
    { label: 'Cash available', amountUsd: null, source: 'Bank', pending: true },
    { label: 'Card balances', amountUsd: null, source: 'Cards', pending: true },
    { label: 'Credit score', amountUsd: null, source: 'Credit bureau', pending: true },
    { label: 'What you could borrow', amountUsd: null, source: 'Eligibility check', pending: true },
  ];

  return {
    mode,
    figures: mode === 'business' ? businessFigures : personalFigures,
    connectors: [
      { name: 'Bank accounts', connected: false, note: LOCAL_ONLY_NOTE },
      { name: 'Credit cards', connected: false, note: LOCAL_ONLY_NOTE },
      { name: 'Credit score', connected: false, note: LOCAL_ONLY_NOTE },
      {
        name: 'Stripe (business only)',
        connected: false,
        note: 'Business revenue only. Never mixed with personal.',
      },
    ],
  };
}
