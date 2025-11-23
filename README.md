# 许我耀眼 - 视频播放器 WebUI

一个仿腾讯视频风格的本地视频播放器，集成了AI朋友圈社交互动功能。

## ✨ 核心特性

### 🎬 视频播放
- **本地视频支持**: 上传播放本地视频文件
- **拖拽上传**: 直接拖拽视频到播放器
- **专业播放器**: 基于 Video.js 8.10.0
- **完整控制**: 播放/暂停、进度控制、音量调节
- **高级功能**: 全屏播放、倍速播放（0.5x - 3x）、画中画、宽屏模式

### 🤖 AI朋友圈（核心功能）
- **智能AI回复**: 使用阿里云百炼API（Qwen-Max模型）
- **发布动态**: 分享观剧感受（最多500字）
- **点赞评论**: 完整的社交互动体验
- **实时互动**: AI在3-30秒内自动回复
- **自动刷新**: 每5秒更新朋友圈内容
- **AI角色**: 3个独特性格的AI角色（徐研、沈皓明、方蕾）

### 🎨 界面设计
- **腾讯视频风格**: 高度还原的UI设计
- **响应式布局**: 支持多种屏幕尺寸
- **图标系统**: 完整的PNG图标资源
- **演员展示**: 演员头像和代表作品

### ⌨️ 键盘快捷键
- `空格键`: 播放/暂停
- `←/→`: 后退/前进 5秒
- `↑/↓`: 增加/减少音量
- `F键`: 全屏切换

## 🚀 快速开始

### 环境要求
- **Node.js** 14.0+ （必需，用于后端服务）
- **现代浏览器** (Chrome, Firefox, Edge, Safari)
- **Python** 3.x（可选，用于本地HTTP服务器）

### 1. 安装依赖

```bash
# 进入后端目录
cd backend

# 安装Node.js依赖
npm install
```

### 2. 配置API密钥（可选）

编辑 `backend/.env` 文件：

```env
# 阿里云百炼 API 配置
DASHSCOPE_API_KEY=your_api_key_here
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DASHSCOPE_MODEL=qwen-max

# 服务器配置
PORT=3000
```

**获取API密钥**: 访问 [阿里云百炼控制台](https://bailian.console.aliyun.com/)

**注意**: 如果不配置API密钥，AI将使用模拟回复。

### 3. 启动服务

#### 方式一：使用启动脚本（推荐）

**Windows**:
```bash
start-ai-moments.bat
```

**Linux/Mac**:
```bash
chmod +x start-services.sh
./start-services.sh
```

#### 方式二：手动启动

**终端1 - 后端服务**:
```bash
cd backend
node server.js
```

**终端2 - 前端服务（可选）**:
```bash
# Python 3
python -m http.server 8000

# 或直接在浏览器打开 video_player.html
```

### 4. 访问应用

- **直接打开**: 双击 `video_player.html`
- **HTTP服务**: 访问 `http://localhost:8000/video_player.html`
- **后端API**: `http://localhost:3000/api/health`

## 📖 详细文档

- **[AI朋友圈功能说明](AI-MOMENTS-README.md)** - 完整的AI功能文档
- **[快速启动指南](QUICKSTART.md)** - 快速上手
- **[测试指南](TESTING.md)** - 功能测试方法
- **[项目指引](CLAUDE.md)** - 代码库说明

## 📁 项目结构

```
LLM_Projects/
├── video_player.html          # 主页面（统一入口）
├── script.js                  # 前端逻辑（含AI朋友圈）
├── styles.css                 # 完整样式文件
├── backend/                   # 后端服务
│   ├── server.js             # Express服务器
│   ├── services/
│   │   └── aiService.js      # AI服务封装
│   ├── .env                  # 环境配置
│   └── package.json          # 依赖配置
├── icon/                      # 图标资源
│   ├── logo.png              # Logo
│   ├── 赵露思.png            # 演员头像
│   └── ...                   # 其他图标
├── start-ai-moments.bat       # Windows启动脚本
├── start-services.sh          # Linux/Mac启动脚本
├── stop-services.sh           # 停止服务脚本
├── test_ai_api.html           # API测试页面
├── cors_test.html             # CORS测试页面
└── *.md                       # 文档文件
```

## 🎯 使用指南

### 播放视频
1. 点击"选择视频文件"按钮或拖拽视频到播放器
2. 视频自动加载并播放
3. 使用自定义控制栏控制播放

### 使用AI朋友圈
1. 点击控制栏右侧的 **👥** 按钮打开AI朋友圈
2. 点击"✏️ 发布动态"分享观剧感受
3. AI会在10-30秒内自动互动（点赞或评论）
4. 评论动态后，AI会在3-8秒内回复

### AI角色设定

| 角色 | 性格 | 特点 |
|------|------|------|
| 徐研 | 活泼开朗 | 喜欢用表情符号，回复热情 |
| 沈皓明 | 理性冷静 | 分析剧情和人物，回复有深度 |
| 方蕾 | 自信专业 | 影评人视角，专业点评 |

## 🔧 技术栈

### 前端
- **HTML5/CSS3**: 响应式UI设计
- **原生JavaScript**: 无框架依赖
- **Video.js 8.10.0**: 视频播放器
- **Fetch API**: 异步数据请求

### 后端
- **Node.js + Express**: RESTful API服务
- **阿里云百炼SDK**: AI集成（Qwen-Max模型）
- **CORS**: 跨域支持
- **dotenv**: 环境变量管理

### API端点

```
GET  /api/health                      # 健康检查
GET  /api/moments                     # 获取动态列表
POST /api/moments                     # 发布新动态
POST /api/moments/:id/like           # 点赞/取消点赞
POST /api/moments/:id/comments       # 发表评论
DELETE /api/moments/:id              # 删除动态
DELETE /api/moments/:id/comments/:idx # 删除评论
```

## 🐛 故障排查

### 后端服务无法启动
**错误**: `Error: listen EADDRINUSE :::3000`

**解决**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <进程号> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### AI不回复
**检查项**:
- ✅ `.env` 中的 `DASHSCOPE_API_KEY` 是否正确
- ✅ 网络连接是否正常
- ✅ 后端日志是否有错误
- ✅ API配额是否充足

### 前端无法连接后端
**解决**:
- 确认后端服务已启动 (`http://localhost:3000`)
- 检查浏览器控制台网络请求
- 确认防火墙未阻止3000端口

## 🔐 安全建议

1. **API密钥保护**: 不要将 `.env` 文件提交到Git
2. **输入验证**: 后端已实现基础验证
3. **速率限制**: 生产环境建议添加API调用频率限制
4. **内容审核**: 建议集成内容安全审核API
5. **HTTPS**: 生产环境使用HTTPS协议

## 📈 性能优化

- 使用虚拟滚动处理大量动态
- 实现增量更新而非全量刷新
- 添加请求防抖和节流
- 使用Redis缓存动态列表
- 实现WebSocket实时推送

## 🗺️ 开发路线图

- [ ] 添加图片上传功能
- [ ] 实现@提及用户功能
- [ ] 支持动态表情包
- [ ] 添加敏感词过滤
- [ ] 实现用户系统和登录
- [ ] 移动端适配优化
- [ ] WebSocket实时推送
- [ ] 数据库持久化（MongoDB/MySQL）
- [ ] 多语言AI支持

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 技术支持

如有问题，请：
1. 查看 [AI-MOMENTS-README.md](AI-MOMENTS-README.md) 的故障排查章节
2. 检查浏览器控制台和后端日志
3. 参考 [TESTING.md](TESTING.md) 测试指南

---

**注意**: 本项目仅供学习和演示使用。
