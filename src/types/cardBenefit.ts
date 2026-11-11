/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PaymentChannel = 
  | 'alipay'         // 支付宝 / 快捷支付
  | 'wechat'         // 微信支付
  | 'unionpay'       // 云闪付 / 银联
  | 'mobile_pay'     // 手机Pay (Apple Pay / Huawei Pay / 手机闪付)
  | 'transit_code'   // 乘车码 (交通二维码)
  | 'bank_app'       // 银行专属App (买单吧 / 兴业生活 / 阳光惠生活 / 建行生活等)
  | 'digital_cny'    // 数字人民币
  | 'any';           // 不限 / 通用

export type SpendScene = 
  | 'subway'         // 地铁
  | 'bus'            // 公交
  | 'shared_bike'    // 共享单车
  | 'dining'         // 餐饮美食
  | 'shopping'       // 商超零售
  | 'online_shop'    // 网上购物 / 电商
  | 'entertainment'  // 休闲娱乐 / 电影
  | 'bills'          // 水电缴费 / 充值
  | 'other'          // 其他
  | 'any';           // 不限 / 通用

export type ActivityPlatform = 
  | 'transport'      // 交通出行
  | 'alipay'         // 支付宝
  | 'wechat'         // 微信
  | 'unionpay'       // 云闪付
  | 'bank_app'       // 银行App
  | 'other'          // 其他渠道
  | 'any';           // 不限

export type BenefitType = 
  | 'fixed'          // 固定立减 (如满2减0.99, 立减1.6)
  | 'rate'           // 按比例优惠 (如5折封顶2元)
  | 'threshold'      // 满额减免 (如满100减30)
  | 'cashback'       // 达标返现 / 刷卡金 (如满18返0.18, 满5000返15)
  | 'points'         // 达标多倍积分 (如微信支付满1000享3倍积分)
  | 'lottery'        // 达标抽奖 (如满5000抽奖1次, 8000再抽1次)
  | 'combo_daily'    // 组合-日达标送积分 (如每日满16送100分)
  | 'combo_weekly'   // 组合-周达标送积分 (如每周累计满200送1000分)
  | 'combo_streak'   // 组合-连续周达标 (如月内连续4周达标送积分)
  | 'asset_tier'     // 资产日均达标 (如月日均5w送40, 10w更高)
  | 'alipay_quickpay'; // 支付宝快捷支付满额达标

export interface InstantRule {
  id: string;
  name: string;
  bank?: string;
  platform: string;
  scene: string;
  scenes?: string[];
  channel: string;
  type: 'fixed' | 'rate' | 'cashback' | 'points' | 'lottery' | 'threshold' | 'alipay_quickpay';
  rate: number;         // 优惠百分比 (如 50 代表 5折, 1 代表 1%返现)
  cap: number;          // 优惠封顶 (元)
  min: number;          // 门槛金额 (元)
  fixed: number;        // 固定优惠金额 (元)
  dateStart: string;    // YYYY-MM-DD
  dateEnd: string;      // YYYY-MM-DD
  start: string;        // HH:mm
  end: string;          // HH:mm
  limit: number | null; // 兼容单项限制次数
  limitPeriod?: 'day' | 'week' | 'month' | 'total';
  dailyLimit?: number | null;   // 日限额 (如 1次/日)
  weeklyLimit?: number | null;  // 周限额 (如 1次/周)
  monthlyLimit?: number | null; // 月限额 (如 15次/月)
  totalLimit?: number | null;   // 活动期内总计限制
  usedCount?: number;   // 历史已使用次数
  notes: string;
  enabled?: boolean;
}

export interface ActivityTier {
  id: string;
  target: number;             // 门槛金额
  rewardName: string;         // 奖励名称
  estimatedReward: number;    // 预估现金价值 (元)
  actualReward: number;       // 实际收益 (元)
  rewardStatus: 'unconfirmed' | 'confirmed' | 'claimed';
  receivedDate: string;
  rewardType: 'cashback' | 'points' | 'lottery' | 'voucher' | 'other';
  points: number;
}

export interface MilestoneActivity {
  id: string;
  name: string;
  bank?: string;
  platform: string;
  channel: string;
  scene: string;
  start: string;
  end: string;
  period: 'day' | 'week' | 'month' | 'period';
  rewardMode: 'highest' | 'cumulative';
  tiers: ActivityTier[];
  notes: string;
  category?: 'quickpay' | 'asset' | 'spend' | 'general';
  currentSpend?: number;      // 当前已统计消费 (元)
}

