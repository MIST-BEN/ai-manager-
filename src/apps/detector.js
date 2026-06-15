const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs');
const path = require('path');

class AIAppDetector {
  constructor() {
    this.applications = [
      // AI编程助手
      {
        name: 'Cursor',
        process: 'Cursor',
        paths: [
          path.join(process.env.LOCALAPPDATA || '', 'Programs', 'cursor'),
          path.join(process.env.APPDATA || '', 'Cursor'),
          'C:\\Users\\' + (process.env.USERNAME || '') + '\\AppData\\Local\\Programs\\cursor'
        ]
      },
      {
        name: 'Windsurf',
        process: 'Windsurf',
        paths: [
          path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Windsurf'),
          path.join(process.env.APPDATA || '', 'Windsurf')
        ]
      },
      {
        name: 'Claude Desktop',
        process: 'Claude',
        paths: [
          path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Claude'),
          path.join(process.env.APPDATA || '', 'Claude')
        ]
      },
      {
        name: 'ChatGPT Desktop',
        process: 'ChatGPT',
        paths: [
          path.join(process.env.LOCALAPPDATA || '', 'Programs', 'ChatGPT'),
          path.join(process.env.APPDATA || '', 'ChatGPT')
        ]
      },
      // AI本地模型工具
      {
        name: 'Ollama',
        process: 'ollama',
        paths: [
          path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Ollama'),
          'C:\\Program Files\\Ollama',
          'C:\\Users\\' + (process.env.USERNAME || '') + '\\AppData\\Local\\Programs\\Ollama'
        ]
      },
      {
        name: 'LM Studio',
        process: 'LM Studio',
        paths: [
          path.join(process.env.LOCALAPPDATA || '', 'LM-Studio'),
          path.join(process.env.APPDATA || '', 'LM Studio')
        ]
      },
      {
        name: 'GPT4All',
        process: 'gpt4all',
        paths: [
          path.join(process.env.LOCALAPPDATA || '', 'gpt4all'),
          'C:\\Program Files\\GPT4All'
        ]
      },
      {
        name: 'Jan',
        process: 'Jan',
        paths: [
          path.join(process.env.LOCALAPPDATA || '', 'jan'),
          path.join(process.env.APPDATA || '', 'Jan')
        ]
      },
      {
        name: 'Pinokio',
        process: 'Pinokio',
        paths: [
          path.join(process.env.LOCALAPPDATA || '', 'Pinokio'),
          path.join(process.env.APPDATA || '', 'Pinokio')
        ]
      },
      // 图像生成
      {
        name: 'Stable Diffusion WebUI',
        process: 'webui',
        paths: [
          'C:\\stable-diffusion-webui',
          'D:\\stable-diffusion-webui',
          path.join(process.env.USERPROFILE || '', 'stable-diffusion-webui')
        ]
      },
      {
        name: 'ComfyUI',
        process: 'main.py',
        paths: [
          'C:\\ComfyUI',
          'D:\\ComfyUI',
          path.join(process.env.USERPROFILE || '', 'ComfyUI')
        ]
      },
      {
        name: 'Fooocus',
        process: 'launch.py',
        paths: [
          'C:\\Fooocus',
          'D:\\Fooocus',
          path.join(process.env.USERPROFILE || '', 'Fooocus')
        ]
      },
      {
        name: 'InvokeAI',
        process: 'invokeai',
        paths: [
          'C:\\InvokeAI',
          path.join(process.env.USERPROFILE || '', 'InvokeAI')
        ]
      }
    ];

    this.detectedApps = [];
  }

  async scan() {
    this.detectedApps = [];

    for (const app of this.applications) {
      const detected = await this.checkApp(app);
      if (detected) {
        this.detectedApps.push(detected);
      }
    }

    // 检查npm全局安装的AI工具
    await this.checkNpmGlobal();

    // 检查pip安装的AI工具
    await this.checkPipPackages();

    // 检查注册表
    await this.checkRegistry();

    return this.detectedApps;
  }

