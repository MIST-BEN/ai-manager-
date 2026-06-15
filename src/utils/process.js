const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class ProcessManager {
  constructor() {
    this.aiProcesses = [];
    this.keywords = [
      'ollama', 'llama', 'gpt', 'chatgpt', 'claude', 'ai',
      'stable-diffusion', 'comfyui', 'diffusion', 'torch',
      'tensorflow', 'pytorch', 'onnx', 'cuda', 'gpu',
      'inference', 'model', 'lora', 'gguf', 'ggml'
    ];
  }

  async scan() {
    this.aiProcesses = [];

    try {
      // Get all running processes
      const { stdout } = await execAsync('tasklist /FO CSV /NH');
      const lines = stdout.split('\n').filter(line => line.trim());

      for (const line of lines) {
        const parts = line.split(',').map(p => p.replace(/"/g, '').trim());
        if (parts.length >= 2) {
          const processName = parts[0].toLowerCase();
          const pid = parseInt(parts[1]);

          // Check if this is an AI-related process
          if (this.isAIProcess(processName)) {
            const details = await this.getProcessDetails(pid);
            this.aiProcesses.push({
              name: parts[0],
              pid: pid,
              memory: parts[4] || 'N/A',
              cpu: parts[5] || 'N/A',
              status: parts[2] || 'N/A',
              ...details,
              type: this.getProcessType(processName)
            });
          }
        }
      }
    } catch (error) {
      console.error('Error scanning processes:', error.message);
    }

    return this.aiProcesses;
  }

  isAIProcess(name) {
    return this.keywords.some(keyword => name.includes(keyword));
  }

  getProcessType(name) {
    const types = {
      'ollama': 'AI Server',
      'llama': 'LLM Runtime',
      'gpt': 'AI Application',
      'chatgpt': 'AI Application',
      'claude': 'AI Application',
      'stable-diffusion': 'Image Generation',
      'comfyui': 'Image Generation',
      'torch': 'ML Framework',
      'tensorflow': 'ML Framework',
      'cuda': 'GPU Computing',
      'inference': 'AI Inference'
    };

    for (const [key, type] of Object.entries(types)) {
      if (name.includes(key)) {
        return type;
      }
    }
    return 'AI Related';
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

  async getProcessInfo(pid) {
    try {
      const { stdout } = await execAsync(
        `wmic process where "ProcessId=${pid}" get Name,ProcessId,WorkingSetSize,KernelModeTime,UserModeTime /FORMAT:CSV`
      );
      return stdout;
    } catch (error) {
      return null;
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

  async startProcess(command) {
    try {
      const child = exec(command);
      return { success: true, pid: child.pid };
    } catch (error) {
      throw new Error(`Failed to start process: ${error.message}`);
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
