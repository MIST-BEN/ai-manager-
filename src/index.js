const AIScanner = require('./scanner');
const AIServer = require('./server');

async function main() {
  console.log('🤖 AI检测和管理系统 v1.0.0');
  console.log('================================\n');

  const scanner = new AIScanner();
  const server = new AIServer(scanner);

  console.log('正在扫描系统中的AI组件...\n');
  const results = await scanner.fullScan();
  
  console.log('\n📊 扫描结果汇总:');
  console.log(`  AI服务: ${results.services.length} 个`);
  console.log(`  AI模型: ${results.models.length} 个`);
  console.log(`  AI应用: ${results.apps.length} 个`);
  console.log(`  AI进程: ${results.processes.length} 个\n`);

  server.start(3000);
}

main().catch(console.error);
