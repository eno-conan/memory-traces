import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { injectCognitoAuth } from '../helpers/auth';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

test.describe('a11y: public pages', () => {
  test('/login ページに WCAG 違反がないこと', async ({ page }) => {
    await page.goto('/login');
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('a11y: authenticated pages', () => {
  test.beforeEach(async ({ page }) => {
    await injectCognitoAuth(page);
  });

  test('/register ページに WCAG 違反がないこと', async ({ page }) => {
    await page.goto('/register');
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });

  test('/dashboard ページに WCAG 違反がないこと', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });
});
