#!/bin/bash

echo "=========================================="
echo "COMPREHENSIVE QUALITY GATE"
echo "=========================================="

FAILURES=0

# 1. TypeScript Quality
echo ""
echo "[1/4] TypeScript Quality Check..."
if bash .claude/skills/typescript-quality-check/scripts/typescript-quality-check.sh; then
  echo "✅ TypeScript checks passed"
else
  echo "❌ TypeScript checks failed"
  FAILURES=$((FAILURES + 1))
fi

# 2. Terraform Quality
echo ""
echo "[2/4] Terraform Quality Check..."
if bash .claude/skills/terraform-quality-check/scripts/terraform-quality-check.sh; then
  echo "✅ Terraform checks passed"
else
  echo "❌ Terraform checks failed"
  FAILURES=$((FAILURES + 1))
fi

# 3. Unit Tests
echo ""
echo "[3/4] Unit Tests..."
if npm test; then
  echo "✅ All tests passed"
else
  echo "❌ Tests failed"
  FAILURES=$((FAILURES + 1))
fi

# 4. Build Verification
echo ""
echo "[4/4] Build Verification..."
if npm run build; then
  echo "✅ Build successful"
else
  echo "❌ Build failed"
  FAILURES=$((FAILURES + 1))
fi

# Summary
echo ""
echo "=========================================="
if [ $FAILURES -eq 0 ]; then
  echo "✅ ALL CHECKS PASSED"
  echo "=========================================="
  exit 0
else
  echo "❌ $FAILURES CHECK(S) FAILED"
  echo "=========================================="
  exit 1
fi
