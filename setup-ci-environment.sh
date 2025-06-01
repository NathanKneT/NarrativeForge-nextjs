#!/bin/bash

# setup-ci-environment.sh - Setup complete CI/CD environment

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}${BOLD}========================================${NC}"
echo -e "${CYAN}${BOLD}   CI/CD ENVIRONMENT SETUP${NC}"
echo -e "${CYAN}${BOLD}========================================${NC}"
echo ""

# Make scripts executable
echo -e "${YELLOW}Making scripts executable...${NC}"
chmod +x test-ci-local.sh
chmod +x check-package-scripts.sh
chmod +x debug-github-actions.sh
echo "✅ Scripts are now executable"
echo ""

# Install system dependencies
echo -e "${YELLOW}Checking system dependencies...${NC}"

# Check and install jq
if ! command -v jq > /dev/null 2>&1; then
    echo "Installing jq..."
    if command -v apt-get > /dev/null 2>&1; then
        sudo apt-get update && sudo apt-get install -y jq
    elif command -v yum > /dev/null 2>&1; then
        sudo yum install -y jq
    elif command -v brew > /dev/null 2>&1; then
        brew install jq
    else
        echo -e "${RED}❌ Cannot install jq automatically. Please install manually.${NC}"
        echo "Ubuntu/Debian: sudo apt-get install jq"
        echo "RHEL/CentOS: sudo yum install jq"
        echo "macOS: brew install jq"
        exit 1
    fi
    echo "✅ jq installed"
else
    echo "✅ jq already available"
fi

# Check curl
if ! command -v curl > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  curl not found - installing...${NC}"
    if command -v apt-get > /dev/null 2>&1; then
        sudo apt-get install -y curl
    elif command -v yum > /dev/null 2>&1; then
        sudo yum install -y curl
    else
        echo -e "${RED}❌ Please install curl manually${NC}"
        exit 1
    fi
    echo "✅ curl installed"
else
    echo "✅ curl already available"
fi

echo ""

# Create directory structure
echo -e "${YELLOW}Creating directory structure...${NC}"

directories=(
    ".github/workflows"
    "src/__tests__"
    "__mocks__"
    "scripts"
    "src/lib"
    "src/stores" 
    "src/types"
    "src/app/api/health"
)

for dir in "${directories[@]}"; do
    if [[ ! -d "$dir" ]]; then
        mkdir -p "$dir"
        echo "📁 Created directory: $dir"
    else
        echo "✅ Directory exists: $dir"
    fi
done
echo ""

# Check Node.js and npm versions
echo -e "${YELLOW}Checking Node.js environment...${NC}"

node_version=$(node --version 2>/dev/null || echo "not found")
npm_version=$(npm --version 2>/dev/null || echo "not found")

echo "Node.js: $node_version"
echo "npm: $npm_version"

if [[ "$node_version" == "not found" ]]; then
    echo -e "${RED}❌ Node.js not found!${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
major_version=$(echo "$node_version" | sed 's/v//' | cut -d. -f1)
if [[ $major_version -lt 18 ]]; then
    echo -e "${YELLOW}⚠️  Warning: Node.js $node_version detected. GitHub Actions uses Node.js 18+${NC}"
    echo "Consider upgrading for better compatibility"
else
    echo "✅ Node.js version is compatible with GitHub Actions"
fi
echo ""

# Run package.json validation
echo -e "${YELLOW}Running package.json validation...${NC}"
if [[ -f "check-package-scripts.sh" ]]; then
    ./check-package-scripts.sh
else
    echo -e "${RED}❌ check-package-scripts.sh not found${NC}"
fi
echo ""

# Create missing essential files
echo -e "${YELLOW}Creating missing essential files...${NC}"

# Create .gitignore if missing
if [[ ! -f ".gitignore" ]]; then
    echo "Creating .gitignore..."
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
    echo "✅ Created .gitignore"
else
    echo "✅ .gitignore already exists"
fi

# Create README if missing basic CI/CD info
if [[ -f "README.md" ]]; then
    if ! grep -q "CI/CD" README.md; then
        echo ""
        echo "## 🚀 CI/CD Pipeline" >> README.md
        echo "" >> README.md
        echo "This project includes a complete CI/CD pipeline with:" >> README.md
        echo "" >> README.md
        echo "- **Local Testing**: \`./test-ci-local.sh\`" >> README.md
        echo "- **GitHub Actions**: Automated builds and deployments" >> README.md
        echo "- **Docker Support**: Containerized deployments" >> README.md
        echo "- **Quality Checks**: TypeScript, ESLint, Tests" >> README.md
        echo "" >> README.md
        echo "### Local Development" >> README.md
        echo "" >> README.md
        echo "\`\`\`bash" >> README.md
        echo "# Install dependencies" >> README.md
        echo "npm install" >> README.md
        echo "" >> README.md
        echo "# Run development server" >> README.md
        echo "npm run dev" >> README.md
        echo "" >> README.md
        echo "# Run full CI/CD test locally" >> README.md
        echo "./test-ci-local.sh --clean" >> README.md
        echo "" >> README.md
        echo "# Debug GitHub Actions locally" >> README.md
        echo "./debug-github-actions.sh" >> README.md
        echo "\`\`\`" >> README.md
        echo ""
        echo "✅ Added CI/CD section to README.md"
    else
        echo "✅ README.md already has CI/CD info"
    fi
else
    echo -e "${YELLOW}⚠️  README.md not found - consider creating one${NC}"
fi

# Create basic test if missing
if [[ ! -f "src/__tests__/basic.test.tsx" ]]; then
    echo "Creating basic test file..."
    cat > src/__tests__/basic.test.tsx << 'EOF'
import { render, screen } from '@testing-library/react';

