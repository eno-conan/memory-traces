#!/bin/bash
set -e

echo "=========================================="
echo "TypeScript Quality Check"
echo "=========================================="

ERRORS=0

# 1. Type Check
echo ""
echo "[1/4] Running TypeScript type check..."
if npx tsc --noEmit --pretty; then
  echo "✅ Type check passed"
else
  echo "❌ Type check failed"
  ERRORS=$((ERRORS + 1))
fi

# 2. ESLint Check
echo ""
echo "[2/4] Running ESLint..."
if npx eslint . --max-warnings 0; then
  echo "✅ ESLint passed"
else
  echo "❌ ESLint failed"
  ERRORS=$((ERRORS + 1))
fi

# 3. Check for 'any' in API routes
echo ""
echo "[3/4] Checking for 'any' types in API routes..."
if npx eslint app/api/**/*.ts --rule '@typescript-eslint/no-explicit-any: error' 2>/dev/null; then
  echo "✅ No explicit 'any' types found"
else
  echo "❌ Explicit 'any' types found in API routes"
  ERRORS=$((ERRORS + 1))
fi

# 4. Lambda Type Safety
echo ""
echo "[4/4] Checking Lambda type safety..."
LAMBDA_ERRORS=0
while IFS=: read -r file line content; do
  if [ -n "$file" ] && [ -n "$line" ]; then
    context=$(sed -n "${line},$((line+5))p" "$file" 2>/dev/null || echo "")
    if ! echo "$context" | grep -E ": \w+Response|as \w+Response" >/dev/null; then
      echo "❌ Missing type annotation: $file:$line"
      LAMBDA_ERRORS=$((LAMBDA_ERRORS + 1))
    fi
  fi
done < <(grep -r "JSON.parse.*Payload" app/ --include="*.ts" -n 2>/dev/null || true)

if [ $LAMBDA_ERRORS -eq 0 ]; then
  echo "✅ All Lambda responses have type annotations"
else
  echo "❌ $LAMBDA_ERRORS Lambda responses missing type annotations"
  ERRORS=$((ERRORS + 1))
fi

# Summary
echo ""
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
  echo "✅ All TypeScript quality checks passed"
  exit 0
else
  echo "❌ $ERRORS check(s) failed"
  exit 1
fi
