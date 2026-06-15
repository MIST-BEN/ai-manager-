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

    this.modelDirectories = [];

    this.models = [];
  }

  async scan() {
    this.models = [];

    // 1. 从Ollama获取模型列表
    await this.scanOllamaModels();

    // 2. 从LM Studio获取模型
    await this.scanLMStudioModels();

    // 3. 扫描本地模型文件
    await this.scanLocalModelFiles();

    return this.models;
  }

  async scanOllamaModels() {
    try {
      const { stdout } = await execAsync('cmd /c "ollama list"');
      const lines = stdout.split('\n').filter(l => l.trim() && !l.includes('NAME'));

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 3) {
          const name = parts[0];
          const id = parts[1];
          const sizeStr = parts.slice(2, -1).join(' ');
          const modified = parts[parts.length - 1];

          this.models.push({
            name: name,
            id: id,
            source: 'Ollama',
            sizeFormatted: sizeStr,
            modified: modified,
            type: 'Ollama Model',
            path: `ollama://${name}`
          });
        }
      }
    } catch (error) {
      // Ollama not available
    }
  }

  async scanLMStudioModels() {
    const lmStudioDir = path.join(process.env.USERPROFILE || '', '.cache', 'lm-studio', 'models');
    if (fs.existsSync(lmStudioDir)) {
      try {
        const entries = fs.readdirSync(lmStudioDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            this.models.push({
              name: entry.name,
              source: 'LM Studio',
              path: path.join(lmStudioDir, entry.name),
              type: 'LM Studio Model'
            });
          }
        }
      } catch (error) {}
    }
  }

  async scanLocalModelFiles() {
    const searchDirs = [];

    // 用户目录下的常见AI文件夹
    const userProfile = process.env.USERPROFILE || '';
    const homeDirs = [
      path.join(userProfile, 'Desktop'),
      path.join(userProfile, 'Documents'),
      path.join(userProfile, 'Downloads'),
      path.join(userProfile, 'AI'),
      path.join(userProfile, 'Models')
    ];

    // 检查所有磁盘
    try {
      const { stdout } = await execAsync('wmic logicaldisk get name');
      const drives = stdout.split('\n')
        .map(l => l.trim())
        .filter(l => /^[A-Z]:$/.test(l));

      for (const drive of drives) {
        searchDirs.push(
          `${drive}\\AI`,
          `${drive}\\Models`,
          `${drive}\\AI-Models`,
          `${drive}\\stable-diffusion-webui\\models`,
          `${drive}\\ComfyUI\\models`
        );
      }
    } catch (error) {}

    // 扫描所有目录（限制深度避免太慢）
    for (const dir of [...homeDirs, ...searchDirs]) {
      if (fs.existsSync(dir)) {
        await this.scanDirectory(dir, 0, 2);
      }
    }
  }

  async scanDirectory(dir, depth = 0, maxDepth = 2) {
    if (depth > maxDepth) return;

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // 跳过node_modules等大目录
          if (entry.name === 'node_modules' || entry.name === '.git') continue;
          await this.scanDirectory(fullPath, depth + 1, maxDepth);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (this.modelExtensions.includes(ext)) {
            const stats = fs.statSync(fullPath);
            // 只收录大于1MB的文件（过滤小文件）
            if (stats.size > 1024 * 1024) {
              this.models.push({
                name: entry.name,
                path: fullPath,
                directory: dir,
                extension: ext,
                size: stats.size,
                sizeFormatted: this.formatSize(stats.size),
                modified: stats.mtime.toISOString().split('T')[0],
                source: 'Local File',
                type: this.getModelType(ext)
              });
            }
          }
        }
      }
    } catch (error) {}
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
    return types[ext] || 'AI Model';
  }

  formatSize(bytes) {
    if (!bytes) return 'N/A';
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

  getModelsBySource() {
    const grouped = {};
    for (const model of this.models) {
      const source = model.source || 'Unknown';
      if (!grouped[source]) {
        grouped[source] = [];
      }
      grouped[source].push(model);
    }
    return grouped;
  }

  getTotalSize() {
    return this.models.reduce((sum, model) => sum + (model.size || 0), 0);
  }
}

module.exports = AIModelScanner;
