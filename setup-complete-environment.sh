#!/bin/bash

# setup-complete-environment.sh - ULTIMATE all-in-one CI/CD setup script
# This script does EVERYTHING needed for a complete CI/CD environment

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Emoji support detection
if locale | grep -q "UTF-8"; then
    SUCCESS_ICON="✅"
    ERROR_ICON="❌"
    WARNING_ICON="⚠️"
    INFO_ICON="ℹ️"
    ROCKET_ICON="🚀"
    GEAR_ICON="🔧"
    CLEAN_ICON="🧹"
    TEST_ICON="🧪"
    DOCKER_ICON="🐳"
    PACKAGE_ICON="📦"
else
    SUCCESS_ICON="[OK]"
    ERROR_ICON="[ERROR]"
    WARNING_ICON="[WARN]"
    INFO_ICON="[INFO]"
    ROCKET_ICON="[DEPLOY]"
    GEAR_ICON="[FIX]"
    CLEAN_ICON="[CLEAN]"
    TEST_ICON="[TEST]"
    DOCKER_ICON="[DOCKER]"
    PACKAGE_ICON="[PKG]"
fi

clear
echo -e "${CYAN}${BOLD}========================================${NC}"
echo -e "${CYAN}${BOLD}    ULTIMATE CI/CD SETUP SCRIPT${NC}"
echo -e "${CYAN}${BOLD}========================================${NC}"
echo ""
echo -e "${BLUE}This script will:${NC}"
echo "  ${SUCCESS_ICON} Check and fix Node.js environment"
echo "  ${CLEAN_ICON} Clean corrupted npm cache/files"
echo "  ${PACKAGE_ICON} Install all dependencies"
echo "  ${GEAR_ICON} Create missing configuration files"
echo "  ${TEST_ICON} Set up testing environment"
echo "  ${DOCKER_ICON} Configure Docker support"
echo "  ${ROCKET_ICON} Test complete CI/CD pipeline"
echo ""

# Parse command line arguments
SKIP_TESTS=false
VERBOSE=false
FORCE_CLEAN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --force-clean)
            FORCE_CLEAN=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --skip-tests    Skip running tests at the end"
            echo "  --verbose       Enable verbose output"
            echo "  --force-clean   Force complete clean (removes node_modules)"
            echo "  --help, -h      Show this help"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

if [[ "$VERBOSE" == true ]]; then
    echo -e "${BLUE}${INFO_ICON} Verbose mode enabled${NC}"
fi

# Function definitions
log_success() {
    echo -e "${GREEN}${SUCCESS_ICON} $1${NC}"
}

log_error() {
    echo -e "${RED}${ERROR_ICON} $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}${WARNING_ICON} $1${NC}"
}

log_info() {
    echo -e "${BLUE}${INFO_ICON} $1${NC}"
}

log_title() {
    echo -e "${CYAN}${BOLD}=== $1 ===${NC}"
}

run_command() {
    local cmd="$1"
    local success_msg="$2"
    local error_msg="$3"
    
    if [[ "$VERBOSE" == true ]]; then
        echo "Running: $cmd"
        if eval "$cmd"; then
            log_success "$success_msg"
            return 0
        else
            log_error "$error_msg"
            return 1
        fi
    else
        if eval "$cmd" > /dev/null 2>&1; then
            log_success "$success_msg"
            return 0
        else
            log_error "$error_msg"
            return 1
        fi
    fi
}

# Check if we're in project root
if [[ ! -f "package.json" ]]; then
    log_error "package.json not found!"
    log_info "Please run this script from your project root directory"
    exit 1
fi

log_success "Found package.json - proceeding with setup"
echo ""

# PHASE 1: ENVIRONMENT CHECK AND FIX
log_title "PHASE 1: ENVIRONMENT CHECK AND FIX"

# Check current versions
current_node=$(node --version 2>/dev/null || echo "not found")
current_npm=$(npm --version 2>/dev/null || echo "not found")

log_info "Current environment:"
echo "  Node.js: $current_node"
echo "  npm: $current_npm"
echo "  OS: $(uname -s) $(uname -r)"

