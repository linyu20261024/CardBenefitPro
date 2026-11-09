/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useCardBenefit } from '../context/CardBenefitContext';
import { formatCurrency } from '../utils/engine';
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
  Edit2
} from 'lucide-react';

export const LedgerFeedbackView: React.FC = () => {
  const {
    state,
    addFeedbackRecord,
    deleteFeedbackRecord,
    toggleRule,
    addRule,
    deleteRule,
    totalSaved
  } = useCardBenefit();

  const [activeSubTab, setActiveSubTab] = useState<'feedback' | 'rules'>('feedback');
  const [searchQuery, setSearchQuery] = useState('');
  const [bankFilter, setBankFilter] = useState('all');

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
    limit: 10,
    limitPeriod: 'month',
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
      when: new Date().toISOString().slice(0, 16),
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
      limit: Number(newRuleData.limit) || null,
      limitPeriod: (newRuleData.limitPeriod as any) || 'month',
      notes: newRuleData.notes || '',
      enabled: true
    });
    setIsAddRuleOpen(false);
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
      limit: 10,
      limitPeriod: 'month',
      notes: ''
    });
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
                        <div>
                          {rule.start && rule.end && rule.start !== '00:00'
                            ? `${rule.start}-${rule.end}`
                            : '全天'}
                        </div>
                        <div>
                          {rule.limit ? `${rule.limit}次/${rule.limitPeriod === 'day' ? '日' : '月'}` : '不限次'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => deleteRule(rule.id)}
                          className="text-slate-400 hover:text-rose-500 p-1"
                          title="删除规则"
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

      {/* Add Rule Modal */}
      {isAddRuleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <form
            onSubmit={handleAddRuleSubmit}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">添加新卡片优惠规则</h3>
              <button
                type="button"
                onClick={() => setIsAddRuleOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">规则名称</label>
                <input
                  type="text"
                  required
                  placeholder="如：农业银行信用卡乘车码立减1元"
                  value={newRuleData.name}
                  onChange={e => setNewRuleData({ ...newRuleData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
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
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">场景</label>
                  <select
                    value={newRuleData.scene}
                    onChange={e => setNewRuleData({ ...newRuleData, scene: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="subway">地铁出行</option>
                    <option value="bus">公交车</option>
                    <option value="shared_bike">共享单车</option>
                    <option value="dining">餐饮美食</option>
                    <option value="shopping">商超零售</option>
                    <option value="online_shop">网上购物</option>
                    <option value="any">通用消费</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">支付渠道</label>
                  <select
                    value={newRuleData.channel}
                    onChange={e => setNewRuleData({ ...newRuleData, channel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="alipay">支付宝</option>
                    <option value="wechat">微信支付</option>
                    <option value="unionpay">云闪付</option>
                    <option value="transit_code">乘车码</option>
                    <option value="bank_app">银行App</option>
                    <option value="any">不限渠道</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">优惠类型</label>
                  <select
                    value={newRuleData.type}
                    onChange={e => setNewRuleData({ ...newRuleData, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="fixed">固定立减</option>
                    <option value="rate">按比例优惠(如5折)</option>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">生效时段起止</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="time"
                      value={newRuleData.start}
                      onChange={e => setNewRuleData({ ...newRuleData, start: e.target.value })}
                      className="w-1/2 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                    />
                    <span>-</span>
                    <input
                      type="time"
                      value={newRuleData.end}
                      onChange={e => setNewRuleData({ ...newRuleData, end: e.target.value })}
                      className="w-1/2 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">限额次数 (次/月)</label>
                  <input
                    type="number"
                    value={newRuleData.limit || ''}
                    onChange={e => setNewRuleData({ ...newRuleData, limit: parseInt(e.target.value, 10) || null })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
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
    </div>
  );
};
