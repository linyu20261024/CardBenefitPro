/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AppState,
  InstantRule,
  MilestoneActivity,
  RewardComboActivity,
  BankAssetActivity,
  BankAssetEntry,
  FeedbackRecord
} from '../types/cardBenefit';
import { getDefaultAppState, getEmptyAppState, inferBankName } from '../data/initialData';
import {
  getLocalDateString,
  inferCardType,
  isCardTypeCompatible,
  normalizeKey,
  getActivityChannels,
  PAYMENT_CHANNEL_OPTIONS,
  SPEND_SCENE_OPTIONS
} from '../utils/engine';

const STORAGE_KEY = 'card_benefit_pro_user_data';

interface CardBenefitContextType {
  state: AppState;
  addFeedbackRecord: (record: Omit<FeedbackRecord, 'id' | 'feedbackAt'>) => void;
  updateFeedbackRecord: (record: FeedbackRecord) => void;
  deleteFeedbackRecord: (id: string) => void;
  toggleRule: (ruleId: string) => void;
  addRule: (rule: InstantRule) => void;
  updateRule: (rule: InstantRule) => void;
  deleteRule: (ruleId: string) => void;
  addBankAssetEntry: (entry: Omit<BankAssetEntry, 'id'>) => void;
  updateBankAssetEntry: (entry: BankAssetEntry) => void;
  deleteBankAssetEntry: (id: string) => void;
  addActivity: (activity: MilestoneActivity) => void;
  updateActivity: (activity: MilestoneActivity) => void;
  deleteActivity: (id: string) => void;
  addRewardActivity: (activity: RewardComboActivity) => void;
  updateRewardActivity: (activity: RewardComboActivity) => void;
  deleteRewardActivity: (id: string) => void;
  addBankAssetActivity: (activity: BankAssetActivity) => void;
  updateBankAssetActivity: (activity: BankAssetActivity) => void;
  deleteBankAssetActivity: (id: string) => void;
  importJsonData: (jsonString: string) => { success: boolean; message: string };
  exportJsonData: () => string;
  resetToDefaultData: () => void;
  clearAllData: () => void;
  loadSampleData: () => void;
  totalSaved: number;
  monthlySaved: number;
  totalCashback: number;
  pendingRewardValue: number;
  activeRulesCount: number;
}

const CardBenefitContext = createContext<CardBenefitContextType | undefined>(undefined);

function reconcileIncompatibleActivitySpend(
  rules: InstantRule[],
  activities: MilestoneActivity[],
  rewardActivities: RewardComboActivity[],
  feedback: FeedbackRecord[]
): { activities: MilestoneActivity[]; feedback: FeedbackRecord[] } {
  const spendReductionByActId: Record<string, number> = {};

  const cleanedFeedback = (feedback || []).map(f => {
    const matchedRule = rules.find(
      r => (f.ruleId && r.id === f.ruleId) || (r.name && f.ruleName && r.name === f.ruleName)
    );
    const fCardType =
      f.cardType ||
      (matchedRule
        ? inferCardType(matchedRule)
        : inferCardType({
            name: f.ruleName,
            notes: f.note,
            platform: f.platform,
            channel: f.channel
          }));
    const fChannel = normalizeKey(matchedRule?.channel || f.channel) || 'any';
    const fScene = normalizeKey(matchedRule?.scene || f.scene) || 'any';
    const fBank = matchedRule?.bank || f.bank;

    if (!f.contributedActivities || f.contributedActivities.length === 0) {
      return f.cardType ? f : { ...f, cardType: fCardType };
    }

    const validContributed = f.contributedActivities.filter(actName => {
      const act = activities.find(a => a.name === actName);
      if (act) {
        const actCardType = inferCardType(act);
        const cardOk = isCardTypeCompatible(fCardType, actCardType, act.includedCardTypes, act.bank);
        const actChannels = getActivityChannels(act);
        const channelOk =
          actChannels.includes('any') ||
          fChannel === 'any' ||
          actChannels.includes(fChannel);
        const normActScene = normalizeKey(act.scene) || 'any';
        const sceneOk =
          normActScene === 'any' || fScene === 'any' || normActScene === fScene;
        const bankOk =
          act.bank === '通用/多行' ||
          act.bank === '不限' ||
          !act.bank ||
          act.bank === fBank ||
          (act.bank === '支付宝' && fChannel === 'alipay' && fCardType !== 'digital_cny');

        if (!cardOk || !channelOk || !sceneOk || !bankOk) {
          spendReductionByActId[act.id] = (spendReductionByActId[act.id] || 0) + (f.amount || 0);
          return false;
        }
        return true;
      }

      const combo = rewardActivities.find(c => c.name === actName);
      if (combo) {
        const comboCardType = inferCardType(combo);
        return isCardTypeCompatible(fCardType, comboCardType, combo.includedCardTypes, combo.bank);
      }

      return true;
    });

    return {
      ...f,
      cardType: f.cardType || fCardType,
      contributedActivities: validContributed
    };
  });

  const cleanedActivities = (activities || []).map(act => {
    const reduction = spendReductionByActId[act.id] || 0;
    if (reduction > 0) {
      const nextSpend = Math.max(0, Number(((act.currentSpend || 0) - reduction).toFixed(2)));
      return {
        ...act,
        currentSpend: nextSpend
      };
    }
    return act;
  });

  return {
    activities: cleanedActivities,
    feedback: cleanedFeedback
  };
}

