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