  async checkApp(app) {
    const result = {
      ...app,
      installed: false,
      running: false,
      path: null,
      pid: null
    };

    for (const appPath of app.paths) {
      try {
        if (fs.existsSync(appPath)) {
          result.installed = true;
          result.path = appPath;
          break;
        }
      } catch (e) {}
    }

    try {
      const processQuery = app.process.includes('.')
        ? app.process
        : `${app.process}.exe`;
      const { stdout } = await execAsync(`tasklist /FI "IMAGENAME eq ${processQuery}" 2>nul`);
      if (stdout.includes(app.process)) {
        result.running = true;
        const pidMatch = stdout.match(/(\d+)/);
        if (pidMatch) {
          result.pid = parseInt(pidMatch[1]);
        }
      }
    } catch (error) {}

    if (result.installed || result.running) {
      return result;
    }

    return null;
  }

  async checkNpmGlobal() {
    try {
      const { stdout } = await execAsync('npm list -g --depth=0 2>nul');
      const aiPackages = [
        'claude-code', '@anthropic-ai/claude-code',
        'aider', 'aider-chat',
        'copilot', '@github/copilot'
      ];

      for (const pkg of aiPackages) {
        if (stdout.includes(pkg)) {
          this.detectedApps.push({
            name: pkg,
            process: pkg,
            source: 'npm',
            installed: true,
            running: false,
            type: 'AI CLI Tool'
          });
        }
      }
    } catch (error) {}
  }

  async checkPipPackages() {
    try {
      const { stdout } = await execAsync('pip list 2>nul');
      const aiPackages = [
        'openai', 'anthropic', 'langchain', 'llama-index',
        'transformers', 'torch', 'diffusers', 'stable-diffusion-webui'
      ];

      for (const pkg of aiPackages) {
        if (stdout.toLowerCase().includes(pkg)) {
          const exists = this.detectedApps.some(a => a.name === pkg);
          if (!exists) {
            this.detectedApps.push({
              name: pkg,
              process: pkg,
              source: 'pip',
              installed: true,
              running: false,
              type: 'AI Python Package'
            });
          }
        }
      }
    } catch (error) {}
  }

  async checkRegistry() {
    try {
      const { stdout } = await execAsync('reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall" /s /v "DisplayName" 2>nul');
      const { stdout: stdout2 } = await execAsync('reg query "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall" /s /v "DisplayName" 2>nul');

      const aiKeywords = [
        'claude', 'chatgpt', 'cursor', 'windsurf', 'copilot',
        'ollama', 'lm studio', 'gpt4all', 'jan', 'pinokio',
        'stable diffusion', 'comfyui', 'fooocus', 'invokeai',
        'aider', 'continue', 'openai', 'anthropic'
      ];

      const allOutput = stdout + '\n' + stdout2;
      const lines = allOutput.split('\n');

      for (const line of lines) {
        if (line.includes('DisplayName')) {
          const match = line.match(/DisplayName\s+REG_SZ\s+(.+)/);
          if (match) {
            const displayName = match[1];
            const lower = displayName.toLowerCase();
            if (aiKeywords.some(kw => lower.includes(kw))) {
              const exists = this.detectedApps.some(
                a => a.name.toLowerCase() === displayName.toLowerCase()
              );
              if (!exists) {
                this.detectedApps.push({
                  name: displayName,
                  source: 'registry',
                  installed: true,
                  running: false
                });
              }
            }
          }
        }
      }
    } catch (error) {}
  }

  async launchApp(app) {
    if (!app.path) throw new Error('App path not found');

    try {
      const entries = fs.readdirSync(app.path);
      const exe = entries.find(e => e.endsWith('.exe'));

      if (exe) {
        const { pid } = await exec(`start "" "${path.join(app.path, exe)}"`);
        return { success: true, pid };
      }
    } catch (error) {
      throw new Error(`Failed to launch ${app.name}: ${error.message}`);
    }
  }

  async stopApp(app) {
    if (!app.pid) throw new Error('Process ID not available');

    try {
      await execAsync(`taskkill /PID ${app.pid} /F`);
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to stop ${app.name}: ${error.message}`);
    }
  }
}

module.exports = AIAppDetector;
