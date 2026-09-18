/**
 * AXON Usage Guardrail & Unit Economics Engine
 * Calculates user compute consumption, prevents negative unit economics,
 * and seamlessly switches to Bring Your Own Key (BYOK) providers.
 */

export interface PlanAllowance {
  tier: 'free' | 'saas' | 'agentic' | 'open_weight';
  monthlyFeeUsd: number;
  maxPlatformCostUsd: number; // 60% Gross Margin floor (Max allowable LLM COGS = 40% of fee)
  includedGenerations: number;
}

export const PLAN_ALLOWANCES: Record<string, PlanAllowance> = {
  free: {
    tier: 'free',
    monthlyFeeUsd: 0,
    maxPlatformCostUsd: 0.05, // Negligible free trial buffer
    includedGenerations: 10,
  },
  saas: {
    tier: 'saas',
    monthlyFeeUsd: 15.0,
    maxPlatformCostUsd: 6.0, // 40% of $15
    includedGenerations: 1000,
  },
  agentic: {
    tier: 'agentic',
    monthlyFeeUsd: 22.5, // 50% markup over $15
    maxPlatformCostUsd: 9.0, // 40% of $22.50
    includedGenerations: 5000,
  },
};

export interface UsageStatus {
  tier: string;
  totalCostUsd: number;
  maxPlatformCostUsd: number;
  percentageUsed: number;
  isExhausted: number | boolean;
  shouldFallbackToBYOK: boolean;
  activeProvider: 'axon_managed' | 'user_byok';
}

export class UsageGuardrail {
  public static evaluateUsage(
    tier: 'free' | 'saas' | 'agentic' | 'open_weight',
    currentMonthCostUsd: number,
    hasUserBYOK: boolean
  ): UsageStatus {
    const allowance = PLAN_ALLOWANCES[tier] || PLAN_ALLOWANCES.free;
    const percentage = allowance.maxPlatformCostUsd > 0
      ? (currentMonthCostUsd / allowance.maxPlatformCostUsd) * 100
      : 100;

    const isExhausted = currentMonthCostUsd >= allowance.maxPlatformCostUsd;
    const shouldFallback = isExhausted && hasUserBYOK;
    const activeProvider = shouldFallback ? 'user_byok' : 'axon_managed';

    return {
      tier,
      totalCostUsd: currentMonthCostUsd,
      maxPlatformCostUsd: allowance.maxPlatformCostUsd,
      percentageUsed: Math.min(percentage, 100),
      isExhausted,
      shouldFallbackToBYOK: shouldFallback,
      activeProvider,
    };
  }

  public static estimateCost(model: string, promptTokens: number, completionTokens: number): number {
    // Standard blended cost calculation per 1k tokens
    const rates: Record<string, { prompt: number; completion: number }> = {
      'axon-mini': { prompt: 0.0001, completion: 0.0002 },
      'gemini-flash': { prompt: 0.000075, completion: 0.0003 },
      'claude-haiku': { prompt: 0.00025, completion: 0.00125 },
      'claude-sonnet': { prompt: 0.003, completion: 0.015 },
    };

    const rate = rates[model] || rates['axon-mini'];
    return (promptTokens / 1000) * rate.prompt + (completionTokens / 1000) * rate.completion;
  }
}
