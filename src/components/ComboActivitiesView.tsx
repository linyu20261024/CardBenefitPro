/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useCardBenefit } from '../context/CardBenefitContext';
import {
  formatCurrency,
  getLocalDateString,
  getMonthEndDateString,
  getNowLocalDateTimeString,
  CARD_TYPE_LABELS,
  inferCardType
} from '../utils/engine';
import { inferBankName } from '../data/initialData';
import { MilestoneActivity, RewardComboActivity, ActivityTier, ComboRule, CardType } from '../types/cardBenefit';
import {
  Sparkles,
  CheckCircle2,
  Gift,
  Coins,
  Layers,
  Flame,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Tag,
  CreditCard,
  ArrowRight,
  Sliders,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Award,
  EyeOff
} from 'lucide-react';

export const ComboActivitiesView: React.FC = () => {
  const {
    state,
    addFeedbackRecord,
    deleteFeedbackRecord,
    addActivity,
    updateActivity,
    deleteActivity,
    updateRewardActivity,
    deleteRewardActivity
  } = useCardBenefit();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [bankFilter, setBankFilter] = useState('all');
  const [activeCategory, setActiveCategory] = useState<'all' | 'milestones' | 'combos' | 'quickpay'>('all');

  // Quick record modal
  const [quickSpendModal, setQuickSpendModal] = useState<{
    targetActivity: string;
    amount: number;
    channel: string;
    bank: string;
    cardType: CardType;
    when: string;
    actualReward: number;
    note: string;
  } | null>(null);

  // Expanded activity spend records
  const [expandedRecords, setExpandedRecords] = useState<Record<string, boolean>>({});

  // Tier Reward Claiming / Earnings Modal
  const [tierRewardModal, setTierRewardModal] = useState<{
    activity: MilestoneActivity;
    tiers: ActivityTier[];
  } | null>(null);

  // Edit Milestone Activity modal
  const [editingMilestone, setEditingMilestone] = useState<MilestoneActivity | null>(null);

  // Edit Combo Activity modal
  const [editingCombo, setEditingCombo] = useState<RewardComboActivity | null>(null);

  // New activity modal
  const [isNewActivityOpen, setIsNewActivityOpen] = useState(false);
  const [newActivityName, setNewActivityName] = useState('支付宝快捷支付满额达标');
  const [newActivityBank, setNewActivityBank] = useState('支付宝');
  const [newActivityCardType, setNewActivityCardType] = useState<CardType>('any');
  const [newActivityIncludedCardTypes, setNewActivityIncludedCardTypes] = useState<CardType[]>(['credit', 'debit']);
  const [newActivityCategory, setNewActivityCategory] = useState<'quickpay' | 'spend' | 'general'>('quickpay');
  const [newActivityExcludeRecommend, setNewActivityExcludeRecommend] = useState<boolean>(false);
  const [newActivityChannel, setNewActivityChannel] = useState('alipay');
  const [newActivityStart, setNewActivityStart] = useState(() => `${getLocalDateString().slice(0, 7)}-01`);
  const [newActivityEnd, setNewActivityEnd] = useState(() => getMonthEndDateString(getLocalDateString().slice(0, 7)));
  const [newActivityNotes, setNewActivityNotes] = useState('支付宝快捷支付消费达标赢立减金与抽奖');
  const [newActivityTiers, setNewActivityTiers] = useState<Array<{ target: number; rewardName: string; estimatedReward: number }>>([
    { target: 1000, rewardName: '5元立减金', estimatedReward: 5 },
    { target: 3000, rewardName: '15元红包', estimatedReward: 15 },
    { target: 5000, rewardName: '88元锦鲤抽奖', estimatedReward: 20 }
  ]);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Compute spend directly from activity.currentSpend (avoiding double counting when addFeedbackRecord updates currentSpend)
  const getActivitySpend = (activityName: string): number => {
    const matchedAct = state.activities.find(a => a.name === activityName);
    if (matchedAct && typeof matchedAct.currentSpend === 'number') {
      return matchedAct.currentSpend;
    }
    return state.feedback
      .filter(f => f.contributedActivities && f.contributedActivities.includes(activityName))
      .reduce((sum, f) => sum + (f.amount || 0), 0);
  };

  // Unique banks list
  const availableBanks = useMemo(() => {
    const banks = new Set<string>();
    state.activities.forEach(a => { if (a.bank) banks.add(a.bank); });
    state.rewardActivities.forEach(a => { if (a.bank) banks.add(a.bank); });
    return ['all', ...Array.from(banks)];
  }, [state.activities, state.rewardActivities]);

  // Filtered milestone activities
  const filteredMilestones = useMemo(() => {
    if (activeCategory === 'combos') return [];
    return state.activities.filter(act => {
      if (bankFilter !== 'all' && act.bank !== bankFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = act.name.toLowerCase().includes(q);
        const matchNotes = (act.notes || '').toLowerCase().includes(q);
        const matchBank = (act.bank || '').toLowerCase().includes(q);
        const matchTiers = act.tiers?.some(t =>
          t.rewardName.toLowerCase().includes(q) || String(t.target).includes(q)
        );
        if (!matchName && !matchNotes && !matchBank && !matchTiers) return false;
      }
      if (activeCategory === 'quickpay') {
        return (
          act.category === 'quickpay' ||
          act.channel === 'alipay' ||
          act.name.includes('快捷') ||
          act.name.includes('支付宝')
        );
      }
      return true;
    });
  }, [state.activities, activeCategory, bankFilter, searchQuery]);

  // Filtered combo activities
  const filteredCombos = useMemo(() => {
    if (activeCategory === 'milestones') return [];
    return state.rewardActivities.filter(a => {
      if (bankFilter !== 'all' && a.bank !== bankFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = a.name.toLowerCase().includes(q);
        const matchNotes = (a.notes || '').toLowerCase().includes(q);
        const matchBank = (a.bank || '').toLowerCase().includes(q);
        const matchRules = a.rules?.some(r =>
          r.name.toLowerCase().includes(q) || (r.notes || '').toLowerCase().includes(q)
        );
        if (!matchName && !matchNotes && !matchBank && !matchRules) return false;
      }
      if (activeCategory === 'quickpay') {
        return (
          a.channels?.includes('alipay') || a.name.includes('快捷支付')
        );
      }
      return true;
    });
  }, [state.rewardActivities, activeCategory, bankFilter, searchQuery]);

  const totalActivitiesCount = state.activities.length + state.rewardActivities.length;
  const filteredCount = filteredMilestones.length + filteredCombos.length;

  const handleQuickSpendSubmit = () => {
    if (!quickSpendModal) return;
    const { targetActivity, amount, channel, bank, cardType, when, actualReward, note } = quickSpendModal;

    addFeedbackRecord({
      ruleId: `combo-${Date.now()}`,
      ruleName: `${targetActivity} - 活动消费记录`,
      bank: bank || '合作银行',
      cardType: cardType || 'any',
      scene: 'any',
      platform: channel === 'alipay' ? 'alipay' : channel === 'wechat' ? 'wechat' : 'bank_app',
      channel: channel || 'any',
      amount,
      expected: actualReward || 0,
      actual: actualReward || 0,
      confirmed: true,
      result: 'confirmed',
      when: when ? when.replace('T', ' ') : getNowLocalDateTimeString(),
      note: note.trim() || `记入【${targetActivity}】活动消费进度`,
      contributedActivities: [targetActivity]
    });

    setToastMsg(
      actualReward > 0
        ? `消费 ¥${amount}（实得收益 ¥${actualReward}）已计入【${targetActivity}】！`
        : `消费 ¥${amount} 已记录并计入【${targetActivity}】活动进度！`
    );
    setQuickSpendModal(null);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSaveTierRewards = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tierRewardModal) return;
    updateActivity({
      ...tierRewardModal.activity,
      tiers: tierRewardModal.tiers
    });
    setToastMsg(`已保存【${tierRewardModal.activity.name}】的活动阶梯收益状态！`);
    setTierRewardModal(null);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityName.trim()) return;

    const resolvedBank = newActivityBank.trim() || inferBankName(newActivityName);

    const newAct: MilestoneActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: newActivityName.trim(),
      bank: resolvedBank,
      cardType: newActivityCardType,
      includedCardTypes: newActivityIncludedCardTypes.length > 0 ? newActivityIncludedCardTypes : undefined,
      category: newActivityCategory,
      excludeFromRecommend: newActivityExcludeRecommend,
      platform: 'any',
      channel: newActivityChannel,
      scene: 'any',
      start: newActivityStart || getLocalDateString(),
      end: newActivityEnd || getMonthEndDateString(getLocalDateString().slice(0, 7)),
      period: 'month',
      rewardMode: 'cumulative',
      currentSpend: 0,
      notes: newActivityNotes.trim(),
      tiers: newActivityTiers.map((t, idx) => ({
        id: `tier-${Date.now()}-${idx}`,
        target: t.target,
        rewardName: t.rewardName,
        estimatedReward: t.estimatedReward,
        rewardStatus: 'unconfirmed',
        actualReward: 0,
        receivedDate: '',
        rewardType: t.rewardName.includes('抽奖') ? 'lottery' : 'cashback',
        points: 0
      }))
    };

    addActivity(newAct);
    setIsNewActivityOpen(false);
    setToastMsg(`已成功添加活动「${newAct.name}」！`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSaveMilestoneEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMilestone) return;

    const sanitizedBank = editingMilestone.bank && editingMilestone.bank !== '合作银行'
      ? editingMilestone.bank
      : inferBankName(editingMilestone.name);

    updateActivity({
      ...editingMilestone,
      bank: sanitizedBank
    });

    setToastMsg(`活动「${editingMilestone.name}」规则修改成功！`);
    setEditingMilestone(null);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSaveComboEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCombo) return;

    const sanitizedBank = editingCombo.bank && editingCombo.bank !== '合作银行'
      ? editingCombo.bank
      : inferBankName(editingCombo.name);

    updateRewardActivity({
      ...editingCombo,
      bank: sanitizedBank
    });

    setToastMsg(`组合连击「${editingCombo.name}」规则修改成功！`);
    setEditingCombo(null);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleAddPresetTemplate = (preset: 'debit_quickpay' | 'alipay' | 'bocom' | 'points') => {
    if (preset === 'debit_quickpay') {
      setNewActivityName('储蓄卡快捷支付月度达标');
      setNewActivityBank('中国银行');
      setNewActivityCardType('debit');
      setNewActivityIncludedCardTypes([]);
      setNewActivityCategory('quickpay');
      setNewActivityExcludeRecommend(true);
      setNewActivityChannel('any');
      setNewActivityNotes('储蓄卡绑定支付宝/微信/抖音等快捷支付达标领立减金（仅记账与收益统计，不参与用卡推荐）');
      setNewActivityTiers([
        { target: 1000, rewardName: '5元微信立减金', estimatedReward: 5 },
        { target: 5000, rewardName: '15元立减金', estimatedReward: 15 }
      ]);
    } else if (preset === 'alipay') {
      setNewActivityName('支付宝快捷支付11月满额达标狂欢');
      setNewActivityBank('支付宝');
      setNewActivityCardType('any');
      setNewActivityIncludedCardTypes(['credit', 'debit']);
      setNewActivityCategory('quickpay');
      setNewActivityExcludeRecommend(false);
      setNewActivityChannel('alipay');
      setNewActivityNotes('绑定银行卡快捷支付消费，满1000返5元，满3000送15元，满5000抽大奖88元');
      setNewActivityTiers([
        { target: 1000, rewardName: '5元刷卡金', estimatedReward: 5 },
        { target: 3000, rewardName: '15元刷卡金', estimatedReward: 15 },
        { target: 5000, rewardName: '88元锦鲤抽奖', estimatedReward: 25 }
      ]);
    } else if (preset === 'bocom') {
      setNewActivityName('交通银行信用卡累计消费抽奖');
      setNewActivityBank('交通银行');
      setNewActivityCardType('credit');
      setNewActivityIncludedCardTypes([]);
      setNewActivityCategory('spend');
      setNewActivityExcludeRecommend(false);
      setNewActivityChannel('any');
      setNewActivityNotes('当月信用卡消费满5000元给1次抽奖，满8000元再给1次抽奖机会（数币/储蓄卡不计入）');
      setNewActivityTiers([
        { target: 5000, rewardName: '抽奖机会1次', estimatedReward: 15 },
        { target: 8000, rewardName: '二重抽奖机会', estimatedReward: 20 }
      ]);
    } else {
      setNewActivityName('信用卡多倍积分阶梯达标');
      setNewActivityBank('通用/多行');
      setNewActivityCardType('credit');
      setNewActivityIncludedCardTypes([]);
      setNewActivityCategory('spend');
      setNewActivityExcludeRecommend(false);
      setNewActivityChannel('any');
      setNewActivityNotes('信用卡消费满额赠送海量综合积分');
      setNewActivityTiers([
        { target: 2000, rewardName: '赠2000积分', estimatedReward: 4 },
        { target: 5000, rewardName: '赠6000积分', estimatedReward: 12 },
        { target: 10000, rewardName: '赠15000积分', estimatedReward: 30 }
      ]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white text-sm font-medium rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            多重组合连击与多维达标活动
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            日/周/连续打卡连击、阶梯满额抽奖与返现，支持随时编辑门槛与规则
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              handleAddPresetTemplate('alipay');
              setIsNewActivityOpen(true);
            }}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新增达标活动</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'all'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          全部活动 ({totalActivitiesCount})
        </button>
        <button
          onClick={() => setActiveCategory('milestones')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'milestones'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          阶梯满额达标 ({state.activities.length})
        </button>
        <button
          onClick={() => setActiveCategory('combos')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeCategory === 'combos'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          组合连击打卡 ({state.rewardActivities.length})
        </button>
        <button
          onClick={() => setActiveCategory('quickpay')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
            activeCategory === 'quickpay'
              ? 'bg-sky-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Flame className="w-3 h-3" />
          <span>快捷支付达标</span>
        </button>
      </div>

      {/* Search & Bank Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索活动名称、银行、消费门槛或奖励内容..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={bankFilter}
            onChange={e => setBankFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-hidden"
          >
            <option value="all">全部发卡银行 ({availableBanks.length > 1 ? availableBanks.length - 1 : 0}家)</option>
            {availableBanks.filter(b => b !== 'all').map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {(searchQuery || bankFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setBankFilter('all');
              }}
              className="px-2.5 py-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 font-medium"
            >
              重置筛选
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {totalActivitiesCount === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-4">
          <Layers className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">暂无多重组合或达标活动</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            当前卡包内尚未包含任何达标活动。您可以通过右上角「同步」导入您的 JSON 数据，或直接使用下方模板快速创建：
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={() => {
                handleAddPresetTemplate('debit_quickpay');
                setIsNewActivityOpen(true);
              }}
              className="px-3.5 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
            >
              + 储蓄卡快捷支付达标 (不推荐)
            </button>
            <button
              onClick={() => {
                handleAddPresetTemplate('alipay');
                setIsNewActivityOpen(true);
              }}
              className="px-3.5 py-1.5 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white rounded-lg transition-colors"
            >
              + 支付宝快捷支付满额活动
            </button>
            <button
              onClick={() => {
                handleAddPresetTemplate('bocom');
                setIsNewActivityOpen(true);
              }}
              className="px-3.5 py-1.5 text-xs font-semibold bg-rose-500 hover:bg-rose-400 text-white rounded-lg transition-colors"
            >
              + 满5000/8000抽奖活动
            </button>
          </div>
        </div>
      ) : filteredCount === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <Search className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">未找到匹配的达标活动</h3>
          <p className="text-xs text-slate-400">
            没有符合当前搜索词「{searchQuery}」或所选银行「{bankFilter}」的活动
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setBankFilter('all');
            }}
            className="px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            清除搜索条件
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section 1: Dynamic Milestone Activities */}
          {filteredMilestones.map(activity => {
            // Precise bank resolution: prioritize real bank name, fallback to inferBankName
            const displayBank =
              activity.bank && activity.bank !== '合作银行' && activity.bank !== '通用'
                ? activity.bank
                : inferBankName(activity.name);

            const actCardType = inferCardType(activity);
            const hasExplicitComboTypes = Boolean(activity.includedCardTypes && activity.includedCardTypes.length > 0);
            const cardScopeLabel = hasExplicitComboTypes
              ? `组合统计: ${activity.includedCardTypes!.map(t => CARD_TYPE_LABELS[t]).join(' + ')}`
              : `${CARD_TYPE_LABELS[actCardType]}独立统计`;

            const currentSpend = getActivitySpend(activity.name);
            const highestTier = activity.tiers.reduce((max, t) => (t.target > max ? t.target : max), 1);
            const nextTier = activity.tiers.find(t => t.target > currentSpend);
            const isAlipayQuickpay =
              activity.category === 'quickpay' ||
              activity.channel === 'alipay' ||
              activity.name.includes('快捷') ||
              activity.name.includes('支付宝');

            const activityRecords = state.feedback.filter(
              f => f.contributedActivities && f.contributedActivities.includes(activity.name)
            );
            const tierConfirmedEarnings = activity.tiers
              .filter(t => t.rewardStatus === 'confirmed' || t.rewardStatus === 'claimed')
              .reduce((sum, t) => sum + (t.actualReward || t.estimatedReward || 0), 0);
            const recordInstantEarnings = activityRecords.reduce(
              (sum, f) => sum + (f.actual || 0),
              0
            );
            const totalActivityEarnings = tierConfirmedEarnings + recordInstantEarnings;
            const isExpanded = Boolean(expandedRecords[activity.id]);

            return (
              <div
                key={activity.id}
                className={`rounded-2xl p-4 sm:p-6 border transition-all space-y-5 ${
                  isAlipayQuickpay
                    ? 'bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 text-white border-sky-500/30 shadow-md'
                    : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 shadow-2xs'
                }`}
              >
                {/* Header row */}
                <div
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b ${
                    isAlipayQuickpay ? 'border-white/10' : 'border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isAlipayQuickpay
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-400/30'
                          : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                      }`}
                    >
                      {isAlipayQuickpay ? <Flame className="w-5 h-5" /> : <Gift className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base sm:text-lg font-bold">{activity.name}</h2>
                        <span
                          className={`px-2 py-0.5 text-2xs font-bold rounded ${
                            isAlipayQuickpay
                              ? 'bg-sky-400 text-slate-950'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {displayBank}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-2xs font-semibold rounded ${
                            hasExplicitComboTypes
                              ? isAlipayQuickpay
                                ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30'
                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800'
                              : isAlipayQuickpay
                              ? 'bg-white/10 text-slate-200'
                              : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                          }`}
                        >
                          {cardScopeLabel}
                        </span>
                        {isAlipayQuickpay && (
                          <span className="px-2 py-0.5 text-2xs font-bold bg-amber-400 text-slate-950 rounded">
                            快捷支付
                          </span>
                        )}
                        {activity.excludeFromRecommend && (
                          <span
                            className={`px-2 py-0.5 text-2xs font-semibold rounded flex items-center gap-1 ${
                              isAlipayQuickpay
                                ? 'bg-slate-700/80 text-slate-200 border border-white/15'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            <EyeOff className="w-3 h-3" />
                            <span>仅记录/不推荐</span>
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-xs mt-0.5 flex flex-wrap items-center gap-3 ${
                          isAlipayQuickpay ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <span>
                          有效期: {activity.start} ~ {activity.end}
                        </span>
                        <span>渠道: {activity.channel === 'any' ? '不限渠道' : activity.channel}</span>
                        {activity.notes && <span>· {activity.notes}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 flex-wrap">
                    <button
                      onClick={() =>
                        setQuickSpendModal({
                          targetActivity: activity.name,
                          amount: nextTier ? Math.max(10, nextTier.target - currentSpend) : 100,
                          channel: activity.channel === 'any' ? (actCardType === 'digital_cny' ? 'digital_cny' : 'alipay') : activity.channel,
                          bank: displayBank,
                          cardType: actCardType,
                          when: getNowLocalDateTimeString(),
                          actualReward: 0,
                          note: ''
                        })
                      }
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs ${
                        isAlipayQuickpay
                          ? 'bg-sky-400 hover:bg-sky-300 text-slate-950'
                          : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>记录消费</span>
                    </button>
                    <button
                      onClick={() =>
                        setTierRewardModal({
                          activity,
                          tiers: activity.tiers.map(t => ({ ...t }))
                        })
                      }
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 border ${
                        isAlipayQuickpay
                          ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border-emerald-400/30'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-emerald-300 dark:border-emerald-800'
                      }`}
                      title="确认阶梯达标收益并记录实得金额"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>登记收益</span>
                    </button>
                    <button
                      onClick={() =>
                        setEditingMilestone({
                          ...activity,
                          bank: displayBank,
                          cardType: actCardType,
                          includedCardTypes: activity.includedCardTypes || []
                        })
                      }
                      className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="修改活动规则与阶梯"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`确认删除活动「${activity.name}」吗？`)) {
                          deleteActivity(activity.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="删除活动"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress bar & Numbers */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
                      <div>
                        <span className={isAlipayQuickpay ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}>
                          本期累计已计入消费:
                        </span>{' '}
                        <span className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums">
                          {formatCurrency(currentSpend)}
                        </span>
                      </div>
                      <div>
                        <span className={isAlipayQuickpay ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}>
                          活动已入账收益:
                        </span>{' '}
                        <span className="text-base sm:text-lg font-extrabold font-mono tabular-nums text-emerald-400 dark:text-emerald-400">
                          +{formatCurrency(totalActivityEarnings)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      {nextTier ? (
                        <span>
                          距下一档(满¥{nextTier.target})还差:{' '}
                          <span className="font-bold text-amber-500 font-mono">
                            {formatCurrency(Math.max(0, nextTier.target - currentSpend))}
                          </span>
                        </span>
                      ) : (
                        <span className="text-emerald-500 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 inline" /> 已达成最高阶梯！
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stepped progress bar */}
                  <div
                    className={`w-full rounded-full h-2.5 overflow-hidden ${
                      isAlipayQuickpay ? 'bg-white/10' : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    <div
                      className={`h-full rounded-full transition-all ${
                        isAlipayQuickpay ? 'bg-sky-400' : 'bg-indigo-600 dark:bg-indigo-400'
                      }`}
                      style={{
                        width: `${Math.min(100, (currentSpend / highestTier) * 100)}%`
                      }}
                    />
                  </div>
                </div>

                {/* Milestone Tiers Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {activity.tiers.map((tier, idx) => {
                    const isAchieved = currentSpend >= tier.target;
                    const isClaimedOrConfirmed = tier.rewardStatus === 'confirmed' || tier.rewardStatus === 'claimed';
                    const diff = tier.target - currentSpend;

                    return (
                      <div
                        key={tier.id || idx}
                        onClick={() =>
                          setTierRewardModal({
                            activity,
                            tiers: activity.tiers.map(t => ({ ...t }))
                          })
                        }
                        className={`p-3.5 rounded-xl border transition-all space-y-1.5 cursor-pointer hover:ring-1 hover:ring-indigo-400/50 ${
                          isAchieved
                            ? isAlipayQuickpay
                              ? 'bg-sky-500/20 border-sky-400/40 text-white'
                              : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-slate-900 dark:text-white'
                            : isAlipayQuickpay
                            ? 'bg-white/5 border-white/10 text-slate-300'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                        title="点击登记或修改此阶梯收益状态"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold font-mono">满 ¥{tier.target}</span>
                          {isAchieved ? (
                            <span className="flex items-center gap-1 text-2xs font-bold text-emerald-500 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" /> 已达成
                            </span>
                          ) : (
                            <span className="text-2xs text-slate-400 font-mono">差 ¥{diff}</span>
                          )}
                        </div>

                        <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 line-clamp-1">
                          {tier.rewardName}
                        </div>

                        <div className="text-3xs text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                          <span>
                            {isClaimedOrConfirmed
                              ? `实得: ¥${tier.actualReward || tier.estimatedReward || 0}`
                              : `预估价值: ¥${tier.estimatedReward || 0}`}
                          </span>
                          <span
                            className={`font-semibold ${
                              tier.rewardStatus === 'claimed'
                                ? 'text-emerald-500 dark:text-emerald-400'
                                : tier.rewardStatus === 'confirmed'
                                ? 'text-sky-500 dark:text-sky-400'
                                : ''
                            }`}
                          >
                            {tier.rewardStatus === 'claimed'
                              ? '已到账 ✓'
                              : tier.rewardStatus === 'confirmed'
                              ? '已确认'
                              : '点击登记收益'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Activity Records Toggle & Inline List */}
                <div className={`pt-2 border-t ${isAlipayQuickpay ? 'border-white/10' : 'border-slate-100 dark:border-slate-800'}`}>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedRecords(prev => ({
                        ...prev,
                        [activity.id]: !prev[activity.id]
                      }))
                    }
                    className={`w-full flex items-center justify-between text-xs font-medium py-1 ${
                      isAlipayQuickpay ? 'text-slate-300 hover:text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>
                      本活动已录入消费与收益流水 ({activityRecords.length} 笔)
                    </span>
                    <span className="flex items-center gap-1 text-2xs">
                      {isExpanded ? '收起明细' : '查看/管理记录'}
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="mt-2 space-y-1.5">
                      {activityRecords.length === 0 ? (
                        <div className={`text-2xs py-3 text-center rounded-lg ${isAlipayQuickpay ? 'bg-white/5 text-slate-400' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400'}`}>
                          暂无关联记录，点击上方「+ 记录消费」即可添加本活动进度记录
                        </div>
                      ) : (
                        activityRecords.map(rec => (
                          <div
                            key={rec.id}
                            className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-2xs ${
                              isAlipayQuickpay
                                ? 'bg-white/5 text-slate-200 border border-white/10'
                                : 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800'
                            }`}
                          >
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 min-w-0">
                              <span className="font-mono opacity-75">{rec.when?.replace('T', ' ') || rec.feedbackAt?.slice(0, 10)}</span>
                              <span className="font-bold font-mono">消费 {formatCurrency(rec.amount)}</span>
                              <span className="opacity-75">渠道: {rec.channel}</span>
                              {rec.actual > 0 && (
                                <span className="text-emerald-400 font-semibold font-mono">
                                  即时收益 +{formatCurrency(rec.actual)}
                                </span>
                              )}
                              {rec.note && <span className="opacity-75 truncate">({rec.note})</span>}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`确定删除该笔 ¥${rec.amount} 的活动记录吗？（将同步扣减本活动累计消费）`)) {
                                  deleteFeedbackRecord(rec.id);
                                  setToastMsg(`已删除活动记录并同步更新进度`);
                                  setTimeout(() => setToastMsg(null), 3000);
                                }
                              }}
                              className="text-slate-400 hover:text-rose-400 p-1 shrink-0"
                              title="删除此记录"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Section 2: Dynamic Reward Combo Activities */}
          {filteredCombos.map(combo => {
            const displayBank =
              combo.bank && combo.bank !== '合作银行' && combo.bank !== '通用'
                ? combo.bank
                : inferBankName(combo.name);

            const comboCardType = inferCardType(combo);
            const hasComboIncluded = Boolean(combo.includedCardTypes && combo.includedCardTypes.length > 0);
            const comboScopeLabel = hasComboIncluded
              ? `组合统计: ${combo.includedCardTypes!.map(t => CARD_TYPE_LABELS[t]).join(' + ')}`
              : `${CARD_TYPE_LABELS[comboCardType]}独立统计`;

            return (
              <div
                key={combo.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <Coins className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                          {combo.name}
                        </h2>
                        <span className="px-2 py-0.5 text-2xs font-bold bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">
                          {displayBank}
                        </span>
                        <span className="px-2 py-0.5 text-2xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded">
                          {comboScopeLabel}
                        </span>
                        <span className="px-2 py-0.5 text-2xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded">
                          打卡连击
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        支持日达标、周达标、连续周达标与指定日加码 · {combo.start} ~ {combo.end}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                    <button
                      onClick={() =>
                        setQuickSpendModal({
                          targetActivity: combo.name,
                          amount: 16,
                          channel: combo.channels?.[0] || 'alipay',
                          bank: displayBank,
                          cardType: comboCardType,
                          when: getNowLocalDateTimeString(),
                          actualReward: 0,
                          note: ''
                        })
                      }
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>打卡记账</span>
                    </button>
                    <button
                      onClick={() =>
                        setEditingCombo({
                          ...combo,
                          bank: displayBank,
                          cardType: comboCardType,
                          includedCardTypes: combo.includedCardTypes || []
                        })
                      }
                      className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="修改组合连击规则"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`确认删除组合活动「${combo.name}」吗？`)) {
                          deleteRewardActivity(combo.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="删除组合活动"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Combo Rules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {combo.rules.map((rule, idx) => {
                    return (
                      <div
                        key={rule.id || idx}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                            {rule.name || `规则 0${idx + 1}`}
                          </span>
                          <span className="text-3xs font-semibold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {rule.type === 'daily'
                              ? '日达标'
                              : rule.type === 'weekly'
                              ? '周达标'
                              : rule.type === 'streak'
                              ? '连击达标'
                              : rule.type === 'ranking'
                              ? '排名挑战'
                              : '特定日'}
                          </span>
                        </div>

                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {rule.amount > 0 ? `消费满 ${rule.amount} 元` : '按排位奖励'}
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {rule.notes ||
                            (rule.dateSpec
                              ? `指定日期: ${rule.dateSpec}`
                              : rule.streak
                              ? `需连续 ${rule.streak} 个周期达标`
                              : '按交易频次与金额达标发放')}
                        </p>

                        <div className="pt-2 text-2xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                          奖励: +{rule.reward} {rule.rewardType === 'points' ? '积分' : '元'}
                          {rule.cap > 0 && ` (封顶${rule.cap})`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Spend Modal */}
      {quickSpendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">增加活动消费记录</h3>
              <button
                onClick={() => setQuickSpendModal(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="text-slate-500 dark:text-slate-400">
                活动项目：<span className="font-semibold text-slate-900 dark:text-white">{quickSpendModal.targetActivity}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">本次消费金额 (元)</label>
                  <input
                    type="number"
                    step="any"
                    value={quickSpendModal.amount}
                    onChange={e =>
                      setQuickSpendModal({
                        ...quickSpendModal,
                        amount: parseFloat(e.target.value) || 0
                      })
                    }
                    className="w-full px-3 py-2 text-base font-bold font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">本笔即时实得收益 (元/可选)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={quickSpendModal.actualReward}
                    onChange={e =>
                      setQuickSpendModal({
                        ...quickSpendModal,
                        actualReward: parseFloat(e.target.value) || 0
                      })
                    }
                    placeholder="0 表示仅累计达标额"
                    className="w-full px-3 py-2 text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">消费卡种</label>
                  <select
                    value={quickSpendModal.cardType}
                    onChange={e =>
                      setQuickSpendModal({
                        ...quickSpendModal,
                        cardType: e.target.value as CardType
                      })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="credit">信用卡</option>
                    <option value="debit">储蓄卡/借记卡</option>
                    <option value="digital_cny">数字人民币</option>
                    <option value="any">通用/其他</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">支付渠道</label>
                  <select
                    value={quickSpendModal.channel}
                    onChange={e =>
                      setQuickSpendModal({
                        ...quickSpendModal,
                        channel: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="alipay">支付宝快捷支付</option>
                    <option value="wechat">微信支付</option>
                    <option value="unionpay">银联云闪付</option>
                    <option value="transit_code">乘车码</option>
                    <option value="bank_app">银行App</option>
                    <option value="digital_cny">数字人民币</option>
                    <option value="any">不限渠道</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">消费时间</label>
                  <input
                    type="datetime-local"
                    value={quickSpendModal.when.replace(' ', 'T').slice(0, 16)}
                    onChange={e =>
                      setQuickSpendModal({
                        ...quickSpendModal,
                        when: e.target.value.replace('T', ' ')
                      })
                    }
                    className="w-full px-3 py-2 font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">备注说明 (可选)</label>
                  <input
                    type="text"
                    value={quickSpendModal.note}
                    onChange={e =>
                      setQuickSpendModal({
                        ...quickSpendModal,
                        note: e.target.value
                      })
                    }
                    placeholder="如：支付宝充值/网购"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setQuickSpendModal(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleQuickSpendSubmit}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg hover:bg-slate-800"
              >
                确认记录
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tier Reward Claiming Modal */}
      {tierRewardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <form
            onSubmit={handleSaveTierRewards}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-8"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-500" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">登记活动阶梯收益</h3>
                  <p className="text-2xs text-slate-400">{tierRewardModal.activity.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTierRewardModal(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-[60vh] overflow-y-auto pr-1">
              {tierRewardModal.tiers.map((tier, idx) => (
                <div
                  key={tier.id || idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      满 ¥{tier.target} · {tier.rewardName}
                    </span>
                    <span className="text-2xs text-slate-400">预估 ¥{tier.estimatedReward || 0}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-3xs text-slate-500 mb-1">领取状态</label>
                      <select
                        value={tier.rewardStatus}
                        onChange={e => {
                          const nextStatus = e.target.value as ActivityTier['rewardStatus'];
                          const updated = [...tierRewardModal.tiers];
                          updated[idx] = {
                            ...updated[idx],
                            rewardStatus: nextStatus,
                            actualReward:
                              nextStatus !== 'unconfirmed' && !updated[idx].actualReward
                                ? updated[idx].estimatedReward || 0
                                : updated[idx].actualReward,
                            receivedDate:
                              nextStatus !== 'unconfirmed' && !updated[idx].receivedDate
                                ? getLocalDateString()
                                : updated[idx].receivedDate
                          };
                          setTierRewardModal({ ...tierRewardModal, tiers: updated });
                        }}
                        className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      >
                        <option value="unconfirmed">待达成/未领取</option>
                        <option value="confirmed">已达成待入账</option>
                        <option value="claimed">已到账领取</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-3xs text-slate-500 mb-1">实际收益金额 (元)</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={tier.actualReward || 0}
                        onChange={e => {
                          const updated = [...tierRewardModal.tiers];
                          updated[idx] = {
                            ...updated[idx],
                            actualReward: parseFloat(e.target.value) || 0
                          };
                          setTierRewardModal({ ...tierRewardModal, tiers: updated });
                        }}
                        className="w-full px-2 py-1.5 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-3xs text-slate-500 mb-1">到账/确认日期</label>
                      <input
                        type="date"
                        value={tier.receivedDate || ''}
                        onChange={e => {
                          const updated = [...tierRewardModal.tiers];
                          updated[idx] = {
                            ...updated[idx],
                            receivedDate: e.target.value
                          };
                          setTierRewardModal({ ...tierRewardModal, tiers: updated });
                        }}
                        className="w-full px-2 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setTierRewardModal(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg"
              >
                保存收益状态
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Milestone Activity Modal */}
      {editingMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <form
            onSubmit={handleSaveMilestoneEdit}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-8"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">修改阶梯达标活动规则</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingMilestone(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">活动名称</label>
                <input
                  type="text"
                  required
                  value={editingMilestone.name}
                  onChange={e => setEditingMilestone({ ...editingMilestone, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">发卡银行</label>
                  <input
                    type="text"
                    value={editingMilestone.bank || ''}
                    onChange={e => setEditingMilestone({ ...editingMilestone, bank: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">主卡种体系</label>
                  <select
                    value={editingMilestone.cardType || 'credit'}
                    onChange={e => setEditingMilestone({ ...editingMilestone, cardType: e.target.value as CardType })}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="credit">信用卡 (独立统计)</option>
                    <option value="debit">储蓄卡/借记卡 (独立统计)</option>
                    <option value="digital_cny">数字人民币 (独立统计)</option>
                    <option value="any">通用/跨卡种</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">指定渠道</label>
                  <select
                    value={editingMilestone.channel}
                    onChange={e => setEditingMilestone({ ...editingMilestone, channel: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="any">不限渠道</option>
                    <option value="alipay">支付宝快捷支付</option>
                    <option value="wechat">微信支付</option>
                    <option value="unionpay">银联云闪付</option>
                    <option value="transit_code">乘车码</option>
                    <option value="bank_app">银行App</option>
                    <option value="digital_cny">数字人民币</option>
                  </select>
                </div>
              </div>

              {/* Explicit Combo Cross-Card Allowance */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="text-2xs font-semibold text-slate-700 dark:text-slate-300">
                  组合活动特别说明：允许同时计入以下卡种消费
                  <span className="font-normal text-slate-400 ml-1">(不勾选则严格按主卡种独立统计)</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {(['credit', 'debit', 'digital_cny'] as CardType[]).map(ct => {
                    const checked = editingMilestone.includedCardTypes?.includes(ct) || false;
                    return (
                      <label key={ct} className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e => {
                            const cur = editingMilestone.includedCardTypes || [];
                            const next = e.target.checked
                              ? Array.from(new Set([...cur, ct]))
                              : cur.filter(x => x !== ct);
                            setEditingMilestone({ ...editingMilestone, includedCardTypes: next });
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{CARD_TYPE_LABELS[ct]}</span>
                      </label>
                    );
                  })}
                </div>
                <label className="pt-1.5 border-t border-slate-200/70 dark:border-slate-700 flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={Boolean(editingMilestone.excludeFromRecommend)}
                    onChange={e =>
                      setEditingMilestone({ ...editingMilestone, excludeFromRecommend: e.target.checked })
                    }
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>不参与「用卡推荐」（仅记录活动进度与收益，适用于储蓄卡快捷达标等专项追踪）</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">开始日期</label>
                  <input
                    type="date"
                    value={editingMilestone.start}
                    onChange={e => setEditingMilestone({ ...editingMilestone, start: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">结束日期</label>
                  <input
                    type="date"
                    value={editingMilestone.end}
                    onChange={e => setEditingMilestone({ ...editingMilestone, end: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">当前累计已消费 (元)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={editingMilestone.currentSpend ?? 0}
                    onChange={e =>
                      setEditingMilestone({ ...editingMilestone, currentSpend: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">活动规则备注</label>
                  <input
                    type="text"
                    value={editingMilestone.notes || ''}
                    onChange={e => setEditingMilestone({ ...editingMilestone, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Tiers list editor */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 dark:text-slate-300 font-medium">阶梯档位设置</label>
                  <button
                    type="button"
                    onClick={() => {
                      const currentTiers = editingMilestone.tiers || [];
                      const lastTarget = currentTiers.length > 0 ? currentTiers[currentTiers.length - 1].target + 3000 : 5000;
                      setEditingMilestone({
                        ...editingMilestone,
                        tiers: [
                          ...currentTiers,
                          {
                            id: `tier-${Date.now()}`,
                            target: lastTarget,
                            rewardName: '新档位奖励',
                            estimatedReward: 15,
                            rewardStatus: 'unconfirmed',
                            actualReward: 0,
                            receivedDate: '',
                            rewardType: 'other',
                            points: 0
                          }
                        ]
                      });
                    }}
                    className="text-2xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    + 增加阶梯档位
                  </button>
                </div>

                <div className="space-y-2">
                  {editingMilestone.tiers.map((tier, idx) => (
                    <div key={tier.id || idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                      <span className="text-2xs font-mono text-slate-400 w-8">#{idx + 1}</span>
                      <div className="w-24">
                        <input
                          type="number"
                          value={tier.target}
                          onChange={e => {
                            const updated = [...editingMilestone.tiers];
                            updated[idx] = { ...updated[idx], target: parseFloat(e.target.value) || 0 };
                            setEditingMilestone({ ...editingMilestone, tiers: updated });
                          }}
                          placeholder="满额(元)"
                          className="w-full px-2 py-1 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={tier.rewardName}
                          onChange={e => {
                            const updated = [...editingMilestone.tiers];
                            updated[idx] = { ...updated[idx], rewardName: e.target.value };
                            setEditingMilestone({ ...editingMilestone, tiers: updated });
                          }}
                          placeholder="奖励名称 (如 15元 / 抽奖1次)"
                          className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                        />
                      </div>
                      <div className="w-20">
                        <input
                          type="number"
                          value={tier.estimatedReward}
                          onChange={e => {
                            const updated = [...editingMilestone.tiers];
                            updated[idx] = { ...updated[idx], estimatedReward: parseFloat(e.target.value) || 0 };
                            setEditingMilestone({ ...editingMilestone, tiers: updated });
                          }}
                          placeholder="价值(元)"
                          className="w-full px-2 py-1 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                        />
                      </div>
                      {editingMilestone.tiers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = editingMilestone.tiers.filter((_, i) => i !== idx);
                            setEditingMilestone({ ...editingMilestone, tiers: updated });
                          }}
                          className="text-slate-400 hover:text-rose-500 p-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingMilestone(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg"
              >
                保存规则修改
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Combo Activity Modal */}
      {editingCombo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <form
            onSubmit={handleSaveComboEdit}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-8"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">修改组合连击活动规则</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCombo(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">活动名称</label>
                <input
                  type="text"
                  required
                  value={editingCombo.name}
                  onChange={e => setEditingCombo({ ...editingCombo, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">发卡银行</label>
                  <input
                    type="text"
                    value={editingCombo.bank || ''}
                    onChange={e => setEditingCombo({ ...editingCombo, bank: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">主卡种体系</label>
                  <select
                    value={editingCombo.cardType || 'credit'}
                    onChange={e => setEditingCombo({ ...editingCombo, cardType: e.target.value as CardType })}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="credit">信用卡 (独立统计)</option>
                    <option value="debit">储蓄卡/借记卡 (独立统计)</option>
                    <option value="digital_cny">数字人民币 (独立统计)</option>
                    <option value="any">通用/跨卡种</option>
                  </select>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="text-2xs font-semibold text-slate-700 dark:text-slate-300">
                  组合活动特别说明：允许同时计入以下卡种
                  <span className="font-normal text-slate-400 ml-1">(不勾选则严格按主卡种独立统计)</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {(['credit', 'debit', 'digital_cny'] as CardType[]).map(ct => {
                    const checked = editingCombo.includedCardTypes?.includes(ct) || false;
                    return (
                      <label key={ct} className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e => {
                            const cur = editingCombo.includedCardTypes || [];
                            const next = e.target.checked
                              ? Array.from(new Set([...cur, ct]))
                              : cur.filter(x => x !== ct);
                            setEditingCombo({ ...editingCombo, includedCardTypes: next });
                          }}
                          className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span>{CARD_TYPE_LABELS[ct]}</span>
                      </label>
                    );
                  })}
                </div>
                <label className="pt-1.5 border-t border-slate-200/70 dark:border-slate-700 flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={Boolean(editingCombo.excludeFromRecommend)}
                    onChange={e =>
                      setEditingCombo({ ...editingCombo, excludeFromRecommend: e.target.checked })
                    }
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span>不参与「用卡推荐」（仅记录活动进度与收益）</span>
                </label>
              </div>

              {/* Combo rules editor */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">各阶段打卡规则明细</label>
                <div className="space-y-3">
                  {editingCombo.rules.map((rule, idx) => (
                    <div key={rule.id || idx} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 dark:text-white">阶段 {idx + 1}: {rule.name}</span>
                        <span className="text-2xs text-slate-400 font-mono">{rule.type}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-3xs text-slate-400">门槛金额 (元)</label>
                          <input
                            type="number"
                            value={rule.amount}
                            onChange={e => {
                              const updated = [...editingCombo.rules];
                              updated[idx] = { ...updated[idx], amount: parseFloat(e.target.value) || 0 };
                              setEditingCombo({ ...editingCombo, rules: updated });
                            }}
                            className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-3xs text-slate-400">奖励数值 (积分/现金)</label>
                          <input
                            type="number"
                            value={rule.reward}
                            onChange={e => {
                              const updated = [...editingCombo.rules];
                              updated[idx] = { ...updated[idx], reward: parseFloat(e.target.value) || 0 };
                              setEditingCombo({ ...editingCombo, rules: updated });
                            }}
                            className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-3xs text-slate-400">规则说明</label>
                        <input
                          type="text"
                          value={rule.notes || ''}
                          onChange={e => {
                            const updated = [...editingCombo.rules];
                            updated[idx] = { ...updated[idx], notes: e.target.value };
                            setEditingCombo({ ...editingCombo, rules: updated });
                          }}
                          className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingCombo(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg"
              >
                保存组合规则
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New Activity Modal */}
      {isNewActivityOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <form
            onSubmit={handleCreateActivity}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">添加新达标活动</h3>
              <button
                type="button"
                onClick={() => setIsNewActivityOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {/* Quick Templates */}
            <div>
              <label className="block text-2xs font-semibold text-slate-500 mb-1">选择预设模板</label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddPresetTemplate('debit_quickpay')}
                  className="px-2.5 py-1 text-2xs font-medium rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800"
                >
                  储蓄卡快捷支付达标 (不推荐)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddPresetTemplate('alipay')}
                  className="px-2.5 py-1 text-2xs font-medium rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
                >
                  支付宝快捷支付满额
                </button>
                <button
                  type="button"
                  onClick={() => handleAddPresetTemplate('bocom')}
                  className="px-2.5 py-1 text-2xs font-medium rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                >
                  满5000/8000抽奖
                </button>
                <button
                  type="button"
                  onClick={() => handleAddPresetTemplate('points')}
                  className="px-2.5 py-1 text-2xs font-medium rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                >
                  多倍积分达标
                </button>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">活动名称</label>
                <input
                  type="text"
                  required
                  value={newActivityName}
                  onChange={e => setNewActivityName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">发卡银行 / 机构</label>
                  <input
                    type="text"
                    value={newActivityBank}
                    onChange={e => setNewActivityBank(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">主卡种体系</label>
                  <select
                    value={newActivityCardType}
                    onChange={e => setNewActivityCardType(e.target.value as CardType)}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="credit">信用卡 (独立统计)</option>
                    <option value="debit">储蓄卡/借记卡 (独立统计)</option>
                    <option value="digital_cny">数字人民币 (独立统计)</option>
                    <option value="any">通用/跨卡种</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">指定支付渠道</label>
                  <select
                    value={newActivityChannel}
                    onChange={e => setNewActivityChannel(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="alipay">支付宝快捷支付</option>
                    <option value="wechat">微信支付</option>
                    <option value="unionpay">银联云闪付</option>
                    <option value="transit_code">乘车码</option>
                    <option value="bank_app">银行App</option>
                    <option value="digital_cny">数字人民币</option>
                    <option value="any">不限渠道</option>
                  </select>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="text-2xs font-semibold text-slate-700 dark:text-slate-300">
                  组合活动特别说明：允许同时计入以下卡种消费
                  <span className="font-normal text-slate-400 ml-1">(不勾选则严格按主卡种独立统计)</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {(['credit', 'debit', 'digital_cny'] as CardType[]).map(ct => {
                    const checked = newActivityIncludedCardTypes.includes(ct);
                    return (
                      <label key={ct} className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e => {
                            const next = e.target.checked
                              ? Array.from(new Set([...newActivityIncludedCardTypes, ct]))
                              : newActivityIncludedCardTypes.filter(x => x !== ct);
                            setNewActivityIncludedCardTypes(next);
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{CARD_TYPE_LABELS[ct]}</span>
                      </label>
                    );
                  })}
                </div>
                <label className="pt-1.5 border-t border-slate-200/70 dark:border-slate-700 flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={newActivityExcludeRecommend}
                    onChange={e => setNewActivityExcludeRecommend(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>不参与「用卡推荐」（仅记录活动进度与收益，适合储蓄卡快捷达标等专项记录）</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">开始日期</label>
                  <input
                    type="date"
                    value={newActivityStart}
                    onChange={e => setNewActivityStart(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">结束日期</label>
                  <input
                    type="date"
                    value={newActivityEnd}
                    onChange={e => setNewActivityEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">活动规则说明</label>
                <input
                  type="text"
                  value={newActivityNotes}
                  onChange={e => setNewActivityNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              {/* Tiers Editor */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">阶梯奖励设置</label>
                <div className="space-y-2">
                  {newActivityTiers.map((tier, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-2xs text-slate-400 font-mono w-10">档位{idx + 1}</span>
                      <input
                        type="number"
                        placeholder="门槛(元)"
                        value={tier.target}
                        onChange={e => {
                          const updated = [...newActivityTiers];
                          updated[idx].target = parseFloat(e.target.value) || 0;
                          setNewActivityTiers(updated);
                        }}
                        className="w-24 px-2 py-1.5 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="奖励说明"
                        value={tier.rewardName}
                        onChange={e => {
                          const updated = [...newActivityTiers];
                          updated[idx].rewardName = e.target.value;
                          setNewActivityTiers(updated);
                        }}
                        className="flex-1 px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                      />
                      <input
                        type="number"
                        placeholder="折合价值(元)"
                        value={tier.estimatedReward}
                        onChange={e => {
                          const updated = [...newActivityTiers];
                          updated[idx].estimatedReward = parseFloat(e.target.value) || 0;
                          setNewActivityTiers(updated);
                        }}
                        className="w-20 px-2 py-1.5 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                      />
                      {newActivityTiers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setNewActivityTiers(newActivityTiers.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-500 p-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setNewActivityTiers([
                        ...newActivityTiers,
                        { target: 10000, rewardName: '额外大礼', estimatedReward: 50 }
                      ])
                    }
                    className="text-2xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    + 增加阶梯档位
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsNewActivityOpen(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg"
              >
                确认创建
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
