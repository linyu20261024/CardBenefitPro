/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useCardBenefit } from '../context/CardBenefitContext';
import { formatCurrency } from '../utils/engine';
import { inferBankName } from '../data/initialData';
import { MilestoneActivity, RewardComboActivity, ActivityTier, ComboRule } from '../types/cardBenefit';
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
  Sliders
} from 'lucide-react';

export const ComboActivitiesView: React.FC = () => {
  const {
    state,
    addFeedbackRecord,
    addActivity,
    updateActivity,
    deleteActivity,
    updateRewardActivity,
    deleteRewardActivity
  } = useCardBenefit();

  // Filter state
  const [activeCategory, setActiveCategory] = useState<'all' | 'milestones' | 'combos' | 'quickpay'>('all');

  // Quick record modal
  const [quickSpendModal, setQuickSpendModal] = useState<{
    targetActivity: string;
    amount: number;
    channel: string;
    bank: string;
  } | null>(null);

  // Edit Milestone Activity modal
  const [editingMilestone, setEditingMilestone] = useState<MilestoneActivity | null>(null);

  // Edit Combo Activity modal
  const [editingCombo, setEditingCombo] = useState<RewardComboActivity | null>(null);

  // New activity modal
  const [isNewActivityOpen, setIsNewActivityOpen] = useState(false);
  const [newActivityName, setNewActivityName] = useState('支付宝快捷支付11月满额达标');
  const [newActivityBank, setNewActivityBank] = useState('支付宝');
  const [newActivityChannel, setNewActivityChannel] = useState('alipay');
  const [newActivityNotes, setNewActivityNotes] = useState('支付宝快捷支付消费达标赢立减金与抽奖');
  const [newActivityTiers, setNewActivityTiers] = useState<Array<{ target: number; rewardName: string; estimatedReward: number }>>([
    { target: 1000, rewardName: '5元立减金', estimatedReward: 5 },
    { target: 3000, rewardName: '15元红包', estimatedReward: 15 },
    { target: 5000, rewardName: '88元锦鲤抽奖', estimatedReward: 20 }
  ]);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Compute spend for each activity based on feedback ledger + manual entries
  const getActivitySpend = (activityName: string, bank?: string, channel?: string): number => {
    const matchedAct = state.activities.find(a => a.name === activityName);
    let base = matchedAct?.currentSpend || 0;

    const ledgerContribution = state.feedback
      .filter(f => {
        if (f.contributedActivities && f.contributedActivities.includes(activityName)) return true;
        if (f.note && f.note.includes(activityName)) return true;
        if (bank && f.bank === bank && f.ruleName.includes(activityName)) return true;
        return false;
      })
      .reduce((sum, f) => sum + (f.amount || 0), 0);

    return base + ledgerContribution;
  };

  // Filtered milestone activities
  const filteredMilestones = useMemo(() => {
    if (activeCategory === 'combos') return [];
    return state.activities.filter(act => {
      if (activeCategory === 'quickpay') {
        return (
          act.channel === 'alipay' ||
          act.name.includes('快捷支付') ||
          act.name.includes('支付宝')
        );
      }
      return true;
    });
  }, [state.activities, activeCategory]);

  // Filtered combo activities
  const filteredCombos = useMemo(() => {
    if (activeCategory === 'milestones') return [];
    if (activeCategory === 'quickpay') {
      return state.rewardActivities.filter(a =>
        a.channels?.includes('alipay') || a.name.includes('快捷支付')
      );
    }
    return state.rewardActivities;
  }, [state.rewardActivities, activeCategory]);

  const totalActivitiesCount = state.activities.length + state.rewardActivities.length;

  const handleQuickSpendSubmit = () => {
    if (!quickSpendModal) return;
    const { targetActivity, amount, channel, bank } = quickSpendModal;

    addFeedbackRecord({
      ruleId: `combo-${Date.now()}`,
      ruleName: `${targetActivity} - 消费推进记账`,
      bank: bank || '合作银行',
      scene: 'any',
      platform: channel === 'alipay' ? 'alipay' : 'bank_app',
      channel: channel || 'any',
      amount,
      expected: 0,
      actual: 0,
      confirmed: true,
      result: 'confirmed',
      when: new Date().toISOString().slice(0, 16),
      note: `记入【${targetActivity}】消费推进`,
      contributedActivities: [targetActivity]
    });

    setToastMsg(`消费 ¥${amount} 已记录并计入【${targetActivity}】活动进度！`);
    setQuickSpendModal(null);
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
      platform: 'any',
      channel: newActivityChannel,
      scene: 'any',
      start: new Date().toISOString().slice(0, 10),
      end: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      period: 'month',
      rewardMode: 'cumulative',
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

  const handleAddPresetTemplate = (preset: 'alipay' | 'bocom' | 'points') => {
    if (preset === 'alipay') {
      setNewActivityName('支付宝快捷支付11月满额达标狂欢');
      setNewActivityBank('支付宝');
      setNewActivityChannel('alipay');
      setNewActivityNotes('绑定信用卡快捷支付消费，满1000返5元，满3000送15元，满5000抽大奖88元');
      setNewActivityTiers([
        { target: 1000, rewardName: '5元刷卡金', estimatedReward: 5 },
        { target: 3000, rewardName: '15元刷卡金', estimatedReward: 15 },
        { target: 5000, rewardName: '88元锦鲤抽奖', estimatedReward: 25 }
      ]);
    } else if (preset === 'bocom') {
      setNewActivityName('交通银行信用卡累计消费抽奖');
      setNewActivityBank('交通银行');
      setNewActivityChannel('any');
      setNewActivityNotes('当月消费满5000元给1次抽奖，满8000元再给1次抽奖机会');
      setNewActivityTiers([
        { target: 5000, rewardName: '抽奖机会1次', estimatedReward: 15 },
        { target: 8000, rewardName: '二重抽奖机会', estimatedReward: 20 }
      ]);
    } else {
      setNewActivityName('信用卡多倍积分阶梯达标');
      setNewActivityBank('通用/多行');
      setNewActivityChannel('any');
      setNewActivityNotes('消费满额赠送海量综合积分');
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
      ) : (
        <div className="space-y-6">
          {/* Section 1: Dynamic Milestone Activities */}
          {filteredMilestones.map(activity => {
            // Precise bank resolution: prioritize real bank name, fallback to inferBankName
            const displayBank =
              activity.bank && activity.bank !== '合作银行' && activity.bank !== '通用'
                ? activity.bank
                : inferBankName(activity.name);

            const currentSpend = getActivitySpend(activity.name, displayBank, activity.channel);
            const highestTier = activity.tiers.reduce((max, t) => (t.target > max ? t.target : max), 1);
            const nextTier = activity.tiers.find(t => t.target > currentSpend);
            const isAlipayQuickpay =
              activity.channel === 'alipay' ||
              activity.name.includes('快捷支付') ||
              activity.name.includes('支付宝');

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
                        {isAlipayQuickpay && (
                          <span className="px-2 py-0.5 text-2xs font-bold bg-amber-400 text-slate-950 rounded">
                            快捷支付
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
                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                    <button
                      onClick={() =>
                        setQuickSpendModal({
                          targetActivity: activity.name,
                          amount: nextTier ? Math.max(10, nextTier.target - currentSpend) : 100,
                          channel: activity.channel === 'any' ? 'alipay' : activity.channel,
                          bank: displayBank
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
                      onClick={() => setEditingMilestone({ ...activity, bank: displayBank })}
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
                  <div className="flex items-baseline justify-between text-xs">
                    <div>
                      <span className={isAlipayQuickpay ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}>
                        本期累计已计入消费:
                      </span>{' '}
                      <span className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums">
                        {formatCurrency(currentSpend)}
                      </span>
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
                    const diff = tier.target - currentSpend;

                    return (
                      <div
                        key={tier.id || idx}
                        className={`p-3.5 rounded-xl border transition-all space-y-1.5 ${
                          isAchieved
                            ? isAlipayQuickpay
                              ? 'bg-sky-500/20 border-sky-400/40 text-white'
                              : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-slate-900 dark:text-white'
                            : isAlipayQuickpay
                            ? 'bg-white/5 border-white/10 text-slate-300'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
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
                          <span>预估价值: ¥{tier.estimatedReward || 0}</span>
                          <span>{tier.rewardStatus === 'confirmed' ? '已领取' : '达成即领'}</span>
                        </div>
                      </div>
                    );
                  })}
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
                          bank: displayBank
                        })
                      }
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>打卡记账</span>
                    </button>
                    <button
                      onClick={() => setEditingCombo({ ...combo, bank: displayBank })}
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">记录消费以推进活动进度</h3>
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
                  <option value="bank_app">银行App</option>
                  <option value="any">不限渠道</option>
                </select>
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

              <div className="grid grid-cols-2 gap-3">
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
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">指定渠道</label>
                  <select
                    value={editingMilestone.channel}
                    onChange={e => setEditingMilestone({ ...editingMilestone, channel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="any">不限渠道</option>
                    <option value="alipay">支付宝快捷支付</option>
                    <option value="wechat">微信支付</option>
                    <option value="unionpay">银联云闪付</option>
                    <option value="bank_app">银行App</option>
                  </select>
                </div>
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

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">活动规则备注</label>
                <input
                  type="text"
                  value={editingMilestone.notes || ''}
                  onChange={e => setEditingMilestone({ ...editingMilestone, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
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

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">发卡银行</label>
                <input
                  type="text"
                  value={editingCombo.bank || ''}
                  onChange={e => setEditingCombo({ ...editingCombo, bank: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <form
            onSubmit={handleCreateActivity}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95"
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
              <div className="flex items-center gap-2">
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

              <div className="grid grid-cols-2 gap-3">
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
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">指定支付渠道</label>
                  <select
                    value={newActivityChannel}
                    onChange={e => setNewActivityChannel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="alipay">支付宝快捷支付</option>
                    <option value="wechat">微信支付</option>
                    <option value="unionpay">银联云闪付</option>
                    <option value="any">不限渠道</option>
                  </select>
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