export const CardBenefitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.version >= 4) {
          if (parsed.rules && parsed.rules.length > 0) {
            parsed.rules = parsed.rules.map((r: any) => ({
              ...r,
              bank: r.bank || inferBankName(r.name || '')
            }));
          }
          if (parsed.activities && parsed.activities.length > 0) {
            parsed.activities = parsed.activities.map((a: any) => ({
              ...a,
              bank: a.bank || inferBankName(a.name || '')
            }));
          }
          if (parsed.rewardActivities && parsed.rewardActivities.length > 0) {
            parsed.rewardActivities = parsed.rewardActivities.map((ra: any) => ({
              ...ra,
              bank: ra.bank || inferBankName(ra.name || '')
            }));
          }
          if ((parsed.version || 0) < 6) {
            const reconciled = reconcileIncompatibleActivitySpend(
              parsed.rules || [],
              parsed.activities || [],
              parsed.rewardActivities || [],
              parsed.feedback || []
            );
            parsed.activities = reconciled.activities;
            parsed.feedback = reconciled.feedback;
            parsed.version = 6;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load saved state from localStorage:', e);
    }
    // First time opening the application is strictly EMPTY!
    return getEmptyAppState();
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to persist state:', e);
    }
  }, [state]);

  const addFeedbackRecord = (record: Omit<FeedbackRecord, 'id' | 'feedbackAt'>) => {
    setState(prev => {
      const matchedRule = prev.rules.find(
        r => (record.ruleId && r.id === record.ruleId) || (r.name && record.ruleName && r.name === record.ruleName)
      );
      const recordCardType =
        record.cardType ||
        (matchedRule ? inferCardType(matchedRule) : inferCardType(record));

      const recordChannel = normalizeKey(record.channel) || 'any';

      const filteredContributed = (record.contributedActivities || []).filter(actName => {
        const act = prev.activities.find(a => a.name === actName);
        if (act) {
          const cardOk = isCardTypeCompatible(recordCardType, inferCardType(act), act.includedCardTypes, act.bank);
          const actChannels = getActivityChannels(act);
          const chOk = actChannels.includes('any') || recordChannel === 'any' || actChannels.includes(recordChannel);
          return cardOk && chOk;
        }
        const combo = prev.rewardActivities.find(c => c.name === actName);
        if (combo) {
          const cardOk = isCardTypeCompatible(recordCardType, inferCardType(combo), combo.includedCardTypes, combo.bank);
          const comboChannels = (combo.channels || []).map(c => normalizeKey(c));
          const chOk = comboChannels.length === 0 || comboChannels.includes('any') || recordChannel === 'any' || comboChannels.includes(recordChannel);
          return cardOk && chOk;
        }
        return true;
      });

      const newRecord: FeedbackRecord = {
        ...record,
        channel: recordChannel,
        cardType: recordCardType,
        contributedActivities: filteredContributed,
        id: `feed-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        feedbackAt: new Date().toISOString()
      };

      // Also increment usedCount on rule if applicable
      const updatedRules = prev.rules.map(r => {
        if (r.id === record.ruleId) {
          return {
            ...r,
            usedCount: (r.usedCount || 0) + 1
          };
        }
        return r;
      });

      // Update current spend on matching and card-type-compatible activities
      const updatedActivities = prev.activities.map(act => {
        if (
          filteredContributed.includes(act.name) &&
          isCardTypeCompatible(recordCardType, inferCardType(act), act.includedCardTypes, act.bank)
        ) {
          return {
            ...act,
            currentSpend: Number(((act.currentSpend || 0) + record.amount).toFixed(2))
          };
        }
        return act;
      });

      return {
        ...prev,
        rules: updatedRules,
        activities: updatedActivities,
        feedback: [newRecord, ...prev.feedback],
        lastUpdated: new Date().toISOString()
      };
    });
  };

  const updateFeedbackRecord = (updatedRecord: FeedbackRecord) => {
    setState(prev => {
      const oldRecord = prev.feedback.find(f => f.id === updatedRecord.id);
      const oldAmount = oldRecord?.amount || 0;
      const newAmount = updatedRecord.amount || 0;
      const oldActs = new Set(oldRecord?.contributedActivities || []);
      const newActs = new Set(updatedRecord.contributedActivities || []);

      const updatedActivities = oldRecord
        ? prev.activities.map(act => {
            const hadOld = oldActs.has(act.name);
            const hasNew = newActs.has(act.name);
            if (!hadOld && !hasNew) return act;
            let delta = 0;
            if (hadOld && hasNew) delta = newAmount - oldAmount;
            else if (!hadOld && hasNew) delta = newAmount;
            else if (hadOld && !hasNew) delta = -oldAmount;
            if (delta === 0) return act;
            return {
              ...act,
              currentSpend: Math.max(0, Number(((act.currentSpend || 0) + delta).toFixed(2)))
            };
          })
        : prev.activities;

      return {
        ...prev,
        activities: updatedActivities,
        feedback: prev.feedback.map(f =>
          f.id === updatedRecord.id
            ? { ...updatedRecord, channel: normalizeKey(updatedRecord.channel) || 'any' }
            : f
        ),
        lastUpdated: new Date().toISOString()
      };
    });
  };

  const deleteFeedbackRecord = (id: string) => {
    setState(prev => {
      const target = prev.feedback.find(f => f.id === id);
      const updatedRules = target
        ? prev.rules.map(r =>
            r.id === target.ruleId ? { ...r, usedCount: Math.max(0, (r.usedCount || 0) - 1) } : r
          )
        : prev.rules;
      const updatedActivities =
        target && target.contributedActivities && target.contributedActivities.length > 0
          ? prev.activities.map(act =>
              target.contributedActivities!.includes(act.name)
                ? { ...act, currentSpend: Math.max(0, (act.currentSpend || 0) - (target.amount || 0)) }
                : act
            )
          : prev.activities;

      return {
        ...prev,
        rules: updatedRules,
        activities: updatedActivities,
        feedback: prev.feedback.filter(f => f.id !== id),
        lastUpdated: new Date().toISOString()
      };
    });
  };

  const toggleRule = (ruleId: string) => {
    setState(prev => ({
      ...prev,
      rules: prev.rules.map(r => (r.id === ruleId ? { ...r, enabled: r.enabled === false ? true : false } : r)),
      lastUpdated: new Date().toISOString()
    }));
  };

  const addRule = (rule: InstantRule) => {
    const newRule: InstantRule = {
      ...rule,
      id: rule.id || `rule-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      bank: rule.bank || inferBankName(rule.name),
      enabled: true
    };
    setState(prev => ({
      ...prev,
      rules: [newRule, ...prev.rules],
      lastUpdated: new Date().toISOString()
    }));
  };

  const updateRule = (updatedRule: InstantRule) => {
    setState(prev => ({
      ...prev,
      rules: prev.rules.map(r => (r.id === updatedRule.id ? updatedRule : r)),
      lastUpdated: new Date().toISOString()
    }));
  };

  const deleteRule = (ruleId: string) => {
    setState(prev => ({
      ...prev,
      rules: prev.rules.filter(r => r.id !== ruleId),
      lastUpdated: new Date().toISOString()
    }));
  };

  const addBankAssetEntry = (entry: Omit<BankAssetEntry, 'id'>) => {
    setState(prev => {
      const existingIdx = prev.bankAssetEntries.findIndex(
        e => e.activityId === entry.activityId && e.date === entry.date
      );
      if (existingIdx >= 0) {
        const updated = [...prev.bankAssetEntries];
        updated[existingIdx] = {
          ...updated[existingIdx],
          amount: entry.amount,
          notes: entry.notes
        };
        return {
          ...prev,
          bankAssetEntries: updated,
          lastUpdated: new Date().toISOString()
        };
      }

      const newEntry: BankAssetEntry = {
        ...entry,
        id: `asset-entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
      };
      return {
        ...prev,
        bankAssetEntries: [...prev.bankAssetEntries, newEntry],
        lastUpdated: new Date().toISOString()
      };
    });
  };

  const updateBankAssetEntry = (updatedEntry: BankAssetEntry) => {
    setState(prev => ({
      ...prev,
      bankAssetEntries: prev.bankAssetEntries.map(e => (e.id === updatedEntry.id ? updatedEntry : e)),
      lastUpdated: new Date().toISOString()
    }));
  };

  const deleteBankAssetEntry = (id: string) => {
    setState(prev => ({
      ...prev,
      bankAssetEntries: prev.bankAssetEntries.filter(e => e.id !== id),
      lastUpdated: new Date().toISOString()
    }));
  };

  const addActivity = (activity: MilestoneActivity) => {
    setState(prev => ({
      ...prev,
      activities: [{ ...activity, currentSpend: activity.currentSpend ?? 0 }, ...prev.activities],
      lastUpdated: new Date().toISOString()
    }));
  };

  const updateActivity = (activity: MilestoneActivity) => {
    setState(prev => ({
      ...prev,
      activities: prev.activities.map(a => (a.id === activity.id ? activity : a)),
      lastUpdated: new Date().toISOString()
    }));
  };

  const deleteActivity = (id: string) => {
    setState(prev => ({
      ...prev,
      activities: prev.activities.filter(a => a.id !== id),
      lastUpdated: new Date().toISOString()
    }));
  };

  const addRewardActivity = (activity: RewardComboActivity) => {
    setState(prev => ({
      ...prev,
      rewardActivities: [activity, ...prev.rewardActivities],
      lastUpdated: new Date().toISOString()
    }));
  };

  const updateRewardActivity = (activity: RewardComboActivity) => {
    setState(prev => ({
      ...prev,
      rewardActivities: prev.rewardActivities.map(a => (a.id === activity.id ? activity : a)),
      lastUpdated: new Date().toISOString()
    }));
  };

  const deleteRewardActivity = (id: string) => {
    setState(prev => ({
      ...prev,
      rewardActivities: prev.rewardActivities.filter(a => a.id !== id),
      lastUpdated: new Date().toISOString()
    }));
  };

  const addBankAssetActivity = (activity: BankAssetActivity) => {
    setState(prev => ({
      ...prev,
      bankAssetActivities: [activity, ...prev.bankAssetActivities],
      lastUpdated: new Date().toISOString()
    }));
  };

  const updateBankAssetActivity = (activity: BankAssetActivity) => {
    setState(prev => ({
      ...prev,
      bankAssetActivities: prev.bankAssetActivities.map(a => (a.id === activity.id ? activity : a)),
      lastUpdated: new Date().toISOString()
    }));
  };

  const deleteBankAssetActivity = (id: string) => {
    setState(prev => ({
      ...prev,
      bankAssetActivities: prev.bankAssetActivities.filter(a => a.id !== id),
      lastUpdated: new Date().toISOString()
    }));
  };

  const importJsonData = (jsonString: string): { success: boolean; message: string } => {
    try {
      const data = JSON.parse(jsonString);

      // Support both user's nested backup format (data.state.rules) and flat format
      const targetState = data.state ? data.state : data;

      if (!targetState.rules && !targetState.activities) {
        return { success: false, message: '无效的卡片优惠JSON数据，未检测到 rules 或 activities 字段' };
      }

      // Merge and sanitize with bank inference
      const mergedRules = (targetState.rules || []).map((r: any) => ({
        ...r,
        bank: r.bank || inferBankName(r.name || ''),
        enabled: r.enabled !== false,
        dailyLimit: r.dailyLimit !== undefined ? r.dailyLimit : (r.limitPeriod === 'day' ? r.limit : null),
        weeklyLimit: r.weeklyLimit !== undefined ? r.weeklyLimit : (r.limitPeriod === 'week' ? r.limit : null),
        monthlyLimit: r.monthlyLimit !== undefined ? r.monthlyLimit : (r.limitPeriod === 'month' ? r.limit : null),
        totalLimit: r.totalLimit !== undefined ? r.totalLimit : (r.limitPeriod === 'total' ? r.limit : null)
      }));

      const mergedActivities = (targetState.activities || []).map((a: any) => ({
        ...a,
        bank: a.bank || inferBankName(a.name || ''),
        channels: Array.isArray(a.channels) && a.channels.length > 0 ? a.channels : (a.channel ? [a.channel] : ['any']),
        currentSpend: a.currentSpend ?? 0
      }));

      const mergedRewardActivities = (targetState.rewardActivities || []).map((ra: any) => ({
        ...ra,
        bank: ra.bank || inferBankName(ra.name || '')
      }));

      const mergedFeedback = targetState.feedback || [];
      const reconciled = reconcileIncompatibleActivitySpend(
        mergedRules,
        mergedActivities,
        mergedRewardActivities,
        mergedFeedback
      );

      setState(prev => ({
        ...prev,
        version: 6,
        rules: mergedRules.length > 0 ? mergedRules : prev.rules,
        activities: reconciled.activities.length > 0 ? reconciled.activities : prev.activities,
        rewardActivities: mergedRewardActivities.length > 0 ? mergedRewardActivities : prev.rewardActivities,
        bankAssetActivities: targetState.bankAssetActivities || prev.bankAssetActivities,
        bankAssetEntries: targetState.bankAssetEntries || prev.bankAssetEntries,
        feedback: targetState.feedback ? reconciled.feedback : prev.feedback,
        lastUpdated: new Date().toISOString()
      }));

      return {
        success: true,
        message: `成功导入数据：包含 ${mergedRules.length} 条用卡规则、${(targetState.activities || []).length} 个达标活动！`
      };
    } catch (e: any) {
      return { success: false, message: `解析JSON失败: ${e.message || '格式错误'}` };
    }
  };

  const exportJsonData = (): string => {
    // Merge standard channel & scene dictionaries for seamless import into PocketGains (拾零账本) and backup restore
    const channelMap = new Map<string, string>();
    [...PAYMENT_CHANNEL_OPTIONS, { value: 'any', label: '不限渠道' }, ...(state.customChannels || [])].forEach(c => {
      const key = normalizeKey(c.value);
      if (key && !channelMap.has(key)) {
        channelMap.set(key, c.label);
      }
    });
    const mergedCustomChannels = Array.from(channelMap.entries()).map(([value, label]) => ({ value, label }));

    const sceneMap = new Map<string, string>();
    [...SPEND_SCENE_OPTIONS, ...(state.customScenes || [])].forEach(s => {
      const key = normalizeKey(s.value);
      if (key && !sceneMap.has(key)) {
        sceneMap.set(key, s.label);
      }
    });
    const mergedCustomScenes = Array.from(sceneMap.entries()).map(([value, label]) => ({ value, label }));

    // Normalize activities & feedback for PocketGains compatibility while preserving 100% lossless backup
    const normalizedActivities = (state.activities || []).map(act => {
      const chList = getActivityChannels(act);
      return {
        ...act,
        channel: chList.includes('any') ? 'any' : chList[0],
        channels: chList,
        tiers: (act.tiers || []).map(tier => {
          const isPaidOut = tier.rewardStatus === 'confirmed' || tier.rewardStatus === 'claimed';
          const hasCashReward = (tier.actualReward || 0) > 0;
          const compatibleRewardType =
            isPaidOut && hasCashReward && (!tier.rewardType || tier.rewardType === 'other')
              ? 'cashback'
              : tier.rewardType;
          return {
            ...tier,
            rewardType: compatibleRewardType
          };
        })
      };
    });

    const normalizedFeedback = (state.feedback || []).map(f => ({
      ...f,
      channel: normalizeKey(f.channel) || 'any',
      scene: normalizeKey(f.scene) || 'any',
      when: f.when ? f.when.replace('T', ' ') : f.when
    }));

    const exportState = {
      ...state,
      version: 6,
      activities: normalizedActivities,
      feedback: normalizedFeedback,
      customChannels: mergedCustomChannels,
      customScenes: mergedCustomScenes,
      lastUpdated: new Date().toISOString()
    };

    const exportObject = {
      backupFormat: 'card-recommender-backup',
      backupVersion: 6,
      appVersion: 6,
      exportedAt: new Date().toISOString(),
      state: exportState,
      customPlatforms: state.customPlatforms,
      customScenes: mergedCustomScenes,
      customChannels: mergedCustomChannels
    };
    return JSON.stringify(exportObject, null, 2);
  };

  const resetToDefaultData = () => {
    const emptyData = getEmptyAppState();
    setState(emptyData);
    localStorage.removeItem(STORAGE_KEY);
  };

  const clearAllData = () => {
    const emptyData = getEmptyAppState();
    setState(emptyData);
    localStorage.removeItem(STORAGE_KEY);
  };

  const loadSampleData = () => {
    const sample = getDefaultAppState();
    setState(sample);
  };

  // Aggregated calculations
  const totalSaved = state.feedback.reduce((sum, f) => sum + (f.actual || f.expected || 0), 0);

  const currentMonthPrefix = getLocalDateString().slice(0, 7);
  const monthlySaved = state.feedback
    .filter(f => (f.when || f.feedbackAt || '').startsWith(currentMonthPrefix))
    .reduce((sum, f) => sum + (f.actual || f.expected || 0), 0);

  const totalCashback = state.activities.reduce((sum, act) => {
    return sum + act.tiers.filter(t => t.rewardStatus === 'confirmed' || t.rewardStatus === 'claimed')
      .reduce((tSum, t) => tSum + (t.actualReward || t.estimatedReward || 0), 0);
  }, 0);

  const pendingRewardValue = state.activities.reduce((sum, act) => {
    return sum + act.tiers.filter(t => t.rewardStatus === 'unconfirmed')
      .reduce((tSum, t) => tSum + (t.estimatedReward || 0), 0);
  }, 0);

  const activeRulesCount = state.rules.filter(r => r.enabled !== false).length;

  return (
    <CardBenefitContext.Provider
      value={{
        state,
        addFeedbackRecord,
        updateFeedbackRecord,
        deleteFeedbackRecord,
        toggleRule,
        addRule,
        updateRule,
        deleteRule,
        addBankAssetEntry,
        updateBankAssetEntry,
        deleteBankAssetEntry,
        addActivity,
        updateActivity,
        deleteActivity,
        addRewardActivity,
        updateRewardActivity,
        deleteRewardActivity,
        addBankAssetActivity,
        updateBankAssetActivity,
        deleteBankAssetActivity,
        importJsonData,
        exportJsonData,
        resetToDefaultData,
        clearAllData,
        loadSampleData,
        totalSaved,
        monthlySaved,
        totalCashback,
        pendingRewardValue,
        activeRulesCount
      }}
    >
      {children}
    </CardBenefitContext.Provider>
  );
};

export const useCardBenefit = (): CardBenefitContextType => {
  const context = useContext(CardBenefitContext);
  if (!context) {
    throw new Error('useCardBenefit must be used within a CardBenefitProvider');
  }
  return context;
};
