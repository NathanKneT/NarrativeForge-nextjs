const fs = require('fs');
const path = require('path');

console.log('🚀 PERFORMANCE AUDIT DÉTAILLÉ\n');

// Analyser .next/static
function analyzeBundleSize() {
  const staticPath = '.next/static';
  if (!fs.existsSync(staticPath)) {
    console.log('❌ Pas de build trouvé');
    return;
  }

  let totalSize = 0;
  const jsFiles = [];
  
  function scanDir(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        scanDir(fullPath);
      } else if (file.name.endsWith('.js')) {
        const stats = fs.statSync(fullPath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        jsFiles.push({ name: file.name, size: stats.size, sizeKB });
        totalSize += stats.size;
      }
    }
  }
  
  scanDir(staticPath);
  
  // Trier par taille
  jsFiles.sort((a, b) => b.size - a.size);
  
  console.log('📦 BUNDLE SIZE ANALYSIS:');
  console.log(`   Total: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Fichiers JS: ${jsFiles.length}`);
  
  console.log('\n🔥 TOP 5 PLUS GROS FICHIERS:');
  jsFiles.slice(0, 5).forEach((file, i) => {
    console.log(`   ${i+1}. ${file.name}: ${file.sizeKB} KB`);
  });
  
  // Recommandations
  console.log('\n💡 RECOMMANDATIONS:');
  if (totalSize > 1024 * 1024) { // > 1MB
    console.log('   🚨 Bundle trop gros (>1MB)');
    console.log('   → Lazy loading obligatoire');
    console.log('   → Code splitting nécessaire');
  }
  
  const bigFiles = jsFiles.filter(f => f.size > 100 * 1024); // >100KB
  if (bigFiles.length > 0) {
    console.log(`   ⚠️ ${bigFiles.length} fichiers >100KB détectés`);
    console.log('   → Possibles candidats pour lazy loading');
  }
}

analyzeBundleSize();

// Score performance
console.log('\n🎯 SCORE PERFORMANCE:');
const staticExists = fs.existsSync('.next/static');
const buildWorks = staticExists;

let score = 40; // Base
if (buildWorks) score += 20;

console.log(`   Build: ${buildWorks ? '✅' : '❌'} (+20)`);
console.log(`   Bundle Analyzer: ⏳ (+10 when configured)`);
console.log(`   Lazy Loading: ⏳ (+20 when implemented)`);
console.log(`   Code Splitting: ⏳ (+10 when optimized)`);

console.log(`\n📊 SCORE ACTUEL: ${score}/100`);
console.log('🎯 PROCHAINE ÉTAPE: Bundle analysis + Lazy loading');