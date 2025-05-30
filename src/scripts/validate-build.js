const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 ASYLUM INTERACTIVE - ENHANCED VALIDATION PIPELINE\n');

let exitCode = 0;
const results = [];
const startTime = Date.now();

// Enhanced result tracking
function addResult(check, status, details, recommendation = null) {
  results.push({ 
    check, 
    status, 
    details, 
    recommendation,
    timestamp: new Date().toISOString()
  });
}

// Enhanced command execution with better error handling
function runCommand(command, description, { timeout = 30000, critical = true } = {}) {
  try {
    console.log(`🔍 ${description}...`);
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      timeout,
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });
    console.log(`✅ ${description} - SUCCESS`);
    addResult(description, 'PASS', 'Command executed successfully');
    return output;
  } catch (error) {
    console.log(`❌ ${description} - FAILED`);
    console.log(`   Error: ${error.message}`);
    const recommendation = critical ? 'Fix this issue before deployment' : 'Consider fixing in next iteration';
    addResult(description, critical ? 'FAIL' : 'WARN', error.message, recommendation);
    if (critical) {
      exitCode = 1;
    }
    return null;
  }
}

// Enhanced file checking with size and content validation
function checkFile(filePath, description, { validateContent = null, maxSizeKB = null } = {}) {
  const exists = fs.existsSync(filePath);
  if (!exists) {
    console.log(`❌ ${description} - MISSING`);
    addResult(description, 'FAIL', `File missing: ${filePath}`, 'Create the missing file');
    exitCode = 1;
    return false;
  }

  const stats = fs.statSync(filePath);
  const sizeKB = Math.round(stats.size / 1024);
  
  if (maxSizeKB && sizeKB > maxSizeKB) {
    console.log(`⚠️ ${description} - TOO LARGE (${sizeKB}KB > ${maxSizeKB}KB)`);
    addResult(description, 'WARN', `File too large: ${sizeKB}KB`, 'Consider optimizing file size');
  } else {
    console.log(`✅ ${description} - FOUND (${sizeKB}KB)`);
    addResult(description, 'PASS', `File found: ${filePath} (${sizeKB}KB)`);
  }

  // Content validation if provided
  if (validateContent) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const isValid = validateContent(content);
      if (!isValid) {
        addResult(`${description} (content)`, 'WARN', 'Content validation failed', 'Review file content');
      }
    } catch (error) {
      addResult(`${description} (content)`, 'WARN', 'Could not validate content');
    }
  }

  return true;
}

// 🔧 PHASE 1: ENHANCED STRUCTURAL CHECKS
console.log('📁 ENHANCED STRUCTURAL CHECKS');
console.log('─────────────────────────────');

checkFile('package.json', 'Package.json', {
  validateContent: (content) => {
    try {
      const pkg = JSON.parse(content);
      return pkg.name && pkg.scripts && pkg.dependencies;
    } catch {
      return false;
    }
  }
});

checkFile('tsconfig.json', 'TypeScript config', {
  validateContent: (content) => content.includes('"strict": true')
});

checkFile('next.config.js', 'Next.js config');
checkFile('tailwind.config.js', 'Tailwind config');
checkFile('jest.config.cjs', 'Jest config');

// Check critical source directories
const criticalDirs = [
  'src/components',
  'src/lib', 
  'src/stores',
  'src/types',
  'src/__tests__'
];

criticalDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    console.log(`✅ ${dir} directory - ${files.length} files`);
    addResult(`${dir} directory`, 'PASS', `${files.length} files found`);
  } else {
    console.log(`❌ ${dir} directory - MISSING`);
    addResult(`${dir} directory`, 'FAIL', 'Critical directory missing');
    exitCode = 1;
  }
});

// 🔧 PHASE 2: ENHANCED TYPESCRIPT VALIDATION
console.log('\n📝 ENHANCED TYPESCRIPT VALIDATION');
console.log('─────────────────────────────────');

const tsOutput = runCommand('npx tsc --noEmit --incremental false', 'TypeScript strict compilation');

