# 🤖 AI管理系统

自动检测并管理电脑上的所有AI组件。

## 快速下载使用

### 方法一：下载压缩包（推荐）

1. **下载** [ai-manager.zip](ai-manager.zip)
2. **解压** 到桌面任意位置
3. **安装依赖**：打开文件夹，按住 `Shift` + 右键空白处 → 选择「在此处打开 Powershell 窗口」，输入：
   ```powershell
   npm install
   ```
4. **启动**：
   ```powershell
   npm start
   ```
5. **打开浏览器** 访问 http://localhost:3000

### 方法二：使用 start.bat

解压后直接双击 `start.bat` 即可启动（需要已安装 Node.js）。

---

## 前置要求

- [Node.js](https://nodejs.org/) 14+（下载LTS版本）
- Windows 10/11

## 功能特性

### 🔍 支持检测的AI工具

#### AI编程助手
- **Cursor** - AI代码编辑器
- **Windsurf** - AI代码编辑器
- **Claude Code** - Anthropic命令行AI
- **GitHub Copilot** - AI编程助手
- **Aider** - AI编程命令行工具

#### AI对话/助手
- **Claude Desktop** - Anthropic桌面应用
- **ChatGPT Desktop** - OpenAI桌面应用

#### AI本地模型工具
- **Ollama** - 本地大模型运行
- **LM Studio** - 本地大模型GUI
- **GPT4All** - 本地AI助手
- **Jan** - 本地AI运行时
- **Pinokio** - AI应用管理器

#### 图像生成
- **Stable Diffusion WebUI**
- **ComfyUI**
- **Fooocus**
- **InvokeAI**

#### AI模型格式
- GGUF (llama.cpp)
- SafeTensors
- PyTorch (.pt/.pth)
- ONNX
- TensorFlow (.pb/.h5)
- LoRA/QLoRA

### 📊 管理功能
- **服务检测**: 自动检测运行中的AI服务端口
- **进程管理**: 查看和终止AI进程
- **资源监控**: CPU、内存、GPU使用率
- **Web控制面板**: 可视化管理界面

## 使用方法

### 启动完整系统（带Web界面）
```bash
npm start
```

访问 http://localhost:3000 打开控制面板

### 仅运行扫描
```bash
npm run scan
```

## API接口

- `GET /api/scan` - 完整扫描
- `GET /api/services` - 获取AI服务
- `GET /api/models` - 获取AI模型
- `GET /api/apps` - 获取AI应用
- `GET /api/processes` - 获取AI进程
- `GET /api/resources` - 获取系统资源
- `POST /api/process/kill` - 终止进程

## 项目结构

```
ai-manager/
├── src/
│   ├── index.js          # 主入口
│   ├── scanner.js        # 扫描器
│   ├── server.js         # Web服务器
│   ├── services/
│   │   └── detector.js   # AI服务检测
│   ├── models/
│   │   └── scanner.js    # AI模型扫描
│   ├── apps/
│   │   └── detector.js   # AI应用检测
│   └── utils/
│       └── process.js    # 进程管理
├── public/
│   ├── index.html        # 控制面板
│   ├── css/style.css     # 样式
│   └── js/app.js         # 前端逻辑
├── package.json
└── README.md
```

## 系统要求

- Windows 10/11
- Node.js 14+
- 管理员权限（用于进程管理）

## 注意事项

1. 某些功能需要管理员权限
2. 模型扫描可能需要较长时间
3. 首次运行会自动扫描系统
4. 建议定期更新以获取最新AI组件支持
