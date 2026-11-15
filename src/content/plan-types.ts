/**
 * Plain-language explanations of plan types. These are general
 * descriptions. A specific plan's own documents always govern.
 */
export interface PlanTypeEntry {
  /** Anchor on the explainer page, e.g. /plan-types#epo */
  id: string;
  short: string;
  name: string;
  summary: string;
  points: string[];
  outOfNetwork: string;
}

export const PLAN_TYPE_ENTRIES: PlanTypeEntry[] = [
  {
    id: "hmo",
    short: "HMO",
    name: "Health Maintenance Organization",
    summary:
      "An HMO covers care from doctors and hospitals in its network. You usually pick a primary care doctor who coordinates your care.",
    points: [
      "You usually choose a primary care doctor.",
      "You often need a referral from that doctor to see a specialist.",
      "Premiums are often lower than for plans with out-of-network coverage.",
    ],
    outOfNetwork:
      "Care outside the network is generally not covered, except for emergency or urgent care.",
  },
  {
    id: "epo",
    short: "EPO",
    name: "Exclusive Provider Organization",
    summary:
      "An EPO covers care from doctors and hospitals in its network. You usually do not need a referral to see a specialist.",
    points: [
      "You can usually see in-network specialists without a referral.",
      "You may not need to choose a primary care doctor.",
      "Most individual plans sold in New Jersey for 2027 are EPO plans.",
    ],
    outOfNetwork:
      "Care outside the network is generally not covered, except for emergency or urgent care.",
  },
  {
    id: "ppo",
    short: "PPO",
    name: "Preferred Provider Organization",
    summary:
      "A PPO has a network, but also pays part of the cost when you use doctors and hospitals outside it.",
    points: [
      "You can usually see specialists without a referral.",
      "You pay less when you stay in the network.",
      "Premiums are often higher than for network-only plans.",
    ],
    outOfNetwork:
      "Care outside the network is generally covered, but you usually pay more, and the provider may bill you for the difference between its charge and what the plan pays.",
  },
  {
    id: "pos",
    short: "POS",
    name: "Point of Service",
    summary:
      "A POS plan mixes features of an HMO and a PPO. You usually have a primary care doctor, and you can go outside the network at a higher cost.",
    points: [
      "You usually choose a primary care doctor.",
      "You often need a referral to see a specialist.",
      "You pay less when you stay in the network.",
    ],
    outOfNetwork:
      "Care outside the network is generally covered at a higher cost, and may require a referral.",
  },
  {
    id: "hdhp-hsa",
    short: "HDHP / HSA",
    name: "High-Deductible Health Plan and Health Savings Account",
    summary:
      "A high-deductible health plan has a higher deductible than a typical plan, so you pay more of your own costs before the plan starts paying. Some of these plans let you open a Health Savings Account.",
    points: [
      "HDHP describes how the costs work. It is not a network type, so an HDHP can also be an HMO, EPO, PPO or POS.",
      "A Health Savings Account (HSA) lets you set aside money for medical costs with tax advantages. Federal rules set who can contribute and how much.",
      "NetCheck marks a plan \"HSA-eligible\" when the state's plan list says it is compatible with an HSA.",
    ],
    outOfNetwork:
      "Out-of-network coverage depends on the plan's network type (HMO, EPO, PPO or POS), not on whether it is a high-deductible plan.",
  },
];

export const PLAN_TYPE_SOURCES = [
  {
    label: "HealthCare.gov: Health insurance plan and network types",
    url: "https://www.healthcare.gov/choose-a-plan/plan-types/",
  },
  {
    label: "HealthCare.gov glossary: High Deductible Health Plan (HDHP)",
    url: "https://www.healthcare.gov/glossary/high-deductible-health-plan/",
  },
  {
    label:
      "New Jersey Department of Banking and Insurance: 2027 individual plans and rates (footnotes 2 and 7)",
    url: "https://www.nj.gov/dobi/division_insurance/ihcseh/ihcrates2027.pdf",
  },
];
