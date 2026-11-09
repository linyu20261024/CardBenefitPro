/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useCardBenefit } from '../context/CardBenefitContext';
import { Download, Upload, RefreshCw, Copy, Check, AlertCircle } from 'lucide-react';

interface DataSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataSyncModal: React.FC<DataSyncModalProps> = ({ isOpen, onClose }) => {
  const { exportJsonData, importJsonData, resetToDefaultData, clearAllData, state } = useCardBenefit();

  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'reset'>(() => {
    return state.rules.length === 0 ? 'import' : 'export';
  });
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  // Sync default tab if state changed
  React.useEffect(() => {
    if (state.rules.length === 0) {
      setActiveTab('import');
    }
  }, [state.rules.length]);

  if (!isOpen) return null;

  const exportedJson = exportJsonData();

  const handleCopy = () => {
    navigator.clipboard.writeText(exportedJson);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([exportedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `card-recommender-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = () => {
    if (!importText.trim()) {
      setImportStatus({ success: false, message: '请粘贴有效的卡片JSON内容' });
      return;
    }
    const result = importJsonData(importText);
    setImportStatus(result);
    if (result.success) {
      setTimeout(() => {
        onClose();
        setImportStatus(null);
        setImportText('');
      }, 1500);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      setImportText(content);
    };
    reader.readAsText(file);
  };

  const handleResetConfirm = () => {
    if (window.confirm('确认恢复初始推荐数据吗？您已添加的自定义记录将被重置为基准数据。')) {
      resetToDefaultData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              用卡数据备份、导入与同步中心
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              100% 格式无损兼容原有 card-recommender-backup.json 结构
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm font-semibold">
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'export'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出 JSON 备份</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'import'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>导入 JSON 数据</span>
          </button>
          <button
            onClick={() => setActiveTab('reset')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'reset'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>恢复默认数据</span>
          </button>
        </div>

        {/* Tab 1: Export */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
              <span>
                当前包含: {state.rules.length} 条规则 · {state.activities.length} 个达标活动 · {state.feedback.length} 条实测流水
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1 text-2xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
                >
                  {hasCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{hasCopied ? '已复制' : '复制文本'}</span>
                </button>
                <button
                  onClick={handleDownloadFile}
                  className="flex items-center gap-1 px-3 py-1 text-2xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-md hover:bg-slate-800 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>下载 .json 文件</span>
                </button>
              </div>
            </div>

            <textarea
              readOnly
              value={exportedJson}
              rows={12}
              className="w-full p-3 font-mono text-2xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-300 resize-none"
            />
          </div>
        )}

        {/* Tab 2: Import */}
        {activeTab === 'import' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <span>可粘贴 JSON 代码或直接选择备份文件：</span>
              <label className="cursor-pointer px-2.5 py-1 text-2xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors">
                <span>浏览本地文件</span>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="在此粘贴包含 rules / activities / bankAssetActivities 的 JSON 代码..."
              rows={10}
              className="w-full p-3 font-mono text-2xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 resize-none"
            />

            {importStatus && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  importStatus.success
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}
              >
                {importStatus.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{importStatus.message}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleImportSubmit}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
              >
                开始解析并导入
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Reset / Clear */}
        {activeTab === 'reset' && (
          <div className="space-y-6 py-2">
            {/* Option A: Restore default curated data */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  恢复系统预设数据（包含 26+ 条规则与活动）
                </h4>
                <p className="text-2xs text-slate-500 dark:text-slate-400">
                  载入建行时光好礼多重连击、交行最红抽奖、建行/工行资产日均达标及支付宝快捷支付活动。
                </p>
              </div>
              <button
                onClick={handleResetConfirm}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shrink-0"
              >
                恢复预设数据
              </button>
            </div>

            {/* Option B: Clear all data (blank slate) */}
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-950 bg-rose-50/50 dark:bg-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-rose-900 dark:text-rose-300">
                  清空所有数据（纯净空白卡包）
                </h4>
                <p className="text-2xs text-rose-700/80 dark:text-rose-400">
                  清空现有全部用卡规则、达标活动与流水账本，从零开始建立专属于您的用卡规则库。
                </p>
              </div>
              <button
                onClick={() => {
                  if (window.confirm('确认清空所有规则与流水数据吗？清空后将从零开始。')) {
                    clearAllData();
                    onClose();
                  }
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors shrink-0"
              >
                清空为纯净卡包
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
