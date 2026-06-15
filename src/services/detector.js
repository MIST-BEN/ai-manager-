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
        commands: ['ollama list', 'ollama ps']
      },
      {
        name: 'LM Studio',
        ports: [1234, 1235],
        process: 'LM Studio',
        commands: ['lms list']
      },
      {
        name: 'LocalAI',
        ports: [8080],
        process: 'local-ai',
        commands: ['curl http://localhost:8080/v1/models']
      },
      {
        name: 'llama.cpp',
        ports: [8080, 8081],
        process: 'llama-server',
        commands: ['curl http://localhost:8080/health']
      },
      {
        name: 'text-generation-webui',
        ports: [5000],
        process: 'python.*text-generation',
        commands: ['curl http://localhost:5000/api/v1/model']
      },
      {
        name: 'Stable Diffusion WebUI',
        ports: [7860],
        process: 'python.*launch.py',
        commands: ['curl http://localhost:7860/sdapi/v1/options']
      },
      {
        name: 'ComfyUI',
        ports: [8188],
        process: 'python.*main.py',
        commands: ['curl http://localhost:8188/system_stats']
      },
      {
        name: 'Automatic1111',
        ports: [7860],
        process: 'python.*launch.py',
        commands: ['curl http://localhost:7860/sdapi/v1/options']
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
        process: 'jan',
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
      pid: null,
      models: []
    };

    try {
      // Check if process is running
      const { stdout } = await execAsync(`tasklist /FI "IMAGENAME eq ${service.process}.exe" 2>nul || echo "not found"`);
      if (stdout.includes(service.process)) {
        result.running = true;
        
        // Try to get process ID
        const pidMatch = stdout.match(/(\d+)/);
        if (pidMatch) {
          result.pid = parseInt(pidMatch[1]);
        }
      }
    } catch (error) {
      // Process not found
    }

    // Check ports
    for (const port of service.ports) {
      try {
        const { stdout } = await execAsync(`netstat -an | findstr :${port} | findstr LISTENING`);
        if (stdout.trim()) {
          result.port = port;
          result.running = true;
        }
      } catch (error) {
        // Port not listening
      }
    }

    // Get available models if service is running
    if (result.running && service.commands.length > 0) {
      try {
        const { stdout } = await execAsync(service.commands[0]);
        result.modelsRaw = stdout;
      } catch (error) {
        // Command failed
      }
    }

    return result;
  }
}

module.exports = AIServiceDetector;
