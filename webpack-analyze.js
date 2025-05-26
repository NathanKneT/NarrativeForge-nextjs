const { execSync } = require('child_process');

console.log('🔍 ANALYSE WEBPACK DÉTAILLÉE\n');

try {
  // Forcer l'analyse avec des variables d'environnement
  process.env.ANALYZE = 'true';
  
  console.log('🏗️ Building avec analyse forcée...');
  execSync('npm run build', { 
    stdio: 'inherit',
    env: { ...process.env, ANALYZE: 'true' }
  });
  
  console.log('\n📊 Si le bundle analyzer ne s\'ouvre pas automatiquement:');
  console.log('1. Cherchez un fichier .next/analyze/');
  console.log('2. Ou installez webpack-bundle-analyzer globalement:');
  console.log('   npm install -g webpack-bundle-analyzer');
  console.log('3. Puis: webpack-bundle-analyzer .next/static/chunks/');
  
} catch (error) {
  console.error('❌ Erreur build:', error.message);
}