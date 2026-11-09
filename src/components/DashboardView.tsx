/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useCardBenefit } from '../context/CardBenefitContext';
import { formatCurrency, formatBigNumber } from '../utils/engine';
import {
  TrendingUp,
  CreditCard,
  Wallet,
  Landmark,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  Filter,
  Sparkles
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { state, totalSaved, monthlySaved, totalCashback, pendingRewardValue, activeRulesCount } = useCardBenefit();

  const [selectedBankFilter, setSelectedBankFilter] = useState<string>('all');
  const [selectedSceneFilter, setSelectedSceneFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');

  // Filter feedback records
  const filteredFeedback = useMemo(() => {
    return state.feedback.filter(f => {
      if (selectedBankFilter !== 'all' && f.bank !== selectedBankFilter) return false;
      if (selectedSceneFilter !== 'all' && f.scene !== selectedSceneFilter) return false;
      return true;
    });
  }, [state.feedback, selectedBankFilter, selectedSceneFilter]);

  // Aggregate savings by bank
  const bankStats = useMemo(() => {
    const map: Record<string, { saved: number; count: number; pending: number }> = {};
    // From feedback
    state.feedback.forEach(f => {
      const bank = f.bank || '通用银行';
      if (!map[bank]) map[bank] = { saved: 0, count: 0, pending: 0 };
      map[bank].saved += f.actual || f.expected || 0;
      map[bank].count += 1;
    });
    // From confirmed activities
    state.activities.forEach(act => {
      const bank = act.bank || '合作银行';
      if (!map[bank]) map[bank] = { saved: 0, count: 0, pending: 0 };
      act.tiers.forEach(t => {
        if (t.rewardStatus === 'confirmed' || t.rewardStatus === 'claimed') {
          map[bank].saved += t.actualReward || t.estimatedReward || 0;
        } else {
          map[bank].pending += t.estimatedReward || 0;
        }
      });
    });

    return Object.entries(map)
      .map(([bank, data]) => ({ bank, ...data, total: data.saved + data.pending }))
      .sort((a, b) => b.total - a.total);
  }, [state.feedback, state.activities]);

  // Benefit types distribution
  const typeStats = useMemo(() => {
    let fixedTotal = 0;
    let rateTotal = 0;
    let cashbackTotal = 0;
    let pointsTotal = 0;
    let quickPayTotal = 0;
    let assetTotal = 0;

    state.feedback.forEach(f => {
      const amt = f.actual || f.expected || 0;
      if (f.ruleName.includes('数币') || f.ruleName.includes('1.6') || f.ruleName.includes('0.99')) {
        fixedTotal += amt;
      } else if (f.ruleName.includes('五折') || f.ruleName.includes('5折')) {
        rateTotal += amt;
      } else if (f.ruleName.includes('快捷支付')) {
        quickPayTotal += amt;
      } else {
        cashbackTotal += amt;
      }
    });

    state.activities.forEach(act => {
      act.tiers.forEach(t => {
        const val = t.actualReward || t.estimatedReward || 0;
        if (t.rewardStatus === 'confirmed' || t.rewardStatus === 'claimed') {
          if (act.name.includes('快捷支付')) {
            quickPayTotal += val;
          } else {
            cashbackTotal += val;
          }
        }
      });
    });

    // Asset rewards
    state.bankAssetActivities.forEach(act => {
      act.tiers.forEach(t => {
        if (t.achieved) {
          assetTotal += t.rewardType === 'cash' ? t.reward : (t.reward * 15) / 10000;
        }
      });
    });

    const sum = fixedTotal + rateTotal + cashbackTotal + pointsTotal + quickPayTotal + assetTotal || 1;
    return [
      { name: '资产达标收益', value: assetTotal, color: 'bg-emerald-500', pct: Math.round((assetTotal / sum) * 100) },
      { name: '支付宝快捷支付', value: quickPayTotal, color: 'bg-indigo-500', pct: Math.round((quickPayTotal / sum) * 100) },
      { name: '达标返现/刷卡金', value: cashbackTotal, color: 'bg-amber-500', pct: Math.round((cashbackTotal / sum) * 100) },
      { name: '固定金额立减', value: fixedTotal, color: 'bg-sky-500', pct: Math.round((fixedTotal / sum) * 100) },
      { name: '按比例优惠/折扣', value: rateTotal, color: 'bg-rose-500', pct: Math.round((rateTotal / sum) * 100) }
    ];
  }, [state.feedback, state.activities, state.bankAssetActivities]);

  // Asset qualified estimated total
  const assetQualifiedTotal = useMemo(() => {
    let sum = 0;
    state.bankAssetActivities.forEach(act => {
      act.tiers.forEach(t => {
        if (t.achieved) {
          sum += t.rewardType === 'cash' ? t.reward : (t.reward * 15) / 10000;
        }
      });
    });
    return sum;
  }, [state.bankAssetActivities]);

  return (
    <div className="space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            优惠收益与用卡成效可视化仪表盘
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            实时汇聚即时立减、多重达标返现、支付宝快捷支付与资产日均收益
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>统计周期: 2026年11月 · 活跃规则 {activeRulesCount} 条</span>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {/* KPI 1 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-2xs space-y-0.5 sm:space-y-1">
          <div className="flex items-center justify-between text-2xs sm:text-xs text-slate-500 dark:text-slate-400">
            <span>实测已省</span>
            <Wallet className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-lg sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {formatCurrency(totalSaved)}
          </div>
          <div className="text-3xs sm:text-2xs text-slate-400">
            共 {state.feedback.length} 笔用卡实测
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-2xs space-y-0.5 sm:space-y-1">
          <div className="flex items-center justify-between text-2xs sm:text-xs text-slate-500 dark:text-slate-400">
            <span>本月当期节省</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-lg sm:text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatCurrency(monthlySaved)}
          </div>
          <div className="text-3xs sm:text-2xs text-slate-400">
            11月立减与即时返还
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-2xs space-y-0.5 sm:space-y-1">
          <div className="flex items-center justify-between text-2xs sm:text-xs text-slate-500 dark:text-slate-400">
            <span>已确认返现</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-lg sm:text-2xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
            {formatCurrency(totalCashback)}
          </div>
          <div className="text-3xs sm:text-2xs text-slate-400">
            交行/兴业/快捷支付
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-2xs space-y-0.5 sm:space-y-1">
          <div className="flex items-center justify-between text-2xs sm:text-xs text-slate-500 dark:text-slate-400">
            <span>资产达标已锁定</span>
            <Landmark className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-lg sm:text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
            {formatCurrency(assetQualifiedTotal)}
          </div>
          <div className="text-3xs sm:text-2xs text-slate-400">
            建行立减金 + 工行积分
          </div>
        </div>

        {/* KPI 5 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-2xs space-y-0.5 sm:space-y-1 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-2xs sm:text-xs text-slate-500 dark:text-slate-400">
            <span>进行中待冲刺</span>
            <Layers className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="text-lg sm:text-2xl font-bold font-mono tabular-nums text-purple-600 dark:text-purple-400">
            {formatCurrency(pendingRewardValue)}
          </div>
          <div className="text-3xs sm:text-2xs text-slate-400">
            下一阶梯达标预估价值
          </div>
        </div>
      </div>

      {/* Main Analytics Grid: Benefit Distribution & Bank Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Benefit Structure & Distribution (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              优惠收益类型分布
            </h3>
            <span className="text-xs text-slate-400">综合收益结构</span>
          </div>

          {/* Stacked Progress Bar */}
          <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
            {typeStats.map((item, idx) => (
              <div
                key={idx}
                className={`${item.color} h-full transition-all`}
                style={{ width: `${Math.max(item.pct, 4)}%` }}
                title={`${item.name}: ${item.pct}% (¥${item.value})`}
              />
            ))}
          </div>

          {/* Breakdown Items List */}
          <div className="space-y-2.5 pt-1">
            {typeStats.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-xs ${item.color}`} />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(item.value)}
                  </span>
                  <span className="text-slate-400 w-10 text-right tabular-nums">{item.pct}%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-2xs text-slate-500 dark:text-slate-400 leading-relaxed">
            💡 提示：资产日均达标与快捷支付满额活动贡献了近 60% 的总收益，结合日常小额乘车码即时立减，可达成收益最大化。
          </div>
        </div>

        {/* Right: Bank Performance Leaderboard (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              各银行/平台优惠贡献排行榜
            </h3>
            <span className="text-xs text-slate-400">已到账 vs 待冲刺</span>
          </div>

          <div className="space-y-3">
            {bankStats.slice(0, 6).map((item, idx) => {
              const maxVal = bankStats[0]?.total || 100;
              const widthPct = Math.round((item.total / maxVal) * 100);

              return (
                <div key={item.bank} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="w-4 text-slate-400 font-mono text-2xs">{idx + 1}.</span>
                      {item.bank}
                    </span>
                    <span className="font-mono tabular-nums text-slate-900 dark:text-white font-bold">
                      {formatCurrency(item.total)}
                    </span>
                  </div>

                  {/* Dual progress bar: saved (solid) + pending (striped/light) */}
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all"
                      style={{ width: `${(item.saved / maxVal) * 100}%` }}
                      title={`已入账: ¥${item.saved}`}
                    />
                    {item.pending > 0 && (
                      <div
                        className="bg-purple-300 dark:bg-purple-700 h-full transition-all"
                        style={{ width: `${(item.pending / maxVal) * 100}%` }}
                        title={`待结算: ¥${item.pending}`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-4 pt-1 text-2xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs bg-indigo-600 dark:bg-indigo-500" />
              已入账实测收益
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs bg-purple-300 dark:bg-purple-700" />
              进行中达标阶梯
            </span>
          </div>
        </div>
      </div>

      {/* Best Strategy by Scene Matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              各典型消费场景最优用卡策略矩阵
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              根据您的规则库与活动库自动提炼出的各高频场景最佳姿势
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Scene 1: Subway */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">🚇 地铁通勤</span>
              <span className="text-2xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">5折 / -¥1.6</span>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              早高峰(06:30-10:00)用【支付宝超级出行卡】享5折封顶2元；平峰期用【交行数币乘车码】立减1.6元。
            </div>
            <div className="text-2xs text-slate-400">
              月省预估: ¥40 - ¥60
            </div>
          </div>

          {/* Scene 2: Shared Bike */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">🚲 共享单车</span>
              <span className="text-2xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">低至0.01元</span>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              【兴业生活App】扫码青桔满1.5减1.49(1分钱骑行4次/月)，哈啰单车立减1.5元(10次/月)。
            </div>
            <div className="text-2xs text-slate-400">
              月省预估: ¥15 - ¥21
            </div>
          </div>

          {/* Scene 3: Online Shopping / QuickPay */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">🛍️ 线上电商/快捷支付</span>
              <span className="text-2xs font-mono font-semibold text-indigo-600 dark:text-indigo-400">返金+抽大奖</span>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              优先选【支付宝快捷支付】满1000返5元/满5000抽88元大奖；或微信支付使用【农行信用卡】单笔满1000享3倍积分。
            </div>
            <div className="text-2xs text-slate-400">
              月省预估: ¥35 - ¥108
            </div>
          </div>

          {/* Scene 4: Big Spend & Milestone */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">💳 大额达标(¥5000+)</span>
              <span className="text-2xs font-mono font-semibold text-purple-600 dark:text-purple-400">双重抽奖+返15</span>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              优先刷【交通银行信用卡】满5000送抽奖1次+返15元，满8000再加送抽奖1次；或选【农行微信满5000返15刷卡金】。
            </div>
            <div className="text-2xs text-slate-400">
              单笔收益: ¥30 - ¥88
            </div>
          </div>
        </div>
      </div>

      {/* Filtered Recent Feedback Records Ledger */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            近期实测优惠打卡记录 ({filteredFeedback.length})
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedBankFilter}
                onChange={e => setSelectedBankFilter(e.target.value)}
                className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-800 dark:text-slate-200"
              >
                <option value="all">全部银行</option>
                <option value="交通银行">交通银行</option>
                <option value="建设银行">建设银行</option>
                <option value="农业银行">农业银行</option>
                <option value="兴业银行">兴业银行</option>
                <option value="支付宝">支付宝</option>
              </select>
            </div>
          </div>
        </div>

        {filteredFeedback.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            暂无符合筛选条件的实测记录
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-y border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">记录时间</th>
                  <th className="py-2.5 px-3 font-semibold">用卡规则 / 活动</th>
                  <th className="py-2.5 px-3 font-semibold">发卡机构</th>
                  <th className="py-2.5 px-3 font-semibold">渠道</th>
                  <th className="py-2.5 px-3 font-semibold text-right">消费金额</th>
                  <th className="py-2.5 px-3 font-semibold text-right">实际优惠</th>
                  <th className="py-2.5 px-3 font-semibold text-center">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {filteredFeedback.slice(0, 8).map(record => (
                  <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {record.when?.replace('T', ' ') || record.feedbackAt?.slice(0, 10)}
                    </td>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-900 dark:text-white max-w-xs truncate">
                      {record.ruleName}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-300">
                      {record.bank || '合作银行'}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-500">
                      {record.channel || '快捷支付'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                      {formatCurrency(record.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      -{formatCurrency(record.actual || record.expected)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="font-sans text-2xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                        已确认
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
