const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class ProcessManager {
  constructor() {
    this.aiProcesses = [];
    // 精确匹配的AI进程名（不含NVIDIA等驱动进程）
    this.processPatterns = [
      // AI聊天/助手
      'ollama', 'chatgpt', 'claude', 'copilot',
      // AI编程工具
      'cursor', 'windsurf', 'continue', 'aider',
      // LLM运行时
      'llama', 'gguf', 'gpt4all', 'lm.studio', 'jan',
      // 图像生成
      'stable-diffusion', 'comfyui', 'fooocus', 'invokeai', 'automatic1111',
      // 其他AI工具
      'pinokio', 'text-generation', 'kobold', 'siliconflow',
      // AI命令行工具
      'claude.exe', 'openai', 'anthropic'
    ];
  }

  async scan() {
    this.aiProcesses = [];

    try {
      const { stdout } = await execAsync('tasklist /FO CSV /NH');
      const lines = stdout.split('\n').filter(line => line.trim());

      for (const line of lines) {
        const parts = line.split(',').map(p => p.replace(/"/g, '').trim());
        if (parts.length >= 2) {
          const processName = parts[0].toLowerCase();
          const pid = parseInt(parts[1]);

          if (this.isAIProcess(processName)) {
            const details = await this.getProcessDetails(pid);
            // 过滤掉NVIDIA驱动进程
            if (!this.isNvidiaDriverProcess(details, processName)) {
              this.aiProcesses.push({
                name: parts[0],
                pid: pid,
                memory: parts[4] || 'N/A',
                status: parts[2] || 'N/A',
                ...details,
                type: this.getProcessType(processName, details)
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error scanning processes:', error.message);
    }

    return this.aiProcesses;
  }

  isAIProcess(name) {
    return this.processPatterns.some(p => name.includes(p));
  }

  isNvidiaDriverProcess(details, name) {
    const nvidiaProcesses = [
      'nvidia', 'nvcontainer', 'nvtray', 'nvsphelper',
      'nvdisplay', 'container', 'session'
    ];
    const path = (details.executablePath || '').toLowerCase();
    const cmd = (details.commandLine || '').toLowerCase();

    if (path.includes('nvidia') || cmd.includes('nvidia')) {
      return true;
    }
    if (name.includes('nvcontainer') || name.includes('nvsphelper')) {
      return true;
    }
    return false;
  }

  getProcessType(name, details) {
    const cmd = ((details && details.commandLine) || '').toLowerCase();
    const path = ((details && details.executablePath) || '').toLowerCase();

    if (name.includes('ollama')) return 'AI Server (Ollama)';
    if (name.includes('claude')) return 'AI Assistant (Claude)';
    if (name.includes('chatgpt')) return 'AI Assistant (ChatGPT)';
    if (name.includes('copilot')) return 'AI Assistant (Copilot)';
    if (name.includes('cursor')) return 'AI IDE (Cursor)';
    if (name.includes('windsurf')) return 'AI IDE (Windsurf)';
    if (name.includes('aider')) return 'AI Coding (Aider)';
    if (name.includes('llama')) return 'LLM Runtime (llama.cpp)';
    if (name.includes('gpt4all')) return 'AI App (GPT4All)';
    if (name.includes('lm.studio')) return 'AI App (LM Studio)';
    if (name.includes('jan')) return 'AI App (Jan)';
    if (name.includes('stable-diffusion') || name.includes('webui')) return 'Image Gen (Stable Diffusion)';
    if (name.includes('comfyui')) return 'Image Gen (ComfyUI)';
    if (name.includes('fooocus')) return 'Image Gen (Fooocus)';
    if (name.includes('pinokio')) return 'AI Manager (Pinokio)';
    if (cmd.includes('python') && cmd.includes('model')) return 'AI Model Runtime';
    return 'AI Tool';
  }

  async getProcessDetails(pid) {
    try {
      const { stdout } = await execAsync(
        `wmic process where "ProcessId=${pid}" get CommandLine,ExecutablePath /FORMAT:LIST`
      );

      const details = {};
      const lines = stdout.split('\n');

      for (const line of lines) {
        if (line.startsWith('CommandLine=')) {
          details.commandLine = line.replace('CommandLine=', '').trim();
        }
        if (line.startsWith('ExecutablePath=')) {
          details.executablePath = line.replace('ExecutablePath=', '').trim();
        }
      }

      return details;
    } catch (error) {
      return {};
    }
  }

  async killProcess(pid) {
    try {
      await execAsync(`taskkill /PID ${pid} /F`);
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to kill process ${pid}: ${error.message}`);
    }
  }

  async getSystemResources() {
    try {
      const { stdout: cpuInfo } = await execAsync('wmic cpu get loadpercentage');
      const cpuMatch = cpuInfo.match(/(\d+)/);
      const cpuUsage = cpuMatch ? parseInt(cpuMatch[1]) : 0;

      const { stdout: memInfo } = await execAsync(
        'wmic OS get FreePhysicalMemory,TotalVisibleMemorySize /FORMAT:CSV'
      );
      const memLines = memInfo.split('\n').filter(l => l.trim());
      let memUsage = 0;
      if (memLines.length > 1) {
        const parts = memLines[1].split(',');
        if (parts.length >= 3) {
          const free = parseInt(parts[1]) || 0;
          const total = parseInt(parts[2]) || 1;
          memUsage = Math.round(((total - free) / total) * 100);
        }
      }

      return { cpuUsage, memUsage };
    } catch (error) {
      return { cpuUsage: 0, memUsage: 0 };
    }
  }

  async getGPUInfo() {
    try {
      const { stdout } = await execAsync(
        'wmic path win32_videocontroller get name,adapterram,driverversion /FORMAT:LIST'
      );

      const gpus = [];
      const lines = stdout.split('\n');
      let currentGpu = {};

      for (const line of lines) {
        if (line.startsWith('Name=')) {
          if (currentGpu.name) {
            gpus.push(currentGpu);
          }
          currentGpu = { name: line.replace('Name=', '').trim() };
        }
        if (line.startsWith('AdapterRAM=')) {
          const ram = parseInt(line.replace('AdapterRAM=', '').trim());
          currentGpu.memory = ram ? `${Math.round(ram / 1024 / 1024)} MB` : 'N/A';
        }
        if (line.startsWith('DriverVersion=')) {
          currentGpu.driver = line.replace('DriverVersion=', '').trim();
        }
      }
      if (currentGpu.name) {
        gpus.push(currentGpu);
      }

      return gpus;
    } catch (error) {
      return [];
    }
  }
}

module.exports = ProcessManager;
