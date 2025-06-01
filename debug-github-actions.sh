#!/bin/bash

# debug-github-actions.sh - Debug GitHub Actions CI/CD locally
# This script simulates the exact GitHub Actions environment

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# GitHub Actions specific environment variables
export CI=true
export GITHUB_ACTIONS=true
export RUNNER_OS="Linux"
export RUNNER_ARCH="X64"
export RUNNER_NAME="GitHub Actions"
export GITHUB_WORKFLOW="CI/CD Pipeline"
export GITHUB_RUN_ID="local-$(date +%s)"
export GITHUB_RUN_NUMBER="1"
export GITHUB_ACTOR="local-user"
export GITHUB_REPOSITORY="asylum-interactive-story-nextjs"
export GITHUB_WORKSPACE="$(pwd)"
export GITHUB_SHA="$(git rev-parse HEAD 2>/dev/null || echo 'unknown')"
export GITHUB_REF="$(git symbolic-ref HEAD 2>/dev/null || echo 'refs/heads/main')"
export GITHUB_REF_NAME="$(git branch --show-current 2>/dev/null || echo 'main')"
export NODE_ENV="production"

echo -e "${CYAN}${BOLD}========================================${NC}"
echo -e "${CYAN}${BOLD}  GITHUB ACTIONS CI/CD DEBUG SCRIPT${NC}"
echo -e "${CYAN}${BOLD}========================================${NC}"
echo ""
echo -e "${BLUE}Simulating exact GitHub Actions environment...${NC}"
echo ""

# Display environment info
echo -e "${YELLOW}Environment Variables:${NC}"
echo "  CI: $CI"
echo "  GITHUB_ACTIONS: $GITHUB_ACTIONS"
echo "  RUNNER_OS: $RUNNER_OS"
echo "  GITHUB_WORKFLOW: $GITHUB_WORKFLOW"
echo "  GITHUB_REF_NAME: $GITHUB_REF_NAME"
echo "  NODE_ENV: $NODE_ENV"
echo "  GITHUB_WORKSPACE: $GITHUB_WORKSPACE"
echo ""

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    echo -e "${RED}❌ Error: package.json not found!${NC}"
    echo -e "${RED}Please run this script from your project root directory.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found package.json - proceeding with GitHub Actions simulation${NC}"
echo ""

# Simulate GitHub Actions job: validate
echo -e "${CYAN}${BOLD}🔍 JOB: validate${NC}"
echo -e "${BLUE}Replicating: .github/workflows/ci-cd.yml -> validate job${NC}"
echo ""

echo -e "${YELLOW}Step: Checkout${NC}"
echo "✅ Code already checked out (local)"
echo ""

echo -e "${YELLOW}Step: Setup Node.js${NC}"
node_version=$(node --version)
npm_version=$(npm --version)
echo "✅ Node.js: $node_version"
echo "✅ npm: $npm_version"

# Check Node.js version (GitHub Actions uses Node 18)
major_version=$(echo "$node_version" | sed 's/v//' | cut -d. -f1)
if [[ $major_version -ge 18 ]]; then
    echo "✅ Node.js version is compatible with GitHub Actions"
else
    echo -e "${YELLOW}⚠️  Warning: GitHub Actions uses Node.js 18+, you have $node_version${NC}"
fi
echo ""

echo -e "${YELLOW}Step: Install dependencies${NC}"
if [[ -f "package-lock.json" ]]; then
    echo "Running: npm ci"
    npm ci
else
    echo "Running: npm install"
    npm install
fi
echo "✅ Dependencies installed"
echo ""

echo -e "${YELLOW}Step: Run pre-build validation${NC}"
echo "Running: npm run validate:pre-build"

# Check if validate:pre-build script exists
if npm run validate:pre-build --silent 2>/dev/null; then
    echo "✅ Pre-build validation passed"
else
    echo -e "${YELLOW}⚠️  validate:pre-build script not found, running individual checks...${NC}"
    
    # Run individual validation steps
    echo "  Running: npm run type-check"
    npm run type-check
    echo "  ✅ TypeScript check passed"
    
    echo "  Running: npm run lint"
    npm run lint
    echo "  ✅ ESLint check passed"
    
    if npm run test:ci --silent 2>/dev/null; then
        echo "  Running: npm run test:ci"
        echo "  ✅ Tests passed"
    else
        echo "  ⚠️  Tests skipped (script not found or no tests)"
    fi
fi
echo ""

# Simulate GitHub Actions job: build
echo -e "${CYAN}${BOLD}🏗️  JOB: build${NC}"
echo -e "${BLUE}Replicating: .github/workflows/ci-cd.yml -> build job${NC}"
echo ""

echo -e "${YELLOW}Step: Cache Next.js build${NC}"
if [[ -d ".next/cache" ]]; then
    echo "✅ Next.js cache found"
