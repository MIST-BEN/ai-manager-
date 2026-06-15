const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs');
const path = require('path');

class AIAppDetector {
  constructor() {
    this.applications = [
      // Desktop AI Apps
      {
        name: 'ChatGPT Desktop',
        process: 'ChatGPT',
        paths: [
          path.join(process.env.LOCALAPPDATA || '', 'Programs', 'ChatGPT'),
          path.join(process.env.PROGRAMFILES || '', 'ChatGPT')
        ]
      },
      {
        name: 'Claude Desktop',
        process: 'Claude',
        paths: [
          path.join(process.env.LOCALAPPDATA || '', 'AnthropicClaude'),
          path.join(process.env.PROGRAMFILES || '', 'Claude')
        ]
      },
      {
        name: 'Ollama Desktop',
        process: 'Ollama',
        paths: [
          path.join(process.env.LOCALAPPDATA || '', 'Ollama'),
          'C:\\Program Files\\Ollama'
        ]
      },
      {
        name: 'LM Studio',
        process: 'LM Studio',
        paths: [
          path.join(process.env.LOCALAPPDATA || '', 'LM-Studio'),
          path.join(process.env.PROGRAMFILES || '', 'LM Studio')
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
        process: 'jan',
        paths: [
          path.join(process.env.LOCALAPPDATA || '', 'jan'),
          'C:\\Program Files\\Jan'
        ]
      },
      {
        name: 'Vesktop (Discord AI)',
        process: 'Vesktop',
        paths: [
          path.join(process.env.LOCALAPPDATA || '', 'Vesktop')
        ]
      },
      {
        name: 'Stable Diffusion WebUI',
        process: 'launch.py',
        paths: [
          'C:\\stable-diffusion-webui',
          'D:\\stable-diffusion-webui'
        ]
      },
      {
        name: 'ComfyUI',
        process: 'main.py',
        paths: [
          'C:\\ComfyUI',
          'D:\\ComfyUI'
        ]
      },
      {
        name: 'Fooocus',
        process: 'launch.py',
        paths: [
          'C:\\Fooocus',
          'D:\\Fooocus'
        ]
      },
      {
        name: 'Automatic1111',
        process: 'launch.py',
        paths: [
          'C:\\stable-diffusion-webui'
        ]
      },
      {
        name: 'InvokeAI',
        process: 'invokeai',
        paths: [
          'C:\\InvokeAI',
          path.join(process.env.USERPROFILE || '', 'invokeai')
        ]
      },
      {
        name: 'Pinokio',
        process: 'Pinokio',
        paths: [
          path.join(process.env.LOCALAPPDATA || '', 'Pinokio'),
          path.join(process.env.APPDATA || '', 'Pinokio')
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

    // Also check for installed programs via registry
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

    // Check if any of the known paths exist
    for (const appPath of app.paths) {
      if (fs.existsSync(appPath)) {
        result.installed = true;
        result.path = appPath;
        break;
      }
    }

    // Check if process is running
    try {
      const { stdout } = await execAsync(`tasklist /FI "IMAGENAME eq ${app.process}.exe" 2>nul`);
      if (stdout.includes(app.process)) {
        result.running = true;
        const pidMatch = stdout.match(/(\d+)/);
        if (pidMatch) {
          result.pid = parseInt(pidMatch[1]);
        }
      }
    } catch (error) {
      // Process not found
    }

    if (result.installed || result.running) {
      return result;
    }

    return null;
  }

  async checkRegistry() {
    try {
      const { stdout } = await execAsync('reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall" /s /v "DisplayName" 2>nul');
      
      const aiKeywords = ['ai', 'gpt', 'llm', 'chat', 'claude', 'ollama', 'stable diffusion', 'comfyui'];
      
      const lines = stdout.split('\n');
      for (const line of lines) {
        if (line.includes('DisplayName')) {
          const match = line.match(/DisplayName\s+REG_SZ\s+(.+)/);
          if (match) {
            const displayName = match[1].toLowerCase();
            if (aiKeywords.some(keyword => displayName.includes(keyword))) {
              // Check if already detected
              if (!this.detectedApps.some(app => app.name.toLowerCase().includes(displayName))) {
                this.detectedApps.push({
                  name: match[1],
                  source: 'registry',
                  installed: true,
                  running: false
                });
              }
            }
          }
        }
      }
    } catch (error) {
      // Registry check failed
    }
  }

  async launchApp(app) {
    if (!app.path) {
      throw new Error('App path not found');
    }

    try {
      // Find executable in path
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
    if (!app.pid) {
      throw new Error('Process ID not available');
    }

    try {
      await execAsync(`taskkill /PID ${app.pid} /F`);
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to stop ${app.name}: ${error.message}`);
    }
  }
}

module.exports = AIAppDetector;