// Count TypeScript files
const tsFiles = [];
function findTSFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findTSFiles(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      tsFiles.push(filePath);
    }
  });
}

findTSFiles('./src');
console.log(`📊 TypeScript files: ${tsFiles.length}`);
addResult('TypeScript file count', 'INFO', `${tsFiles.length} .ts/.tsx files found`);

// 🔧 PHASE 3: ENHANCED CODE QUALITY CHECKS
console.log('\n🔍 ENHANCED CODE QUALITY CHECKS');
console.log('─────────────────────────────────');

runCommand('npm run lint', 'ESLint validation');
runCommand('npm run format:check', 'Prettier formatting check', { critical: false });

// Check for common code quality issues
const codeQualityChecks = {
  'console.log usage': (content) => {
    const logs = content.match(/console\.log/g);
    return !logs || logs.length < 5; // Max 5 console.logs acceptable
  },
  'TODO comments': (content) => {
    const todos = content.match(/\/\/ TODO|\/\* TODO/g);
    return !todos || todos.length < 10; // Max 10 TODOs acceptable
  },
  'any type usage': (content) => {
    const anyUsage = content.match(/:\s*any\b/g);
    return !anyUsage || anyUsage.length < 3; // Max 3 'any' types
  }
};

let totalIssues = 0;
tsFiles.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    Object.entries(codeQualityChecks).forEach(([checkName, validator]) => {
      if (!validator(content)) {
        totalIssues++;
      }
    });
  } catch (error) {
    // Skip files that can't be read
  }
});

if (totalIssues === 0) {
  console.log('✅ Code quality checks - EXCELLENT');
  addResult('Code quality', 'PASS', 'No major quality issues found');
} else if (totalIssues < 10) {
  console.log(`⚠️ Code quality checks - ${totalIssues} minor issues`);
  addResult('Code quality', 'WARN', `${totalIssues} minor issues found`, 'Review and clean up code');
} else {
  console.log(`❌ Code quality checks - ${totalIssues} issues found`);
  addResult('Code quality', 'FAIL', `${totalIssues} issues found`, 'Significant cleanup needed');
  exitCode = 1;
}

// 🔧 PHASE 4: ENHANCED TEST VALIDATION
console.log('\n🧪 ENHANCED TEST VALIDATION');
console.log('──────────────────────────');

// Find test files
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
  addResult('Test files exist', 'PASS', `Found ${testFiles.length} test files`);
  
  // Run tests with coverage
  const testOutput = runCommand('npm run test:ci', 'Test suite execution with coverage');
  
  // Parse coverage if available
  if (fs.existsSync('coverage/coverage-summary.json')) {
    try {
      const coverage = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
      const totalCoverage = coverage.total;
      
      const coverageScore = Math.round(
        (totalCoverage.lines.pct + totalCoverage.functions.pct + 
         totalCoverage.branches.pct + totalCoverage.statements.pct) / 4
      );
      
      console.log(`📊 Test Coverage: ${coverageScore}%`);
      if (coverageScore >= 70) {
        addResult('Test coverage', 'PASS', `${coverageScore}% coverage`);
      } else if (coverageScore >= 50) {
        addResult('Test coverage', 'WARN', `${coverageScore}% coverage`, 'Increase test coverage');
      } else {
        addResult('Test coverage', 'FAIL', `${coverageScore}% coverage`, 'Significantly increase test coverage');
        exitCode = 1;
      }
    } catch (error) {
      addResult('Test coverage', 'WARN', 'Could not parse coverage report');
    }
  }
} else {
  console.log('⚠️ No test files found');
  addResult('Test files exist', 'FAIL', 'No test files found', 'Create comprehensive test suite');
  exitCode = 1;
}

// 🔧 PHASE 5: ENHANCED BUILD VALIDATION
console.log('\n🏗️ ENHANCED BUILD VALIDATION');
console.log('────────────────────────');

const buildOutput = runCommand('npm run build', 'Production build');

