const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class AIModelScanner {
  constructor() {
    this.modelExtensions = [
      '.gguf', '.bin', '.pt', '.pth', '.onnx', '.pb', 
      '.h5', '.safetensors', '.ckpt', '.diffusers',
      '.lora', '.qlora', '.ggml', '.q4_0', '.q4_1',
      '.q5_0', '.q5_1', '.q8_0', '.f16', '.f32'
    ];

    this.modelDirectories = [
      // Ollama models
      path.join(process.env.USERPROFILE || '', '.ollama', 'models'),
      // LM Studio models
      path.join(process.env.USERPROFILE || '', '.cache', 'lm-studio', 'models'),
      // Hugging Face cache
      path.join(process.env.USERPROFILE || '', '.cache', 'huggingface', 'hub'),
      // Stable Diffusion models
      'C:\\stable-diffusion-webui\\models',
      'C:\\ComfyUI\\models',
      // Common AI directories
      'C:\\AI\\models',
      'C:\\Models',
      path.join(process.env.USERPROFILE || '', 'Desktop', 'AI'),
      path.join(process.env.USERPROFILE || '', 'Documents', 'AI')
    ];

    this.models = [];
  }

  async scan() {
    this.models = [];

    // Scan known directories
    for (const dir of this.modelDirectories) {
      if (fs.existsSync(dir)) {
        await this.scanDirectory(dir);
      }
    }

    // Scan common drives
    await this.scanDrives();

    return this.models;
  }

  async scanDirectory(dir, depth = 0) {
    if (depth > 3) return; // Limit recursion depth

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await this.scanDirectory(fullPath, depth + 1);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (this.modelExtensions.includes(ext)) {
            const stats = fs.statSync(fullPath);
            this.models.push({
              name: entry.name,
              path: fullPath,
              directory: dir,
              extension: ext,
              size: stats.size,
              sizeFormatted: this.formatSize(stats.size),
              modified: stats.mtime,
              type: this.getModelType(ext)
            });
          }
        }
      }
    } catch (error) {
      // Skip inaccessible directories
    }
  }

  async scanDrives() {
    try {
      const { stdout } = await execAsync('wmic logicaldisk get name');
      const drives = stdout.split('\n')
        .map(line => line.trim())
        .filter(line => /^[A-Z]:$/.test(line));

      for (const drive of drives) {
        const aiDirs = [
          `${drive}\\AI`,
          `${drive}\\Models`,
          `${drive}\\AI-Models`,
          `${drive}\\stable-diffusion-webui`,
          `${drive}\\ComfyUI`
        ];

        for (const dir of aiDirs) {
          if (fs.existsSync(dir)) {
            await this.scanDirectory(dir);
          }
        }
      }
    } catch (error) {
      // Drive scanning failed
    }
  }

  getModelType(ext) {
    const types = {
      '.gguf': 'GGUF (llama.cpp)',
      '.ggml': 'GGML (legacy)',
      '.bin': 'Binary Model',
      '.pt': 'PyTorch',
      '.pth': 'PyTorch',
      '.onnx': 'ONNX',
      '.pb': 'TensorFlow',
      '.h5': 'Keras/H5',
      '.safetensors': 'SafeTensors',
      '.ckpt': 'Checkpoint',
      '.diffusers': 'Diffusers',
      '.lora': 'LoRA Adapter',
      '.qlora': 'QLoRA Adapter'
    };
    return types[ext] || 'Unknown';
  }

  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  getModelsByType() {
    const grouped = {};
    for (const model of this.models) {
      const type = model.type;
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(model);
    }
    return grouped;
  }

  getModelsBySize() {
    return [...this.models].sort((a, b) => b.size - a.size);
  }

  getTotalSize() {
    return this.models.reduce((sum, model) => sum + model.size, 0);
  }
}

module.exports = AIModelScanner;
