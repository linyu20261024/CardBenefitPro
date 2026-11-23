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
  BankAssetEntry,
  FeedbackRecord,
  CardType
} from '../types/cardBenefit';

export interface RecommendationQuery {
  amount: number;
  scene: string;
  channel: string;
  platform?: string;
  bank?: string;
  cardType?: CardType;
  currentTime?: string; // HH:mm
  currentDate?: string; // YYYY-MM-DD
}

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  credit: '信用卡',
  debit: '储蓄卡',
  digital_cny: '数字人民币',
  any: '通用/组合'
};

export function normalizeKey(val?: string): string {
  return (val || '').trim().toLowerCase().replace(/-/g, '_');
}

/**
 * Infers the card/account instrument type (信用卡 / 储蓄卡 / 数字人民币 / 通用组合).
 * Digital RMB, debit cards, and credit cards are independent by default.
 */
export function inferCardType(item: {
  cardType?: CardType;
  name?: string;
  notes?: string;
  platform?: string;
  channel?: string;
  channels?: string[];
}): CardType {
  if (item.cardType) {
    return item.cardType;
  }

  const normChannel = normalizeKey(item.channel);
  const normPlatform = normalizeKey(item.platform);
  const channelsList = (item.channels || []).map(c => normalizeKey(c));
  const text = `${item.name || ''} ${item.notes || ''} ${item.platform || ''}`;

  const mentionsDigitalCny =
    normChannel === 'digital_cny' ||
    normPlatform === 'digital_cny' ||
    (channelsList.length > 0 && channelsList.every(c => c === 'digital_cny')) ||
    text.includes('数币') ||
    text.includes('数字人民币');

  const mentionsCredit =
    text.includes('信用卡') ||
    text.includes('贷记卡') ||
    text.includes('最红') ||
    text.includes('刷卡金') ||
    text.includes('直通车') ||
    text.includes('龙卡') ||
    text.includes('买单吧') ||
    text.includes('阳光惠生活') ||
    text.includes('动卡空间') ||
    text.includes('掌上生活') ||
    text.includes('发现精彩') ||
    text.includes('缤纷生活') ||
    text.includes('口袋银行') ||
    text.includes('好兴动') ||
    text.includes('多倍积分') ||
    text.includes('三倍积分');

  const mentionsDebit =
    text.includes('储蓄卡') ||
    text.includes('借记卡') ||
    text.includes('工资卡');

  if (mentionsDigitalCny && !mentionsCredit && !mentionsDebit) {
    return 'digital_cny';
  }
  if (mentionsDebit && !mentionsCredit && !mentionsDigitalCny) {
    return 'debit';
  }
  if (mentionsCredit && !mentionsDebit && !mentionsDigitalCny) {
    return 'credit';
  }

  return 'any';
}

/**
 * Checks whether a rule/transaction's cardType may contribute to an activity's cardType.
 * By default, digital_cny / debit / credit are strictly isolated unless an activity explicitly declares includedCardTypes.
 */
export function isCardTypeCompatible(
  ruleCardType: CardType,
  actCardType: CardType,
  actIncludedCardTypes?: CardType[],
  actBank?: string
): boolean {
  // 1. Explicit combo activity specifying participating card types
  if (actIncludedCardTypes && actIncludedCardTypes.length > 0) {
    if (ruleCardType === 'any') {
      return actIncludedCardTypes.includes('any') || actIncludedCardTypes.some(t => t !== 'digital_cny');
    }
    return actIncludedCardTypes.includes(ruleCardType) || actIncludedCardTypes.includes('any');
  }

  // 2. Digital RMB is strictly isolated from non-digital_cny activities
  if (ruleCardType === 'digital_cny' || actCardType === 'digital_cny') {
    return ruleCardType === 'digital_cny' && actCardType === 'digital_cny';
  }

  // 3. Debit and Credit are strictly isolated from each other
  if (ruleCardType === 'debit' && actCardType === 'credit') return false;
  if (ruleCardType === 'credit' && actCardType === 'debit') return false;

  // 4. Payment platform milestones (e.g. 支付宝快捷支付) without card restriction allow credit/debit bank cards
  const isPaymentPlatformAct = actBank === '支付宝' || actBank === '微信支付' || actBank === '银联云闪付';
  if (isPaymentPlatformAct && actCardType === 'any') {
    return ruleCardType === 'credit' || ruleCardType === 'debit' || ruleCardType === 'any';
  }

  if (ruleCardType !== 'any' && actCardType !== 'any') {
    return ruleCardType === actCardType;
  }

  // Keep debit isolated from generic bank activities unless explicitly allowed
  if (ruleCardType === 'debit' && actCardType === 'any') return false;
  if (actCardType === 'debit' && ruleCardType === 'any') return false;

  return true;
}