// Basic smoke test to ensure testing setup works
describe('Basic Test Setup', () => {
  it('should render a simple component', () => {
    const TestComponent = () => <div>Test Component</div>;
    render(<TestComponent />);
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  it('should pass basic math test', () => {
    expect(2 + 2).toBe(4);
  });

  it('should handle async operations', async () => {
    const promise = Promise.resolve('async result');
    const result = await promise;
    expect(result).toBe('async result');
  });
});

// Test environment validation
describe('Environment Setup', () => {
  it('should have jest globals available', () => {
    expect(typeof describe).toBe('function');
    expect(typeof it).toBe('function');
    expect(typeof expect).toBe('function');
  });

  it('should have testing library matchers', () => {
    const div = document.createElement('div');
    div.textContent = 'Hello World';
    expect(div).toBeInTheDocument();
  });
});

export {};
EOF
    echo "✅ Created basic test file"
else
    echo "✅ Basic test file already exists"
fi

# Create health API endpoint if missing
if [[ ! -f "src/app/api/health/route.ts" ]]; then
    echo "Creating health API endpoint..."
    cat > src/app/api/health/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Basic health check
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
      checks: {
        database: 'not_implemented',
        external_services: 'not_implemented',
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
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Internal server error',
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  }
}
EOF
    echo "✅ Created health API endpoint"
else
    echo "✅ Health API endpoint already exists"
fi

# Create mock files if missing
if [[ ! -f "__mocks__/@xyflow/react.js" ]]; then
    echo "Creating React Flow mock..."
    cat > __mocks__/@xyflow/react.js << 'EOF'
// Mock for @xyflow/react
const React = require('react');

const MockReactFlow = React.forwardRef((props, ref) => {
  return React.createElement('div', {
    'data-testid': 'react-flow',
    ref,
    ...props
  });
});

const MockNode = (props) => {
  return React.createElement('div', {
    'data-testid': 'react-flow-node',
    ...props
  });
};

const MockHandle = (props) => {
  return React.createElement('div', {
    'data-testid': 'react-flow-handle',
    ...props
  });
};

module.exports = {
  ReactFlow: MockReactFlow,
  Node: MockNode,
  Handle: MockHandle,
  Position: {
    Top: 'top',
    Right: 'right',
    Bottom: 'bottom',
    Left: 'left',
  },
  useNodesState: () => [[], () => {}, () => {}],
  useEdgesState: () => [[], () => {}, () => {}],
  useReactFlow: () => ({
    getNodes: () => [],
    getEdges: () => [],
    fitView: () => {},
  }),
};
EOF
    echo "✅ Created React Flow mock"
else
    echo "✅ React Flow mock already exists"
fi

if [[ ! -f "__mocks__/fileMock.js" ]]; then
    echo "Creating file mock..."
    echo "module.exports = 'test-file-stub';" > __mocks__/fileMock.js
    echo "✅ Created file mock"
else
    echo "✅ File mock already exists"
fi

echo ""

# Install dependencies if package.json exists
echo -e "${YELLOW}Installing/updating dependencies...${NC}"
if [[ -f "package.json" ]]; then
    if [[ -f "package-lock.json" ]]; then
        echo "Running npm ci..."
        npm ci
    else
        echo "Running npm install..."
        npm install
    fi
    echo "✅ Dependencies installed"
else
    echo -e "${RED}❌ package.json not found!${NC}"
    exit 1
fi

echo ""

# Create a comprehensive test script
echo -e "${YELLOW}Creating comprehensive test runner...${NC}"
cat > test-all.sh << 'EOF'
#!/bin/bash

# Comprehensive test runner for all CI/CD scenarios

echo "🚀 Running comprehensive CI/CD tests..."
echo ""

echo "1️⃣ Checking package.json configuration..."
./check-package-scripts.sh
echo ""

echo "2️⃣ Running standard CI/CD pipeline..."
./test-ci-local.sh
echo ""

echo "3️⃣ Running GitHub Actions simulation..."
./debug-github-actions.sh
echo ""

echo "✅ All tests completed!"
echo ""
echo "If all tests passed, your CI/CD pipeline is ready! 🎉"
echo "Push to GitHub to see it in action."
EOF

chmod +x test-all.sh
echo "✅ Created comprehensive test runner (test-all.sh)"
echo ""

# Final summary
echo -e "${CYAN}${BOLD}========================================${NC}"
echo -e "${CYAN}${BOLD}           SETUP COMPLETE${NC}"
echo -e "${CYAN}${BOLD}========================================${NC}"
echo ""

echo -e "${GREEN}✅ CI/CD environment setup completed!${NC}"
echo ""
echo -e "${BLUE}📋 What was created/configured:${NC}"
echo "  • Made all scripts executable"
echo "  • Installed system dependencies (jq, curl)"
echo "  • Created directory structure"
echo "  • Added missing essential files"
echo "  • Created basic tests and mocks"
echo "  • Set up health API endpoint"
echo "  • Installed npm dependencies"
echo ""

echo -e "${YELLOW}🧪 Available test commands:${NC}"
echo "  • ./test-ci-local.sh           - Standard CI/CD test"
echo "  • ./test-ci-local.sh --clean   - Full clean test"
echo "  • ./debug-github-actions.sh    - GitHub Actions simulation"
echo "  • ./check-package-scripts.sh   - Validate package.json"
echo "  • ./test-all.sh               - Run all tests"
echo ""

echo -e "${YELLOW}🚀 Quick start:${NC}"
echo "  1. Run: ./test-all.sh"
echo "  2. Fix any issues found"
echo "  3. Commit and push to GitHub"
echo "  4. Check GitHub Actions tab"
echo ""

echo -e "${GREEN}Your CI/CD pipeline is ready! 🎉${NC}"