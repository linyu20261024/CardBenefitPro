/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  InstantRule,
  MilestoneActivity,
  RewardComboActivity,
  RecommendationResult,
  BankAssetActivity,
  BankAssetEntry
} from '../types/cardBenefit';

export interface RecommendationQuery {
  amount: number;
  scene: string;
  channel: string;
  platform?: string;
  bank?: string;
  currentTime?: string; // HH:mm
  currentDate?: string; // YYYY-MM-DD
}

// Valuation rate: 10,000 points = 15 RMB
export const POINTS_RMB_RATE = 15 / 10000;
// Conservative value for a lottery ticket chance: 3 RMB
export const LOTTERY_RMB_VALUE = 3.0;

export function evaluateRecommendations(
  query: RecommendationQuery,
  rules: InstantRule[],
  activities: MilestoneActivity[],
  rewardActivities: RewardComboActivity[]
): RecommendationResult[] {
  const { amount, scene, channel, bank, currentTime = '08:30', currentDate = new Date().toISOString().slice(0, 10) } = query;

  if (amount <= 0) return [];

  const results: RecommendationResult[] = [];

  // 1. Evaluate Instant Rules
  for (const rule of rules) {
    if (rule.enabled === false) continue;

    // Bank filter
    if (bank && bank !== 'all' && rule.bank !== bank) continue;

    // Amount min check
    if (rule.min && amount < rule.min) continue;

    // Date range check
    if (rule.dateStart && currentDate < rule.dateStart) continue;
    if (rule.dateEnd && currentDate > rule.dateEnd) continue;

    // Time window check (e.g. 06:30 - 10:00)
    let isTimeRestricted = false;
    let inTimeWindow = true;
    if (rule.start && rule.end && rule.start !== '00:00' && rule.end !== '23:59') {
      isTimeRestricted = true;
      if (currentTime < rule.start || currentTime > rule.end) {
        inTimeWindow = false;
      }
    }

    // Scene match
    const sceneMatch =
      rule.scene === 'any' ||
      scene === 'any' ||
      rule.scene === scene ||
      (rule.scenes && rule.scenes.includes(scene));
    if (!sceneMatch) continue;

    // Channel match
    const channelMatch =
      rule.channel === 'any' ||
      channel === 'any' ||
      rule.channel === channel ||
      (rule.channel === 'alipay' && channel === 'transit_code') || // transit codes often use alipay
      (rule.channel === 'transit_code' && (channel === 'alipay' || channel === 'unionpay'));
    if (!channelMatch) continue;

    // Usage limit check
    if (rule.limit && rule.usedCount && rule.usedCount >= rule.limit) {
      continue; // Expended
    }

    // Calculate benefits
    let instantSavings = 0;
    let cashbackReward = 0;
    let pointsReward = 0;
    let lotteryChances = 0;
    let lotteryValue = 0;
    const qualifications: string[] = [];
    const triggeredMilestones: string[] = [];

    if (isTimeRestricted) {
      qualifications.push(`限时段 ${rule.start}-${rule.end}${inTimeWindow ? ' (当前生效中)' : ' (当前未在时间段)'}`);
    }
    if (rule.limit) {
      const remaining = rule.limit - (rule.usedCount || 0);
      qualifications.push(`限额 ${rule.limit}次/${rule.limitPeriod === 'day' ? '日' : '月'} (余${remaining}次)`);
    }

    switch (rule.type) {
      case 'fixed':
        instantSavings = Math.min(rule.fixed, amount);
        break;
      case 'rate': {
        const calculated = (amount * (rule.rate || 0)) / 100;
        instantSavings = rule.cap > 0 ? Math.min(calculated, rule.cap) : calculated;
        // Don't exceed total amount
        instantSavings = Math.min(instantSavings, amount);
        break;
      }
      case 'cashback':
        if (rule.fixed > 0) {
          cashbackReward = rule.fixed;
        } else if (rule.rate > 0) {
          const calc = (amount * rule.rate) / 100;
          cashbackReward = rule.cap > 0 ? Math.min(calc, rule.cap) : calc;
        }
        break;
      case 'points':
        pointsReward = rule.fixed > 0 ? rule.fixed : Math.floor(amount * (rule.rate || 1));
        if (rule.cap > 0 && pointsReward > rule.cap) pointsReward = rule.cap;
        break;
      case 'lottery':
        lotteryChances = 1;
        lotteryValue = rule.fixed > 0 ? rule.fixed : LOTTERY_RMB_VALUE;
        break;
      case 'threshold':
        instantSavings = Math.min(rule.fixed, amount);
        break;
      case 'alipay_quickpay':
        cashbackReward = rule.fixed > 0 ? rule.fixed : 5;
        triggeredMilestones.push('计入支付宝快捷支付月度满额累计');
        break;
    }

    // Check combo triggers
    // If bank is CCB and amount >= 16 in Alipay/WeChat, triggers CCB时光好礼
    if (
      (rule.bank === '建设银行' || !rule.bank) &&
      amount >= 16 &&
      (channel === 'alipay' || channel === 'wechat' || channel === 'any')
    ) {
      pointsReward += 100;
      triggeredMilestones.push('触发建行龙卡时光好礼日达标(+100分)');
      if (amount >= 200) {
        triggeredMilestones.push('加速建行周累计满200元目标');
      }
    }

    // If channel is Alipay, triggers Alipay quick pay
    if ((channel === 'alipay' || rule.channel === 'alipay') && amount >= 18) {
      triggeredMilestones.push('计入支付宝快捷支付满额达标');
    }

    // If bank is 交行 and amount is large, triggers 最红星期五
    if (rule.bank === '交通银行' && amount >= 5000) {
      lotteryChances += 1;
      lotteryValue += 15;
      triggeredMilestones.push('达成交行最红5000元抽奖机会1次');
    }

    const pointsValue = pointsReward * POINTS_RMB_RATE;
    const totalEffectiveBenefit = instantSavings + cashbackReward + pointsValue + lotteryValue;
    const effectiveDiscountRate = amount > 0 ? (totalEffectiveBenefit / amount) * 100 : 0;

    results.push({
      id: rule.id,
      name: rule.name,
      bank: rule.bank || '通用银行',
      channel: rule.channel,
      scene: rule.scene,
      platform: rule.platform,
      type: rule.type,
      instantSavings: Number(instantSavings.toFixed(2)),
      cashbackReward: Number(cashbackReward.toFixed(2)),
      pointsReward,
      pointsValue: Number(pointsValue.toFixed(2)),
      lotteryChances,
      lotteryEstimatedValue: Number(lotteryValue.toFixed(2)),
      totalEffectiveBenefit: Number(totalEffectiveBenefit.toFixed(2)),
      effectiveDiscountRate: Number(effectiveDiscountRate.toFixed(1)),
      isBestOverall: false,
      isBestInstant: false,
      triggersCombo: triggeredMilestones.length > 0,
      triggeredComboDetails: triggeredMilestones,
      qualifications,
      notes: rule.notes || '',
      ruleRef: rule
    });
  }

  // 2. Evaluate Milestone Activities (Tiered activities like 交行达标5000送15 / 支付宝快捷支付)
  for (const act of activities) {
    if (bank && bank !== 'all' && act.bank !== bank) continue;
    if (act.channel !== 'any' && channel !== 'any' && act.channel !== channel) continue;

    // Check if current spend + amount reaches an unconfirmed tier
    const currentSpend = act.currentSpend || 0;
    const projectedSpend = currentSpend + amount;

    for (const tier of act.tiers) {
      if (currentSpend < tier.target && projectedSpend >= tier.target) {
        const estVal = tier.estimatedReward || (tier.rewardType === 'points' ? tier.points * POINTS_RMB_RATE : 15);
        const hitReward = tier.actualReward || estVal;
        
        results.push({
          id: `${act.id}-${tier.id}`,
          name: `${act.name} (满¥${tier.target}阶梯达成)`,
          bank: act.bank || '合作银行',
          channel: act.channel,
          scene: act.scene,
          platform: act.platform,
          type: 'cashback',
          instantSavings: 0,
          cashbackReward: tier.rewardType === 'cashback' ? hitReward : 0,
          pointsReward: tier.rewardType === 'points' ? tier.points : 0,
          pointsValue: tier.rewardType === 'points' ? tier.points * POINTS_RMB_RATE : 0,
          lotteryChances: tier.rewardType === 'lottery' ? 1 : 0,
          lotteryEstimatedValue: tier.rewardType === 'lottery' ? estVal : 0,
          totalEffectiveBenefit: Number(estVal.toFixed(2)),
          effectiveDiscountRate: Number(((estVal / amount) * 100).toFixed(1)),
          isBestOverall: false,
          isBestInstant: false,
          triggersCombo: true,
          triggeredComboDetails: [`本笔消费直接促成【${act.name}】达标门槛 ¥${tier.target}！`],
          qualifications: [`当前累计¥${currentSpend} -> 消费后¥${projectedSpend}`],
          notes: act.notes || '消费门槛阶梯奖励',
          ruleRef: act
        });
      }
    }
  }

  // Sort results by total effective benefit descending
  results.sort((a, b) => {
    if (b.totalEffectiveBenefit !== a.totalEffectiveBenefit) {
      return b.totalEffectiveBenefit - a.totalEffectiveBenefit;
    }
    return b.instantSavings - a.instantSavings;
  });

  if (results.length > 0) {
    // Flag the best overall
    results[0].isBestOverall = true;

    // Find highest instant discount
    let maxInstant = -1;
    let maxInstantIndex = -1;
    results.forEach((r, idx) => {
      if (r.instantSavings > maxInstant && r.instantSavings > 0) {
        maxInstant = r.instantSavings;
        maxInstantIndex = idx;
      }
    });

    if (maxInstantIndex >= 0) {
      results[maxInstantIndex].isBestInstant = true;
    }
  }

  return results;
}