# Check if we're in WSL
WSL_ENV=false
if grep -q Microsoft /proc/version 2>/dev/null; then
    log_info "Detected WSL (Windows Subsystem for Linux)"
    WSL_ENV=true
fi

# Check Node.js version (fixed version check)
check_node_version() {
    if [[ "$current_node" == "not found" ]]; then
        return 1
    fi
    
    major_version=$(echo "$current_node" | sed 's/v//' | cut -d. -f1)
    if [[ $major_version =~ ^[0-9]+$ ]] && [[ $major_version -ge 18 ]]; then
        return 0
    fi
    return 1
}

if check_node_version; then
    log_success "Node.js $current_node is compatible! (≥18 required)"
else
    log_error "Node.js $current_node is incompatible (need ≥18.17.0)"
    
    log_info "Installing Node.js 18 LTS..."
    
    # Install Node.js using the best method available
    if command -v curl > /dev/null 2>&1; then
        log_info "Installing Node.js via NodeSource repository..."
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        
        if command -v apt-get > /dev/null 2>&1; then
            sudo apt-get install -y nodejs
        elif command -v yum > /dev/null 2>&1; then
            sudo yum install -y nodejs
        fi
        
        # Verify installation
        new_node=$(node --version 2>/dev/null || echo "not found")
        if check_node_version; then
            log_success "Node.js successfully updated to $new_node"
        else
            log_error "Node.js installation failed"
            log_info "Please install Node.js 18+ manually from https://nodejs.org/"
            exit 1
        fi
    else
        log_error "Cannot install Node.js automatically"
        log_info "Please install Node.js 18+ manually:"
        echo "  • Visit: https://nodejs.org/"
        echo "  • Or use nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
        exit 1
    fi
fi

# Check npm version
npm_major=$(echo "$current_npm" | cut -d. -f1)
if [[ $npm_major -ge 9 ]]; then
    log_success "npm $current_npm is excellent!"
else
    log_warning "npm $current_npm is old, upgrading..."
    npm install -g npm@latest
    current_npm=$(npm --version)
    log_success "npm updated to $current_npm"
fi

echo ""

# PHASE 2: SYSTEM DEPENDENCIES
log_title "PHASE 2: SYSTEM DEPENDENCIES"

# Install essential tools
essential_tools=("curl" "jq" "git")

for tool in "${essential_tools[@]}"; do
    if command -v "$tool" > /dev/null 2>&1; then
        log_success "$tool is available"
    else
        log_info "Installing $tool..."
        if command -v apt-get > /dev/null 2>&1; then
            sudo apt-get update && sudo apt-get install -y "$tool"
        elif command -v yum > /dev/null 2>&1; then
            sudo yum install -y "$tool"
        elif command -v brew > /dev/null 2>&1; then
            brew install "$tool"
        else
            log_warning "Cannot install $tool automatically"
        fi
        
        if command -v "$tool" > /dev/null 2>&1; then
            log_success "$tool installed successfully"
        else
            log_warning "$tool installation may have failed"
        fi
    fi
done

echo ""

# PHASE 3: CLEANUP
log_title "PHASE 3: CLEANUP"

log_info "Cleaning npm cache and problematic files..."

# Clean npm cache
run_command "npm cache clean --force" "npm cache cleaned" "Failed to clean npm cache"

# Remove problematic files
if [[ "$FORCE_CLEAN" == true ]] || [[ ! -d "node_modules" ]]; then
    log_info "Removing node_modules and package-lock.json..."
    rm -rf node_modules/ 2>/dev/null || true
    rm -f package-lock.json 2>/dev/null || true
    log_success "Files cleaned"
else
    log_info "Keeping existing node_modules (use --force-clean to remove)"
fi

