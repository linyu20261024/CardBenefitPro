# CardBenefit Pro - 智能用卡推荐与多维达标收益仪表盘

专业信用卡与支付优惠推荐系统，支持消费场景、支付渠道、活动平台多维筛选，涵盖即时立减、按比例优惠、达标返现、多重组合连击、资产日均达标与支付宝快捷支付满额追踪，提供最优用卡策略与收益可视化仪表盘。

---

## 📱 移动端优化特性（手机高密度快速查询）

手机是日常消费（地铁闸机、便利店收银台、线上结账）最重要的查询工具，本项目针对移动端进行了深度人机工效设计：

1. **高密度信息布局（尽量多显示内容）**：
   - **紧凑型金额与横滑标签**：常用金额（¥2、¥5、¥18、¥5000）与场景横向轻滑快速切换，不占用宝贵垂直屏幕空间。
   - **首屏聚光灯推荐卡片**：直接呈现「即时立减额」、「抵扣后实付」及「综合年化回报率」，无需向下滚动即可决策。
   - **紧凑候选列表**：备选方案采用高密度卡片式布局，一屏可同时对比 3~4 个卡片方案。
2. **拇指自然操作区（Fixed Bottom Tab Bar）**：
   - 底部固定 5 大导航标签（推荐、仪表盘、多重达标、资产达标、规则账本），单手拇指即可盲按切换。
   - 适配 iOS Home Indicator 与 Android 全面屏手势安全区 (`pb-[env(safe-area-inset-bottom)]`)。
3. **支持全屏独立 Web App（添加到手机主屏幕）**：
   - 已配置 `apple-mobile-web-app-capable`、`theme-color` 与 `viewport-fit=cover`。
   - 在 iPhone Safari 中点击「分享」->「添加到主屏幕」，即可像原生 App 一样全屏沉浸使用，无浏览器地址栏打扰。

---

## 🚀 GitHub 托管与部署全流程操作指南

如需将本项目托管至 GitHub 并通过 **GitHub Pages** 或 **Vercel** 免费在线访问，请按照以下步骤操作：

### 第一步：在 GitHub 上新建仓库 (Repository)
1. 登录 [GitHub](https://github.com/)，点击右上角的 **`+`** 号 -> 选择 **New repository**。
2. 填写仓库名称（例如：`card-benefit-pro` 或 `card-recommender`）。
3. 仓库类型建议选择 **Public**（如需使用免费版 GitHub Pages 自动部署，Public 仓库无需升级会员）。
4. **不要勾选** "Initialize this repository with a README"（因为本地已有完整项目）。
5. 点击 **Create repository**。

---

### 第二步：将本地代码推送到 GitHub
在您本地电脑的项目根目录下打开终端（Terminal），依次执行以下命令：

```bash
# 1. 初始化本地 Git 仓库（若未初始化）
git init

# 2. 将所有文件添加到版本控制
git add .

# 3. 提交本地版本
git commit -m "feat: initial commit of CardBenefit Pro with mobile optimization"

# 4. 将默认分支切换为 main
git branch -M main

# 5. 关联您在 GitHub 上刚创建的远程仓库 (请将 YOUR_USERNAME 替换为您的 GitHub 用户名)
git remote add origin https://github.com/YOUR_USERNAME/card-benefit-pro.git

# 6. 推送代码至远程仓库
git push -u origin main
```

---

### 第三步：开启 GitHub Pages 自动化在线访问 (已内置 Actions)
本项目已在 `.github/workflows/deploy.yml` 中配置好了全自动 CI/CD 流程：

1. 打开您在 GitHub 上的仓库页面，点击上方的 **Settings**（设置）选项卡。
2. 在左侧菜单中找到 **Pages**。
3. 在 **Build and deployment** 下方的 **Source** 下拉菜单中：
   - 选择 **GitHub Actions**（推荐，全自动构建部署）。
4. 此时只要代码有任何推送更新，GitHub 会自动运行构建并在几秒钟内生成在线访问网址：
   `https://YOUR_USERNAME.github.io/card-benefit-pro/`

> **提示**：如果遇到资源路径问题，`vite.config.ts` 中已设置 `base: './'`，无论部署在子目录还是二级域名均可正常加载静态资源。

---

### 第四步：使用 Vercel / Cloudflare Pages 部署（备选方案，体验极佳）
如果您喜欢 Vercel 或 Cloudflare Pages：
1. 访问 [Vercel](https://vercel.com/) 并使用 GitHub 账号登录。
2. 点击 **Add New** -> **Project** -> 选择您刚导入的 `card-benefit-pro` 仓库。
3. Framework Preset 选择 **Vite**，点击 **Deploy** 即可瞬间获得全球 CDN 加速的访问链接，支持自动 HTTPS 和自定义域名绑定。

---

## 🛠️ 本地开发运行

```bash
# 安装依赖
npm install

# 启动本地开发服务 (默认端口 3000)
npm run dev

# 编译打包生产版本
npm run build

# 语法及类型检查
npm run lint
```

---

## 📊 数据备份与安全

- **纯前端隐私优先**：所有消费记录、日结资产与规则数据均保存在浏览器的本地加密存储（LocalStorage）中，不会上传到任何第三方未经授权的服务器。
- **与旧版 100% 格式无损互通**：在页面右上角点击「备份与同步」，可随时一键导出为标准的 `card-recommender-backup.json` 文件，或在多台设备间无缝复制迁移。
