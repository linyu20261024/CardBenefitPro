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
    const newRecord: FeedbackRecord = {
      ...record,
      id: `feed-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      feedbackAt: new Date().toISOString()
    };

    setState(prev => {
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

      // Update current spend on matching activities
      const updatedActivities = prev.activities.map(act => {
        if (record.contributedActivities && record.contributedActivities.includes(act.name)) {
          return {
            ...act,
            currentSpend: (act.currentSpend || 0) + record.amount
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
    setState(prev => ({
      ...prev,
      feedback: prev.feedback.map(f => (f.id === updatedRecord.id ? updatedRecord : f)),
      lastUpdated: new Date().toISOString()
    }));
  };

  const deleteFeedbackRecord = (id: string) => {
    setState(prev => ({
      ...prev,
      feedback: prev.feedback.filter(f => f.id !== id),
      lastUpdated: new Date().toISOString()
    }));
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
    const newEntry: BankAssetEntry = {
      ...entry,
      id: `asset-entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    };
    setState(prev => ({
      ...prev,
      bankAssetEntries: [...prev.bankAssetEntries, newEntry],
      lastUpdated: new Date().toISOString()
    }));
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
      activities: [activity, ...prev.activities],
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

  const importJsonData = (jsonString: string): { success: boolean; message: string } => {
    try {
      const data = JSON.parse(jsonString);

      // Support both user's nested backup format (data.state.rules) and flat format
      const targetState = data.state ? data.state : data;

      if (!targetState.rules && !targetState.activities) {
        return { success: false, message: '无效的卡片优惠JSON数据，未检测到 rules 或 activities 字段' };
      }

      // Merge and sanitize
      const mergedRules = (targetState.rules || []).map((r: any) => ({
        ...r,
        bank: r.bank || inferBankName(r.name || ''),
        enabled: r.enabled !== false
      }));

      setState(prev => ({
        ...prev,
        rules: mergedRules.length > 0 ? mergedRules : prev.rules,
        activities: targetState.activities || prev.activities,
        rewardActivities: targetState.rewardActivities || prev.rewardActivities,
        bankAssetActivities: targetState.bankAssetActivities || prev.bankAssetActivities,
        bankAssetEntries: targetState.bankAssetEntries || prev.bankAssetEntries,
        feedback: targetState.feedback || prev.feedback,
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
    // Generate compatible backup format with both original fields and enhanced models
    const exportObject = {
      backupFormat: "card-recommender-backup",
      backupVersion: 5,
      appVersion: 5,
      exportedAt: new Date().toISOString(),
      state: {
        ...state,
        lastUpdated: new Date().toISOString()
      },
      customPlatforms: state.customPlatforms,
      customScenes: state.customScenes,
      customChannels: state.customChannels
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

  const currentMonthPrefix = new Date().toISOString().slice(0, 7);
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
