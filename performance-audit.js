const fs = require('fs');
const path = require('path');

class PerformanceAuditor {
  constructor() {
    this.results = {
      score: 0,
      checks: [],
      recommendations: [],
      timestamp: new Date().toISOString(),
    };
  }

  async runAudit() {
    console.log('🚀 Starting Performance Audit...\n');
    
    await this.checkBundleSize();
    await this.checkLazyLoading();
    await this.checkSecurityHeaders();
    await this.checkPerformanceMonitoring();
    await this.checkTestCoverage();
    await this.checkTypeScript();
    await this.checkMetadata();
    
    this.calculateScore();
    this.generateReport();
    
    return this.results;
  }

  async checkBundleSize() {
    const check = { name: 'Bundle Size', status: 'unknown', points: 0, maxPoints: 20 };
    
    try {
      const buildDir = path.join(process.cwd(), '.next');
      if (!fs.existsSync(buildDir)) {
        check.status = 'warning';
        check.message = 'Build directory not found. Run npm run build first.';
        this.results.recommendations.push('Run "npm run build" to generate build artifacts');
      } else {
        // Check for main chunks
        const staticDir = path.join(buildDir, 'static', 'chunks');
        if (fs.existsSync(staticDir)) {
          const files = fs.readdirSync(staticDir);
          const mainChunks = files.filter(f => f.includes('main') || f.includes('pages'));
          
          if (mainChunks.length > 0) {
            check.status = 'pass';
            check.points = 20;
            check.message = `Found optimized chunks: ${mainChunks.length} files`;
          }
        }
      }
    } catch (error) {
      check.status = 'fail';
      check.message = `Error checking bundle: ${error.message}`;
    }
    
    this.results.checks.push(check);
  }

  async checkLazyLoading() {
    const check = { name: 'Lazy Loading', status: 'unknown', points: 0, maxPoints: 15 };
    
    try {
      const editorPage = path.join(process.cwd(), 'src', 'app', 'editor', 'page.tsx');
      const homePage = path.join(process.cwd(), 'src', 'app', 'page.tsx');
      
      let foundLazyLoading = 0;
      
      if (fs.existsSync(editorPage)) {
        const content = fs.readFileSync(editorPage, 'utf8');
        if (content.includes('dynamic') && content.includes('ssr: false')) {
          foundLazyLoading++;
        }
      }
      
      if (fs.existsSync(homePage)) {
        const content = fs.readFileSync(homePage, 'utf8');
        if (content.includes('dynamic')) {
          foundLazyLoading++;
        }
      }
      
      if (foundLazyLoading >= 1) {
        check.status = 'pass';
        check.points = 15;
        check.message = `Lazy loading implemented in ${foundLazyLoading} page(s)`;
      } else {
        check.status = 'fail';
        check.message = 'No lazy loading detected';
        this.results.recommendations.push('Implement dynamic imports for heavy components');
      }
    } catch (error) {
      check.status = 'fail';
      check.message = `Error checking lazy loading: ${error.message}`;
    }
    
    this.results.checks.push(check);
  }

  async checkSecurityHeaders() {
    const check = { name: 'Security Headers', status: 'unknown', points: 0, maxPoints: 20 };
    
    try {
      const configPath = path.join(process.cwd(), 'next.config.js');
      
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf8');
        
        const securityFeatures = [
          'X-Content-Type-Options',
          'X-Frame-Options',
          'Content-Security-Policy',
          'Referrer-Policy',
          'Permissions-Policy'
        ];
        
        const foundFeatures = securityFeatures.filter(feature => 
          content.includes(feature)
        );
        
        if (foundFeatures.length >= 4) {
          check.status = 'pass';
          check.points = 20;
          check.message = `Security headers configured: ${foundFeatures.join(', ')}`;
        } else {
          check.status = 'partial';
          check.points = Math.round((foundFeatures.length / securityFeatures.length) * 20);
          check.message = `Partial security headers: ${foundFeatures.length}/${securityFeatures.length}`;
          this.results.recommendations.push('Add missing security headers in next.config.js');
        }
      } else {
        check.status = 'fail';
        check.message = 'next.config.js not found';
        this.results.recommendations.push('Create next.config.js with security headers');
      }
    } catch (error) {
      check.status = 'fail';
      check.message = `Error checking security headers: ${error.message}`;
    }
    