if (checkFile('.next', 'Build output directory')) {
  checkFile('.next/static', 'Static assets directory');
  
  // Enhanced bundle analysis
  if (fs.existsSync('.next/static')) {
    let totalSize = 0;
    let jsSize = 0;
    let cssSize = 0;
    
    function calculateSize(dir) {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          calculateSize(filePath);
        } else {
          totalSize += stat.size;
          if (file.endsWith('.js')) jsSize += stat.size;
          if (file.endsWith('.css')) cssSize += stat.size;
        }
      });
    }
    
    calculateSize('.next/static');
    const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
    const jsSizeMB = (jsSize / 1024 / 1024).toFixed(2);
    const cssSizeMB = (cssSize / 1024 / 1024).toFixed(2);
    
    console.log(`📊 Bundle Analysis:`);
    console.log(`   Total: ${sizeMB}MB`);
    console.log(`   JavaScript: ${jsSizeMB}MB`);
    console.log(`   CSS: ${cssSizeMB}MB`);
    
    if (totalSize < 5 * 1024 * 1024) { // < 5MB
      addResult('Bundle size', 'PASS', `${sizeMB}MB - Excellent`);
    } else if (totalSize < 10 * 1024 * 1024) { // < 10MB
      addResult('Bundle size', 'WARN', `${sizeMB}MB - Consider optimization`, 'Analyze and optimize large dependencies');
    } else {
      addResult('Bundle size', 'FAIL', `${sizeMB}MB - Too large`, 'Significant optimization required');
      exitCode = 1;
    }
  }
}

// 🔧 PHASE 6: ENHANCED SECURITY VALIDATION
console.log('\n🔒 ENHANCED SECURITY VALIDATION');
console.log('──────────────────────────────');

runCommand('npm audit --audit-level=moderate', 'Security audit');

// Check for security best practices
const securityChecks = [
  {
    file: 'next.config.js',
    check: 'Security headers',
    patterns: ['X-Content-Type-Options', 'X-Frame-Options', 'Content-Security-Policy']
  },
  {
    file: 'package.json',
    check: 'Dependency versions',
    patterns: ['latest', 'react.*18', 'next.*14']
  }
];

securityChecks.forEach(({ file, check, patterns }) => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const found = patterns.filter(pattern => content.includes(pattern));
    
    if (found.length >= patterns.length - 1) {
      console.log(`✅ ${check} - GOOD`);
      addResult(check, 'PASS', `${found.length}/${patterns.length} checks passed`);
    } else {
      console.log(`⚠️ ${check} - NEEDS IMPROVEMENT`);
      addResult(check, 'WARN', `${found.length}/${patterns.length} checks passed`, 'Review security configuration');
    }
  }
});

// 🔧 PHASE 7: PERFORMANCE CHECKS
console.log('\n⚡ PERFORMANCE VALIDATION');
console.log('──────────────────────────');

// Check for performance best practices
const perfChecks = {
  'Dynamic imports': (content) => content.includes('dynamic('),
  'Image optimization': (content) => content.includes('next/image'),
  'Lazy loading': (content) => content.includes('lazy') || content.includes('Suspense'),
};

let perfScore = 0;
const perfResults = [];

tsFiles.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    Object.entries(perfChecks).forEach(([checkName, validator]) => {
      if (validator(content)) {
        perfScore++;
        if (!perfResults.includes(checkName)) {
          perfResults.push(checkName);
        }
      }
    });
  } catch (error) {
    // Skip files that can't be read
  }
});

console.log(`📊 Performance Features: ${perfResults.length}/${Object.keys(perfChecks).length}`);
if (perfResults.length >= 2) {
  addResult('Performance optimization', 'PASS', `${perfResults.length} optimizations found`);
} else {
  addResult('Performance optimization', 'WARN', `${perfResults.length} optimizations found`, 'Add more performance optimizations');
}

// 🔧 PHASE 8: FINAL SUMMARY
console.log('\n📊 ENHANCED VALIDATION SUMMARY');
console.log('═══════════════════════════════');