export interface ComboRule {
  id: string;
  type: 'daily' | 'weekly' | 'streak' | 'date' | 'ranking' | 'single';
  name: string;
  period: 'day' | 'week' | 'month' | 'transaction';
  amount: number;             // 消费金额要求
  count: number;              // 笔数要求
  logic?: 'all' | 'any';
  rewardType: 'points' | 'cash' | 'lottery' | 'none' | 'other';
  reward: number;             // 奖励数额 (如100积分, 10元)
  cap: number;                // 上限
  dateSpec: string;           // 如 "周六；每月6日，16日，26日"
  streak: number;             // 连续周期数 (如4周)
  rankMetric?: string;
  rankFrom?: number;
  rankTo?: string | number;
  actualRank?: string | number;
  notes: string;
  completed?: boolean;
  currentProgress?: number;
}

export interface RewardComboActivity {
  id: string;
  name: string;
  bank?: string;
  platform: string;
  scene: string;
  channels: string[];
  start: string;
  end: string;
  notes: string;
  rules: ComboRule[];
}

export interface BankAssetTier {
  threshold: number;         // 资产门槛 (如 10000, 50000, 100000, 200000, 500000)
  rewardType: 'cash' | 'points' | 'other';
  reward: number;            // 现金价值或积分数
  label: string;             // 标签说明 (如 "40微信立减金", "16000积分")
  achieved?: boolean;
}

export interface BankAssetActivity {
  id: string;
  bank: string;
  month: string;             // YYYY-MM
  start: string;
  end: string;
  baseline: number;          // 基准资产 (元)
  scope: string;             // 统计范围 (存款 / 投资理财 / 基金 / 数币)
  notes: string;
  tiers: BankAssetTier[];
}

export interface BankAssetEntry {
  id: string;
  activityId: string;
  date: string;              // YYYY-MM-DD
  amount: number;            // 当日资产余额 (元)
  notes?: string;
}

export interface FeedbackRecord {
  id: string;
  ruleId: string;
  ruleName: string;
  bank?: string;
  scene: string;
  platform: string;
  channel: string;
  amount: number;
  expected: number;
  actual: number;
  confirmed: boolean;
  result: 'confirmed' | 'discrepancy' | 'failed';
  when: string;              // 消费时间 YYYY-MM-DDTHH:mm
  feedbackAt: string;        // 记录时间 ISO
  note: string;
  contributedActivities?: string[]; // 推进的活动名称或ID
  editedAt?: string;
}

export interface RecommendationResult {
  id: string;
  name: string;
  bank: string;
  channel: string;
  scene: string;
  platform: string;
  type: string;
  instantSavings: number;        // 即时保底减免 (元)
  cashbackReward: number;        // 达标返现 (元)
  pointsReward: number;          // 积分奖励 (点)
  pointsValue: number;           // 积分估值 (元)
  lotteryChances: number;        // 抽奖次数
  lotteryEstimatedValue: number; // 抽奖预估价值 (元)
  totalEffectiveBenefit: number; // 综合收益 (元)
  effectiveDiscountRate: number; // 综合优惠率 %
  isBestOverall: boolean;        // 综合最优
  isBestInstant: boolean;        // 即时立减最高
  triggersCombo: boolean;        // 触发多重组合达标
  triggeredComboDetails: string[];
  qualifications: string[];      // 资格与注意事项 (如 限时段, 领券, 次数限制)
  notes?: string;                // 规则或活动补充说明
  ruleRef: InstantRule | MilestoneActivity | RewardComboActivity;
  isEligible: boolean;           // 是否符合当前生效条件 (时间、门槛、限额等)
  ineligibleReason?: string;     // 不符合的原因 (如: 不在生效时段内：限 06:45-10:15)
}

export interface AppState {
  version: number;
  rules: InstantRule[];
  activities: MilestoneActivity[];
  rewardActivities: RewardComboActivity[];
  bankAssetActivities: BankAssetActivity[];
  bankAssetEntries: BankAssetEntry[];
  spendEntries: any[];
  feedback: FeedbackRecord[];
  rankActivities: any[];
  customPlatforms: Array<{ value: string; label: string }>;
  customScenes: Array<{ value: string; label: string }>;
  customChannels: Array<{ value: string; label: string }>;
  lastUpdated: string;
}
