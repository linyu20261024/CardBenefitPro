/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useCardBenefit } from '../context/CardBenefitContext';
import { evaluateRecommendations, formatCurrency, formatBigNumber } from '../utils/engine';
import { RecommendationResult } from '../types/cardBenefit';
import {
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  PlusCircle,
  Tag,
  Coins,
  Gift,
  HelpCircle,
  Upload,
  Download
} from 'lucide-react';

const QUICK_AMOUNTS = [
  { label: '¥2 (地铁起步)', value: 2 },
  { label: '¥5 (日常通勤)', value: 5 },
  { label: '¥18 (笔笔返门槛)', value: 18 },
  { label: '¥50', value: 50 },
  { label: '¥100 (满减门槛)', value: 100 },
  { label: '¥500 (食惠狂欢)', value: 500 },
  { label: '¥1000 (3倍积分/快捷支付)', value: 1000 },
  { label: '¥5000 (抽奖/返15刷卡金)', value: 5000 },
  { label: '¥8000 (交行二重抽奖)', value: 8000 }
];

const SCENES = [
  { id: 'subway', label: '地铁出行' },
  { id: 'bus', label: '公交车' },
  { id: 'shared_bike', label: '共享单车' },
  { id: 'dining', label: '餐饮美食' },
  { id: 'shopping', label: '商超便利' },
  { id: 'online_shop', label: '网上电商' },
  { id: 'entertainment', label: '休闲娱乐' },
  { id: 'bills', label: '生活缴费' },
  { id: 'any', label: '通用消费' }
];

const CHANNELS = [
  { id: 'any', label: '不限渠道' },
  { id: 'alipay', label: '支付宝快捷支付' },
  { id: 'wechat', label: '微信支付' },
  { id: 'unionpay', label: '银联云闪付' },
  { id: 'mobile_pay', label: '手机Pay/Apple Pay' },
  { id: 'transit_code', label: '乘车码' },
  { id: 'bank_app', label: '银行专属App' },
  { id: 'digital_cny', label: '数字人民币' }
];

const BANKS = [
  'all',
  '交通银行',
  '建设银行',
  '农业银行',
  '兴业银行',
  '光大银行',
  '工商银行',
  '广发银行',
  '华夏银行',
  '邮储银行',
  '平安银行',
  '支付宝'
];

interface RecommendationViewProps {
  onOpenSyncModal?: () => void;
}