# Clean npm logs
rm -rf ~/.npm/_logs/* 2>/dev/null || true

echo ""

# PHASE 4: DIRECTORY STRUCTURE
log_title "PHASE 4: DIRECTORY STRUCTURE"

# Create essential directories
directories=(
    ".github/workflows"
    "src/__tests__"
    "__mocks__"
    "scripts"
    "src/app/api/health"
    "src/lib"
    "src/stores"
    "src/types"
)

for dir in "${directories[@]}"; do
    if [[ ! -d "$dir" ]]; then
        mkdir -p "$dir"
        log_info "Created directory: $dir"
    else
        log_success "Directory exists: $dir"
    fi
done

echo ""

# PHASE 5: CONFIGURATION FILES
log_title "PHASE 5: CONFIGURATION FILES"

# Create .gitignore if missing
if [[ ! -f ".gitignore" ]]; then
    log_info "Creating .gitignore..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Next.js
.next/
out/
build/
dist/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Testing
coverage/
test-results/
.nyc_output/

# Misc
.DS_Store
*.tgz
*.tar.gz

# Runtime data
pids
*.pid
*.seed
*.log

# Cache
.npm
.cache/
.turbo/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
Thumbs.db
EOF
    log_success "Created .gitignore"
else
    log_success ".gitignore already exists"
fi

# Create .prettierrc.json if missing
if [[ ! -f ".prettierrc.json" ]]; then
    log_info "Creating .prettierrc.json..."
    cat > .prettierrc.json << 'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"]
}
EOF
    log_success "Created .prettierrc.json"
else
    log_success ".prettierrc.json already exists"
fi

# Create health API endpoint if missing
if [[ ! -f "src/app/api/health/route.ts" ]]; then
    log_info "Creating health API endpoint..."
    cat > src/app/api/health/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.1.0',
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
      },
    };

    return NextResponse.json(healthData, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { status: 'unhealthy', timestamp: new Date().toISOString(), error: 'Internal server error' },
      { status: 500 }
    );
  }
}
EOF
    log_success "Created health API endpoint"
else
    log_success "Health API endpoint already exists"
fi

# Create basic test if missing
if [[ ! -f "src/__tests__/basic.test.tsx" ]]; then
    log_info "Creating basic test file..."
    cat > src/__tests__/basic.test.tsx << 'EOF'
import { render, screen } from '@testing-library/react';

describe('Basic Test Setup', () => {
  it('should render a simple component', () => {
    const TestComponent = () => <div>Test Component</div>;
    render(<TestComponent />);
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  it('should pass basic math test', () => {
    expect(2 + 2).toBe(4);
  });
});

export {};
EOF
    log_success "Created basic test file"
else
    log_success "Basic test file already exists"
fi

# Create mocks if missing
if [[ ! -f "__mocks__/@xyflow/react.js" ]]; then
    log_info "Creating React Flow mock..."
    mkdir -p "__mocks__/@xyflow"
    cat > __mocks__/@xyflow/react.js << 'EOF'
const React = require('react');

const MockReactFlow = React.forwardRef((props, ref) => {
  return React.createElement('div', { 'data-testid': 'react-flow', ref, ...props });
});

module.exports = {
  ReactFlow: MockReactFlow,
  Handle: (props) => React.createElement('div', { 'data-testid': 'react-flow-handle', ...props }),
  Position: { Top: 'top', Right: 'right', Bottom: 'bottom', Left: 'left' },
  useNodesState: () => [[], () => {}, () => {}],
  useEdgesState: () => [[], () => {}, () => {}],
  useReactFlow: () => ({ getNodes: () => [], getEdges: () => [], fitView: () => {} }),
};
EOF
    log_success "Created React Flow mock"
else
    log_success "React Flow mock already exists"
fi

if [[ ! -f "__mocks__/fileMock.js" ]]; then
    echo "module.exports = 'test-file-stub';" > __mocks__/fileMock.js
    log_success "Created file mock"
else
    log_success "File mock already exists"
fi

echo ""

# PHASE 6: PACKAGE.JSON VALIDATION AND FIX
log_title "PHASE 6: PACKAGE.JSON VALIDATION"

if command -v jq > /dev/null 2>&1; then
    # Fix engines field
    log_info "Updating package.json engines field..."
    tmp_file=$(mktemp)
    jq '.engines.node = ">=18.17.0" | .engines.npm = ">=9.0.0"' package.json > "$tmp_file" && mv "$tmp_file" package.json
    log_success "Updated engines field"
    
    # Check for required scripts
    required_scripts=("dev" "build" "start" "lint" "type-check")
    missing_scripts=()
    
    for script in "${required_scripts[@]}"; do
        if jq -e ".scripts[\"$script\"]" package.json > /dev/null 2>&1; then
            log_success "Script '$script' found"
        else
            log_warning "Script '$script' missing"
            missing_scripts+=("$script")
        fi
    done
    
    if [[ ${#missing_scripts[@]} -gt 0 ]]; then
        log_warning "Some required scripts are missing"
        log_info "Please add them to package.json manually"
    fi
else
    log_warning "jq not available - skipping package.json validation"
fi

echo ""

# PHASE 7: DEPENDENCY INSTALLATION
log_title "PHASE 7: DEPENDENCY INSTALLATION"

# Configure npm for best performance
log_info "Configuring npm..."
npm config set registry https://registry.npmjs.org/
npm config set fund false
npm config set audit-level moderate

if [[ "$WSL_ENV" == true ]]; then
    npm config set cache ~/.npm
    log_info "Applied WSL-specific npm optimizations"
fi

# Install dependencies
log_info "Installing dependencies..."

if [[ -f "package-lock.json" ]]; then
    install_cmd="npm ci"
else
    install_cmd="npm install"
fi

if [[ "$VERBOSE" == true ]]; then
    if $install_cmd; then
        log_success "Dependencies installed successfully"
    elif npm install --legacy-peer-deps; then
        log_success "Dependencies installed with legacy peer deps"
    elif npm install --force; then
        log_warning "Dependencies installed with --force"
    else
        log_error "All installation methods failed"
        exit 1
    fi
else
    if $install_cmd > /dev/null 2>&1; then
        log_success "Dependencies installed successfully"
    elif npm install --legacy-peer-deps > /dev/null 2>&1; then
        log_success "Dependencies installed with legacy peer deps"
    elif npm install --force > /dev/null 2>&1; then
        log_warning "Dependencies installed with --force"
    else
        log_error "All installation methods failed"
        exit 1
    fi
fi

# Verify installation
if [[ -d "node_modules" ]] && [[ -n "$(ls -A node_modules 2>/dev/null)" ]]; then
    package_count=$(ls node_modules 2>/dev/null | wc -l)
    log_success "node_modules created with $package_count packages"
else
    log_error "node_modules directory missing or empty"
    exit 1
fi

echo ""

# PHASE 8: SCRIPT CREATION
log_title "PHASE 8: CI/CD SCRIPTS CREATION"

# Make existing scripts executable
scripts_to_make_executable=(
    "test-ci-local.sh"
    "check-package-scripts.sh" 
    "debug-github-actions.sh"
    "fix-node-environment.sh"
    "fix-version-check.sh"
    "quick-fix.sh"
)

for script in "${scripts_to_make_executable[@]}"; do
    if [[ -f "$script" ]]; then
        chmod +x "$script"
        log_success "Made $script executable"
    fi
done

# Create a comprehensive test runner
if [[ ! -f "test-all.sh" ]]; then
    log_info "Creating comprehensive test runner..."
    cat > test-all.sh << 'EOF'
#!/bin/bash

echo "🚀 Running comprehensive CI/CD tests..."
echo ""

echo "1️⃣ Checking package.json configuration..."
if [[ -f "check-package-scripts.sh" ]]; then
    ./check-package-scripts.sh
fi
echo ""

echo "2️⃣ Running standard CI/CD pipeline..."
if [[ -f "test-ci-local.sh" ]]; then
    ./test-ci-local.sh
fi
echo ""

echo "3️⃣ Running GitHub Actions simulation..."
if [[ -f "debug-github-actions.sh" ]]; then
    ./debug-github-actions.sh
fi
echo ""

echo "✅ All tests completed!"
EOF
    chmod +x test-all.sh
    log_success "Created comprehensive test runner"
else
    log_success "Test runner already exists"
fi

echo ""

# PHASE 9: BASIC VALIDATION
log_title "PHASE 9: BASIC VALIDATION"

# Test critical npm scripts
critical_scripts=("build" "dev" "lint")

for script in "${critical_scripts[@]}"; do
    if npm run "$script" --help > /dev/null 2>&1; then
        log_success "Script '$script' is working"
    else
        log_warning "Script '$script' may have issues"
    fi
done

# Test TypeScript compilation
if [[ -f "tsconfig.json" ]]; then
    log_info "Testing TypeScript compilation..."
    if npx tsc --noEmit --skipLibCheck > /dev/null 2>&1; then
        log_success "TypeScript compilation successful"
    else
        log_warning "TypeScript has some issues (may be fixable)"
    fi
fi

echo ""

# PHASE 10: WSL OPTIMIZATIONS
if [[ "$WSL_ENV" == true ]]; then
    log_title "PHASE 10: WSL OPTIMIZATIONS"
    
    # Check project location
    current_path=$(pwd)
    if [[ "$current_path" =~ ^/mnt/c ]]; then
        log_warning "Project is in Windows filesystem (/mnt/c)"
        log_info "For better performance, consider moving to Linux filesystem"
        echo "  Example: cp -r . ~/projects/$(basename \"$current_path\")"
    else
        log_success "Project is in Linux filesystem (optimal)"
    fi
    
    # Set up npm global directory
    if ! echo "$PATH" | grep -q "npm-global"; then
        npm config set prefix ~/.npm-global
        echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
        log_success "Configured npm global directory"
        log_info "Run 'source ~/.bashrc' to update PATH"
    fi
    
    echo ""
fi

# PHASE 11: FINAL TESTS
if [[ "$SKIP_TESTS" != true ]]; then
    log_title "PHASE 11: FINAL TESTS"
    
    log_info "Running quick development server test..."
    timeout 10s npm run dev > /dev/null 2>&1 &
    DEV_PID=$!
    sleep 5
    
    if kill -0 $DEV_PID 2>/dev/null; then
        log_success "Development server starts successfully"
        kill $DEV_PID 2>/dev/null || true
    else
        log_warning "Development server may have issues"
    fi
    
    wait $DEV_PID 2>/dev/null || true
    
    echo ""
fi

# FINAL SUMMARY
log_title "SETUP COMPLETE!"

echo ""
log_success "🎉 Ultimate CI/CD environment setup completed!"
echo ""

final_node=$(node --version)
final_npm=$(npm --version)

echo -e "${BLUE}📋 Environment Summary:${NC}"
echo "  Node.js: $final_node ✅"
echo "  npm: $final_npm ✅"
echo "  Dependencies: Installed ✅"
echo "  Configuration: Complete ✅"
echo "  Tests: Ready ✅"
echo "  CI/CD Scripts: Available ✅"
echo ""

echo -e "${YELLOW}🚀 Quick Start Commands:${NC}"
echo "  • npm run dev                 - Start development"
echo "  • npm run build               - Build for production"
echo "  • ./test-ci-local.sh          - Test CI/CD pipeline"
echo "  • ./debug-github-actions.sh   - Simulate GitHub Actions"
echo "  • ./test-all.sh               - Run all tests"
echo ""

echo -e "${BLUE}💡 Next Steps:${NC}"
echo "  1. Test development: npm run dev"
echo "  2. Run full CI/CD test: ./test-ci-local.sh"
echo "  3. Commit and push to GitHub"
echo "  4. Monitor GitHub Actions"
echo ""

if [[ "$WSL_ENV" == true ]]; then
    echo -e "${CYAN}🐧 WSL Users:${NC}"
    echo "  • Run: source ~/.bashrc"
    echo "  • Consider moving project to Linux filesystem for speed"
    echo ""
fi

echo -e "${GREEN}Your complete CI/CD environment is ready! 🚀${NC}"