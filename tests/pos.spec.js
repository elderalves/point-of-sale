const { test, expect } = require('@playwright/test');
const {
  addResultComment,
  attachFailureScreenshot
} = require('./helpers/testrail');

function productCard(page, name) {
  return page.locator('.product__item').filter({ hasText: name });
}

function invoiceValue(page, label) {
  return page
    .locator('.summary__invoice-item')
    .filter({ hasText: label })
    .locator('.summary__invoice-value');
}

test.describe('Mock POS flow', () => {
  test.afterEach(async ({ page }, testInfo) => {
    await attachFailureScreenshot(page, testInfo);
  });

  test('shows an empty order by default', async ({ page }, testInfo) => {
    addResultComment(testInfo, [
      'Open the POS landing page.',
      'Verify the order starts empty.',
      'Confirm payment and clear actions are disabled.'
    ]);

    await page.goto('/');

    await expect(page.locator('.summary__empty')).toHaveText(
      'Start adding items from the mock catalog to build this order.'
    );
    await expect(page.locator('header')).toContainText('0 items');
    await expect(page.getByRole('button', { name: 'Pay' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Clear All Items' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Clear Last Item' })).toBeDisabled();
    await expect(page.locator('.navigation-bar')).toContainText('All');
    await expect(page.locator('.navigation-bar')).toContainText('Pizza');
  });

  test('adds items, calculates totals, and pays the order', async ({ page }, testInfo) => {
    addResultComment(testInfo, [
      'Add two pepperoni pizzas to the order.',
      'Verify the subtotal and total values.',
      'Complete payment and confirm the balance is zero.'
    ]);

    await page.goto('/');

    const pepperoni = productCard(page, 'Pizza-16 Inch Pepperoni');

    await pepperoni.locator('.product__addition').click();
    await pepperoni.locator('.product__addition').click();

    await expect(pepperoni.locator('.product__qtd')).toHaveText('2');
    await expect(page.locator('header')).toContainText('2 items');
    await expect(page.locator('.summary__products')).toContainText('2 Qty - $80.00');
    await expect(invoiceValue(page, 'Subtotal')).toHaveText('$80.00');
    await expect(invoiceValue(page, 'Order Total')).toHaveText('$91.30');
    await expect(page.getByRole('button', { name: 'Pay $91.30' })).toBeEnabled();

    await page.getByRole('button', { name: 'Pay $91.30' }).click();

    await expect(page.locator('header')).toContainText('Status: Paid');
    await expect(invoiceValue(page, 'Payments')).toHaveText('$91.30');
    await expect(invoiceValue(page, 'Balance Due')).toHaveText('$0.00');
    await expect(page.getByRole('button', { name: 'Paid' })).toBeDisabled();
  });

  test('filters products, cycles the customer, and cancels the order', async ({ page }, testInfo) => {
    addResultComment(testInfo, [
      'Switch the customer profile.',
      'Filter the catalog to pizza products.',
      'Add an item, then cancel the order and verify the reset state.'
    ]);

    await page.goto('/');

    await page.getByRole('button', { name: 'Customer: Walk-in Guest' }).click();
    await expect(page.getByRole('button', { name: 'Customer: Birthday Party' })).toBeVisible();

    await page.locator('.navigation-bar').getByRole('button', { name: 'Pizza' }).click();
    await expect(productCard(page, 'Pizza-16 Inch Pepperoni')).toBeVisible();
    await expect(productCard(page, 'Laser Tag Game')).toHaveCount(0);

    await productCard(page, 'Pizza Large-Cheese').locator('.product__addition').click();
    await expect(page.locator('header')).toContainText('1 item');

    await page.getByRole('button', { name: 'Cancel Order' }).click();

    await expect(page.locator('header')).toContainText('Order #23935');
    await expect(page.locator('header')).toContainText('0 items');
    await expect(page.locator('.summary__empty')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pay' })).toBeDisabled();
  });
});