// Valuation rate: 10,000 points = 15 RMB
export const POINTS_RMB_RATE = 15 / 10000;
// Conservative value for a lottery ticket chance: 3 RMB
export const LOTTERY_RMB_VALUE = 3.0;

/**
 * Returns local date in YYYY-MM-DD format (using local device timezone, avoiding UTC shifts)
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns local date time in YYYY-MM-DD HH:mm format
 */
export function getNowLocalDateTimeString(d: Date = new Date()): string {
  const dateStr = getLocalDateString(d);
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${dateStr} ${hour}:${minute}`;
}

/**
 * Returns the exact last calendar date (YYYY-MM-DD) for a given YYYY-MM month string
 */
export function getMonthEndDateString(yearMonth: string): string {
  const [yStr, mStr] = yearMonth.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  if (!y || !m) return `${yearMonth}-30`;
  const lastDay = new Date(y, m, 0).getDate();
  return `${yearMonth}-${String(lastDay).padStart(2, '0')}`;
}

/**
 * Returns the start (Monday) and end (Sunday) dates of the ISO week containing dateStr (YYYY-MM-DD)
 */
export function getWeekStartAndEnd(dateStr: string): { start: string; end: string } {
  const parts = dateStr.split('-').map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  const dayOfWeek = date.getDay(); // 0 is Sunday, 1 is Monday...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: getLocalDateString(monday),
    end: getLocalDateString(sunday)
  };
}

export interface RulePeriodUsage {
  dailyUsage: number;
  weeklyUsage: number;
  monthlyUsage: number;
  totalUsage: number;
}

/**
 * Safely extracts YYYY-MM-DD from any date string
 */
export function extractDateStr(whenStr?: string): string | null {
  if (!whenStr) return null;
  const match = whenStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (match) {
    const y = match[1];
    const m = match[2].padStart(2, '0');
    const d = match[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return null;
}

/**
 * Dynamically calculates how many times a rule has been used in current day, week, month, and total
 * based on ledger records and avoiding timezone shifts
 */
export function calculateRuleUsage(
  rule: InstantRule,
  feedbackRecords: FeedbackRecord[] = [],
  currentDateStr: string = getLocalDateString()
): RulePeriodUsage {
  const normRuleName = (rule.name || '').trim().toLowerCase();
  const matchingRecords = feedbackRecords.filter(f => {
    if (f.ruleId && f.ruleId === rule.id) return true;
    if (normRuleName && f.ruleName && f.ruleName.trim().toLowerCase() === normRuleName) return true;
    return false;
  });

  const currentMonthStr = currentDateStr.slice(0, 7);
  const { start: weekStart, end: weekEnd } = getWeekStartAndEnd(currentDateStr);

  let dailyUsage = 0;
  let weeklyUsage = 0;
  let monthlyUsage = 0;
  let totalUsage = 0;

  for (const f of matchingRecords) {
    totalUsage++;
    const recDate = extractDateStr(f.when);
    if (!recDate) continue;

    if (recDate === currentDateStr) {
      dailyUsage++;
    }
    if (recDate >= weekStart && recDate <= weekEnd) {
      weeklyUsage++;
    }
    if (recDate.slice(0, 7) === currentMonthStr) {
      monthlyUsage++;
    }
  }

  return {
    dailyUsage,
    weeklyUsage,
    monthlyUsage,
    totalUsage
  };
}

export function evaluateRecommendations(
  query: RecommendationQuery,
  rules: InstantRule[],
  activities: MilestoneActivity[],
  rewardActivities: RewardComboActivity[],
  feedbackRecords: FeedbackRecord[] = []
): RecommendationResult[] {
  const {
    amount,
    scene,
    channel,
    bank,
    cardType,
    currentTime = '08:30',
    currentDate = getLocalDateString()
  } = query;

  if (amount <= 0) return [];

  const normQueryScene = normalizeKey(scene) || 'any';
  const normQueryChannel = normalizeKey(channel) || 'any';

  const results: RecommendationResult[] = [];

  // 1. Evaluate Instant Rules
  for (const rule of rules) {
    if (rule.enabled === false) continue;

    // Bank filter
    if (bank && bank !== 'all' && rule.bank !== bank) continue;

    // Card type inference & filter
    const ruleCardType = inferCardType(rule);
    if (cardType && cardType !== 'any') {
      if (cardType === 'digital_cny' && ruleCardType !== 'digital_cny') continue;
      if (cardType === 'debit' && ruleCardType !== 'debit') continue;
      if (cardType === 'credit' && ruleCardType !== 'credit' && ruleCardType !== 'any') continue;
    }

    // Scene match (normalized)
    const normRuleScene = normalizeKey(rule.scene) || 'any';
    const sceneMatch =
      normRuleScene === 'any' ||
      normQueryScene === 'any' ||
      normRuleScene === normQueryScene ||
      (rule.scenes && rule.scenes.some(s => normalizeKey(s) === normQueryScene));
    if (!sceneMatch) continue;

    // Channel match (normalized, keeping digital_cny distinct from alipay/unionpay)
    const normRuleChannel = normalizeKey(rule.channel) || 'any';
    const channelMatch =
      normRuleChannel === 'any' ||
      normQueryChannel === 'any' ||
      normRuleChannel === normQueryChannel ||
      (normQueryChannel === 'digital_cny' && ruleCardType === 'digital_cny') ||
      (normRuleChannel === 'alipay' && normQueryChannel === 'transit_code' && ruleCardType !== 'digital_cny') ||
      (normRuleChannel === 'transit_code' && ruleCardType !== 'digital_cny' && (normQueryChannel === 'alipay' || normQueryChannel === 'unionpay'));
    if (!channelMatch) continue;

    // Evaluate eligibility
    let isEligible = true;
    const ineligibleReasons: string[] = [];

    // Time window check (e.g. 06:30 - 10:00, 00:00 - 10:00, 18:00 - 23:59, or cross-midnight 22:00 - 06:00)
    let isTimeRestricted = false;
    let inTimeWindow = true;
    const hasTimeWindow = Boolean(
      rule.start && rule.end && !(rule.start === '00:00' && rule.end === '23:59')
    );
    if (hasTimeWindow) {
      isTimeRestricted = true;
      const inRange =
        rule.start <= rule.end
          ? currentTime >= rule.start && currentTime <= rule.end
          : currentTime >= rule.start || currentTime <= rule.end;
      if (!inRange) {
        inTimeWindow = false;
        isEligible = false;
        ineligibleReasons.push(`不在生效时段内 (限 ${rule.start}-${rule.end}，当前用卡时间 ${currentTime})`);
      }
    }

    // Amount min check
    let meetsMin = true;
    if (rule.min && amount < rule.min) {
      meetsMin = false;
      isEligible = false;
      const diff = (rule.min - amount).toFixed(2);
      ineligibleReasons.push(`未达门槛金额 (需满 ¥${rule.min}，还差 ¥${diff})`);
    }

    // Date range check: completely exclude expired or unstarted rules from query recommendations
    const curDateStr = extractDateStr(currentDate) || currentDate;
    const ruleEndDate = extractDateStr(rule.dateEnd);
    const ruleStartDate = extractDateStr(rule.dateStart);

    if (ruleEndDate && curDateStr > ruleEndDate) {
      // Activity has already ended; do not include in results or ineligible
      continue;
    }
    if (ruleStartDate && curDateStr < ruleStartDate) {
      // Activity has not started yet
      continue;
    }

    // Parallel usage limits check (supporting parallel: dailyLimit, weeklyLimit, monthlyLimit, totalLimit, and legacy limit)
    const dailyLimit = rule.dailyLimit ?? (rule.limitPeriod === 'day' ? rule.limit : null);
    const weeklyLimit = rule.weeklyLimit ?? (rule.limitPeriod === 'week' ? rule.limit : null);
    const monthlyLimit = rule.monthlyLimit ?? (rule.limitPeriod === 'month' ? rule.limit : null);
    const totalLimit = rule.totalLimit ?? (rule.limitPeriod === 'total' ? rule.limit : null);

    // Calculate dynamic usage from feedback records based on local date
    const usage = calculateRuleUsage(rule, feedbackRecords, currentDate);

    // Check each configured parallel limit
    if (dailyLimit && dailyLimit > 0 && usage.dailyUsage >= dailyLimit) {
      isEligible = false;
      ineligibleReasons.push(`本日优惠次数已达上限 (${usage.dailyUsage}/${dailyLimit}次)`);
    }

    if (weeklyLimit && weeklyLimit > 0 && usage.weeklyUsage >= weeklyLimit) {
      isEligible = false;
      ineligibleReasons.push(`本周优惠次数已达上限 (${usage.weeklyUsage}/${weeklyLimit}次)`);
    }

    if (monthlyLimit && monthlyLimit > 0 && usage.monthlyUsage >= monthlyLimit) {
      isEligible = false;
      ineligibleReasons.push(`本月优惠次数已达上限 (${usage.monthlyUsage}/${monthlyLimit}次)`);
    }

    if (totalLimit && totalLimit > 0 && usage.totalUsage >= totalLimit) {
      isEligible = false;
      ineligibleReasons.push(`活动总优惠次数已达上限 (${usage.totalUsage}/${totalLimit}次)`);
    }

    // Calculate benefits
    let instantSavings = 0;
    let cashbackReward = 0;
    let pointsReward = 0;
    let lotteryChances = 0;
    let lotteryValue = 0;
    const qualifications: string[] = [];
    const triggeredMilestones: string[] = [];
    const triggeredActivityNames: string[] = [];

    if (isTimeRestricted) {
      qualifications.push(`限时段 ${rule.start}-${rule.end}${inTimeWindow ? ' (当前生效中)' : ' (当前未在时间段)'}`);
    }
    if (rule.min) {
      qualifications.push(`满¥${rule.min}起用${meetsMin ? '' : ' (未达标)'}`);
    }
    if (rule.cap && rule.cap > 0) {
      qualifications.push(rule.type === 'points' ? `单笔封顶 ${rule.cap}积分` : `单笔封顶 ¥${rule.cap}`);
    }
    if (dailyLimit && dailyLimit > 0) {
      const rem = Math.max(0, dailyLimit - usage.dailyUsage);
      qualifications.push(`限额 ${dailyLimit}次/日 (今日余${rem}次)`);
    }
    if (weeklyLimit && weeklyLimit > 0) {
      const rem = Math.max(0, weeklyLimit - usage.weeklyUsage);
      qualifications.push(`限额 ${weeklyLimit}次/周 (本周余${rem}次)`);
    }
    if (monthlyLimit && monthlyLimit > 0) {
      const rem = Math.max(0, monthlyLimit - usage.monthlyUsage);
      qualifications.push(`限额 ${monthlyLimit}次/月 (本月余${rem}次)`);
    }
    if (totalLimit && totalLimit > 0) {
      const rem = Math.max(0, totalLimit - usage.totalUsage);
      qualifications.push(`总限额 ${totalLimit}次 (余${rem}次)`);
    }

    switch (rule.type) {
      case 'fixed': {
        const raw = rule.cap > 0 ? Math.min(rule.fixed, rule.cap) : rule.fixed;
        instantSavings = Math.min(raw, amount);
        break;
      }
      case 'rate': {
        const calculated = (amount * (rule.rate || 0)) / 100;
        instantSavings = rule.cap > 0 ? Math.min(calculated, rule.cap) : calculated;
        instantSavings = Math.min(instantSavings, amount);
        break;
      }
      case 'cashback':
        if (rule.fixed > 0) {
          cashbackReward = rule.cap > 0 ? Math.min(rule.fixed, rule.cap) : rule.fixed;
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
        if (rule.cap > 0) lotteryValue = Math.min(lotteryValue, rule.cap);
        break;
      case 'threshold': {
        const raw = rule.cap > 0 ? Math.min(rule.fixed, rule.cap) : rule.fixed;
        instantSavings = Math.min(raw, amount);
        break;
      }
      case 'alipay_quickpay':
        cashbackReward = rule.fixed > 0 ? rule.fixed : 5;
        if (rule.cap > 0) cashbackReward = Math.min(cashbackReward, rule.cap);
        triggeredMilestones.push('计入支付宝快捷支付月度满额累计');
        break;
    }

    // Check real active MilestoneActivities & RewardComboActivities in state
    // Enforce strict CardType isolation (digital_cny / debit / credit are independent unless explicitly combined)
    const effectiveRuleChannel = normRuleChannel === 'any' ? normQueryChannel : normRuleChannel;
    const effectiveRuleScene = normRuleScene === 'any' ? normQueryScene : normRuleScene;

    for (const act of activities) {
      if (act.excludeFromRecommend) continue;
      const actEndDate = extractDateStr(act.end);
      const actStartDate = extractDateStr(act.start);
      if (actEndDate && curDateStr > actEndDate) continue;
      if (actStartDate && curDateStr < actStartDate) continue;

      const actCardType = inferCardType(act);
      if (!isCardTypeCompatible(ruleCardType, actCardType, act.includedCardTypes, act.bank)) {
        continue;
      }

      const bankMatches =
        act.bank === '通用/多行' ||
        act.bank === '不限' ||
        (Boolean(act.bank) && act.bank === rule.bank) ||
        (act.bank === '支付宝' && effectiveRuleChannel === 'alipay' && ruleCardType !== 'digital_cny');
      if (!bankMatches) continue;

      const normActChannel = normalizeKey(act.channel) || 'any';
      const channelMatches =
        normActChannel === 'any' ||
        (effectiveRuleChannel !== 'any' && normActChannel === effectiveRuleChannel);
      if (!channelMatches) continue;

      const normActScene = normalizeKey(act.scene) || 'any';
      const sceneMatches =
        normActScene === 'any' ||
        effectiveRuleScene === 'any' ||
        normActScene === effectiveRuleScene ||
        (rule.scenes && rule.scenes.some(s => normalizeKey(s) === normActScene));
      if (!sceneMatches) continue;

      const curSpend = act.currentSpend || 0;
      const nextHitTier = act.tiers.find(t => curSpend < t.target && curSpend + amount >= t.target);
      if (nextHitTier) {
        triggeredMilestones.push(`叠加推进【${act.name}】达标¥${nextHitTier.target} (${nextHitTier.rewardName})`);
        triggeredActivityNames.push(act.name);
      } else if (act.tiers.some(t => curSpend < t.target)) {
        triggeredMilestones.push(`计入【${act.name}】累计消费`);
        triggeredActivityNames.push(act.name);
      }
    }

    for (const combo of rewardActivities) {
      if (combo.excludeFromRecommend) continue;
      const comboEndDate = extractDateStr(combo.end);
      const comboStartDate = extractDateStr(combo.start);
      if (comboEndDate && curDateStr > comboEndDate) continue;
      if (comboStartDate && curDateStr < comboStartDate) continue;

      const comboCardType = inferCardType(combo);
      if (!isCardTypeCompatible(ruleCardType, comboCardType, combo.includedCardTypes, combo.bank)) {
        continue;
      }

      const bankMatches =
        combo.bank === '通用/多行' ||
        combo.bank === '不限' ||
        (Boolean(combo.bank) && combo.bank === rule.bank);
      if (!bankMatches) continue;

      const normComboChannels = (combo.channels || []).map(c => normalizeKey(c));
      const channelMatches =
        normComboChannels.length === 0 ||
        normComboChannels.includes('any') ||
        (effectiveRuleChannel !== 'any' && normComboChannels.includes(effectiveRuleChannel));
      if (!channelMatches) continue;

      const normComboScene = normalizeKey(combo.scene) || 'any';
      const sceneMatches =
        normComboScene === 'any' ||
        effectiveRuleScene === 'any' ||
        normComboScene === effectiveRuleScene ||
        (rule.scenes && rule.scenes.some(s => normalizeKey(s) === normComboScene));
      if (!sceneMatches) continue;

      for (const cr of combo.rules || []) {
        if (cr.amount > 0 && amount >= cr.amount && (cr.type === 'daily' || cr.type === 'single')) {
          if (cr.rewardType === 'points' && cr.reward > 0) {
            pointsReward += cr.reward;
            triggeredMilestones.push(`触发【${combo.name}·${cr.name}】(+${cr.reward}积分)`);
          } else if (cr.rewardType === 'cash' && cr.reward > 0) {
            cashbackReward += cr.reward;
            triggeredMilestones.push(`触发【${combo.name}·${cr.name}】(+¥${cr.reward})`);
          } else if (cr.rewardType === 'lottery') {
            lotteryChances += 1;
            lotteryValue += cr.reward > 0 ? cr.reward : LOTTERY_RMB_VALUE;
            triggeredMilestones.push(`触发【${combo.name}·${cr.name}】抽奖机会`);
          }
          if (!triggeredActivityNames.includes(combo.name)) {
            triggeredActivityNames.push(combo.name);
          }
        }
      }
    }

    const pointsValue = pointsReward * POINTS_RMB_RATE;
    const totalEffectiveBenefit = instantSavings + cashbackReward + pointsValue + lotteryValue;
    const effectiveDiscountRate = amount > 0 ? (totalEffectiveBenefit / amount) * 100 : 0;

    results.push({
      id: rule.id,
      name: rule.name,
      bank: rule.bank || '通用银行',
      cardType: ruleCardType,
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
      triggeredActivityNames,
      qualifications,
      notes: rule.notes || '',
      ruleRef: rule,
      isEligible,
      ineligibleReason: isEligible ? undefined : ineligibleReasons.join('；')
    });
  }

  // 2. Evaluate Milestone Activities (Tiered activities like 交行达标5000送15 / 支付宝快捷支付)
  const curDateStr = extractDateStr(currentDate) || currentDate;
  for (const act of activities) {
    if (act.excludeFromRecommend) continue;
    // Exclude expired milestone activities
    const actEndDate = extractDateStr(act.end);
    const actStartDate = extractDateStr(act.start);
    if (actEndDate && curDateStr > actEndDate) continue;
    if (actStartDate && curDateStr < actStartDate) continue;

    if (bank && bank !== 'all' && act.bank !== bank) continue;

    const actCardType = inferCardType(act);
    if (cardType && cardType !== 'any' && !isCardTypeCompatible(cardType, actCardType, act.includedCardTypes, act.bank)) {
      continue;
    }

    const normActChannel = normalizeKey(act.channel) || 'any';
    if (normQueryChannel === 'digital_cny' && actCardType !== 'digital_cny' && !act.includedCardTypes?.includes('digital_cny')) {
      continue;
    }
    if (normActChannel !== 'any' && normQueryChannel !== 'any' && normActChannel !== normQueryChannel) {
      continue;
    }

    const normActScene = normalizeKey(act.scene) || 'any';
    if (normActScene !== 'any' && normQueryScene !== 'any' && normActScene !== normQueryScene) {
      continue;
    }

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
          cardType: actCardType,
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
          triggeredActivityNames: [act.name],
          qualifications: [`当前累计¥${currentSpend} -> 消费后¥${projectedSpend}`],
          notes: act.notes || '消费门槛阶梯奖励',
          ruleRef: act,
          isEligible: true
        });
      }
    }
  }

  // Sort results: Eligible cards strictly first, sorted by benefit descending; Ineligible cards below, sorted by potential benefit
  results.sort((a, b) => {
    if (a.isEligible !== b.isEligible) {
      return a.isEligible ? -1 : 1;
    }
    if (b.totalEffectiveBenefit !== a.totalEffectiveBenefit) {
      return b.totalEffectiveBenefit - a.totalEffectiveBenefit;
    }
    return b.instantSavings - a.instantSavings;
  });

  // Flag the best overall: ONLY among ELIGIBLE cards with totalEffectiveBenefit > 0
  const bestEligible = results.find(r => r.isEligible && r.totalEffectiveBenefit > 0);
  if (bestEligible) {
    bestEligible.isBestOverall = true;
  }

  // Find highest instant discount ONLY among ELIGIBLE cards with instantSavings > 0
  const eligibleInstants = results.filter(r => r.isEligible && r.instantSavings > 0);
  if (eligibleInstants.length > 0) {
    let topInstant = eligibleInstants[0];
    for (const r of eligibleInstants) {
      if (r.instantSavings > topInstant.instantSavings) {
        topInstant = r;
      }
    }
    topInstant.isBestInstant = true;
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

  // Deduplicate entries by calendar date (keeping the latest entry per day)
  const dailyMap = new Map<string, BankAssetEntry>();
  entries
    .filter(e => e.activityId === activity.id)
    .forEach(e => {
      dailyMap.set(e.date, e);
    });

  const actEntries = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

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
