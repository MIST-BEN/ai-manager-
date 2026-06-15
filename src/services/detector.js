const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class AIServiceDetector {
  constructor() {
    this.services = [
      {
        name: 'Ollama',
        ports: [11434],
        process: 'ollama',
        commands: ['ollama list']
      },
      {
        name: 'LM Studio',
        ports: [1234, 1235],
        process: 'LM Studio',
        commands: []
      },
      {
        name: 'LocalAI',
        ports: [8080],
        process: 'local-ai',
        commands: []
      },
      {
        name: 'llama.cpp Server',
        ports: [8080, 8081, 8082],
        process: 'llama-server',
        commands: []
      },
      {
        name: 'text-generation-webui',
        ports: [5000],
        process: 'python',
        commands: []
      },
      {
        name: 'Stable Diffusion WebUI',
        ports: [7860],
        process: 'python',
        commands: []
      },
      {
        name: 'ComfyUI',
        ports: [8188],
        process: 'python',
        commands: []
      },
      {
        name: 'GPT4All',
        ports: [4891],
        process: 'gpt4all',
        commands: []
      },
      {
        name: 'Jan',
        ports: [1337],
        process: 'Jan',
        commands: []
      },
      {
        name: 'SiliconFlow',
        ports: [11435],
        process: 'siliconflow',
        commands: []
      },
      {
        name: 'KoboldCpp',
        ports: [5001],
        process: 'koboldcpp',
        commands: []
      }
    ];
  }

  async scan() {
    const detected = [];

    for (const service of this.services) {
      const status = await this.checkService(service);
      if (status.running) {
        detected.push({
          ...service,
          ...status,
          status: 'running'
        });
      }
    }

    return detected;
  }

  async checkService(service) {
    const result = {
      running: false,
      port: null,
      pid: null
    };

    // Check ports first (more reliable)
    for (const port of service.ports) {
      try {
        const { stdout } = await execAsync(`netstat -an | findstr :${port} | findstr LISTENING`);
        if (stdout.trim()) {
          result.port = port;
          result.running = true;
          break;
        }
      } catch (error) {}
    }

    // Also check process
    if (!result.running) {
      try {
        const processQuery = service.process.includes('.')
          ? service.process
          : `${service.process}.exe`;
        const { stdout } = await execAsync(`tasklist /FI "IMAGENAME eq ${processQuery}" 2>nul`);
        if (stdout.includes(service.process)) {
          result.running = true;
          const pidMatch = stdout.match(/(\d+)/);
          if (pidMatch) {
            result.pid = parseInt(pidMatch[1]);
          }
        }
      } catch (error) {}
    }

    return result;
  }
}

module.exports = AIServiceDetector;
