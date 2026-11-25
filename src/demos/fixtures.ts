// Shared, made-up data for the demo screens. Nothing here is real.

import { formatCurrency } from "../components/functional-primitive/currency/currency";

/** The demos are the Squonk Society, a New Zealand members' society: spread into Currency and CurrencyField. */
export const nz = { locale: "en-NZ", currency: "NZD" } as const;

/** An amount as text, for strings such as toasts and option descriptions. In JSX, use `<Currency>`. */
export const money = (n: number) => formatCurrency(n, nz);

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" });

export const MEMBER = {
  name: "Aroha Ngata",
  membershipNumber: "SQ-104-772",
  chapter: "Waikato Chapter",
  contact: "Aroha Ngata",
  email: "aroha@example.org",
};

export type AccountStatus = "overdue" | "due" | "clear" | "credit";

export interface MembershipAccount {
  id: string;
  fee: string;
  period: string;
  due: string;
  balance: number;
  status: AccountStatus;
}

export const ACCOUNTS: MembershipAccount[] = [
  { id: "DUES-0042", fee: "Annual dues", period: "2026–27 season", due: "2026-09-28", balance: 148.2, status: "overdue" },
  { id: "SWAMP-0042", fee: "Swamp Fund levy", period: "Spring 2026", due: "2026-11-20", balance: 62.14, status: "due" },
  { id: "KIT-0042", fee: "Night-watch kit hire", period: "Winter 2026", due: "2027-04-07", balance: 0, status: "clear" },
  { id: "TRIP-0042", fee: "Field-trip deposit", period: "Spring 2026", due: "2026-10-20", balance: -31.24, status: "credit" },
];

export const STATUS_LABEL: Record<AccountStatus, string> = {
  overdue: "Overdue",
  due: "Due soon",
  clear: "Paid",
  credit: "Credit",
};

export const STATUS_TONE = {
  overdue: "error",
  due: "warning",
  clear: "success",
  credit: "info",
} as const;

export interface SightingReport {
  id: string;
  kind: string;
  period: string;
  logged: string;
  amount: number;
  status: "Verified" | "Under review" | "Corrected";
}

const PERIODS = ["Sep 2026", "Aug 2026", "Jul 2026", "Jun 2026", "May 2026", "Apr 2026", "Mar 2026", "Feb 2026", "Jan 2026", "Dec 2025", "Nov 2025", "Oct 2025"];

/** `amount` is the tear volume recorded, in millilitres. */
export const SIGHTINGS: SightingReport[] = PERIODS.flatMap((period, i) => [
  {
    id: `S-TRAIL-${2026_09 - i}`,
    kind: "Tear trail",
    period,
    logged: `2026-${String(Math.max(1, 10 - i)).padStart(2, "0")}-${String(26 - (i % 5)).padStart(2, "0")}`,
    amount: 3200 + ((i * 731) % 2400),
    status: i === 0 ? "Under review" : i === 4 ? "Corrected" : "Verified",
  },
  {
    id: `S-POOL-${2026_09 - i}`,
    kind: "Tear pool",
    period,
    logged: `2026-${String(Math.max(1, 10 - i)).padStart(2, "0")}-${String(18 - (i % 3)).padStart(2, "0")}`,
    amount: 5900 + ((i * 457) % 900),
    status: "Verified",
  },
]);

export interface Activity {
  id: number;
  title: string;
  detail: string;
  when: string;
  tone: "success" | "info" | "warning";
}

const KINDS = [
  { title: "Payment received", detail: "$1,240.00 towards annual dues", tone: "success" as const },
  { title: "Sighting logged", detail: "Tear trail near the Pureora hemlock stand", tone: "info" as const },
  { title: "Reminder sent", detail: "Swamp Fund levy due on 20 November", tone: "warning" as const },
  { title: "Newsletter issued", detail: "Dues statement for October", tone: "info" as const },
  { title: "Address updated", detail: "Postal address changed by Aroha Ngata", tone: "info" as const },
];

export const activity = (id: number): Activity => {
  const kind = KINDS[id % KINDS.length];
  const when = new Date(Date.UTC(2026, 10, 3, 20) - id * 9.5 * 3600_000);
  return { id, ...kind, when: when.toLocaleString("en-NZ", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) };
};

export const CHAPTERS = ["Northland", "Auckland", "Waikato", "Bay of Plenty", "Gisborne", "Hawke's Bay", "Taranaki", "Manawatū-Whanganui", "Wellington", "Tasman", "Nelson", "Marlborough", "West Coast", "Canterbury", "Otago", "Southland"].map(
  (label) => ({ value: label.toLowerCase().replace(/[^a-z]+/g, "-"), label: `${label} Chapter` })
);

export const INTERESTS = [
  { value: "INT-01", label: "Night watches", description: "INT-01" },
  { value: "INT-02", label: "Tear-pool mapping", description: "INT-02" },
  { value: "INT-03", label: "Habitat restoration", description: "INT-03" },
  { value: "INT-04", label: "Folklore archive", description: "INT-04" },
  { value: "INT-05", label: "Field photography", description: "INT-05" },
  { value: "INT-06", label: "Sound recording", description: "INT-06" },
  { value: "INT-07", label: "Hemlock walks", description: "INT-07" },
  { value: "INT-08", label: "Outreach and education", description: "INT-08" },
];

export type CaseStatus = "New" | "In progress" | "Waiting" | "Escalated" | "Closed";
export type CasePriority = "High" | "Medium" | "Low";

export interface Case {
  id: string;
  member: string;
  fee: string;
  reason: string;
  owed: number;
  opened: string;
  status: CaseStatus;
  priority: CasePriority;
  officer: string;
}

const MEMBERS = ["Aroha Ngata", "Tui Harrow", "Hemi Brookes", "Moana Fitch", "Rimu Delaney", "Kōwhai Lindqvist", "Pania Okafor", "Manu Whitcombe", "Tāne Aldous", "Kiri Penhaligon", "Weka Tolliver", "Huia Marchetti", "Tama Eastwood", "Keita Rowntree", "Pūkeko Hallam", "Ruru Castellano", "Wiremu Banks", "Kākā Ellory", "Toroa Quigley", "Kōtare Ashdown", "Hoani Fairweather", "Tītī Vance", "Kārearea Moss", "Matiu Larkspur"];
const REASONS = ["Dues overdue", "Sighting needs verification", "Instalment missed", "Credit check", "Chapter transfer"];
const OFFICERS = ["Hana Walker", "Sam Patel", "Mere Walker", "Liam Chen"];
const STATUSES: CaseStatus[] = ["New", "In progress", "Waiting", "Escalated", "In progress", "Closed"];
const PRIORITIES: CasePriority[] = ["High", "Medium", "Low", "Medium"];

export const CASES: Case[] = MEMBERS.map((member, i) => ({
  id: `C-${2026_0400 + i * 7}`,
  member,
  // Offset by the officer's turn so each officer's cases vary too.
  fee: ["Annual dues", "Swamp Fund levy", "Night-watch kit hire", "Annual dues"][(i + Math.floor(i / 4)) % 4],
  reason: REASONS[i % REASONS.length],
  owed: i % 5 === 3 ? 0 : 480 + ((i * 1733) % 18000),
  opened: `2026-${String(8 + (i % 3)).padStart(2, "0")}-${String(1 + ((i * 7) % 27)).padStart(2, "0")}`,
  status: STATUSES[i % STATUSES.length],
  priority: PRIORITIES[(i + Math.floor(i / 4)) % PRIORITIES.length],
  officer: OFFICERS[i % OFFICERS.length],
}));
