const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

class AIServer {
  constructor(scanner) {
    this.scanner = scanner;
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server);
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocket();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, '..', 'public')));
  }

  setupRoutes() {
    // Get all AI components
    this.app.get('/api/scan', async (req, res) => {
      try {
        const results = await this.scanner.fullScan();
        res.json({ success: true, data: results });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get services
    this.app.get('/api/services', (req, res) => {
      const results = this.scanner.getResults();
      res.json({ success: true, data: results.services });
    });

    // Get models
    this.app.get('/api/models', (req, res) => {
      const results = this.scanner.getResults();
      res.json({ success: true, data: results.models });
    });

    // Get apps
    this.app.get('/api/apps', (req, res) => {
      const results = this.scanner.getResults();
      res.json({ success: true, data: results.apps });
    });

    // Get processes
    this.app.get('/api/processes', (req, res) => {
      const results = this.scanner.getResults();
      res.json({ success: true, data: results.processes });
    });

    // Kill process
    this.app.post('/api/process/kill', async (req, res) => {
      const { pid } = req.body;
      try {
        await this.scanner.processManager.killProcess(pid);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get system resources
    this.app.get('/api/resources', async (req, res) => {
      try {
        const resources = await this.scanner.processManager.getSystemResources();
        const gpu = await this.scanner.processManager.getGPUInfo();
        res.json({ success: true, data: { ...resources, gpu } });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
  }

  setupSocket() {
    this.io.on('connection', (socket) => {
      console.log('Client connected');

      socket.on('requestScan', async () => {
        const results = await this.scanner.fullScan();
        socket.emit('scanResults', results);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });
  }

  start(port = 3000) {
    this.server.listen(port, () => {
      console.log(`🌐 AI管理服务器运行在 http://localhost:${port}`);
      console.log(`📊 控制面板: http://localhost:${port}`);
    });
  }
}

module.exports = AIServer;
