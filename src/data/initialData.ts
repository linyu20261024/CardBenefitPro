/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AppState,
  InstantRule,
  MilestoneActivity,
  RewardComboActivity,
  BankAssetActivity,
  BankAssetEntry,
  FeedbackRecord
} from '../types/cardBenefit';

export function inferBankName(title: string): string {
  if (!title) return '通用/合作银行';
  if (title.includes('交通') || title.includes('交行') || title.includes('买单吧')) return '交通银行';
  if (title.includes('农业') || title.includes('农行')) return '农业银行';
  if (title.includes('建设') || title.includes('建行') || title.includes('龙卡')) return '建设银行';
  if (title.includes('兴业') || title.includes('好兴动')) return '兴业银行';
  if (title.includes('光大') || title.includes('阳光惠生活')) return '光大银行';
  if (title.includes('工商') || title.includes('工行') || title.includes('工银')) return '工商银行';
  if (title.includes('广发') || title.includes('发现精彩')) return '广发银行';
  if (title.includes('华夏') || title.includes('华彩生活')) return '华夏银行';
  if (title.includes('邮储') || title.includes('邮政')) return '邮储银行';
  if (title.includes('平安') || title.includes('口袋银行')) return '平安银行';
  if (title.includes('上海') || title.includes('上行')) return '上海银行';
  if (title.includes('招商') || title.includes('招行') || title.includes('掌上生活')) return '招商银行';
  if (title.includes('中信') || title.includes('动卡空间')) return '中信银行';
  if (title.includes('中国银行') || title.includes('中行') || title.includes('缤纷生活')) return '中国银行';
  if (title.includes('浦发') || title.includes('浦东发展')) return '浦发银行';
  if (title.includes('民生')) return '民生银行';
  if (title.includes('北京银行')) return '北京银行';
  if (title.includes('江苏银行')) return '江苏银行';
  if (title.includes('宁波银行')) return '宁波银行';
  if (title.includes('浙商银行')) return '浙商银行';
  if (title.includes('支付宝') || title.includes('超级出行卡')) return '支付宝';
  if (title.includes('微信') || title.includes('财付通')) return '微信支付';
  if (title.includes('云闪付') || title.includes('银联')) return '银联云闪付';
  return '合作银行';
}

// Clean initial empty state: Source code contains zero hardcoded private rule/activity data.
// All user rules and activities are saved strictly in local storage and populated via user import.
export const INITIAL_RULES: InstantRule[] = [];
export const INITIAL_ACTIVITIES: MilestoneActivity[] = [];
export const INITIAL_REWARD_ACTIVITIES: RewardComboActivity[] = [];
export const INITIAL_BANK_ASSET_ACTIVITIES: BankAssetActivity[] = [];
export const INITIAL_BANK_ASSET_ENTRIES: BankAssetEntry[] = [];
export const INITIAL_FEEDBACK: FeedbackRecord[] = [];

export function getDefaultAppState(): AppState {
  return {
    version: 6,
    rules: INITIAL_RULES,
    activities: INITIAL_ACTIVITIES,
    rewardActivities: INITIAL_REWARD_ACTIVITIES,
    bankAssetActivities: INITIAL_BANK_ASSET_ACTIVITIES,
    bankAssetEntries: INITIAL_BANK_ASSET_ENTRIES,
    spendEntries: [],
    feedback: INITIAL_FEEDBACK,
    rankActivities: [],
    customPlatforms: [
      { value: "transport", label: "交通出行" },
      { value: "alipay", label: "支付宝" },
      { value: "wechat", label: "微信支付" },
      { value: "unionpay", label: "云闪付/玩赚中心" },
      { value: "bank_app", label: "银行专属App" },
      { value: "custom-platform-mw0cf9o5", label: "兴业生活" },
      { value: "custom-platform-mw0cqtgd", label: "阳光惠生活" }
    ],
    customScenes: [
      { value: "subway", label: "地铁出行" },
      { value: "bus", label: "公交车" },
      { value: "shared_bike", label: "共享单车" },
      { value: "dining", label: "餐饮美食" },
      { value: "shopping", label: "商超零售" },
      { value: "online_shop", label: "网上购物" },
      { value: "entertainment", label: "休闲娱乐" },
      { value: "bills", label: "水电缴费" },
      { value: "any", label: "通用消费" }
    ],
    customChannels: [
      { value: "alipay", label: "支付宝快捷支付" },
      { value: "wechat", label: "微信支付" },
      { value: "unionpay", label: "银联云闪付" },
      { value: "mobile_pay", label: "手机Pay/Apple Pay" },
      { value: "transit_code", label: "乘车码" },
      { value: "bank_app", label: "银行App支付" },
      { value: "digital_cny", label: "数字人民币" },
      { value: "any", label: "不限渠道" }
    ],
    lastUpdated: new Date().toISOString()
  };
}

export function getEmptyAppState(): AppState {
  return {
    version: 6,
    rules: [],
    activities: [],
    rewardActivities: [],
    bankAssetActivities: [],
    bankAssetEntries: [],
    spendEntries: [],
    feedback: [],
    rankActivities: [],
    customPlatforms: [],
    customScenes: [],
    customChannels: [],
    lastUpdated: new Date().toISOString()
  };
}
