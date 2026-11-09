/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useCardBenefit } from '../context/CardBenefitContext';
import { calculateAssetMetrics, formatCurrency, formatBigNumber } from '../utils/engine';
import { BankAssetEntry } from '../types/cardBenefit';
import {
  Landmark,
  TrendingUp,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Calculator,
  ArrowRight
} from 'lucide-react';

export const AssetMilestonesView: React.FC = () => {
  const { state, addBankAssetEntry, updateBankAssetEntry, deleteBankAssetEntry } = useCardBenefit();

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
  const [newAmount, setNewAmount] = useState<string>('240000');
  const [newNote, setNewNote] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

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
            日结资产按天数加权精准计算【当前月日均】与【月末预测日均】，5w/10w高额立减金轻松达标
          </p>
        </div>

        {/* Segmented Bank Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto">
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
      </div>

      {state.bankAssetActivities.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-3">
          <Landmark className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">暂无银行资产达标活动</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            当前卡包为空，所有数据保存在本地。请通过右上角「同步」导入您的 JSON 数据。
          </p>
        </div>
      ) : metrics && selectedActivity && (
        <>
          {/* Key Metrics Dashboard Card */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-indigo-500/20 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold">{selectedActivity.bank}</h2>
                  <div className="text-xs text-slate-300">
                    基准资产: {formatCurrency(selectedActivity.baseline)} · 范围: {selectedActivity.scope}
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-300 font-mono">
                {selectedActivity.month} (本月共 {metrics.totalDaysInMonth} 天 · 已录入 {metrics.loggedDays} 天)
              </div>
            </div>

            {/* Calculations Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
              <div className="bg-white/5 rounded-xl p-3.5 border border-white/10">
                <span className="text-2xs text-slate-400 block font-sans">当前已录入日均</span>
                <span className="text-lg sm:text-xl font-bold text-white tabular-nums">
                  {formatCurrency(metrics.currentAverageDaily)}
                </span>
                <span className="text-3xs text-slate-400 block mt-0.5">
                  已累计: {formatCurrency(metrics.currentSum)}
                </span>
              </div>

              <div className="bg-white/5 rounded-xl p-3.5 border border-white/10">
                <span className="text-2xs text-slate-400 block font-sans">最新资产余额</span>
                <span className="text-lg sm:text-xl font-bold text-sky-400 tabular-nums">
                  {formatCurrency(metrics.latestBalance)}
                </span>
                <span className="text-3xs text-slate-400 block mt-0.5">
                  保持此余额至月末
                </span>
              </div>

              <div className="bg-white/5 rounded-xl p-3.5 border border-white/10">
                <span className="text-2xs text-slate-400 block font-sans">月末预测日均资产</span>
                <span className="text-lg sm:text-xl font-bold text-emerald-400 tabular-nums">
                  {formatCurrency(metrics.projectedMonthEndAverage)}
                </span>
                <span className="text-3xs text-emerald-300 block mt-0.5">
                  超基准提升: {formatCurrency(metrics.netIncreaseAverage)}
                </span>
              </div>

              <div className="bg-white/5 rounded-xl p-3.5 border border-white/10">
                <span className="text-2xs text-slate-400 block font-sans">当前达成最高档位</span>
                <span className="text-lg sm:text-xl font-bold text-amber-300 tabular-nums">
                  {metrics.highestAchievedTier > 0 ? formatBigNumber(metrics.highestAchievedTier) : '尚未达标'}
                </span>
                <span className="text-3xs text-amber-200 block mt-0.5">
                  已锁定丰厚立减金/积分
                </span>
              </div>
            </div>

            {/* Smart Advisor Callout */}
            {metrics.nextTier && (
              <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-200">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold text-white">智能充值/留存建议：</span>
                  若要冲刺下一档【{formatBigNumber(metrics.nextTier.threshold)} 奖励 - {metrics.nextTier.label}】，在剩余 {metrics.totalDaysInMonth - metrics.loggedDays} 天中，每日需保持资产日均
                  <span className="font-bold font-mono text-amber-300 mx-1">
                    {formatCurrency(metrics.nextTier.requiredDailyForRemainingDays)}
                  </span>
                  元。
                </div>
              </div>
            )}
          </div>

          {/* Tiers Ladder (5w / 10w / 20w / 50w) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                阶梯达标进度一览表 (重点：5w 与 10w 档位)
              </h3>
              <span className="text-xs text-slate-400">
                月末预测达成率以加权日均测算
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {metrics.achievedTiers.slice(0, 4).map((tier, idx) => (
                <div
                  key={tier.threshold}
                  className={`p-4 rounded-xl border transition-all space-y-2.5 ${
                    tier.isAchieved
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      月日均 {formatBigNumber(tier.threshold)}
                    </span>
                    {tier.isAchieved ? (
                      <span className="px-2 py-0.5 text-2xs font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> 已达标
                      </span>
                    ) : (
                      <span className="text-2xs text-slate-500 font-mono">
                        待冲刺
                      </span>
                    )}
                  </div>

                  <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                    {tier.label || (tier.rewardType === 'cash' ? `¥${tier.reward}立减金` : `${tier.reward}积分`)}
                  </div>

                  {/* Progress bar towards this tier */}
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        tier.isAchieved ? 'bg-emerald-500' : 'bg-indigo-500'
                      }`}
                      style={{
                        width: `${Math.min(100, (metrics.projectedMonthEndAverage / tier.threshold) * 100)}%`
                      }}
                    />
                  </div>

                  <div className="text-2xs text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono">
                    <span>
                      {tier.isAchieved
                        ? '100% 达成'
                        : `完成度 ${((metrics.projectedMonthEndAverage / tier.threshold) * 100).toFixed(0)}%`}
                    </span>
                    {!tier.isAchieved && (
                      <span>差 {formatCurrency(tier.threshold - metrics.projectedMonthEndAverage)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Asset Ledger Table & Add Entry Form */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Add Entry Form (4 cols) */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  登记每日资产日终余额
                </h3>
              </div>

              <form onSubmit={handleAddEntry} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    记录日期
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    当日日终资产余额 (元)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newAmount}
                    onChange={e => setNewAmount(e.target.value)}
                    className="w-full px-3 py-2 text-base font-bold font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    资产变动备注 (可选)
                  </label>
                  <input
                    type="text"
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="如：理财转入 / 定期结息"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold text-xs rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>添加至日均计算表</span>
                </button>
              </form>
            </div>

            {/* Right: History Entries Table (8 cols) */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  已录入资产明细表 ({activityEntries.length} 天)
                </h3>
                <span className="text-xs text-slate-400">
                  按记录倒序排列
                </span>
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
    </div>
  );
};