const passCount = results.filter(r => r.status === 'PASS').length;
const failCount = results.filter(r => r.status === 'FAIL').length;
const warnCount = results.filter(r => r.status === 'WARN').length;
const totalChecks = results.length;

const executionTime = Math.round((Date.now() - startTime) / 1000);

console.log(`Execution Time: ${executionTime}s`);
console.log(`Total Checks: ${totalChecks}`);
console.log(`✅ Passed: ${passCount}`);
console.log(`⚠️ Warnings: ${warnCount}`);
console.log(`❌ Failed: ${failCount}`);

const score = Math.round((passCount / totalChecks) * 100);
console.log(`\n🎯 ENHANCED READINESS SCORE: ${score}/100`);

// Enhanced scoring with specific recommendations
if (score >= 95) {
  console.log('🚀 EXCELLENT - Production ready!');
} else if (score >= 85) {
  console.log('✨ VERY GOOD - Minor improvements recommended');
} else if (score >= 70) {
  console.log('🔧 GOOD - Some optimization needed');
} else if (score >= 50) {
  console.log('⚠️ NEEDS WORK - Significant improvements required');
} else {
  console.log('🚨 CRITICAL - Major issues must be resolved');
}

// Generate enhanced report
const enhancedReport = {
  timestamp: new Date().toISOString(),
  executionTime,
  score,
  summary: { 
    total: totalChecks, 
    passed: passCount, 
    warnings: warnCount, 
    failed: failCount 
  },
  results,
  recommendations: generateEnhancedRecommendations(results),
  nextSteps: generateNextSteps(score, results),
  metadata: {
    nodeVersion: process.version,
    platform: process.platform,
    projectVersion: getProjectVersion(),
  }
};

fs.writeFileSync('validation-report-enhanced.json', JSON.stringify(enhancedReport, null, 2));
console.log('\n📄 Enhanced report saved to: validation-report-enhanced.json');

// Helper functions
function generateEnhancedRecommendations(results) {
  const recommendations = [];
  const failedChecks = results.filter(r => r.status === 'FAIL');
  const warningChecks = results.filter(r => r.status === 'WARN');
  
  if (failedChecks.length > 0) {
    recommendations.push('🔥 CRITICAL PRIORITIES:');
    failedChecks.forEach(check => {
      recommendations.push(`   • ${check.check}: ${check.recommendation || check.details}`);
    });
  }
  
  if (warningChecks.length > 0) {
    recommendations.push('⚠️ IMPROVEMENTS:');
    warningChecks.forEach(check => {
      recommendations.push(`   • ${check.check}: ${check.recommendation || 'Review and optimize'}`);
    });
  }
  
  // Phase-specific recommendations
  if (results.some(r => r.check.includes('Test') && r.status !== 'PASS')) {
    recommendations.push('📋 TESTING ROADMAP:');
    recommendations.push('   • Implement unit tests for critical components');
    recommendations.push('   • Add integration tests for user flows');
    recommendations.push('   • Set up E2E testing with Playwright');
  }
  
  return recommendations;
}

function generateNextSteps(score, results) {
  const steps = [];
  
  if (score < 70) {
    steps.push('1. Fix all critical failures immediately');
    steps.push('2. Address major warnings');
    steps.push('3. Re-run validation');
  } else if (score < 85) {
    steps.push('1. Review and fix warnings');
    steps.push('2. Improve test coverage');
    steps.push('3. Optimize performance');
  } else {
    steps.push('1. Address remaining minor issues');
    steps.push('2. Set up CI/CD pipeline');
    steps.push('3. Deploy to staging environment');
  }
  
  return steps;
}

function getProjectVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return pkg.version || '1.0.0';
  } catch {
    return 'unknown';
  }
}

console.log('\n🔍 NEXT ACTIONS:');
if (exitCode === 0) {
  console.log('✅ All critical checks passed - Ready for next phase!');
  console.log('🚀 Recommended: Set up CI/CD pipeline');
} else {
  console.log('❌ Critical issues found - Please address before proceeding');
  console.log('📋 Check validation-report-enhanced.json for detailed recommendations');
}

process.exit(exitCode);