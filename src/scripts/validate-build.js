#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

/**
 * Script de validation de build pour s'assurer que l'application
 * est prête pour la production FAANG-level
 */

class BuildValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
    
    console.log(chalk.blue.bold('🚀 Starting FAANG-level build validation...\n'));
  }

  // Validation TypeScript
  validateTypeScript() {
    console.log(chalk.yellow('📝 Validating TypeScript...'));
    
    try {
      execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
      this.passed.push('TypeScript compilation');
    } catch (error) {
      this.errors.push('TypeScript compilation failed');
      console.log(chalk.red('❌ TypeScript errors found'));
      console.log(error.stdout.toString());
    }
  }

  // Validation ESLint
  validateESLint() {
    console.log(chalk.yellow('🔍 Running ESLint...'));
    
    try {
      execSync('npx eslint src/ --ext .ts,.tsx --max-warnings 0', { stdio: 'pipe' });
      this.passed.push('ESLint validation');
    } catch (error) {
      this.errors.push('ESLint violations found');
      console.log(chalk.red('❌ ESLint errors found'));
      console.log(error.stdout.toString());
    }
  }

  // Validation des tests
  validateTests() {
    console.log(chalk.yellow('🧪 Running tests...'));
    
    try {
      const result = execSync('npm run test:ci', { stdio: 'pipe' }).toString();
      
      // Vérifier la couverture
      if (result.includes('All files')) {
        const coverageMatch = result.match(/All files\s+\|\s+(\d+\.?\d*)/);
        if (coverageMatch) {
          const coverage = parseFloat(coverageMatch[1]);
          if (coverage >= 90) {
            this.passed.push(`Test coverage: ${coverage}%`);
          } else {
            this.warnings.push(`Test coverage below 90%: ${coverage}%`);
          }
        }
      }
      
      this.passed.push('All tests passing');
    } catch (error) {
      this.errors.push('Tests failed');
      console.log(chalk.red('❌ Test failures found'));
    }
  }

  // Validation de la taille du bundle
  validateBundleSize() {
    console.log(chalk.yellow('📦 Analyzing bundle size...'));
    
    try {
      const buildDir = path.join(process.cwd(), '.next');
      
      if (!fs.existsSync(buildDir)) {
        this.errors.push('Build directory not found - run npm run build first');
        return;
      }

      // Vérifier la taille des chunks JS
      const staticDir = path.join(buildDir, 'static');
      if (fs.existsSync(staticDir)) {
        const jsDir = path.join(staticDir, 'chunks');
        if (fs.existsSync(jsDir)) {
          const jsFiles = fs.readdirSync(jsDir).filter(file => file.endsWith('.js'));
          
          let totalSize = 0;
          let largeFiles = [];
          
          jsFiles.forEach(file => {
            const filePath = path.join(jsDir, file);
            const stats = fs.statSync(filePath);
            const sizeKB = stats.size / 1024;
            totalSize += sizeKB;
            
            if (sizeKB > 500) { // Fichiers > 500KB
              largeFiles.push({ file, size: sizeKB });
            }
          });
          
          if (totalSize < 1000) { // Total < 1MB
            this.passed.push(`Bundle size: ${totalSize.toFixed(2)}KB`);
          } else {
            this.warnings.push(`Large bundle size: ${totalSize.toFixed(2)}KB`);
          }
          
          if (largeFiles.length > 0) {
            this.warnings.push(`Large chunks found: ${largeFiles.map(f => `${f.file} (${f.size.toFixed(2)}KB)`).join(', ')}`);
          }
        }
      }
    } catch (error) {
      this.warnings.push('Bundle analysis failed');
    }
  }

  // Validation de la sécurité
  validateSecurity() {
    console.log(chalk.yellow('🔒 Running security audit...'));
    
    try {
      execSync('npm audit --audit-level=moderate --production', { stdio: 'pipe' });
      this.passed.push('Security audit clean');
    } catch (error) {
      this.warnings.push('Security vulnerabilities found');
      console.log(chalk.yellow('⚠️  Run npm audit for details'));
    }
  }

  // Validation des dépendances
  validateDependencies() {
    console.log(chalk.yellow('📚 Checking dependencies...'));
    
    try {
      const packageJson = require('../package.json');
      
      // Vérifier les dépendances périmées
      const result = execSync('npx npm-check-updates --errorLevel 2', { stdio: 'pipe' }).toString();
      
      if (result.includes('All dependencies match')) {
        this.passed.push('Dependencies up to date');
      } else {
        this.warnings.push('Some dependencies may need updates');
      }
      
      // Vérifier la structure du package.json
      const requiredFields = ['name', 'version', 'scripts', 'dependencies'];
      const missingFields = requiredFields.filter(field => !packageJson[field]);
      
      if (missingFields.length === 0) {
        this.passed.push('Package.json structure valid');
      } else {
        this.errors.push(`Missing package.json fields: ${missingFields.join(', ')}`);
      }
      
    } catch (error) {
      this.warnings.push('Dependency check had issues');
    }
  }

  // Validation des fichiers de configuration
  validateConfiguration() {
    console.log(chalk.yellow('⚙️  Validating configuration...'));
    
    const requiredFiles = [
      'next.config.js',
      'tsconfig.json',
      'tailwind.config.js',
      '.eslintrc.json',
      'jest.config.js',
    ];
    
    const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
    
    if (missingFiles.length === 0) {
      this.passed.push('All configuration files present');
    } else {
      this.errors.push(`Missing configuration files: ${missingFiles.join(', ')}`);
    }
    
    // Vérifier next.config.js
    try {
      const nextConfig = require('../next.config.js');
      if (nextConfig.swcMinify !== undefined) {
        this.passed.push('SWC minification configured');
      }
      if (nextConfig.experimental?.optimizeCss) {
        this.passed.push('CSS optimization enabled');
      }
    } catch (error) {
      this.warnings.push('Next.js config validation failed');
    }
  }

  // Validation des performances
  validatePerformance() {
    console.log(chalk.yellow('⚡ Checking performance optimizations...'));
    
    // Vérifier la présence d'optimisations
    const srcDir = path.join(process.cwd(), 'src');
    
    // Vérifier l'usage de dynamic imports
    const hasLazyLoading = this.checkForPattern(srcDir, /dynamic\(/g);
    if (hasLazyLoading) {
      this.passed.push('Dynamic imports found (lazy loading)');
    } else {
      this.warnings.push('Consider adding lazy loading with dynamic imports');
    }
    
    // Vérifier React.memo usage
    const hasMemoization = this.checkForPattern(srcDir, /React\.memo|useMemo|useCallback/g);
    if (hasMemoization) {
      this.passed.push('Memoization optimizations found');
    } else {
      this.warnings.push('Consider adding React memoization optimizations');
    }
    
    // Vérifier Image optimization
    const hasImageOptimization = this.checkForPattern(srcDir, /next\/image/g);
    if (hasImageOptimization) {
      this.passed.push('Next.js Image optimization used');
    } else {
      this.warnings.push('Consider using Next.js Image component for optimizations');
    }
  }

  // Utilitaire pour rechercher des patterns dans les fichiers
  checkForPattern(dir, pattern) {
    const files = this.getAllFiles(dir, ['.ts', '.tsx', '.js', '.jsx']);
    
    return files.some(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        return pattern.test(content);
      } catch (error) {
        return false;
      }
    });
  }

  // Utilitaire pour obtenir tous les fichiers
  getAllFiles(dir, extensions = []) {
    let files = [];
    
    try {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          files = files.concat(this.getAllFiles(fullPath, extensions));
        } else if (stat.isFile()) {
          if (extensions.length === 0 || extensions.some(ext => fullPath.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      });
    } catch (error) {
      // Ignorer les erreurs de lecture de répertoire
    }
    
    return files;
  }

  // Validation Lighthouse (basique)
  validateLighthouse() {
    console.log(chalk.yellow('🔍 Checking Lighthouse readiness...'));
    
    // Vérifier les optimisations SEO de base
    const metaTags = this.checkForPattern('src', /<meta|<title/g);
    if (metaTags) {
      this.passed.push('SEO meta tags present');
    } else {
      this.warnings.push('Add SEO meta tags for better Lighthouse scores');
    }
    
    // Vérifier l'accessibilité
    const a11y = this.checkForPattern('src', /aria-|alt=|role=/g);
    if (a11y) {
      this.passed.push('Accessibility attributes found');
    } else {
      this.warnings.push('Add accessibility attributes for better scores');
    }
  }

  // Exécuter toutes les validations
  async runAllValidations() {
    const validations = [
      () => this.validateTypeScript(),
      () => this.validateESLint(),
      () => this.validateTests(),
      () => this.validateBundleSize(),
      () => this.validateSecurity(),
      () => this.validateDependencies(),
      () => this.validateConfiguration(),
      () => this.validatePerformance(),
      () => this.validateLighthouse(),
    ];

    for (const validation of validations) {
      try {
        await validation();
      } catch (error) {
        console.error(chalk.red('Validation error:'), error);
      }
    }

    this.showResults();
  }

  // Afficher les résultats
  showResults() {
    console.log('\n' + chalk.blue.bold('📊 VALIDATION RESULTS') + '\n');
    
    // Succès
    if (this.passed.length > 0) {
      console.log(chalk.green.bold('✅ PASSED:'));
      this.passed.forEach(item => console.log(chalk.green(`  ✓ ${item}`)));
      console.log('');
    }
    
    // Avertissements
    if (this.warnings.length > 0) {
      console.log(chalk.yellow.bold('⚠️  WARNINGS:'));
      this.warnings.forEach(item => console.log(chalk.yellow(`  ⚠ ${item}`)));
      console.log('');
    }
    
    // Erreurs
    if (this.errors.length > 0) {
      console.log(chalk.red.bold('❌ ERRORS:'));
      this.errors.forEach(item => console.log(chalk.red(`  ❌ ${item}`)));
      console.log('');
    }

    // Résumé final
    const total = this.passed.length + this.warnings.length + this.errors.length;
    const successRate = ((this.passed.length / total) * 100).toFixed(1);
    
    console.log(chalk.blue.bold('📈 SUMMARY:'));
    console.log(`  Total checks: ${total}`);
    console.log(chalk.green(`  Passed: ${this.passed.length}`));
    console.log(chalk.yellow(`  Warnings: ${this.warnings.length}`));
    console.log(chalk.red(`  Errors: ${this.errors.length}`));
    console.log(`  Success rate: ${successRate}%`);
    
    // Déterminer le niveau de qualité
    let qualityLevel = '';
    if (this.errors.length === 0 && this.warnings.length <= 2) {
      qualityLevel = chalk.green.bold('🏆 FAANG READY!');
    } else if (this.errors.length === 0) {
      qualityLevel = chalk.yellow.bold('🥈 PRODUCTION READY');
    } else {
      qualityLevel = chalk.red.bold('🚫 NEEDS WORK');
    }
    
    console.log(`\n${qualityLevel}\n`);
    
    // Code de sortie
    process.exit(this.errors.length > 0 ? 1 : 0);
  }
}

// Exécuter la validation
if (require.main === module) {
  const validator = new BuildValidator();
  validator.runAllValidations().catch(error => {
    console.error(chalk.red('Validation script failed:'), error);
    process.exit(1);
  });
}

module.exports = BuildValidator;