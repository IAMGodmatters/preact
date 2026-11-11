import { chromium } from 'playwright';
import { unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(error.message));
const failures = [];
let backupPath;
const check = async (name, fn) => {
  try { await fn(); console.log('PASS', name); }
  catch (error) { failures.push({ name, error: error.message }); console.error('FAIL', name, error.message); }
};
try {
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle', timeout: 60000 });
  await page.getByText('YOUR PRIVATE WORKSPACE').waitFor({ timeout: 30000 });
  await check('application renders', async () => {
    if (!(await page.title()).includes('Magnanimous')) throw new Error('Unexpected page title');
  });
  await check('task create and persist', async () => {
    await page.getByRole('button', { name: 'Tasks', exact: true }).click();
    await page.getByPlaceholder('What needs to get done?').fill('Smoke test task');
    await page.getByRole('button', { name: 'Add task' }).click();
    await page.getByText('Smoke test task').waitFor();
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Tasks', exact: true }).click();
    await page.getByText('Smoke test task').waitFor();
    await page.locator('.task-row input[type="checkbox"]').check();
    await page.locator('.task-row.is-done').waitFor();
    await page.locator('.check-label input').uncheck();
    await page.getByText('No tasks here yet. Add one above.').waitFor();
    await page.locator('.check-label input').check();
    await page.getByText('Smoke test task').waitFor();
    await page.getByPlaceholder('What needs to get done?').fill('Temporary smoke task');
    await page.getByRole('button', { name: 'Add task' }).click();
    await page.getByRole('button', { name: 'Delete task' }).first().click();
    await page.getByText('Temporary smoke task').waitFor({ state: 'detached' });
  });
  await check('notes create, edit and copy controls', async () => {
    await page.getByRole('button', { name: 'Notes', exact: true }).click();
    await page.getByPlaceholder('Note title').fill('Smoke test note');
    await page.getByPlaceholder('Write your thoughts…').fill('A note saved locally.');
    await page.getByRole('button', { name: 'Save new note' }).click();
    await page.getByText('Smoke test note').waitFor();
    await page.getByRole('button', { name: 'Copy note' }).click();
    await page.getByText('Copied to clipboard').waitFor();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    if (copied !== 'A note saved locally.') throw new Error('Copied note text did not match');
    await page.locator('.note-item textarea').fill('Updated smoke note body');
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Notes', exact: true }).click();
    if (await page.locator('.note-item textarea').inputValue() !== 'Updated smoke note body') throw new Error('Edited note did not persist');
  });
  await check('calculator arithmetic', async () => {
    await page.getByRole('button', { name: 'Calculator', exact: true }).click();
    await page.getByPlaceholder('Example: 125 * 8').fill('125 * 8');
    await page.getByRole('button', { name: 'Calculate' }).click();
    await page.getByText('1000', { exact: true }).waitFor();
    await page.getByPlaceholder('Example: 125 * 8').fill('8 / 0');
    await page.getByRole('button', { name: 'Calculate' }).click();
    await page.getByText('Cannot divide by zero').waitFor();
  });
  await check('text tools word and character counts', async () => {
    await page.getByRole('button', { name: 'Text tools', exact: true }).click();
    await page.getByPlaceholder('Paste or type your text here…').fill('Magnanimous test');
    await page.getByText('2', { exact: true }).first().waitFor();
    await page.getByRole('button', { name: 'UPPERCASE' }).click();
    if (await page.locator('textarea').inputValue() !== 'MAGNANIMOUS TEST') throw new Error('Uppercase conversion did not update the text');
    await page.getByRole('button', { name: 'lowercase' }).click();
    if (await page.locator('textarea').inputValue() !== 'magnanimous test') throw new Error('Lowercase conversion did not update the text');
    await page.getByPlaceholder('Paste or type your text here…').fill('  two   spaces\n and a line  ');
    await page.getByRole('button', { name: 'Clean spaces' }).click();
    if (await page.locator('textarea').inputValue() !== 'two spaces and a line') throw new Error('Whitespace cleanup failed');
  });
  await check('JSON format and validate', async () => {
    await page.getByRole('button', { name: 'JSON tool', exact: true }).click();
    await page.getByRole('button', { name: 'Format & validate' }).click();
    await page.getByText('Valid JSON — formatted').waitFor();
    await page.locator('textarea').fill('{invalid json');
    await page.getByRole('button', { name: 'Format & validate' }).click();
    await page.getByText(/JSON error:/).waitFor();
  });
  await check('planner add event', async () => {
    await page.getByRole('button', { name: 'Planner', exact: true }).click();
    await page.getByPlaceholder('Appointment, deadline or reminder').fill('Smoke test appointment');
    await page.getByRole('button', { name: 'Add to planner' }).click();
    await page.getByText('Smoke test appointment').waitFor();
  });
  await check('focus timer starts and pauses', async () => {
    await page.getByRole('button', { name: 'Focus timer', exact: true }).click();
    await page.getByRole('button', { name: '5 min', exact: true }).click();
    await page.getByRole('button', { name: 'Start focus' }).click();
    await page.getByRole('button', { name: 'Pause' }).waitFor();
    await page.getByRole('button', { name: 'Pause' }).click();
    await page.getByRole('button', { name: 'Start focus' }).waitFor();
    await page.getByRole('button', { name: 'Reset' }).click();
    await page.getByText('05:00').waitFor();
    await page.getByRole('button', { name: '5-minute break' }).click();
    await page.getByText('05:00').waitFor();
  });
  await check('habit add and check-in', async () => {
    await page.getByRole('button', { name: 'Habits', exact: true }).click();
    await page.getByPlaceholder('Example: Read for 10 minutes').fill('Daily reading');
    await page.getByRole('button', { name: 'Add habit' }).click();
    await page.getByText('Daily reading').waitFor();
    await page.getByRole('checkbox').check();
    await page.getByText('1 total check-ins').waitFor();
    await page.getByRole('checkbox').uncheck();
    await page.getByText('0 total check-ins').waitFor();
    await page.getByRole('checkbox').check();
    await page.getByText('1 total check-ins').waitFor();
  });
  await check('unit conversion', async () => {
    await page.getByRole('button', { name: 'Unit converter', exact: true }).click();
    await page.getByRole('button', { name: 'Convert', exact: true }).click();
    await page.getByText('0.621371 mi').waitFor();
    await page.locator('select').first().selectOption('temperature');
    await page.locator('select').nth(1).selectOption('C');
    await page.locator('select').nth(2).selectOption('F');
    await page.getByRole('button', { name: 'Convert', exact: true }).click();
    await page.getByText('33.8 F').waitFor();
  });
  await check('theme toggle', async () => {
    const toggle = page.getByRole('button', { name: 'Light mode' });
    await toggle.click();
    await page.getByRole('button', { name: 'Dark mode' }).waitFor();
  });
  await check('backup export and restore', async () => {
    await page.getByRole('button', { name: 'Backup & restore', exact: true }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download full backup' }).click();
    const download = await downloadPromise;
    if (!download.suggestedFilename().endsWith('.json')) throw new Error('Backup was not JSON');
    backupPath = join(tmpdir(), `magnanimous-studio-smoke-${Date.now()}.json`);
    await download.saveAs(backupPath);
    await page.locator('input[type="file"]').setInputFiles({ name: 'invalid-backup.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
    await page.getByText('This is not a Magnanimous Studio backup.').waitFor();
    const existingTask = await page.evaluate(() => JSON.parse(localStorage.getItem('mw-tasks') || '[]').some(task => task.text === 'Smoke test task'));
    if (!existingTask) throw new Error('Invalid backup changed existing saved data');
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Backup & restore', exact: true }).click();
    page.once('dialog', dialog => dialog.accept());
    await page.locator('input[type="file"]').setInputFiles(backupPath);
    await page.getByText('Backup restored successfully').waitFor();
    await page.getByRole('button', { name: 'Tasks', exact: true }).click();
    await page.getByText('Smoke test task').waitFor();
    await page.getByRole('button', { name: 'Notes', exact: true }).click();
    await page.getByText('Smoke test note').waitFor();
    await page.getByRole('button', { name: 'Planner', exact: true }).click();
    await page.getByText('Smoke test appointment').waitFor();
    await page.getByRole('button', { name: 'Habits', exact: true }).click();
    await page.getByText('Daily reading').waitFor();
  });
  await check('malformed backup records are safely sanitized', async () => {
    const now = new Date();
    const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
    const malformed = {
      app: 'Magnanimous Studio', tasks: [null, { text: '   ' }, { text: 'Recovered task', done: 'yes' }],
      notes: [null, { body: 'Recovered note', title: 12 }],
      events: [null, { title: 'Bad date', date: '2026-02-31' }, { title: 'Recovered appointment', date: today, time: '99:99' }],
      habits: [null, { name: 'Recovered habit', checks: 'not-an-array' }]
    };
    await page.getByRole('button', { name: 'Backup & restore', exact: true }).click();
    page.once('dialog', dialog => dialog.accept());
    await page.locator('input[type="file"]').setInputFiles({ name: 'sanitized-backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(malformed)) });
    await page.getByText('Backup restored successfully').waitFor();
    await page.getByRole('button', { name: 'Tasks', exact: true }).click();
    await page.getByText('Recovered task').waitFor();
    const checked = await page.locator('.task-row input[type="checkbox"]').isChecked();
    if (checked) throw new Error('Malformed completion flag was not normalized');
    await page.getByRole('button', { name: 'Notes', exact: true }).click();
    await page.getByText('Untitled note').waitFor();
    await page.getByRole('button', { name: 'Planner', exact: true }).click();
    await page.getByText('Recovered appointment').waitFor();
    await page.getByText('Bad date').waitFor({ state: 'detached' });
    await page.getByRole('button', { name: 'Habits', exact: true }).click();
    await page.getByText('Recovered habit').waitFor();
    await page.getByText('0 total check-ins').waitFor();
  });
  await check('corrupted local storage recovers without a crash', async () => {
    const damagedPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      await damagedPage.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
      await damagedPage.evaluate(() => {
        localStorage.setItem('mw-tasks', '{broken');
        localStorage.setItem('mw-notes', JSON.stringify({ wrong: true }));
        localStorage.setItem('mw-events', JSON.stringify([null, { title: 'Invalid', date: 'not-a-date' }]));
        localStorage.setItem('mw-habits', JSON.stringify([null, { name: 'Broken habit', checks: null }]));
        localStorage.setItem('mw-theme', 'not-a-boolean');
      });
      await damagedPage.reload({ waitUntil: 'networkidle' });
      await damagedPage.getByRole('button', { name: 'Tasks', exact: true }).click();
      await damagedPage.getByText('No tasks here yet. Add one above.').waitFor();
      await damagedPage.getByRole('button', { name: 'Notes', exact: true }).click();
      await damagedPage.getByText('No notes found. Create your first note.').waitFor();
      await damagedPage.getByRole('button', { name: 'Planner', exact: true }).click();
      await damagedPage.getByText('Nothing planned yet. Add an appointment or reminder above.').waitFor();
      await damagedPage.getByRole('button', { name: 'Habits', exact: true }).click();
      await damagedPage.getByText('Broken habit').waitFor();
      await damagedPage.getByText('0 total check-ins').waitFor();
      await damagedPage.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Quota exceeded', 'QuotaExceededError'); }; });
      await damagedPage.getByPlaceholder('What needs to get done?').waitFor({ state: 'detached' });
      await damagedPage.getByRole('button', { name: 'Tasks', exact: true }).click();
      await damagedPage.getByPlaceholder('What needs to get done?').fill('Unsaved task');
      await damagedPage.getByRole('button', { name: 'Add task' }).click();
      await damagedPage.getByText('This browser could not save the change.').waitFor();
    } finally { await damagedPage.close(); }
  });
  await check('application has no uncaught page errors', async () => {
    if (pageErrors.length) throw new Error(pageErrors.join('; '));
  });
  await check('mobile layout has no horizontal overflow', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    const metrics = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    if (metrics.scroll > metrics.width + 2) throw new Error('Horizontal overflow: ' + JSON.stringify(metrics));
  });
} finally {
  await browser.close();
  if (backupPath) await unlink(backupPath).catch(() => {});
}
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exit(1);
}
console.log('All browser smoke tests passed.');
