/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useCardBenefit } from '../context/CardBenefitContext';
import { calculateAssetMetrics, formatCurrency, formatBigNumber } from '../utils/engine';
import { BankAssetActivity, BankAssetEntry, BankAssetTier } from '../types/cardBenefit';
import {
  Landmark,
  TrendingUp,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Calculator,
  ArrowRight,
  Sliders
} from 'lucide-react';

export const AssetMilestonesView: React.FC = () => {
  const {
    state,
    addBankAssetEntry,
    updateBankAssetEntry,
    deleteBankAssetEntry,
    addBankAssetActivity,
    updateBankAssetActivity,
    deleteBankAssetActivity
  } = useCardBenefit();

  const [selectedActivityId, setSelectedActivityId] = useState<string>(
    state.bankAssetActivities[0]?.id || ''
  );

  const selectedActivity = useMemo(() => {
    return (
      state.bankAssetActivities.find(a => a.id === selectedActivityId) ||
      state.bankAssetActivities[0]
    );
  }, [state.bankAssetActivities, selectedActivityId]);

  const metrics = useMemo(() => {
    if (!selectedActivity) return null;
    return calculateAssetMetrics(selectedActivity, state.bankAssetEntries);
  }, [selectedActivity, state.bankAssetEntries]);

  // Form state for adding daily asset entry
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [newAmount, setNewAmount] = useState<string>('50000');
  const [newNote, setNewNote] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Edit Bank Asset Activity modal
  const [editingAssetActivity, setEditingAssetActivity] = useState<BankAssetActivity | null>(null);

  // New Bank Asset Activity modal
  const [isNewAssetModalOpen, setIsNewAssetModalOpen] = useState(false);
  const [newBankName, setNewBankName] = useState('建设银行');
  const [newMonth, setNewMonth] = useState(new Date().toISOString().slice(0, 7));
  const [newBaseline, setNewBaseline] = useState<number>(0);
  const [newScope, setNewScope] = useState('活期存款 + 投资理财 + 基金');
  const [newNotes, setNewNotes] = useState('月日均资产达标5w/10w享立减金奖励');
  const [newTiers, setNewTiers] = useState<BankAssetTier[]>([
    { threshold: 50000, rewardType: 'cash', reward: 40, label: '40微信立减金' },
    { threshold: 100000, rewardType: 'cash', reward: 100, label: '100微信立减金' },
    { threshold: 200000, rewardType: 'cash', reward: 200, label: '200微信立减金' }
  ]);

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) return;
    const amountVal = parseFloat(newAmount);
    if (isNaN(amountVal) || amountVal < 0) return;

    addBankAssetEntry({
      activityId: selectedActivity.id,
      date: newDate,
      amount: amountVal,
      notes: newNote
    });

    setToastMsg(`已成功记录 ${newDate} 资产日终余额: ${formatCurrency(amountVal)}`);
    setNewNote('');
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSaveAssetEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssetActivity) return;

    updateBankAssetActivity(editingAssetActivity);
    setToastMsg(`银行资产达标活动「${editingAssetActivity.bank}」规则修改成功！`);
    setEditingAssetActivity(null);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCreateAssetActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName.trim()) return;

    const newActivity: BankAssetActivity = {
      id: `asset-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      bank: newBankName.trim(),
      month: newMonth,
      start: `${newMonth}-01`,
      end: `${newMonth}-31`,
      baseline: newBaseline,
      scope: newScope.trim(),
      notes: newNotes.trim(),
      tiers: newTiers
    };

    addBankAssetActivity(newActivity);
    setSelectedActivityId(newActivity.id);
    setIsNewAssetModalOpen(false);
    setToastMsg(`已成功添加「${newActivity.bank}」资产达标活动！`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const activityEntries = useMemo(() => {
    if (!selectedActivity) return [];
    return state.bankAssetEntries
      .filter(e => e.activityId === selectedActivity.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [selectedActivity, state.bankAssetEntries]);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white text-sm font-medium rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header & Bank Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            银行月日均资产提升与阶梯奖励追踪
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            日结资产按天数加权精准计算【当前月日均】与【月末预测日均】，随时修改门槛与奖励
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Segmented Bank Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto scrollbar-none">
            {state.bankAssetActivities.map(act => (
              <button
                key={act.id}
                onClick={() => setSelectedActivityId(act.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  selectedActivity?.id === act.id
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {act.bank}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsNewAssetModalOpen(true)}
            className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1 shrink-0 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新增银行资产活动</span>
          </button>
        </div>
      </div>

      {state.bankAssetActivities.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-4">
          <Landmark className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">暂无银行资产达标活动</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            当前卡包为空。您可以点击右上角「同步」导入您的数据，或点击下方按钮直接新建一家银行的月日均资产达标活动：
          </p>
          <button
            onClick={() => setIsNewAssetModalOpen(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-xs"
          >
            + 新建银行资产达标活动
          </button>
        </div>
      ) : metrics && selectedActivity && (
        <>
          {/* Key Metrics Dashboard Card */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-md border border-indigo-500/20 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold">{selectedActivity.bank}</h2>
                    <span className="px-2 py-0.5 text-2xs font-semibold bg-white/10 rounded">
                      {selectedActivity.month}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    基准资产: {formatCurrency(selectedActivity.baseline)} · 范围: {selectedActivity.scope}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  onClick={() => setEditingAssetActivity({ ...selectedActivity })}
                  className="px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-1.5 border border-white/15"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-300" />
                  <span>修改本行规则</span>
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`确认删除「${selectedActivity.bank}」资产达标活动吗？`)) {
                      deleteBankAssetActivity(selectedActivity.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-white/10 transition-colors"
                  title="删除本行活动"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calculations Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
              <div className="bg-white/5 rounded-xl p-3.5 border border-white/10">
                <span className="text-2xs text-slate-400 block font-sans">当前已录入日均</span>
                <span className="text-lg sm:text-xl font-bold text-white tabular-nums">
                  {formatCurrency(metrics.currentAverageDaily)}
                </span>
                <span className="text-3xs text-slate-400 block mt-0.5 font-sans">
                  已累计: {formatCurrency(metrics.currentSum)}
                </span>
              </div>

              <div className="bg-white/5 rounded-xl p-3.5 border border-white/10">
                <span className="text-2xs text-slate-400 block font-sans">按目前余额预测月末日均</span>
                <span className="text-lg sm:text-xl font-bold text-indigo-300 tabular-nums">
                  {formatCurrency(metrics.projectedMonthEndAverage)}
                </span>
                <span className="text-3xs text-slate-400 block mt-0.5 font-sans">
                  以最新当日余额推演
                </span>
              </div>

              <div className="bg-white/5 rounded-xl p-3.5 border border-white/10">
                <span className="text-2xs text-slate-400 block font-sans">已达成阶梯奖励</span>
                <span className="text-lg sm:text-xl font-bold text-emerald-400 tabular-nums">
                  {metrics.achievedTiers.filter(t => t.isAchieved).pop()?.label || '未达门槛'}
                </span>
                <span className="text-3xs text-slate-400 block mt-0.5 font-sans">
                  价值: ¥{metrics.achievedTiers.filter(t => t.isAchieved).pop()?.reward || 0}
                </span>
              </div>

              <div className="bg-white/5 rounded-xl p-3.5 border border-white/10">
                <span className="text-2xs text-slate-400 block font-sans">下一档需日均结存</span>
                <span className="text-lg sm:text-xl font-bold text-amber-300 tabular-nums">
                  {metrics.nextTier ? formatCurrency(metrics.nextTier.requiredDailyForRemainingDays) : '已达最高档'}
                </span>
                <span className="text-3xs text-slate-400 block mt-0.5 font-sans">
                  剩余 {Math.max(0, metrics.totalDaysInMonth - metrics.loggedDays)} 天每日需维持
                </span>
              </div>
            </div>

            {/* Stepped Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>月末预测达标进度</span>
                <span className="font-mono">
                  {metrics.nextTier
                    ? `距下一档 (${metrics.nextTier.label} - 门槛¥${metrics.nextTier.threshold}) 还差月日均 ¥${Math.round(
                        metrics.nextTier.threshold - metrics.projectedMonthEndAverage
                      )}`
                    : '已达成最高门槛！'}
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (metrics.projectedMonthEndAverage / (metrics.nextTier?.threshold || 100000)) * 100
                    )}%`
                  }}
                />
              </div>
            </div>

            {/* Asset Tiers Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {selectedActivity.tiers.map((tier, idx) => {
                const isProjectedAchieved = metrics.projectedMonthEndAverage >= tier.threshold;
                const isCurrentAchieved = metrics.currentAverageDaily >= tier.threshold;

                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isCurrentAchieved
                        ? 'bg-emerald-500/20 border-emerald-400/50 text-white'
                        : isProjectedAchieved
                        ? 'bg-amber-500/20 border-amber-400/40 text-white'
                        : 'bg-white/5 border-white/10 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold font-mono">月日均 满 ¥{formatBigNumber(tier.threshold)}</span>
                      {isCurrentAchieved ? (
                        <span className="flex items-center gap-1 text-2xs font-semibold text-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 已锁定
                        </span>
                      ) : isProjectedAchieved ? (
                        <span className="text-2xs font-semibold text-amber-300">预测可达</span>
                      ) : (
                        <span className="text-2xs text-slate-400">待冲刺</span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-white mt-1">{tier.label}</div>
                    <div className="text-2xs text-slate-400 mt-1">
                      折合价值: ¥{tier.reward} · {tier.rewardType === 'cash' ? '现金/立减金' : '积分'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily Balances Ledger & Quick Recorder */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Record Asset Input Form */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Calculator className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  录入 {selectedActivity.bank} 资产日终余额
                </h3>
              </div>

              <form onSubmit={handleAddEntry} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    记录日期
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    当日资产日终结存金额 (元)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">¥</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={newAmount}
                      onChange={e => setNewAmount(e.target.value)}
                      placeholder="如 50000"
                      className="w-full pl-7 pr-3 py-2 text-base font-bold font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    备注信息 (可选)
                  </label>
                  <input
                    type="text"
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="如：理财赎回到活期"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors shadow-xs"
                >
                  确认保存当日结存
                </button>
              </form>
            </div>

            {/* Entries Table */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  已录入资产明细表 ({activityEntries.length} 天)
                </h3>
                <span className="text-xs text-slate-400">按记录倒序排列</span>
              </div>

              {activityEntries.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  暂无记录，请在左侧录入资产余额
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-y border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">日期</th>
                        <th className="py-2.5 px-3 font-semibold text-right">当日结存余额</th>
                        <th className="py-2.5 px-3 font-semibold">备注说明</th>
                        <th className="py-2.5 px-3 font-semibold text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {activityEntries.map(entry => (
                        <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-medium">
                            {entry.date}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                            {formatCurrency(entry.amount)}
                          </td>
                          <td className="py-2.5 px-3 font-sans text-slate-500">
                            {entry.notes || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => deleteBankAssetEntry(entry.id)}
                              className="text-slate-400 hover:text-rose-500 p-1 rounded"
                              title="删除记录"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Edit Bank Asset Activity Rules Modal */}
      {editingAssetActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <form
            onSubmit={handleSaveAssetEdit}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-8"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  修改 {editingAssetActivity.bank} 资产达标规则
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingAssetActivity(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">银行名称</label>
                  <input
                    type="text"
                    required
                    value={editingAssetActivity.bank}
                    onChange={e => setEditingAssetActivity({ ...editingAssetActivity, bank: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">达标月份 (YYYY-MM)</label>
                  <input
                    type="text"
                    required
                    value={editingAssetActivity.month}
                    onChange={e => setEditingAssetActivity({ ...editingAssetActivity, month: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">基准资产 (元)</label>
                  <input
                    type="number"
                    value={editingAssetActivity.baseline}
                    onChange={e =>
                      setEditingAssetActivity({
                        ...editingAssetActivity,
                        baseline: parseFloat(e.target.value) || 0
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">资产统计范围</label>
                  <input
                    type="text"
                    value={editingAssetActivity.scope}
                    onChange={e => setEditingAssetActivity({ ...editingAssetActivity, scope: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">活动规则备注</label>
                <input
                  type="text"
                  value={editingAssetActivity.notes}
                  onChange={e => setEditingAssetActivity({ ...editingAssetActivity, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              {/* Tiers Editor */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 dark:text-slate-300 font-medium">资产阶梯门槛与奖励</label>
                  <button
                    type="button"
                    onClick={() => {
                      const current = editingAssetActivity.tiers || [];
                      const lastThresh = current.length > 0 ? current[current.length - 1].threshold * 2 : 50000;
                      setEditingAssetActivity({
                        ...editingAssetActivity,
                        tiers: [
                          ...current,
                          {
                            threshold: lastThresh,
                            rewardType: 'cash',
                            reward: 50,
                            label: `新档位奖励`
                          }
                        ]
                      });
                    }}
                    className="text-2xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    + 增加门槛档位
                  </button>
                </div>

                <div className="space-y-2">
                  {editingAssetActivity.tiers.map((tier, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700"
                    >
                      <span className="text-2xs font-mono text-slate-400 w-8">#{idx + 1}</span>
                      <div className="w-28">
                        <input
                          type="number"
                          value={tier.threshold}
                          onChange={e => {
                            const updated = [...editingAssetActivity.tiers];
                            updated[idx] = { ...updated[idx], threshold: parseFloat(e.target.value) || 0 };
                            setEditingAssetActivity({ ...editingAssetActivity, tiers: updated });
                          }}
                          placeholder="日均门槛(元)"
                          className="w-full px-2 py-1 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={tier.label}
                          onChange={e => {
                            const updated = [...editingAssetActivity.tiers];
                            updated[idx] = { ...updated[idx], label: e.target.value };
                            setEditingAssetActivity({ ...editingAssetActivity, tiers: updated });
                          }}
                          placeholder="奖励说明 (如 40微信立减金)"
                          className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                        />
                      </div>
                      <div className="w-20">
                        <input
                          type="number"
                          value={tier.reward}
                          onChange={e => {
                            const updated = [...editingAssetActivity.tiers];
                            updated[idx] = { ...updated[idx], reward: parseFloat(e.target.value) || 0 };
                            setEditingAssetActivity({ ...editingAssetActivity, tiers: updated });
                          }}
                          placeholder="价值(元)"
                          className="w-full px-2 py-1 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                        />
                      </div>
                      {editingAssetActivity.tiers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = editingAssetActivity.tiers.filter((_, i) => i !== idx);
                            setEditingAssetActivity({ ...editingAssetActivity, tiers: updated });
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
                onClick={() => setEditingAssetActivity(null)}
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

      {/* New Bank Asset Activity Modal */}
      {isNewAssetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <form
            onSubmit={handleCreateAssetActivity}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-8"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">新增银行月日均资产活动</h3>
              <button
                type="button"
                onClick={() => setIsNewAssetModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">银行名称</label>
                  <input
                    type="text"
                    required
                    value={newBankName}
                    onChange={e => setNewBankName(e.target.value)}
                    placeholder="如：招商银行 / 建设银行"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">达标月份</label>
                  <input
                    type="text"
                    required
                    value={newMonth}
                    onChange={e => setNewMonth(e.target.value)}
                    placeholder="YYYY-MM"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">基准资产 (元)</label>
                  <input
                    type="number"
                    value={newBaseline}
                    onChange={e => setNewBaseline(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">统计范围</label>
                  <input
                    type="text"
                    value={newScope}
                    onChange={e => setNewScope(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">活动规则备注</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              {/* Tiers Editor */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 dark:text-slate-300 font-medium">阶梯门槛与奖励</label>
                  <button
                    type="button"
                    onClick={() => {
                      const lastThresh = newTiers.length > 0 ? newTiers[newTiers.length - 1].threshold * 2 : 50000;
                      setNewTiers([
                        ...newTiers,
                        { threshold: lastThresh, rewardType: 'cash', reward: 50, label: '新档位奖励' }
                      ]);
                    }}
                    className="text-2xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    + 增加门槛档位
                  </button>
                </div>

                <div className="space-y-2">
                  {newTiers.map((tier, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700"
                    >
                      <span className="text-2xs font-mono text-slate-400 w-8">#{idx + 1}</span>
                      <div className="w-28">
                        <input
                          type="number"
                          value={tier.threshold}
                          onChange={e => {
                            const updated = [...newTiers];
                            updated[idx] = { ...updated[idx], threshold: parseFloat(e.target.value) || 0 };
                            setNewTiers(updated);
                          }}
                          placeholder="门槛(元)"
                          className="w-full px-2 py-1 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={tier.label}
                          onChange={e => {
                            const updated = [...newTiers];
                            updated[idx] = { ...updated[idx], label: e.target.value };
                            setNewTiers(updated);
                          }}
                          placeholder="说明 (如 40立减金)"
                          className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                        />
                      </div>
                      <div className="w-20">
                        <input
                          type="number"
                          value={tier.reward}
                          onChange={e => {
                            const updated = [...newTiers];
                            updated[idx] = { ...updated[idx], reward: parseFloat(e.target.value) || 0 };
                            setNewTiers(updated);
                          }}
                          placeholder="价值"
                          className="w-full px-2 py-1 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                        />
                      </div>
                      {newTiers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setNewTiers(newTiers.filter((_, i) => i !== idx))}
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
                onClick={() => setIsNewAssetModalOpen(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg"
              >
                创建银行资产活动
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
