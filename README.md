# 🤖 AI管理系统

自动检测并管理电脑上的所有AI组件。

## 功能特性

### 🔍 AI检测
- **AI服务检测**: 自动检测Ollama、LM Studio、LocalAI等AI服务
- **AI模型扫描**: 扫描本地AI模型文件（.gguf、.pt、.onnx等）
- **AI应用检测**: 检测已安装的AI桌面应用
- **AI进程监控**: 实时监控AI相关进程

### 📊 管理功能
- **服务管理**: 启动/停止AI服务
- **进程管理**: 终止AI进程
- **资源监控**: CPU、内存、GPU使用率
- **Web控制面板**: 可视化管理界面

### 🎯 支持的AI组件

#### AI服务
- Ollama
- LM Studio
- LocalAI
- llama.cpp
- text-generation-webui
- Stable Diffusion WebUI
- ComfyUI
- GPT4All
- Jan

#### AI模型格式
- GGUF (llama.cpp)
- SafeTensors
- PyTorch (.pt/.pth)
- ONNX
- TensorFlow (.pb/.h5)
- LoRA/QLoRA

#### AI应用
- ChatGPT Desktop
- Claude Desktop
- LM Studio
- GPT4All
- Jan
- Stable Diffusion WebUI
- ComfyUI
- Fooocus
- InvokeAI

## 安装

```bash
cd ai-manager
npm install
```

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

### 开发模式
```bash
npm run serve
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