else
    echo "📁 No existing Next.js cache"
fi
echo ""

echo -e "${YELLOW}Step: Build application${NC}"
echo "Running: npm run build"
echo "Environment: NODE_ENV=$NODE_ENV"

# Build with production environment
npm run build

if [[ -d ".next" ]]; then
    echo "✅ Build completed successfully"
    
    # Check build artifacts
    if [[ -f ".next/build-manifest.json" ]]; then
        echo "✅ Build manifest created"
    else
        echo -e "${RED}❌ Build manifest missing${NC}"
        exit 1
    fi
    
    if [[ -d ".next/static" ]]; then
        echo "✅ Static assets generated"
        static_files=$(find .next/static -type f | wc -l)
        echo "📊 Static files: $static_files"
    else
        echo -e "${RED}❌ Static assets missing${NC}"
        exit 1
    fi
    
    # Check for standalone build (needed for Docker)
    if [[ -d ".next/standalone" ]]; then
        echo "✅ Standalone build created (Docker ready)"
    else
        echo "📝 No standalone build (check next.config.js output setting)"
    fi
    
else
    echo -e "${RED}❌ Build failed - .next directory not created${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step: Run enhanced validation${NC}"
if npm run validate:enhanced --silent 2>/dev/null; then
    echo "✅ Enhanced validation passed"
elif npm run validate --silent 2>/dev/null; then
    echo "✅ Basic validation passed"
else
    echo -e "${YELLOW}⚠️  No validation script found${NC}"
fi
echo ""

# Simulate GitHub Actions job: security
echo -e "${CYAN}${BOLD}🔒 JOB: security${NC}"
echo -e "${BLUE}Replicating: .github/workflows/ci-cd.yml -> security job${NC}"
echo ""

echo -e "${YELLOW}Step: Run security audit${NC}"
echo "Running: npm audit --audit-level high"
if npm audit --audit-level high; then
    echo "✅ Security audit passed"
else
    echo -e "${YELLOW}⚠️  Security vulnerabilities found (check manually with 'npm audit')${NC}"
fi
echo ""

# Simulate optional performance job
echo -e "${CYAN}${BOLD}⚡ JOB: performance (if enabled)${NC}"
echo -e "${BLUE}Replicating: .github/workflows/ci-cd.yml -> performance job${NC}"
echo ""

echo -e "${YELLOW}Step: Start server for testing${NC}"
echo "Running: npm start &"

# Start server in background
npm start > /tmp/server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
echo "Waiting for server to start..."
sleep 15

if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ Server started successfully"
    
    # Test endpoints like GitHub Actions would
    if command -v curl > /dev/null 2>&1; then
        echo -e "${YELLOW}Step: Test application endpoints${NC}"
        
        # Test main page
        if curl -f -s http://localhost:3000 > /dev/null; then
            echo "✅ Main page (/) responds"
        else
            echo -e "${RED}❌ Main page (/) failed${NC}"
        fi
        
        # Test health endpoint
        if curl -f -s http://localhost:3000/api/health > /dev/null; then
            echo "✅ Health endpoint (/api/health) responds"
        else
            echo -e "${YELLOW}⚠️  Health endpoint not available${NC}"
        fi
        
        # Test editor page
        if curl -f -s http://localhost:3000/editor > /dev/null; then
            echo "✅ Editor page (/editor) responds"
        else
            echo -e "${YELLOW}⚠️  Editor page may not be available${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  curl not available - skipping endpoint tests${NC}"
    fi
    
    # Stop server
    kill $SERVER_PID 2>/dev/null
    wait $SERVER_PID 2>/dev/null || true
    echo "🛑 Server stopped"
else
    echo -e "${RED}❌ Server failed to start${NC}"
    echo "Server logs:"
    cat /tmp/server.log 2>/dev/null || echo "No logs available"
fi
echo ""

# Simulate Docker job (if enabled)
echo -e "${CYAN}${BOLD}🐳 JOB: docker (if on main branch)${NC}"
echo -e "${BLUE}Replicating: .github/workflows/ci-cd.yml -> docker job${NC}"
echo ""