export const RecommendationView: React.FC<RecommendationViewProps> = ({ onOpenSyncModal }) => {
  const { state, addFeedbackRecord, loadSampleData } = useCardBenefit();

  const [amountInput, setAmountInput] = useState<string>('5');
  const [selectedScene, setSelectedScene] = useState<string>('subway');
  const [selectedChannel, setSelectedChannel] = useState<string>('alipay');
  const [selectedBank, setSelectedBank] = useState<string>('all');
  const [customTime, setCustomTime] = useState<string>('08:30');
  const [recordModalData, setRecordModalData] = useState<{
    result: RecommendationResult;
    actualAmount: number;
    actualSavings: number;
    note: string;
  } | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const parsedAmount = Math.max(0, parseFloat(amountInput) || 0);

  const recommendations = useMemo(() => {
    return evaluateRecommendations(
      {
        amount: parsedAmount,
        scene: selectedScene,
        channel: selectedChannel,
        bank: selectedBank,
        currentTime: customTime
      },
      state.rules,
      state.activities,
      state.rewardActivities
    );
  }, [parsedAmount, selectedScene, selectedChannel, selectedBank, customTime, state]);

  const bestPick = recommendations.length > 0 ? recommendations[0] : null;
  const otherPicks = recommendations.length > 1 ? recommendations.slice(1) : [];

  const handleApplyRecommendation = (rec: RecommendationResult) => {
    setRecordModalData({
      result: rec,
      actualAmount: parsedAmount,
      actualSavings: rec.instantSavings > 0 ? rec.instantSavings : rec.cashbackReward,
      note: rec.triggersCombo ? rec.triggeredComboDetails.join('; ') : ''
    });
  };

  const handleConfirmRecord = () => {
    if (!recordModalData) return;
    const { result, actualAmount, actualSavings, note } = recordModalData;

    addFeedbackRecord({
      ruleId: result.id,
      ruleName: result.name,
      bank: result.bank,
      scene: selectedScene,
      platform: result.platform,
      channel: result.channel,
      amount: actualAmount,
      expected: result.instantSavings > 0 ? result.instantSavings : result.cashbackReward,
      actual: actualSavings,
      confirmed: true,
      result: actualSavings >= result.instantSavings ? 'confirmed' : 'discrepancy',
      when: new Date().toISOString().slice(0, 16),
      note: note || result.notes || '',
      contributedActivities: result.triggeredComboDetails
    });

    setRecordModalData(null);
    setSuccessToast(`已成功采纳并记录！实测优惠 ${formatCurrency(actualSavings)} 已记入收益统计。`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white text-sm font-medium rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Simulator Inputs Canvas - Mobile High-Density Optimized */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs space-y-3.5 sm:space-y-5">
        {/* Top title & time */}
        <div className="flex items-center justify-between gap-2 pb-2.5 sm:pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              智能用卡决策与最优方案
            </h1>
            <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              输入拟消费金额与场景，多维匹配即时立减、达标返现、积分倍增与组合连击
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 shrink-0">
            <Clock className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
            <span className="hidden sm:inline">消费时刻:</span>
            <input
              type="time"
              value={customTime}
              onChange={e => setCustomTime(e.target.value)}
              className="px-2 py-1 text-xs font-mono font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Row 1: Amount Input & Compact Scrollable Chips */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            <span>拟消费金额 (元)</span>
            <span className="sm:hidden text-2xs text-slate-400 font-mono">横滑选常用金额 →</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-32 sm:w-44 shrink-0">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base sm:text-lg font-bold text-slate-400">¥</span>
              <input
                type="number"
                min="0.01"
                step="any"
                value={amountInput}
                onChange={e => setAmountInput(e.target.value)}
                placeholder="金额"
                className="w-full pl-7 pr-3 py-1.5 sm:py-2.5 text-lg sm:text-xl font-bold font-mono tracking-tight text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex overflow-x-auto scrollbar-none items-center gap-1.5 flex-1 py-0.5">
              {QUICK_AMOUNTS.map(item => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setAmountInput(item.value.toString())}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 active:scale-95 ${
                    parsedAmount === item.value
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Spend Scene Filter - Single line swipeable on mobile */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            <span>消费场景</span>
            <span className="sm:hidden text-2xs text-slate-400 font-mono">横滑切换 →</span>
          </div>
          <div className="flex overflow-x-auto scrollbar-none items-center gap-1.5 py-0.5">
            {SCENES.map(sc => (
              <button
                key={sc.id}
                type="button"
                onClick={() => setSelectedScene(sc.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 active:scale-95 ${
                  selectedScene === sc.id
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Payment Channel Filter - Single line swipeable on mobile */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            <span>支付渠道 / 平台</span>
            <span className="sm:hidden text-2xs text-slate-400 font-mono">横滑切换 →</span>
          </div>
          <div className="flex overflow-x-auto scrollbar-none items-center gap-1.5 py-0.5">
            {CHANNELS.map(ch => (
              <button
                key={ch.id}
                type="button"
                onClick={() => setSelectedChannel(ch.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 active:scale-95 ${
                  selectedChannel === ch.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {ch.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 4: Bank Filter - Compact */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">机构:</span>
            {BANKS.slice(0, 8).map(b => (
              <button
                key={b}
                type="button"
                onClick={() => setSelectedBank(b)}
                className={`px-2 py-0.5 text-xs rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  selectedBank === b
                    ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {b === 'all' ? '全部' : b}
              </button>
            ))}
          </div>
          <span className="text-2xs sm:text-xs text-slate-400 font-mono self-end sm:self-auto shrink-0">
            匹配到 {recommendations.length} 项方案
          </span>
        </div>
      </div>

      {/* Results Section */}
      {state.rules.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
            <Upload className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">卡包当前为空 (纯净本地模式)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              当前尚未导入任何用卡规则，所有数据仅保存在您本地设备中。请点击下方按钮导入您的用卡推荐备份 JSON 文件。
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <button
              onClick={onOpenSyncModal}
              className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>导入我的 JSON 备份</span>
            </button>
            <button
              onClick={loadSampleData}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <span>加载示例演示数据</span>
            </button>
          </div>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">暂无匹配的用卡优惠方案</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            当前输入的消费金额（¥{parsedAmount}）或筛选条件在此时间段未触发特定优惠。您可以尝试切换为【不限渠道】或调整金额。
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Spotlight: Best Overall Card */}
          {bestPick && (
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-2xl p-4 sm:p-7 shadow-lg border border-indigo-500/20">
              {/* Highlight ribbon */}
              <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <div className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-2xs sm:text-xs font-bold bg-amber-400 text-slate-950 rounded-md tracking-wide uppercase flex items-center gap-1">
                    <Sparkles className="w-3 h-3 fill-current" />
                    <span>首推最优</span>
                  </div>
                  <span className="text-2xs sm:text-xs text-slate-300 font-medium">
                    综合回报 {bestPick.effectiveDiscountRate}%
                  </span>
                </div>
                <div className="text-2xs sm:text-xs text-slate-400 font-mono truncate">
                  {bestPick.bank} · {bestPick.channel}
                </div>
              </div>

              {/* Main recommendation title & money metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-center">
                <div className="lg:col-span-7 space-y-2">
                  <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white leading-snug">
                    {bestPick.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-2 sm:line-clamp-none">
                    {bestPick.notes || '符合当前消费场景与金额，享有专属优惠与达标返还。'}
                  </p>

                  {/* Conditions & Trigger tags (unboxed text style) */}
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-2.5 text-2xs sm:text-xs text-slate-300 pt-0.5">
                    {bestPick.qualifications.map((q, idx) => (
                      <span key={idx} className="flex items-center gap-1 text-amber-200">
                        <Tag className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>{q}</span>
                      </span>
                    ))}
                    {bestPick.triggeredComboDetails.map((trig, idx) => (
                      <span key={idx} className="flex items-center gap-1 text-emerald-300">
                        <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{trig}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right side savings box */}
                <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-xl p-3.5 sm:p-5 border border-white/15 space-y-2.5 sm:space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-300">综合预估总收益</span>
                    <span className="text-xl sm:text-3xl font-extrabold font-mono tabular-nums text-emerald-400">
                      +{formatCurrency(bestPick.totalEffectiveBenefit)}
                    </span>
                  </div>

                  <div className="space-y-1 sm:space-y-1.5 text-2xs sm:text-xs text-slate-300 border-t border-white/10 pt-2 font-mono">
                    {bestPick.instantSavings > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">即时立减</span>
                        <span className="text-white font-semibold">-{formatCurrency(bestPick.instantSavings)}</span>
                      </div>
                    )}
                    {bestPick.instantSavings > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">抵扣后实付</span>
                        <span className="text-amber-300 font-bold">
                          {formatCurrency(Math.max(0, parsedAmount - bestPick.instantSavings))}
                        </span>
                      </div>
                    )}
                    {bestPick.cashbackReward > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">达标返现</span>
                        <span className="text-emerald-300">+{formatCurrency(bestPick.cashbackReward)}</span>
                      </div>
                    )}
                    {bestPick.pointsReward > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">赠送积分</span>
                        <span className="text-sky-300">+{bestPick.pointsReward}分 (≈¥{bestPick.pointsValue})</span>
                      </div>
                    )}
                    {bestPick.lotteryChances > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">抽奖机会</span>
                        <span className="text-purple-300">
                          {bestPick.lotteryChances}次 (估值¥{bestPick.lotteryEstimatedValue})
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleApplyRecommendation(bestPick)}
                    className="w-full mt-1.5 py-2.5 sm:py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm min-h-[44px] active:scale-98"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>采纳此方案并一键记账</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Secondary Candidate List */}
          {otherPicks.length > 0 && (
            <div className="space-y-2.5 pt-1 sm:pt-2">
              <div className="flex items-center justify-between text-xs">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                  其他备选推荐方案 ({otherPicks.length})
                </h3>
                <span className="text-2xs text-slate-400">按综合有效收益排序</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5">
                {otherPicks.map(rec => (
                  <div
                    key={rec.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-2.5"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <span className="text-2xs sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {rec.bank} · {rec.channel}
                        </span>
                        {rec.isBestInstant && (
                          <span className="px-1.5 py-0.5 text-3xs sm:text-2xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded">
                            立减最高
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                        {rec.name}
                      </h4>
                      <p className="text-2xs sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {rec.notes || '符合消费门槛'}
                      </p>

                      {/* Trigger combo indicator */}
                      {rec.triggersCombo && (
                        <div className="mt-1 text-3xs sm:text-2xs text-emerald-600 dark:text-emerald-400 font-medium truncate">
                          ✦ {rec.triggeredComboDetails[0]}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-xs sm:text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          +{formatCurrency(rec.totalEffectiveBenefit)}
                        </div>
                        <div className="text-3xs sm:text-2xs text-slate-400 font-mono">
                          {rec.instantSavings > 0
                            ? `立减¥${rec.instantSavings}`
                            : rec.cashbackReward > 0
                            ? `返现¥${rec.cashbackReward}`
                            : `${rec.pointsReward}积分`}
                        </div>
                      </div>

                      <button
                        onClick={() => handleApplyRecommendation(rec)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap min-h-[36px] flex items-center justify-center active:scale-95"
                      >
                        采纳记账
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Record Confirmation Modal */}
      {recordModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                确认采纳并记录优惠使用
              </h3>
              <button
                onClick={() => setRecordModalData(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl space-y-1.5">
                <div className="font-semibold text-slate-900 dark:text-white text-sm">
                  {recordModalData.result.name}
                </div>
                <div className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span>{recordModalData.result.bank}</span>
                  <span>·</span>
                  <span>渠道: {recordModalData.result.channel}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  实付消费金额 (元)
                </label>
                <input
                  type="number"
                  step="any"
                  value={recordModalData.actualAmount}
                  onChange={e =>
                    setRecordModalData({
                      ...recordModalData,
                      actualAmount: parseFloat(e.target.value) || 0
                    })
                  }
                  className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  实际享受优惠金额 (元)
                </label>
                <input
                  type="number"
                  step="any"
                  value={recordModalData.actualSavings}
                  onChange={e =>
                    setRecordModalData({
                      ...recordModalData,
                      actualSavings: parseFloat(e.target.value) || 0
                    })
                  }
                  className="w-full px-3 py-2 text-sm font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  备注说明 (可选)
                </label>
                <input
                  type="text"
                  value={recordModalData.note}
                  onChange={e =>
                    setRecordModalData({
                      ...recordModalData,
                      note: e.target.value
                    })
                  }
                  placeholder="如：早高峰地铁出行打卡成功"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setRecordModalData(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmRecord}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-lg transition-colors"
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
