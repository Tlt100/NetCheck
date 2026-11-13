import type { PlanType } from "@/lib/types";

/**
 * One-sentence note shown on each plan card about care at hospitals that are
 * not in the plan's network. General descriptions only; a specific plan's
 * documents always govern.
 *
 * The HMO and EPO wording follows footnote 2 of the NJ Department of Banking
 * and Insurance 2027 individual rate sheet: "network-only plans with no
 * option to use out-of-network providers, except in the case of emergency or
 * urgent care."
 */
export const OUT_OF_NETWORK_NOTE: Record<PlanType, string> = {
  HMO: "HMO plans are network-only. Care at a hospital outside the network is generally not covered, except for emergency or urgent care.",
  EPO: "EPO plans are network-only. Care at a hospital outside the network is generally not covered, except for emergency or urgent care.",
  PPO: "PPO plans generally cover care outside the network, but you usually pay more than you would in-network.",
  POS: "POS plans generally cover care outside the network at a higher cost, and may require a referral from your primary care doctor.",
};