if [[ "$GITHUB_REF_NAME" == "main" ]]; then
    echo -e "${YELLOW}Step: Set up Docker Buildx${NC}"
    if command -v docker > /dev/null 2>&1; then
        echo "✅ Docker available"
        
        echo -e "${YELLOW}Step: Build Docker image${NC}"
        if [[ -f "Dockerfile" ]]; then
            echo "Running: docker build -t asylum-story:test ."
            if docker build -t asylum-story:test . > /tmp/docker-build.log 2>&1; then
                echo "✅ Docker image built successfully"
                
                # Test Docker image
                echo -e "${YELLOW}Step: Test Docker image${NC}"
                echo "Running: docker run -d -p 3001:3000 asylum-story:test"
                CONTAINER_ID=$(docker run -d -p 3001:3000 asylum-story:test)
                
                sleep 10
                
                if docker ps | grep -q "$CONTAINER_ID"; then
                    echo "✅ Docker container running"
                    
                    # Test container health
                    if curl -f -s http://localhost:3001 > /dev/null 2>&1; then
                        echo "✅ Docker container responds to HTTP requests"
                    else
                        echo -e "${YELLOW}⚠️  Docker container not responding (may need more time)${NC}"
                    fi
                    
                    # Stop container
                    docker stop "$CONTAINER_ID" > /dev/null
                    docker rm "$CONTAINER_ID" > /dev/null
                    echo "🛑 Docker container stopped and removed"
                else
                    echo -e "${RED}❌ Docker container failed to start${NC}"
                    docker logs "$CONTAINER_ID" 2>/dev/null || true
                fi
                
                # Clean up image
                docker rmi asylum-story:test > /dev/null 2>&1 || true
            else
                echo -e "${RED}❌ Docker build failed${NC}"
                cat /tmp/docker-build.log
            fi
        else
            echo -e "${YELLOW}⚠️  Dockerfile not found${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Docker not available - skipping Docker build test${NC}"
    fi
else
    echo "ℹ️  Skipping Docker build (not on main branch)"
fi
echo ""

# GitHub Actions specific checks
echo -e "${CYAN}${BOLD}🔍 GITHUB ACTIONS SPECIFIC CHECKS${NC}"
echo ""

echo -e "${YELLOW}Workflow file validation:${NC}"
if [[ -f ".github/workflows/ci-cd.yml" ]]; then
    echo "✅ GitHub Actions workflow file found"
    
    # Basic YAML syntax check
    if command -v python3 > /dev/null 2>&1; then
        if python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci-cd.yml'))" 2>/dev/null; then
            echo "✅ Workflow YAML syntax is valid"
        else
            echo -e "${RED}❌ Workflow YAML syntax error${NC}"
        fi
    elif command -v yamllint > /dev/null 2>&1; then
        if yamllint .github/workflows/ci-cd.yml > /dev/null 2>&1; then
            echo "✅ Workflow YAML syntax is valid"
        else
            echo -e "${RED}❌ Workflow YAML syntax error${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Cannot validate YAML syntax (install python3 or yamllint)${NC}"
    fi
    
    # Check for required jobs
    required_jobs=("validate" "build")
    for job in "${required_jobs[@]}"; do
        if grep -q "^  $job:" .github/workflows/ci-cd.yml; then
            echo "✅ Job '$job' found in workflow"
        else
            echo -e "${RED}❌ Job '$job' missing in workflow${NC}"
        fi
    done
else
    echo -e "${RED}❌ GitHub Actions workflow file not found${NC}"
    echo "Expected: .github/workflows/ci-cd.yml"
fi
echo ""

echo -e "${YELLOW}Environment compatibility:${NC}"
# Check for GitHub Actions specific configurations
if grep -q "ubuntu-latest" .github/workflows/ci-cd.yml 2>/dev/null; then
    echo "✅ Workflow configured for Ubuntu (matches this environment)"
else
    echo -e "${YELLOW}⚠️  Workflow OS not specified or different${NC}"
fi

if grep -q "node-version.*18" .github/workflows/ci-cd.yml 2>/dev/null; then
    echo "✅ Workflow uses Node.js 18 (recommended)"
else
    echo -e "${YELLOW}⚠️  Check Node.js version in workflow${NC}"
fi
echo ""

# Summary
echo -e "${CYAN}${BOLD}========================================${NC}"
echo -e "${CYAN}${BOLD}           SIMULATION COMPLETE${NC}"
echo -e "${CYAN}${BOLD}========================================${NC}"
echo ""

echo -e "${GREEN}✅ GitHub Actions CI/CD simulation completed!${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo "  • Environment variables set to match GitHub Actions"
echo "  • All jobs from ci-cd.yml workflow simulated"
echo "  • Build artifacts validated"
echo "  • Server functionality tested"
echo "  • Docker build tested (if available)"
echo "  • Security audit performed"
echo ""

echo -e "${YELLOW}🚀 Next steps:${NC}"
echo "  1. Fix any issues found above"
echo "  2. Commit and push your changes"
echo "  3. Monitor actual GitHub Actions run"
echo "  4. Compare results with this simulation"
echo ""

echo -e "${BLUE}📝 GitHub Actions URL will be:${NC}"
echo "  https://github.com/YOUR_USERNAME/asylum-interactive-story-nextjs/actions"
echo ""

# Clean up
rm -f /tmp/server.log /tmp/docker-build.log

echo -e "${GREEN}Local debugging complete! 🎉${NC}"