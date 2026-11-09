/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CardBenefitProvider } from './context/CardBenefitContext';
import { Header } from './components/Header';
import { RecommendationView } from './components/RecommendationView';
import { DashboardView } from './components/DashboardView';
import { ComboActivitiesView } from './components/ComboActivitiesView';
import { AssetMilestonesView } from './components/AssetMilestonesView';
import { LedgerFeedbackView } from './components/LedgerFeedbackView';
import { DataSyncModal } from './components/DataSyncModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('recommend');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return (
      localStorage.getItem('theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  return (
    <CardBenefitProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
        {/* Navigation Bar compliant with Top Bar Contract */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenSyncModal={() => setIsSyncModalOpen(true)}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-8 pb-24 md:pb-8">
          {activeTab === 'recommend' && <RecommendationView onOpenSyncModal={() => setIsSyncModalOpen(true)} />}
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'combos' && <ComboActivitiesView />}
          {activeTab === 'assets' && <AssetMilestonesView />}
          {activeTab === 'ledger' && <LedgerFeedbackView />}
        </main>

        {/* Data Sync & Backup Modal */}
        <DataSyncModal
          isOpen={isSyncModalOpen}
          onClose={() => setIsSyncModalOpen(false)}
        />

        {/* Desktop Footer (hidden on mobile to preserve screen real estate) */}
        <footer className="hidden md:block border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 py-6 text-xs text-slate-500 dark:text-slate-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 dark:text-slate-200">CardBenefit Pro</span>
              <span aria-hidden="true">·</span>
              <span>多维用卡推荐与收益核算系统</span>
              <span aria-hidden="true">·</span>
              <span>数据本地加密持久化</span>
            </div>

            <div className="flex items-center gap-4 text-2xs text-slate-400">
              <span>支持支付宝快捷支付 · 银行月日均资产提升 · 多重连击</span>
            </div>
          </div>
        </footer>
      </div>
    </CardBenefitProvider>
  );
}