/**
 * Calculates bank asset day-by-day metrics
 */
export interface AssetCalculationResult {
  activityId: string;
  bank: string;
  month: string;
  totalDaysInMonth: number;
  loggedDays: number;
  currentSum: number;
  currentAverageDaily: number;
  latestBalance: number;
  projectedMonthEndAverage: number;
  baseline: number;
  netIncreaseAverage: number;
  achievedTiers: Array<{
    threshold: number;
    label: string;
    reward: number;
    rewardType: string;
    isAchieved: boolean;
    gapToThreshold: number;
    requiredDailyForRemainingDays: number;
  }>;
  highestAchievedTier: number;
  nextTier: {
    threshold: number;
    label: string;
    gapToThreshold: number;
    requiredDailyForRemainingDays: number;
  } | null;
}

export function calculateAssetMetrics(
  activity: BankAssetActivity,
  entries: BankAssetEntry[]
): AssetCalculationResult {
  const [yearStr, monthStr] = activity.month.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const totalDaysInMonth = new Date(year, month, 0).getDate();

  const actEntries = entries
    .filter(e => e.activityId === activity.id)
    .sort((a, b) => a.date.localeCompare(b.date));

  const loggedDays = actEntries.length;
  const currentSum = actEntries.reduce((sum, e) => sum + (e.amount || 0), 0);
  const currentAverageDaily = loggedDays > 0 ? currentSum / loggedDays : 0;
  const latestBalance = actEntries.length > 0 ? actEntries[actEntries.length - 1].amount : 0;

  // Remaining days in month
  const remainingDays = Math.max(0, totalDaysInMonth - loggedDays);
  // Projected month-end daily average if latest balance is maintained for remaining days
  const projectedTotalSum = currentSum + latestBalance * remainingDays;
  const projectedMonthEndAverage = totalDaysInMonth > 0 ? projectedTotalSum / totalDaysInMonth : 0;

  const baseline = activity.baseline || 0;
  const netIncreaseAverage = Math.max(0, projectedMonthEndAverage - baseline);

  let highestAchievedTier = 0;
  let nextTier = null;

  const achievedTiers = activity.tiers.map(tier => {
    // Qualification check: is net average >= threshold? Or is absolute average >= threshold?
    // In Chinese banking promotion (e.g. 建行资产提升), it is measured on Net Average Daily Increase (月日均提升额) or Total Month Daily Average.
    const isAchieved = projectedMonthEndAverage >= tier.threshold;
    if (isAchieved && tier.threshold > highestAchievedTier) {
      highestAchievedTier = tier.threshold;
    }

    const gapToThreshold = Math.max(0, tier.threshold * totalDaysInMonth - currentSum);
    const requiredDailyForRemainingDays =
      remainingDays > 0 ? Math.max(0, gapToThreshold / remainingDays) : 0;

    return {
      threshold: tier.threshold,
      label: tier.label,
      reward: tier.reward,
      rewardType: tier.rewardType,
      isAchieved,
      gapToThreshold,
      requiredDailyForRemainingDays
    };
  });

  const upcoming = achievedTiers.find(t => !t.isAchieved);
  if (upcoming) {
    nextTier = {
      threshold: upcoming.threshold,
      label: upcoming.label,
      gapToThreshold: upcoming.gapToThreshold,
      requiredDailyForRemainingDays: upcoming.requiredDailyForRemainingDays
    };
  }

  return {
    activityId: activity.id,
    bank: activity.bank,
    month: activity.month,
    totalDaysInMonth,
    loggedDays,
    currentSum,
    currentAverageDaily,
    latestBalance,
    projectedMonthEndAverage,
    baseline,
    netIncreaseAverage,
    achievedTiers,
    highestAchievedTier,
    nextTier
  };
}

/**
 * Format currency in Chinese Yuan
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format big numbers like 50000 -> 5万
 */
export function formatBigNumber(num: number): string {
  if (num >= 10000) {
    const wan = num / 10000;
    return `${wan.toFixed(wan % 1 === 0 ? 0 : 1)}万`;
  }
  return num.toLocaleString();
}
