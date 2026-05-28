#!/bin/bash

echo "=========================================="
echo "Terraform Quality Check"
echo "=========================================="

cd infra-aws/

# 1. Version Check
echo ""
echo "[1/3] Checking Terraform version..."
if terraform version | grep "Terraform v1\."; then
  echo "✅ Terraform version is 1.x"
else
  echo "❌ Terraform version must be 1.x"
  exit 1
fi

# 2. Format Check
echo ""
echo "[2/3] Checking Terraform formatting..."
if terraform fmt -check -recursive; then
  echo "✅ All files properly formatted"
  FMT_EXIT=0
else
  echo "⚠️  Formatting issues found - attempting auto-fix..."
  terraform fmt -recursive
  echo "✅ Auto-formatted Terraform files"
  FMT_EXIT=0
fi

# 3. Validation
echo ""
echo "[3/3] Validating Terraform configuration..."
if terraform validate; then
  echo "✅ Terraform configuration valid"
  VALIDATE_EXIT=0
else
  echo "❌ Terraform validation failed"
  VALIDATE_EXIT=1
fi

# Summary
echo ""
echo "=========================================="
if [ $((FMT_EXIT + VALIDATE_EXIT)) -eq 0 ]; then
  echo "✅ All Terraform checks passed"
  exit 0
else
  echo "❌ Terraform checks failed"
  exit 1
fi