    this.results.checks.push(check);
  }

  async checkPerformanceMonitoring() {
    const check = { name: 'Performance Monitoring', status: 'unknown', points: 0, maxPoints: 15 };
    
    try {
      const monitorPath = path.join(process.cwd(), 'src', 'lib', 'performanceMonitor.ts');
      const metricsPath = path.join(process.cwd(), 'src', 'app', 'api', 'metrics', 'route.ts');
      
      let foundFeatures = 0;
      
      if (fs.existsSync(monitorPath)) {
        const content = fs.readFileSync(monitorPath, 'utf8');
        if (content.includes('WebVitalsMetric') && content.includes('performanceMonitor')) {
          foundFeatures++;
        }
      }
      
      if (fs.existsSync(metricsPath)) {
        foundFeatures++;
      }
      
      if (foundFeatures >= 2) {
        check.status = 'pass';
        check.points = 15;
        check.message = 'Performance monitoring fully implemented';
      } else if (foundFeatures === 1) {
        check.status = 'partial';
        check.points = 8;
        check.message = 'Performance monitoring partially implemented';
        this.results.recommendations.push('Complete performance monitoring setup');
      } else {
        check.status = 'fail';
        check.message = 'No performance monitoring detected';
        this.results.recommendations.push('Implement Web Vitals monitoring');
      }
    } catch (error) {
      check.status = 'fail';
      check.message = `Error checking performance monitoring: ${error.message}`;
    }
    
    this.results.checks.push(check);
  }

  async checkTestCoverage() {
    const check = { name: 'Test Coverage', status: 'unknown', points: 0, maxPoints: 15 };
    
    try {
      const testsDir = path.join(process.cwd(), 'src', '__tests__');
      const jestConfig = path.join(process.cwd(), 'jest.config.cjs');
      
      let foundTests = 0;
      
      if (fs.existsSync(testsDir)) {
        const testFiles = this.findTestFiles(testsDir);
        foundTests = testFiles.length;
      }
      
      const hasJestConfig = fs.existsSync(jestConfig);
      
      if (foundTests >= 5 && hasJestConfig) {
        check.status = 'pass';
        check.points = 15;
        check.message = `Found ${foundTests} test files with Jest configuration`;
      } else if (foundTests >= 2 || hasJestConfig) {
        check.status = 'partial';
        check.points = 8;
        check.message = `Partial test setup: ${foundTests} tests, Jest config: ${hasJestConfig}`;
        this.results.recommendations.push('Expand test coverage and ensure Jest is properly configured');
      } else {
        check.status = 'fail';
        check.message = 'Insufficient test coverage';
        this.results.recommendations.push('Add comprehensive test suite');
      }
    } catch (error) {
      check.status = 'fail';
      check.message = `Error checking tests: ${error.message}`;
    }
    
    this.results.checks.push(check);
  }

  async checkTypeScript() {
    const check = { name: 'TypeScript Configuration', status: 'unknown', points: 0, maxPoints: 10 };
    
    try {
      const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
      
      if (fs.existsSync(tsconfigPath)) {
        const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
        
        const requiredOptions = ['strict', 'baseUrl', 'paths'];
        const foundOptions = requiredOptions.filter(option => 
          content.compilerOptions && content.compilerOptions[option] !== undefined
        );
        
        if (foundOptions.length >= 2) {
          check.status = 'pass';
          check.points = 10;
          check.message = 'TypeScript properly configured';
        } else {
          check.status = 'partial';
          check.points = 5;
          check.message = 'Basic TypeScript configuration';
        }
      } else {
        check.status = 'fail';
        check.message = 'TypeScript configuration missing';
        this.results.recommendations.push('Configure TypeScript with strict mode');
      }
    } catch (error) {
      check.status = 'fail';
      check.message = `Error checking TypeScript: ${error.message}`;
    }
    
    this.results.checks.push(check);
  }

  async checkMetadata() {
    const check = { name: 'SEO & Metadata', status: 'unknown', points: 0, maxPoints: 5 };
    
    try {
      const layoutPath = path.join(process.cwd(), 'src', 'app', 'layout.tsx');
      
      if (fs.existsSync(layoutPath)) {
        const content = fs.readFileSync(layoutPath, 'utf8');
        
        if (content.includes('metadata') && content.includes('title') && content.includes('description')) {
          check.status = 'pass';
          check.points = 5;
          check.message = 'SEO metadata configured';
        } else {
          check.status = 'partial';
          check.points = 2;
          check.message = 'Basic metadata present';
        }
      } else {
        check.status = 'fail';
        check.message = 'Layout file not found';
      }
    } catch (error) {
      check.status = 'fail';
      check.message = `Error checking metadata: ${error.message}`;
    }
    
    this.results.checks.push(check);
  }

  findTestFiles(dir) {
    const files = [];
    
    function traverse(currentDir) {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          traverse(fullPath);
        } else if (item.includes('.test.') || item.includes('.spec.')) {
          files.push(fullPath);
        }
      }
    }
    
    traverse(dir);
    return files;
  }

  calculateScore() {
    const totalPoints = this.results.checks.reduce((sum, check) => sum + check.points, 0);
    const maxPoints = this.results.checks.reduce((sum, check) => sum + check.maxPoints, 0);
    
    this.results.score = Math.round((totalPoints / maxPoints) * 100);
    this.results.totalPoints = totalPoints;
    this.results.maxPoints = maxPoints;
  }

  generateReport() {
    console.log('\n📊 ASYLUM PERFORMANCE AUDIT REPORT');
    console.log('=====================================\n');
    
    console.log(`🎯 OVERALL SCORE: ${this.results.score}/100`);
    console.log(`📈 Points: ${this.results.totalPoints}/${this.results.maxPoints}\n`);
    
    // Status indicators
    const getStatusIcon = (status) => {
      switch (status) {
        case 'pass': return '✅';
        case 'partial': return '⚠️';
        case 'fail': return '❌';
        default: return '❓';
      }
    };
    
    console.log('📋 DETAILED RESULTS:');
    console.log('────────────────────');
    
    this.results.checks.forEach(check => {
      const icon = getStatusIcon(check.status);
      const score = `${check.points}/${check.maxPoints}`;
      console.log(`${icon} ${check.name.padEnd(25)} ${score.padStart(8)} │ ${check.message}`);
    });
    
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      console.log('───────────────────');
      this.results.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
    }
    
    console.log('\n🏆 FAANG READINESS:');
    console.log('──────────────────');
    
    if (this.results.score >= 95) {
      console.log('🚀 EXCELLENT - Ready for FAANG deployment!');
    } else if (this.results.score >= 85) {
      console.log('✨ VERY GOOD - Almost FAANG ready, minor improvements needed');
    } else if (this.results.score >= 70) {
      console.log('🔧 GOOD - Solid foundation, some optimization needed');
    } else {
      console.log('⚠️  NEEDS WORK - Significant improvements required');
    }
    
    // Write detailed report
    const reportPath = path.join(process.cwd(), 'performance-audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    console.log(`\n🕒 Audit completed at: ${this.results.timestamp}\n`);
  }
}

// Run audit if called directly
if (require.main === module) {
  const auditor = new PerformanceAuditor();
  auditor.runAudit().then(results => {
    process.exit(results.score >= 95 ? 0 : 1);
  }).catch(error => {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  });
}

module.exports = PerformanceAuditor;