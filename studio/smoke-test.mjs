import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.STUDIO_URL || 'http://127.0.0.1:4173/preact/';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
const externalRequests = [];
page.on('request', (request) => {
  if (new URL(request.url()).origin !== new URL(base).origin) externalRequests.push(request.url());
});

try {
  await page.goto(base, { waitUntil: 'networkidle' });
  await assert.doesNotReject(() => page.getByRole('heading', { name: 'Tasks', exact: true }).waitFor());
  for (const name of ['Tasks', 'Notes', 'Planner', 'Focus Timer', 'Habits', 'Calculator', 'Unit Converter', 'Text Tools', 'JSON Formatter', 'Backup & Restore']) {
    await page.getByRole('button', { name: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).waitFor();
  }

  await page.getByLabel('New task').fill('Studio smoke task');
  await page.getByRole('button', { name: 'Add task' }).click();
  await page.getByText('Studio smoke task').waitFor();
  await page.locator('.task-item input[type="checkbox"]').first().check();

  await page.getByRole('button', { name: /Notes/ }).click();
  await page.getByLabel('Note title').fill('Studio smoke note');
  await page.getByLabel('Note text').fill('Notes stay in this browser.');
  await page.getByRole('button', { name: 'Save note' }).click();
  await page.getByText('Studio smoke note').waitFor();
  await page.getByRole('button', { name: 'Edit note' }).click();
  await page.getByLabel('Edit note text').fill('Edited note stays in this browser.');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByText('Edited note stays in this browser.').waitFor();

  await page.getByRole('button', { name: /Planner/ }).click();
  await page.getByLabel('Plan title').fill('Studio smoke plan');
  await page.getByLabel('Plan date').fill('2026-11-12');
  await page.getByLabel('Plan time').fill('10:30');
  await page.getByRole('button', { name: 'Add plan' }).click();
  await page.getByText('Studio smoke plan').waitFor();

  await page.getByRole('button', { name: /Focus Timer/ }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByRole('button', { name: 'Pause' }).waitFor();
  await page.getByRole('button', { name: 'Pause' }).click();

  await page.getByRole('button', { name: /Habits/ }).click();
  await page.getByLabel('New habit').fill('Walk for ten minutes');
  await page.getByRole('button', { name: 'Add habit' }).click();
  await page.getByText('Walk for ten minutes').waitFor();
  await page.locator('.task-item input[type="checkbox"]').first().check();

  await page.getByRole('button', { name: /Calculator/ }).click();
  await page.getByLabel('Calculator expression').fill('12 * (3 + 2)');
  await page.getByRole('button', { name: 'Calculate' }).click();
  await page.locator('.result-card').getByText('60', { exact: true }).waitFor();

  await page.getByRole('button', { name: /Unit Converter/ }).click();
  await page.locator('.result-card').getByText('1000 m', { exact: true }).waitFor();

  await page.getByRole('button', { name: /Text Tools/ }).click();
  await page.getByLabel('Text input').fill('hello world');
  await page.getByRole('button', { name: 'Uppercase' }).click();
  await page.getByText('HELLO WORLD', { exact: true }).waitFor();

  await page.getByRole('button', { name: /JSON Formatter/ }).click();
  await page.getByRole('button', { name: 'Format JSON' }).click();
  await page.locator('.json-output').getByText('"magnanimous": "ready"').waitFor();

  await page.getByRole('button', { name: /Backup & Restore/ }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download backup' }).click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), 'magnanimous-studio-backup.json');

  await page.getByRole('button', { name: 'Light mode' }).click();
  await page.locator('.app.light').waitFor();
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.app.light').waitFor();
  await page.getByRole('button', { name: /Tasks/ }).click();
  await page.getByText('Studio smoke task').waitFor();

  page.once('dialog', (dialog) => dialog.accept());
  const restored = {
    app: 'Magnanimous Preact Studio',
    version: 1,
    theme: 'dark',
    workspace: {
      tasks: [{ id: 'restored-task', title: 'Restored backup task', done: false }],
      notes: [],
      plans: [],
      habits: [],
    },
  };
  await page.getByRole('button', { name: /Backup & Restore/ }).click();
  await page.getByLabel('Restore backup').setInputFiles({
    name: 'studio-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(restored)),
  });
  await page.getByText('Backup restored in this browser.').waitFor();
  await page.getByRole('button', { name: /Tasks/ }).click();
  await page.getByText('Restored backup task').waitFor();
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByText('Restored backup task').waitFor();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle' });
  const widths = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
  assert.ok(widths.document <= widths.viewport + 1, 'Mobile layout must not cause horizontal page overflow.');
  await page.getByRole('button', { name: /Tasks/ }).waitFor();
  assert.deepEqual(externalRequests, [], 'Studio must not send data to external services.');
  console.log('Magnanimous Preact Studio browser smoke tests: PASS');
} finally {
  await browser.close();
}
