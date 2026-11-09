/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CreditCard, Sparkles, PieChart, Layers, Landmark, History, SlidersHorizontal, Download, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSyncModal: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSyncModal,
  isDarkMode,
  toggleDarkMode
}) => {
  const navItems = [
    { id: 'recommend', label: '用卡推荐', icon: Sparkles },
    { id: 'dashboard', label: '收益仪表盘', icon: PieChart },
    { id: 'combos', label: '多重与快捷达标', icon: Layers },
    { id: 'assets', label: '资产日均达标', icon: Landmark },
    { id: 'ledger', label: '优惠记录与规则', icon: History }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark (single element) */}
        <div className="flex items-center gap-2.5 shrink-0 cursor-pointer" onClick={() => setActiveTab('recommend')}>
          <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 shadow-sm">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              CardBenefit Pro
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              智能用卡决策引擎
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (concise, single line) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action & Utilities */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleDarkMode}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isDarkMode ? '切换浅色模式' : '切换深色模式'}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenSyncModal}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-xs whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">备份与同步</span>
            <span className="sm:hidden">同步</span>
          </button>
        </div>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar (Thumb Zone) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-lg pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 items-center h-14">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex flex-col items-center justify-center h-full transition-colors active:scale-95 ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
                <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};
