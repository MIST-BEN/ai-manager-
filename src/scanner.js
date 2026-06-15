const AIServiceDetector = require('./services/detector');
const AIModelScanner = require('./models/scanner');
const AIAppDetector = require('./apps/detector');
const ProcessManager = require('./utils/process');

class AIScanner {
  constructor() {
    this.serviceDetector = new AIServiceDetector();
    this.modelScanner = new AIModelScanner();
    this.appDetector = new AIAppDetector();
    this.processManager = new ProcessManager();
    this.results = {
      services: [],
      models: [],
      apps: [],
      processes: []
    };
  }

  async fullScan() {
    console.log('🔍 扫描AI服务...');
    this.results.services = await this.serviceDetector.scan();

    console.log('📁 扫描AI模型文件...');
    this.results.models = await this.modelScanner.scan();

    console.log('💻 检测AI应用程序...');
    this.results.apps = await this.appDetector.scan();

    console.log('⚙️ 扫描AI相关进程...');
    this.results.processes = await this.processManager.scan();

    return this.results;
  }

  getResults() {
    return this.results;
  }
}

// 直接运行时执行扫描
if (require.main === module) {
  const scanner = new AIScanner();
  scanner.fullScan().then(results => {
    console.log('\n📊 扫描结果汇总:');
    console.log(`  AI服务: ${results.services.length} 个`);
    console.log(`  AI模型: ${results.models.length} 个`);
    console.log(`  AI应用: ${results.apps.length} 个`);
    console.log(`  AI进程: ${results.processes.length} 个`);
    
    if (results.services.length > 0) {
      console.log('\n🔧 运行中的AI服务:');
      results.services.forEach(s => console.log(`  - ${s.name} (端口: ${s.port})`));
    }
    
    if (results.models.length > 0) {
      console.log('\n📁 发现的AI模型:');
      results.models.slice(0, 10).forEach(m => console.log(`  - ${m.name} (${m.sizeFormatted})`));
      if (results.models.length > 10) {
        console.log(`  ... 还有 ${results.models.length - 10} 个模型`);
      }
    }
    
    if (results.apps.length > 0) {
      console.log('\n💻 检测到的AI应用:');
      results.apps.forEach(a => console.log(`  - ${a.name} (${a.running ? '运行中' : '已安装'})`));
    }
    
    if (results.processes.length > 0) {
      console.log('\n⚙️ AI相关进程:');
      results.processes.forEach(p => console.log(`  - ${p.name} (PID: ${p.pid})`));
    }
  }).catch(console.error);
}

module.exports = AIScanner;
