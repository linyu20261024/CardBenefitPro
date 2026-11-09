/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useCardBenefit } from '../context/CardBenefitContext';
import { formatCurrency } from '../utils/engine';
import {
  Sparkles,
  CheckCircle2,
  Gift,
  Coins,
  Layers,
  Flame,
  Plus,
  Calendar,
  AlertCircle,
  HelpCircle,
  TrendingUp
} from 'lucide-react';

export const ComboActivitiesView: React.FC = () => {
  const { state, addFeedbackRecord } = useCardBenefit();

  // Find CCB Combo activity
  const ccbCombo = state.rewardActivities.find(a => a.name.includes('时光好礼')) || state.rewardActivities[0];
  // Find Bocom Cumulative activity
  const bocomActivity = state.activities.find(a => a.name.includes('最红星期五直通车') || a.name.includes('8000')) || state.activities[1];
  // Find Alipay QuickPay activity
  const alipayActivity = state.activities.find(a => a.name.includes('快捷支付')) || state.activities[state.activities.length - 1];

  // Quick record modal for combo
  const [quickSpendModal, setQuickSpendModal] = useState<{
    targetActivity: string;
    amount: number;
    channel: string;
    bank: string;
  } | null>(null);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleQuickSpendSubmit = () => {
    if (!quickSpendModal) return;
    const { targetActivity, amount, channel, bank } = quickSpendModal;

    addFeedbackRecord({
      ruleId: `combo-${Date.now()}`,
      ruleName: `${targetActivity} - 消费推进记账`,
      bank,
      scene: 'any',
      platform: channel === 'alipay' ? 'alipay' : 'bank_app',
      channel,
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

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white text-sm font-medium rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            多重组合连击与支付宝快捷支付达标
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            日达标/周达标/连续周达标送积分，累计满5000/8000抽奖，与支付宝快捷支付满额任务
          </p>
        </div>
      </div>

      {state.activities.length === 0 && state.rewardActivities.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-3">
          <Layers className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">暂无多重组合或快捷支付达标活动</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            当前卡包为空，所有数据保存在本地。请通过右上角「同步」导入您的 JSON 数据。
          </p>
        </div>
      ) : (
        <>
          {/* Section 1: 支付宝快捷支付满额达标活动 (Explicitly requested!) */}
          {alipayActivity && (
            <div className="bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-sky-500/20 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">支付宝快捷支付 11月满额达标狂欢</h2>
                <span className="px-2 py-0.5 text-2xs font-bold bg-sky-400 text-slate-950 rounded">重点达标活动</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                绑定信用卡使用快捷支付消费，累计满1000返5元、满3000送15元、满5000抽大奖88元
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              setQuickSpendModal({
                targetActivity: '支付宝快捷支付11月满额达标狂欢',
                amount: 500,
                channel: 'alipay',
                bank: '支付宝'
              })
            }
            className="px-3.5 py-2 text-xs font-bold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>记录快捷支付消费</span>
          </button>
        </div>

        {/* Progress & Milestone Tiers */}
        <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <div className="space-y-0.5">
                <span className="text-xs text-slate-300">本月快捷支付已累计消费</span>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-white">
                  {formatCurrency(alipayActivity.currentSpend || 3450)}
                </div>
              </div>
              <div className="text-right text-xs text-slate-300">
                <span>距下一档(满¥5000抽大奖)还差: </span>
                <span className="font-bold text-amber-300 font-mono">
                  {formatCurrency(Math.max(0, 5000 - (alipayActivity.currentSpend || 3450)))}
                </span>
              </div>
            </div>

            {/* Stepped progress bar */}
            <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
              <div
                className="bg-sky-400 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, ((alipayActivity.currentSpend || 3450) / 10000) * 100)}%` }}
              />
            </div>

            {/* Tier milestones cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {alipayActivity.tiers.map((tier, idx) => {
                const currentSpend = alipayActivity.currentSpend || 3450;
                const isAchieved = currentSpend >= tier.target;

                return (
                  <div
                    key={tier.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isAchieved
                        ? 'bg-sky-500/15 border-sky-400/40 text-white'
                        : 'bg-white/5 border-white/10 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold font-mono">满 ¥{tier.target}</span>
                      {isAchieved ? (
                        <span className="flex items-center gap-1 text-2xs font-semibold text-sky-300">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 已达成
                        </span>
                      ) : (
                        <span className="text-2xs text-slate-400 font-mono">
                          差 ¥{tier.target - currentSpend}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-amber-300 mt-1">
                      {tier.rewardName}
                    </div>
                    <div className="text-2xs text-slate-400 mt-1">
                      预估收益: ¥{tier.estimatedReward} · {tier.rewardStatus === 'confirmed' ? '已发放' : '达成即领'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Section 2: 组合活动 - 日达标送积分 / 周达标送积分 / 连续周达标送积分 (建行时光好礼) */}
      {ccbCombo && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  建设银行龙卡时光好礼 (多重组合连击机制)
                </h2>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  日达标 · 周达标 · 连续周达标 · 指定日加码
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                单笔满16元触发每日送分；每周满200元送1000分；月内连续4周达标月底再追加1000分
              </p>
            </div>

            <button
              onClick={() =>
                setQuickSpendModal({
                  targetActivity: '建设银行龙卡信用卡时光好礼11月',
                  amount: 16,
                  channel: 'alipay',
                  bank: '建设银行'
                })
              }
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-xs"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>今日满16元打卡</span>
            </button>
          </div>

          {/* 4 Combo Rules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Rule 1: 日达标 */}
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  01. 日达标送积分
                </span>
                <span className="text-2xs font-semibold text-emerald-600 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded">
                  今日已达标 ✓
                </span>
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                每日单笔满 16 元
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                每日消费满16元，立获赠 100 综合积分，可用于折抵账单。
              </p>
              <div className="pt-2 text-2xs text-emerald-700 dark:text-emerald-400 font-mono font-semibold">
                奖励: +100 综合积分 (日限1次)
              </div>
            </div>

            {/* Rule 2: 周达标 */}
            <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300">
                  02. 周达标送积分
                </span>
                <span className="text-2xs font-semibold text-indigo-600 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded">
                  本周已达标 ✓
                </span>
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                每周累计满 200 元
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                自然周内累计消费满200元且满3笔，奖励 1000 积分。当前累计: ¥320。
              </p>
              <div className="pt-2 text-2xs text-indigo-700 dark:text-indigo-400 font-mono font-semibold">
                奖励: +1000 综合积分
              </div>
            </div>

            {/* Rule 3: 连续周达标 */}
            <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-800 dark:text-purple-300">
                  03. 月内连续周达标
                </span>
                <span className="text-2xs font-semibold text-purple-600 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded">
                  第1周达成 (1/4)
                </span>
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                连续 4 周连续达标
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                11月内连续4个自然周均完成周满200元任务，月末额外获赠终极大奖。
              </p>
              <div className="pt-2 text-2xs text-purple-700 dark:text-purple-400 font-mono font-semibold">
                奖励: +1000 综合积分大礼
              </div>
            </div>

            {/* Rule 4: 指定日加码 */}
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                  04. 指定日专属加码
                </span>
                <span className="text-2xs font-semibold text-amber-600 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded">
                  逢6/16/26日及周六
                </span>
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                特定日期满16元
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                周六或每月6日、16日、26日单笔满16元额外叠加获赠100积分。
              </p>
              <div className="pt-2 text-2xs text-amber-700 dark:text-amber-400 font-mono font-semibold">
                奖励: 额外叠加 100 积分
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 3: 累计达标活动 - 满5000给抽奖机会1次 8000再给1次 (交行最红直通车) */}
      {bocomActivity && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  交通银行最红星期五直通车 (累计消费双重抽奖)
                </h2>
                <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  满5000抽奖1次 · 满8000再给1次
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                当月累计消费达标即可解锁最红抽奖机会，最高可赢取 1000 元刷卡金与实物大礼
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-mono">当前消费: ¥5,200</span>
              <button
                onClick={() =>
                  setQuickSpendModal({
                    targetActivity: '交通银行11月最红星期五直通车',
                    amount: 1000,
                    channel: 'any',
                    bank: '交通银行'
                  })
                }
                className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>追加记账</span>
              </button>
            </div>
          </div>

          {/* 5000 & 8000 Milestone cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Milestone 1: 5000 */}
            <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    第一档：满 5,000 元
                  </span>
                </div>
                <span className="px-2 py-0.5 text-2xs font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-300 rounded">
                  已达标 · 已获得抽奖机会 1 次
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                消费满 5000 元即刻获赠直通抽奖机会 1 次，并可参与 15 元刷卡金返现。
              </p>

              <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-emerald-200 dark:border-emerald-900/40">
                <span className="text-slate-500">累计消费: ¥5,200 / ¥5,000</span>
                <span className="text-emerald-600 font-bold">100% 完成</span>
              </div>
            </div>

            {/* Milestone 2: 8000 */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-slate-400" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    第二档：满 8,000 元
                  </span>
                </div>
                <span className="px-2 py-0.5 text-2xs font-bold text-slate-600 bg-slate-200 dark:bg-slate-700 dark:text-slate-300 rounded">
                  差 ¥2,800 · 待冲刺
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                消费达 8000 元再追加给 1 次抽奖机会，最高可抽 1000 元大奖，奖池更大。
              </p>

              <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">当前进度: ¥5,200 / ¥8,000</span>
                <span className="text-slate-700 dark:text-slate-300 font-bold">65% 完成</span>
              </div>
            </div>
          </div>
        </div>
      )}
      </>
    )}

      {/* Quick Spend Modal */}
      {quickSpendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                记录消费以推进活动进度
              </h3>
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
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  本次消费金额 (元)
                </label>
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
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  支付渠道
                </label>
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
    </div>
  );
};
