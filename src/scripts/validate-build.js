const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 ASYLUM INTERACTIVE - FAANG VALIDATION PIPELINE\n');

let exitCode = 0;
const results = [];

// Fonction utilitaire pour exécuter des commandes
function runCommand(command, description) {
  try {
    console.log(`🔍 ${description}...`);
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description} - SUCCESS`);
    results.push({ check: description, status: 'PASS', details: 'Command executed successfully' });
    return output;
  } catch (error) {
    console.log(`❌ ${description} - FAILED`);
    console.log(`   Error: ${error.message}`);
    results.push({ check: description, status: 'FAIL', details: error.message });
    exitCode = 1;
    return null;
  }
}

// Fonction pour vérifier l'existence de fichiers
function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    console.log(`✅ ${description} - FOUND`);
    results.push({ check: description, status: 'PASS', details: `File found: ${filePath}` });
  } else {
    console.log(`❌ ${description} - MISSING`);
    results.push({ check: description, status: 'FAIL', details: `File missing: ${filePath}` });
    exitCode = 1;
  }
  return exists;
}

// 1. VÉRIFICATIONS STRUCTURELLES
console.log('📁 STRUCTURAL CHECKS');
console.log('────────────────────');

checkFile('package.json', 'Package.json exists');
checkFile('tsconfig.json', 'TypeScript config exists');
checkFile('next.config.js', 'Next.js config exists');
checkFile('tailwind.config.js', 'Tailwind config exists');
checkFile('jest.config.cjs', 'Jest config exists');

// 2. VÉRIFICATIONS TYPESCRIPT
console.log('\n📝 TYPESCRIPT VALIDATION');
console.log('─────────────────────────');

runCommand('npx tsc --noEmit', 'TypeScript compilation check');

// 3. VÉRIFICATIONS ESLINT
console.log('\n🔍 CODE QUALITY CHECKS');
console.log('──────────────────────');

runCommand('npm run lint', 'ESLint validation');

// 4. VÉRIFICATIONS DES TESTS
console.log('\n🧪 TEST VALIDATION');
console.log('──────────────────');

// Vérifier si des fichiers de test existent
const testFiles = [];
function findTestFiles(dir) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findTestFiles(filePath);
    } else if (file.includes('.test.') || file.includes('.spec.')) {
      testFiles.push(filePath);
    }
  });
}

findTestFiles('./src');

if (testFiles.length > 0) {
  console.log(`✅ Test files found - ${testFiles.length} files`);
  results.push({ 
    check: 'Test files exist', 
    status: 'PASS', 
    details: `Found ${testFiles.length} test files` 
  });
  
  // Exécuter les tests
  runCommand('npm run test:ci', 'Test suite execution');
} else {
  console.log('⚠️ No test files found - Creating basic test structure recommended');
  results.push({ 
    check: 'Test files exist', 
    status: 'WARN', 
    details: 'No test files found' 
  });
}

// 5. VÉRIFICATIONS DE BUILD
console.log('\n🏗️ BUILD VALIDATION');
console.log('───────────────────');

runCommand('npm run build', 'Production build');

// Vérifier que le build a créé les fichiers attendus
if (checkFile('.next', 'Build output directory')) {
  checkFile('.next/static', 'Static assets directory');
  
  // Analyser la taille du bundle
  const staticDir = path.join('.next', 'static');
  if (fs.existsSync(staticDir)) {
    let totalSize = 0;
    function calculateSize(dir) {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          calculateSize(filePath);
        } else {
          totalSize += stat.size;
        }
      });
    }
    
    calculateSize(staticDir);
    const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
    
    if (totalSize < 5 * 1024 * 1024) { // < 5MB
      console.log(`✅ Bundle size check - ${sizeMB}MB (Good)`);
      results.push({ 
        check: 'Bundle size', 
        status: 'PASS', 
        details: `${sizeMB}MB - Within acceptable limits` 
      });
    } else {
      console.log(`⚠️ Bundle size check - ${sizeMB}MB (Large)`);
      results.push({ 
        check: 'Bundle size', 
        status: 'WARN', 
        details: `${sizeMB}MB - Consider optimization` 
      });
    }
  }
}

// 6. VÉRIFICATIONS DE SÉCURITÉ
console.log('\n🔒 SECURITY VALIDATION');
console.log('─────────────────────');

// Audit de sécurité npm
runCommand('npm audit --audit-level=high', 'Security audit');

// Vérifier les headers de sécurité dans next.config.js
const nextConfigPath = 'next.config.js';
if (fs.existsSync(nextConfigPath)) {
  const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
  const securityHeaders = [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'Content-Security-Policy',
    'Referrer-Policy',
    'Permissions-Policy'
  ];
  
  const foundHeaders = securityHeaders.filter(header => nextConfig.includes(header));
  
  if (foundHeaders.length >= 4) {
    console.log(`✅ Security headers - ${foundHeaders.length}/${securityHeaders.length} configured`);
    results.push({ 
      check: 'Security headers', 
      status: 'PASS', 
      details: `${foundHeaders.length} security headers configured` 
    });
  } else {
    console.log(`⚠️ Security headers - ${foundHeaders.length}/${securityHeaders.length} configured`);
    results.push({ 
      check: 'Security headers', 
      status: 'WARN', 
      details: `Only ${foundHeaders.length} security headers found` 
    });
  }
}

// 7. VÉRIFICATIONS API
console.log('\n🌐 API VALIDATION');
console.log('─────────────────');

checkFile('src/app/api/health/route.ts', 'Health API endpoint');
checkFile('src/app/api/metrics/route.ts', 'Metrics API endpoint');

// 8. RÉSUMÉ FINAL
console.log('\n📊 VALIDATION SUMMARY');
console.log('═════════════════════');

const passCount = results.filter(r => r.status === 'PASS').length;
const failCount = results.filter(r => r.status === 'FAIL').length;
const warnCount = results.filter(r => r.status === 'WARN').length;
const totalChecks = results.length;

console.log(`Total Checks: ${totalChecks}`);
console.log(`✅ Passed: ${passCount}`);
console.log(`⚠️ Warnings: ${warnCount}`);
console.log(`❌ Failed: ${failCount}`);

const score = Math.round((passCount / totalChecks) * 100);
console.log(`\n🎯 FAANG READINESS SCORE: ${score}/100`);

if (score >= 95) {
  console.log('🚀 EXCELLENT - Ready for FAANG deployment!');
} else if (score >= 85) {
  console.log('✨ VERY GOOD - Almost FAANG ready, minor improvements needed');
} else if (score >= 70) {
  console.log('🔧 GOOD - Solid foundation, some optimization needed');
} else {
  console.log('⚠️ NEEDS WORK - Significant improvements required');
}

// Sauvegarder le rapport détaillé
const report = {
  timestamp: new Date().toISOString(),
  score,
  summary: { total: totalChecks, passed: passCount, warnings: warnCount, failed: failCount },
  results,
  recommendations: generateRecommendations(results),
};

fs.writeFileSync('validation-report.json', JSON.stringify(report, null, 2));
console.log('\n📄 Detailed report saved to: validation-report.json');

// Fonction pour générer des recommandations
function generateRecommendations(results) {
  const recommendations = [];
  
  const failedChecks = results.filter(r => r.status === 'FAIL');
  const warningChecks = results.filter(r => r.status === 'WARN');
  
  if (failedChecks.length > 0) {
    recommendations.push('🔥 CRITICAL: Fix failed checks before deployment');
    failedChecks.forEach(check => {
      recommendations.push(`   - ${check.check}: ${check.details}`);
    });
  }
  
  if (warningChecks.length > 0) {
    recommendations.push('⚠️ IMPROVEMENTS: Address warnings for optimal performance');
    warningChecks.forEach(check => {
      recommendations.push(`   - ${check.check}: ${check.details}`);
    });
  }
  
  if (failedChecks.length === 0 && warningChecks.length === 0) {
    recommendations.push('🎉 All checks passed! Your project is FAANG-ready!');
  }
  
  return recommendations;
}

console.log('\n🔍 NEXT STEPS:');
if (exitCode === 0) {
  console.log('✅ All critical checks passed - Ready for deployment!');
  console.log('🚀 Run: npm run start');
} else {
  console.log('❌ Some checks failed - Please review and fix issues');
  console.log('📋 Check validation-report.json for detailed recommendations');
}

process.exit(exitCode);