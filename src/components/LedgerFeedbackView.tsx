/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useCardBenefit } from '../context/CardBenefitContext';
import { formatCurrency, calculateRuleUsage, getLocalDateString, getNowLocalDateTimeString } from '../utils/engine';
import { FeedbackRecord, InstantRule } from '../types/cardBenefit';
import {
  History,
  Plus,
  Trash2,
  CheckCircle2,
  Sliders,
  Search,
  Filter,
  ToggleLeft,
  ToggleRight,
  Edit2,
  Clock,
  AlertCircle,
  Calendar
} from 'lucide-react';

export const LedgerFeedbackView: React.FC = () => {
  const {
    state,
    addFeedbackRecord,
    deleteFeedbackRecord,
    toggleRule,
    addRule,
    updateRule,
    deleteRule,
    totalSaved
  } = useCardBenefit();

  const [activeSubTab, setActiveSubTab] = useState<'feedback' | 'rules'>('feedback');
  const [searchQuery, setSearchQuery] = useState('');
  const [bankFilter, setBankFilter] = useState('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New feedback modal
  const [isAddFeedbackOpen, setIsAddFeedbackOpen] = useState(false);
  const [newFeedbackData, setNewFeedbackData] = useState({
    ruleName: '自定义优惠消费',
    bank: '交通银行',
    scene: 'subway',
    platform: 'transport',
    channel: 'alipay',
    amount: 5,
    expected: 2,
    actual: 2,
    note: ''
  });

  // Edit rule modal
  const [editingRule, setEditingRule] = useState<InstantRule | null>(null);
  const [editRuleData, setEditRuleData] = useState<InstantRule | null>(null);

  // New rule modal
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
  const [newRuleData, setNewRuleData] = useState<Partial<InstantRule>>({
    name: '',
    bank: '交通银行',
    platform: 'transport',
    scene: 'subway',
    channel: 'alipay',
    type: 'fixed',
    fixed: 1,
    rate: 0,
    cap: 0,
    min: 0,
    dateStart: '2026-11-01',
    dateEnd: '2026-12-31',
    start: '00:00',
    end: '23:59',
    dailyLimit: 1,
    weeklyLimit: null,
    monthlyLimit: 15,
    totalLimit: null,
    limit: 1,
    limitPeriod: 'day',
    usedCount: 0,
    notes: ''
  });

  const filteredFeedback = state.feedback.filter(f => {
    if (bankFilter !== 'all' && f.bank !== bankFilter) return false;
    if (searchQuery && !f.ruleName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredRules = state.rules.filter(r => {
    if (bankFilter !== 'all' && r.bank !== bankFilter) return false;
    if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleAddFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addFeedbackRecord({
      ruleId: `custom-${Date.now()}`,
      ruleName: newFeedbackData.ruleName,
      bank: newFeedbackData.bank,
      scene: newFeedbackData.scene,
      platform: newFeedbackData.platform,
      channel: newFeedbackData.channel,
      amount: newFeedbackData.amount,
      expected: newFeedbackData.expected,
      actual: newFeedbackData.actual,
      confirmed: true,
      result: 'confirmed',
      when: getNowLocalDateTimeString(),
      note: newFeedbackData.note
    });
    setIsAddFeedbackOpen(false);
  };

  const handleAddRuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleData.name) return;
    addRule({
      id: `rule-${Date.now()}`,
      name: newRuleData.name,
      bank: newRuleData.bank,
      platform: newRuleData.platform || 'any',
      scene: newRuleData.scene || 'any',
      scenes: [newRuleData.scene || 'any'],
      channel: newRuleData.channel || 'any',
      type: (newRuleData.type as any) || 'fixed',
      rate: Number(newRuleData.rate) || 0,
      cap: Number(newRuleData.cap) || 0,
      min: Number(newRuleData.min) || 0,
      fixed: Number(newRuleData.fixed) || 0,
      dateStart: newRuleData.dateStart || '',
      dateEnd: newRuleData.dateEnd || '',
      start: newRuleData.start || '00:00',
      end: newRuleData.end || '23:59',
      dailyLimit: newRuleData.dailyLimit ? Number(newRuleData.dailyLimit) : (newRuleData.limitPeriod === 'day' && newRuleData.limit ? Number(newRuleData.limit) : null),
      weeklyLimit: newRuleData.weeklyLimit ? Number(newRuleData.weeklyLimit) : (newRuleData.limitPeriod === 'week' && newRuleData.limit ? Number(newRuleData.limit) : null),
      monthlyLimit: newRuleData.monthlyLimit ? Number(newRuleData.monthlyLimit) : (newRuleData.limitPeriod === 'month' && newRuleData.limit ? Number(newRuleData.limit) : null),
      totalLimit: newRuleData.totalLimit ? Number(newRuleData.totalLimit) : (newRuleData.limitPeriod === 'total' && newRuleData.limit ? Number(newRuleData.limit) : null),
      limit: newRuleData.dailyLimit || newRuleData.monthlyLimit || newRuleData.weeklyLimit || newRuleData.limit || null,
      limitPeriod: (newRuleData.limitPeriod as any) || (newRuleData.dailyLimit ? 'day' : 'month'),
      notes: newRuleData.notes || '',
      enabled: true
    });
    setIsAddRuleOpen(false);
    setToastMsg(`新规则「${newRuleData.name}」已添加成功！`);
    setTimeout(() => setToastMsg(null), 3000);
    setNewRuleData({
      name: '',
      bank: '交通银行',
      platform: 'transport',
      scene: 'subway',
      channel: 'alipay',
      type: 'fixed',
      fixed: 1,
      rate: 0,
      cap: 0,
      min: 0,
      dateStart: '2026-11-01',
      dateEnd: '2026-12-31',
      start: '00:00',
      end: '23:59',
      dailyLimit: 1,
      weeklyLimit: null,
      monthlyLimit: 15,
      totalLimit: null,
      limit: 1,
      limitPeriod: 'day',
      usedCount: 0,
      notes: ''
    });
  };

  const handleOpenEditRule = (rule: InstantRule) => {
    setEditingRule(rule);
    setEditRuleData({
      ...rule,
      dailyLimit: rule.dailyLimit ?? (rule.limitPeriod === 'day' ? rule.limit : null),
      weeklyLimit: rule.weeklyLimit ?? (rule.limitPeriod === 'week' ? rule.limit : null),
      monthlyLimit: rule.monthlyLimit ?? (rule.limitPeriod === 'month' ? rule.limit : null),
      totalLimit: rule.totalLimit ?? (rule.limitPeriod === 'total' ? rule.limit : null),
      usedCount: rule.usedCount ?? 0,
      limitPeriod: rule.limitPeriod || 'month'
    });
  };

  const handleUpdateRuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRuleData) return;
    updateRule({
      ...editRuleData,
      rate: Number(editRuleData.rate) || 0,
      cap: Number(editRuleData.cap) || 0,
      min: Number(editRuleData.min) || 0,
      fixed: Number(editRuleData.fixed) || 0,
      dailyLimit: editRuleData.dailyLimit ? Number(editRuleData.dailyLimit) : null,
      weeklyLimit: editRuleData.weeklyLimit ? Number(editRuleData.weeklyLimit) : null,
      monthlyLimit: editRuleData.monthlyLimit ? Number(editRuleData.monthlyLimit) : null,
      totalLimit: editRuleData.totalLimit ? Number(editRuleData.totalLimit) : null,
      limit: editRuleData.dailyLimit || editRuleData.monthlyLimit || editRuleData.weeklyLimit || editRuleData.limit || null,
      usedCount: Number(editRuleData.usedCount) || 0
    });
    setToastMsg(`规则「${editRuleData.name}」已成功保存！`);
    setTimeout(() => setToastMsg(null), 3000);
    setEditingRule(null);
    setEditRuleData(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            实测收益记录与用卡规则库
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            维护每一笔卡片优惠使用明细，并可启停、添加或调整卡片优惠规则
          </p>
        </div>

        {/* Sub-nav tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('feedback')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeSubTab === 'feedback'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            实测收益流水 ({state.feedback.length})
          </button>
          <button
            onClick={() => setActiveSubTab('rules')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeSubTab === 'rules'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            用卡规则库 ({state.rules.length})
          </button>
        </div>
      </div>

      {/* Filter & Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索规则或流水名称..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <select
            value={bankFilter}
            onChange={e => setBankFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
          >
            <option value="all">全发卡机构</option>
            <option value="交通银行">交通银行</option>
            <option value="建设银行">建设银行</option>
            <option value="农业银行">农业银行</option>
            <option value="兴业银行">兴业银行</option>
            <option value="支付宝">支付宝</option>
            <option value="光大银行">光大银行</option>
            <option value="工商银行">工商银行</option>
            <option value="广发银行">广发银行</option>
          </select>
        </div>

        {activeSubTab === 'feedback' ? (
          <button
            onClick={() => setIsAddFeedbackOpen(true)}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>登记一笔实测消费</span>
          </button>
        ) : (
          <button
            onClick={() => setIsAddRuleOpen(true)}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>添加新用卡规则</span>
          </button>
        )}
      </div>

      {/* View 1: Feedback Records Ledger */}
      {activeSubTab === 'feedback' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">消费时间</th>
                  <th className="py-3 px-4 font-semibold">活动 / 规则名称</th>
                  <th className="py-3 px-4 font-semibold">银行</th>
                  <th className="py-3 px-4 font-semibold">支付渠道</th>
                  <th className="py-3 px-4 font-semibold text-right">消费金额</th>
                  <th className="py-3 px-4 font-semibold text-right">实测优惠</th>
                  <th className="py-3 px-4 font-semibold">备注 / 推进活动</th>
                  <th className="py-3 px-4 font-semibold text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {filteredFeedback.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                      暂无用卡消费实测流水记录。在「用卡推荐」点击“记录用卡实测”即可快捷入账。
                    </td>
                  </tr>
                ) : (
                  filteredFeedback.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {item.when?.replace('T', ' ') || item.feedbackAt?.slice(0, 10)}
                      </td>
                      <td className="py-3 px-4 font-sans font-medium text-slate-900 dark:text-white max-w-xs truncate">
                        {item.ruleName}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-700 dark:text-slate-300">
                        {item.bank || '合作银行'}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-500">
                        {item.channel}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-800 dark:text-slate-200">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        -{formatCurrency(item.actual || item.expected)}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-500 text-2xs max-w-xs truncate">
                        {item.note || item.contributedActivities?.join(', ') || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => deleteFeedbackRecord(item.id)}
                          className="text-slate-400 hover:text-rose-500 p-1"
                          title="删除记录"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 2: Rules Management */}
      {activeSubTab === 'rules' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold text-center w-12">状态</th>
                  <th className="py-3 px-4 font-semibold">规则名称</th>
                  <th className="py-3 px-4 font-semibold">发卡银行</th>
                  <th className="py-3 px-4 font-semibold">场景</th>
                  <th className="py-3 px-4 font-semibold">支付渠道</th>
                  <th className="py-3 px-4 font-semibold">优惠策略</th>
                  <th className="py-3 px-4 font-semibold">时段与频次</th>
                  <th className="py-3 px-4 font-semibold text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRules.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                      暂无用卡规则。您可以点击右上角「同步」导入您的 JSON 数据，或点击「+ 新增规则」添加。
                    </td>
                  </tr>
                ) : (
                  filteredRules.map(rule => (
                    <tr
                      key={rule.id}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/40 ${
                        rule.enabled === false ? 'opacity-50' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleRule(rule.id)}
                          className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
                          title={rule.enabled === false ? '启用规则' : '禁用规则'}
                        >
                          {rule.enabled !== false ? (
                            <ToggleRight className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                        <div>{rule.name}</div>
                        {rule.notes && (
                          <div className="text-3xs text-slate-400 line-clamp-1">{rule.notes}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {rule.bank || '通用'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {rule.scene}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {rule.channel}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {rule.type === 'fixed'
                          ? `立减 ¥${rule.fixed}`
                          : rule.type === 'rate'
                          ? `${rule.rate}% (封顶¥${rule.cap})`
                          : rule.type === 'cashback'
                          ? `返现 ¥${rule.fixed}`
                          : `${rule.type}`}
                      </td>
                      <td className="py-3 px-4 font-mono text-2xs text-slate-500">
                        <div className="font-semibold text-slate-700 dark:text-slate-300">
                          {rule.start && rule.end && rule.start !== '00:00' && rule.end !== '23:59'
                            ? `${rule.start}-${rule.end}`
                            : '全天生效'}
                        </div>
                        <div className="mt-1">
                          {(() => {
                            const usage = calculateRuleUsage(rule, state.feedback, getLocalDateString());
                            const limits: { text: string; sub: string; exceeded: boolean }[] = [];
                            
                            const dLimit = rule.dailyLimit ?? (rule.limitPeriod === 'day' ? rule.limit : null);
                            const wLimit = rule.weeklyLimit ?? (rule.limitPeriod === 'week' ? rule.limit : null);
                            const mLimit = rule.monthlyLimit ?? (rule.limitPeriod === 'month' ? rule.limit : null);
                            const tLimit = rule.totalLimit ?? (rule.limitPeriod === 'total' ? rule.limit : null);

                            if (dLimit && dLimit > 0) {
                              limits.push({
                                text: `${dLimit}次/日`,
                                sub: `今日余${Math.max(0, dLimit - usage.dailyUsage)}次`,
                                exceeded: usage.dailyUsage >= dLimit
                              });
                            }
                            if (wLimit && wLimit > 0) {
                              limits.push({
                                text: `${wLimit}次/周`,
                                sub: `本周余${Math.max(0, wLimit - usage.weeklyUsage)}次`,
                                exceeded: usage.weeklyUsage >= wLimit
                              });
                            }
                            if (mLimit && mLimit > 0) {
                              limits.push({
                                text: `${mLimit}次/月`,
                                sub: `本月余${Math.max(0, mLimit - usage.monthlyUsage)}次`,
                                exceeded: usage.monthlyUsage >= mLimit
                              });
                            }
                            if (tLimit && tLimit > 0) {
                              limits.push({
                                text: `${tLimit}次/总`,
                                sub: `总余${Math.max(0, tLimit - usage.totalUsage)}次`,
                                exceeded: usage.totalUsage >= tLimit
                              });
                            }

                            if (limits.length === 0) {
                              return <span className="text-slate-400">不限频次</span>;
                            }

                            return (
                              <div className="flex flex-col gap-0.5">
                                {limits.map((l, idx) => (
                                  <div key={idx} className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`font-semibold ${l.exceeded ? 'text-rose-500 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                      {l.text}
                                    </span>
                                    <span className={`text-3xs ${l.exceeded ? 'text-rose-400 font-medium' : 'text-slate-400'}`}>
                                      ({l.sub})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditRule(rule)}
                            className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="修改规则详情与限额"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`确定要删除规则「${rule.name}」吗？`)) {
                                deleteRule(rule.id);
                                setToastMsg(`规则「${rule.name}」已删除`);
                                setTimeout(() => setToastMsg(null), 3000);
                              }
                            }}
                            className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="删除规则"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Feedback Modal */}
      {isAddFeedbackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <form
            onSubmit={handleAddFeedbackSubmit}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">登记一笔实测消费与优惠</h3>
              <button
                type="button"
                onClick={() => setIsAddFeedbackOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">活动 / 规则名称</label>
                <input
                  type="text"
                  required
                  value={newFeedbackData.ruleName}
                  onChange={e => setNewFeedbackData({ ...newFeedbackData, ruleName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">发卡机构</label>
                  <input
                    type="text"
                    value={newFeedbackData.bank}
                    onChange={e => setNewFeedbackData({ ...newFeedbackData, bank: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">支付渠道</label>
                  <select
                    value={newFeedbackData.channel}
                    onChange={e => setNewFeedbackData({ ...newFeedbackData, channel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="alipay">支付宝快捷支付</option>
                    <option value="wechat">微信支付</option>
                    <option value="unionpay">云闪付</option>
                    <option value="transit_code">乘车码</option>
                    <option value="bank_app">银行App</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">消费金额 (元)</label>
                  <input
                    type="number"
                    step="any"
                    value={newFeedbackData.amount}
                    onChange={e => setNewFeedbackData({ ...newFeedbackData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">实际优惠 (元)</label>
                  <input
                    type="number"
                    step="any"
                    value={newFeedbackData.actual}
                    onChange={e => setNewFeedbackData({ ...newFeedbackData, actual: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 font-mono text-emerald-600 font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">备注说明</label>
                <input
                  type="text"
                  value={newFeedbackData.note}
                  onChange={e => setNewFeedbackData({ ...newFeedbackData, note: e.target.value })}
                  placeholder="如：早高峰乘车码自动立减"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddFeedbackOpen(false)}
                className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg"
              >
                保存记账
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Rule Modal */}
      {editingRule && editRuleData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <form
            onSubmit={handleUpdateRuleSubmit}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">修改用卡规则与限额</h3>
                  <p className="text-3xs text-slate-400">调整卡片规则、生效时段及使用频次限制</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingRule(null);
                  setEditRuleData(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Rule Name */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">规则名称</label>
                <input
                  type="text"
                  required
                  value={editRuleData.name}
                  onChange={e => setEditRuleData({ ...editRuleData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                />
              </div>

              {/* Bank, Scene, Channel */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">发卡机构 / 银行</label>
                  <input
                    type="text"
                    value={editRuleData.bank || ''}
                    onChange={e => setEditRuleData({ ...editRuleData, bank: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">消费场景</label>
                  <select
                    value={editRuleData.scene}
                    onChange={e => setEditRuleData({ ...editRuleData, scene: e.target.value, scenes: [e.target.value] })}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="subway">地铁出行</option>
                    <option value="bus">公交车</option>
                    <option value="shared_bike">共享单车</option>
                    <option value="dining">餐饮美食</option>
                    <option value="shopping">商超零售</option>
                    <option value="online_shop">网上电商</option>
                    <option value="entertainment">休闲娱乐</option>
                    <option value="bills">生活缴费</option>
                    <option value="any">通用消费</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">支付渠道</label>
                  <select
                    value={editRuleData.channel}
                    onChange={e => setEditRuleData({ ...editRuleData, channel: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="alipay">支付宝快捷支付</option>
                    <option value="wechat">微信支付</option>
                    <option value="unionpay">云闪付/银联</option>
                    <option value="transit_code">乘车码</option>
                    <option value="mobile_pay">手机Pay/Apple Pay</option>
                    <option value="bank_app">银行App</option>
                    <option value="digital_cny">数字人民币</option>
                    <option value="any">不限渠道</option>
                  </select>
                </div>
              </div>

              {/* Benefit Type & Amounts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">优惠类型</label>
                  <select
                    value={editRuleData.type}
                    onChange={e => setEditRuleData({ ...editRuleData, type: e.target.value as any })}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="fixed">固定立减 (元)</option>
                    <option value="rate">折扣比例 (%)</option>
                    <option value="threshold">门槛立减 (元)</option>
                    <option value="cashback">达标返现 (元)</option>
                    <option value="points">赠送积分 (点)</option>
                    <option value="lottery">抽奖机会</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    {editRuleData.type === 'rate' ? '折扣比例 (%)' : '优惠金额 (元)'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editRuleData.type === 'rate' ? editRuleData.rate : editRuleData.fixed}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      if (editRuleData.type === 'rate') {
                        setEditRuleData({ ...editRuleData, rate: val });
                      } else {
                        setEditRuleData({ ...editRuleData, fixed: val });
                      }
                    }}
                    className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">满减门槛 (元)</label>
                  <input
                    type="number"
                    step="any"
                    value={editRuleData.min}
                    onChange={e => setEditRuleData({ ...editRuleData, min: parseFloat(e.target.value) || 0 })}
                    placeholder="0为无门槛"
                    className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Time Window Section */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>生效时段限制 (HH:mm)</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditRuleData({ ...editRuleData, start: '00:00', end: '23:59' })}
                      className="px-2 py-0.5 text-3xs font-medium rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      全天生效
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditRuleData({ ...editRuleData, start: '06:30', end: '10:00' })}
                      className="px-2 py-0.5 text-3xs font-medium rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      早高峰
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditRuleData({ ...editRuleData, start: '06:45', end: '10:15' })}
                      className="px-2 py-0.5 text-3xs font-medium rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      通勤时段
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={editRuleData.start || '00:00'}
                    onChange={e => setEditRuleData({ ...editRuleData, start: e.target.value })}
                    className="w-1/2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                  <span className="text-slate-400">至</span>
                  <input
                    type="time"
                    value={editRuleData.end || '23:59'}
                    onChange={e => setEditRuleData({ ...editRuleData, end: e.target.value })}
                    className="w-1/2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Parallel Usage Limit Section: 1次/日 与 15次/月 并行限制 */}
              <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl space-y-2.5 border border-amber-200/70 dark:border-amber-900/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>频次与限额并行控制</span>
                  </label>
                  <span className="text-3xs text-amber-700 dark:text-amber-400 font-medium">
                    支持「1次/日」与「15次/月」同时并行生效
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1">
                  <div className="text-3xs text-slate-500 font-medium">快捷预设模板：</div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { label: '1次/日 · 15次/月 (通勤推荐)', d: 1, w: null, m: 15, t: null },
                      { label: '1次/日 · 5次/月', d: 1, w: null, m: 5, t: null },
                      { label: '1次/日 · 30次/月', d: 1, w: null, m: 30, t: null },
                      { label: '1次/周 · 4次/月', d: null, w: 1, m: 4, t: null },
                      { label: '1次/日', d: 1, w: null, m: null, t: null },
                      { label: '1次/周', d: null, w: 1, m: null, t: null },
                      { label: '5次/月', d: null, w: null, m: 5, t: null },
                      { label: '1次/月', d: null, w: null, m: 1, t: null },
                      { label: '不限频次', d: null, w: null, m: null, t: null }
                    ].map(preset => {
                      const isActive =
                        editRuleData.dailyLimit === preset.d &&
                        editRuleData.weeklyLimit === preset.w &&
                        editRuleData.monthlyLimit === preset.m &&
                        editRuleData.totalLimit === preset.t;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setEditRuleData({
                            ...editRuleData,
                            dailyLimit: preset.d,
                            weeklyLimit: preset.w,
                            monthlyLimit: preset.m,
                            totalLimit: preset.t,
                            limit: preset.d || preset.m || preset.w || preset.t || null,
                            limitPeriod: preset.d ? 'day' : preset.w ? 'week' : preset.m ? 'month' : 'total'
                          })}
                          className={`px-2.5 py-1 text-2xs rounded-lg font-medium transition-colors ${
                            isActive
                              ? 'bg-amber-500 text-slate-950 font-bold shadow-2xs'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Parallel Limit Inputs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div>
                    <label className="block text-2xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      日限额 (次/日)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editRuleData.dailyLimit ?? ''}
                      onChange={e => {
                        const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                        setEditRuleData({ ...editRuleData, dailyLimit: val });
                      }}
                      placeholder="留空为不限"
                      className="w-full px-2.5 py-1.5 font-mono text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      周限额 (次/周)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editRuleData.weeklyLimit ?? ''}
                      onChange={e => {
                        const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                        setEditRuleData({ ...editRuleData, weeklyLimit: val });
                      }}
                      placeholder="留空为不限"
                      className="w-full px-2.5 py-1.5 font-mono text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      月限额 (次/月)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editRuleData.monthlyLimit ?? ''}
                      onChange={e => {
                        const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                        setEditRuleData({ ...editRuleData, monthlyLimit: val });
                      }}
                      placeholder="留空为不限"
                      className="w-full px-2.5 py-1.5 font-mono text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      活动总限额 (次)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editRuleData.totalLimit ?? ''}
                      onChange={e => {
                        const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                        setEditRuleData({ ...editRuleData, totalLimit: val });
                      }}
                      placeholder="留空为不限"
                      className="w-full px-2.5 py-1.5 font-mono text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Live ledger stats display */}
                {(() => {
                  const usage = calculateRuleUsage(editRuleData, state.feedback, getLocalDateString());
                  return (
                    <div className="p-2 rounded-lg bg-amber-100/50 dark:bg-amber-950/40 text-3xs text-amber-900 dark:text-amber-200 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-semibold">实时流水核算：</span>
                      <span>今日已用 <strong className="font-mono">{usage.dailyUsage}</strong> 次</span>
                      <span>本周已用 <strong className="font-mono">{usage.weeklyUsage}</strong> 次</span>
                      <span>本月已用 <strong className="font-mono">{usage.monthlyUsage}</strong> 次</span>
                      <span>总计已用 <strong className="font-mono">{usage.totalUsage}</strong> 次</span>
                      <span className="text-slate-400">（按本地自然日/月动态核算，次日 00:00 自动重置今日额度）</span>
                    </div>
                  );
                })()}
              </div>

              {/* Date Validity */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">开始日期</label>
                  <input
                    type="date"
                    value={editRuleData.dateStart || ''}
                    onChange={e => setEditRuleData({ ...editRuleData, dateStart: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">截止日期</label>
                  <input
                    type="date"
                    value={editRuleData.dateEnd || ''}
                    onChange={e => setEditRuleData({ ...editRuleData, dateEnd: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Rule Notes */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">规则备注与领券指引</label>
                <textarea
                  rows={2}
                  value={editRuleData.notes || ''}
                  onChange={e => setEditRuleData({ ...editRuleData, notes: e.target.value })}
                  placeholder="如：支付宝出行频道先领券后乘车；每月1日更新额度"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`确定要删除规则「${editRuleData.name}」吗？`)) {
                    deleteRule(editRuleData.id);
                    setEditingRule(null);
                    setEditRuleData(null);
                    setToastMsg(`规则已删除`);
                    setTimeout(() => setToastMsg(null), 3000);
                  }
                }}
                className="px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 font-medium"
              >
                删除此规则
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingRule(null);
                    setEditRuleData(null);
                  }}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  保存修改
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Add Rule Modal */}
      {isAddRuleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <form
            onSubmit={handleAddRuleSubmit}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">添加新卡片优惠规则</h3>
              <button
                type="button"
                onClick={() => setIsAddRuleOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">规则名称</label>
                <input
                  type="text"
                  required
                  placeholder="如：农业银行信用卡乘车码立减1元"
                  value={newRuleData.name}
                  onChange={e => setNewRuleData({ ...newRuleData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">发卡机构</label>
                  <input
                    type="text"
                    value={newRuleData.bank}
                    onChange={e => setNewRuleData({ ...newRuleData, bank: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">消费场景</label>
                  <select
                    value={newRuleData.scene}
                    onChange={e => setNewRuleData({ ...newRuleData, scene: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="subway">地铁出行</option>
                    <option value="bus">公交车</option>
                    <option value="shared_bike">共享单车</option>
                    <option value="dining">餐饮美食</option>
                    <option value="shopping">商超零售</option>
                    <option value="online_shop">网上电商</option>
                    <option value="entertainment">休闲娱乐</option>
                    <option value="bills">生活缴费</option>
                    <option value="any">通用消费</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">支付渠道</label>
                  <select
                    value={newRuleData.channel}
                    onChange={e => setNewRuleData({ ...newRuleData, channel: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="alipay">支付宝</option>
                    <option value="wechat">微信支付</option>
                    <option value="unionpay">云闪付</option>
                    <option value="transit_code">乘车码</option>
                    <option value="mobile_pay">手机Pay</option>
                    <option value="bank_app">银行App</option>
                    <option value="any">不限渠道</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">优惠类型</label>
                  <select
                    value={newRuleData.type}
                    onChange={e => setNewRuleData({ ...newRuleData, type: e.target.value as any })}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="fixed">固定立减 (元)</option>
                    <option value="rate">折扣比例 (%)</option>
                    <option value="threshold">门槛满减</option>
                    <option value="cashback">达标返现</option>
                    <option value="points">多倍积分</option>
                    <option value="lottery">达标抽奖</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">优惠数值/立减额</label>
                  <input
                    type="number"
                    step="any"
                    value={newRuleData.fixed}
                    onChange={e => setNewRuleData({ ...newRuleData, fixed: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">门槛金额 (元)</label>
                  <input
                    type="number"
                    step="any"
                    value={newRuleData.min}
                    onChange={e => setNewRuleData({ ...newRuleData, min: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Time Window */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>生效时段起止</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setNewRuleData({ ...newRuleData, start: '00:00', end: '23:59' })}
                      className="px-2 py-0.5 text-3xs font-medium rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-300"
                    >
                      全天
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewRuleData({ ...newRuleData, start: '06:30', end: '10:00' })}
                      className="px-2 py-0.5 text-3xs font-medium rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-300"
                    >
                      早高峰
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={newRuleData.start}
                    onChange={e => setNewRuleData({ ...newRuleData, start: e.target.value })}
                    className="w-1/2 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                  <span>-</span>
                  <input
                    type="time"
                    value={newRuleData.end}
                    onChange={e => setNewRuleData({ ...newRuleData, end: e.target.value })}
                    className="w-1/2 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Parallel Usage Limit Section: 1次/日 与 15次/月 并行限制 */}
              <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl space-y-2.5 border border-amber-200/70 dark:border-amber-900/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>频次与限额并行控制</span>
                  </label>
                  <span className="text-3xs text-amber-700 dark:text-amber-400 font-medium">
                    支持「1次/日」与「15次/月」同时并行生效
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1">
                  <div className="text-3xs text-slate-500 font-medium">快捷预设模板：</div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { label: '1次/日 · 15次/月 (通勤推荐)', d: 1, w: null, m: 15, t: null },
                      { label: '1次/日 · 5次/月', d: 1, w: null, m: 5, t: null },
                      { label: '1次/日 · 30次/月', d: 1, w: null, m: 30, t: null },
                      { label: '1次/周 · 4次/月', d: null, w: 1, m: 4, t: null },
                      { label: '1次/日', d: 1, w: null, m: null, t: null },
                      { label: '1次/周', d: null, w: 1, m: null, t: null },
                      { label: '5次/月', d: null, w: null, m: 5, t: null },
                      { label: '1次/月', d: null, w: null, m: 1, t: null },
                      { label: '不限频次', d: null, w: null, m: null, t: null }
                    ].map(preset => {
                      const isActive =
                        newRuleData.dailyLimit === preset.d &&
                        newRuleData.weeklyLimit === preset.w &&
                        newRuleData.monthlyLimit === preset.m &&
                        newRuleData.totalLimit === preset.t;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setNewRuleData({
                            ...newRuleData,
                            dailyLimit: preset.d,
                            weeklyLimit: preset.w,
                            monthlyLimit: preset.m,
                            totalLimit: preset.t,
                            limit: preset.d || preset.m || preset.w || preset.t || null,
                            limitPeriod: preset.d ? 'day' : preset.w ? 'week' : preset.m ? 'month' : 'total'
                          })}
                          className={`px-2.5 py-1 text-2xs rounded-lg font-medium transition-colors ${
                            isActive
                              ? 'bg-amber-500 text-slate-950 font-bold shadow-2xs'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Parallel Limit Inputs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div>
                    <label className="block text-2xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      日限额 (次/日)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newRuleData.dailyLimit ?? ''}
                      onChange={e => {
                        const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                        setNewRuleData({ ...newRuleData, dailyLimit: val });
                      }}
                      placeholder="留空为不限"
                      className="w-full px-2.5 py-1.5 font-mono text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      周限额 (次/周)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newRuleData.weeklyLimit ?? ''}
                      onChange={e => {
                        const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                        setNewRuleData({ ...newRuleData, weeklyLimit: val });
                      }}
                      placeholder="留空为不限"
                      className="w-full px-2.5 py-1.5 font-mono text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      月限额 (次/月)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newRuleData.monthlyLimit ?? ''}
                      onChange={e => {
                        const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                        setNewRuleData({ ...newRuleData, monthlyLimit: val });
                      }}
                      placeholder="留空为不限"
                      className="w-full px-2.5 py-1.5 font-mono text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      活动总限额 (次)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newRuleData.totalLimit ?? ''}
                      onChange={e => {
                        const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                        setNewRuleData({ ...newRuleData, totalLimit: val });
                      }}
                      placeholder="留空为不限"
                      className="w-full px-2.5 py-1.5 font-mono text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Date Validity */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span>活动有效起止日期</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const today = getLocalDateString();
                        const month = today.slice(0, 7);
                        setNewRuleData({
                          ...newRuleData,
                          dateStart: `${month}-01`,
                          dateEnd: `${month}-30`
                        });
                      }}
                      className="px-2 py-0.5 text-3xs font-medium rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      当月有效
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const today = getLocalDateString();
                        const year = today.slice(0, 4);
                        setNewRuleData({
                          ...newRuleData,
                          dateStart: today,
                          dateEnd: `${year}-12-31`
                        });
                      }}
                      className="px-2 py-0.5 text-3xs font-medium rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      至年底
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const today = getLocalDateString();
                        setNewRuleData({
                          ...newRuleData,
                          dateStart: today,
                          dateEnd: '2027-12-31'
                        });
                      }}
                      className="px-2 py-0.5 text-3xs font-medium rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      长期有效
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-2xs text-slate-600 dark:text-slate-400 mb-1">开始日期</label>
                    <input
                      type="date"
                      value={newRuleData.dateStart || ''}
                      onChange={e => setNewRuleData({ ...newRuleData, dateStart: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs text-slate-600 dark:text-slate-400 mb-1">截止日期</label>
                    <input
                      type="date"
                      value={newRuleData.dateEnd || ''}
                      onChange={e => setNewRuleData({ ...newRuleData, dateEnd: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">规则备注与领券指引</label>
                <textarea
                  rows={2}
                  value={newRuleData.notes}
                  onChange={e => setNewRuleData({ ...newRuleData, notes: e.target.value })}
                  placeholder="如：云闪付玩赚中心领券，乘车码使用"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddRuleOpen(false)}
                className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg"
              >
                添加至规则库
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <span>✓ {toastMsg}</span>
        </div>
      )}
    </div>
  );
};
