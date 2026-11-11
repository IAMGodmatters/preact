import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const failures = [];
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
  });
  await check('notes create and copy controls', async () => {
    await page.getByRole('button', { name: 'Notes', exact: true }).click();
    await page.getByPlaceholder('Note title').fill('Smoke test note');
    await page.getByPlaceholder('Write your thoughts…').fill('A note saved locally.');
    await page.getByRole('button', { name: 'Save new note' }).click();
    await page.getByText('Smoke test note').waitFor();
  });
  await check('calculator arithmetic', async () => {
    await page.getByRole('button', { name: 'Calculator', exact: true }).click();
    await page.getByPlaceholder('Example: 125 * 8').fill('125 * 8');
    await page.getByRole('button', { name: 'Calculate' }).click();
    await page.getByText('1000', { exact: true }).waitFor();
  });
  await check('text tools word and character counts', async () => {
    await page.getByRole('button', { name: 'Text tools', exact: true }).click();
    await page.getByPlaceholder('Paste or type your text here…').fill('Magnanimous test');
    await page.getByText('2', { exact: true }).first().waitFor();
    await page.getByRole('button', { name: 'UPPERCASE' }).click();
    if (await page.locator('textarea').inputValue() !== 'MAGNANIMOUS TEST') throw new Error('Uppercase conversion did not update the text');
  });
  await check('JSON format and validate', async () => {
    await page.getByRole('button', { name: 'JSON tool', exact: true }).click();
    await page.getByRole('button', { name: 'Format & validate' }).click();
    await page.getByText('Valid JSON — formatted').waitFor();
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
  });
  await check('habit add and check-in', async () => {
    await page.getByRole('button', { name: 'Habits', exact: true }).click();
    await page.getByPlaceholder('Example: Read for 10 minutes').fill('Daily reading');
    await page.getByRole('button', { name: 'Add habit' }).click();
    await page.getByText('Daily reading').waitFor();
    await page.getByRole('checkbox').check();
    await page.getByText('1 total check-ins').waitFor();
  });
  await check('unit conversion', async () => {
    await page.getByRole('button', { name: 'Unit converter', exact: true }).click();
    await page.getByRole('button', { name: 'Convert', exact: true }).click();
    await page.getByText('0.621371 mi').waitFor();
  });
  await check('theme toggle', async () => {
    const toggle = page.getByRole('button', { name: 'Light mode' });
    await toggle.click();
    await page.getByRole('button', { name: 'Dark mode' }).waitFor();
  });
  await check('backup export control', async () => {
    await page.getByRole('button', { name: 'Backup & restore', exact: true }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download full backup' }).click();
    const download = await downloadPromise;
    if (!download.suggestedFilename().endsWith('.json')) throw new Error('Backup was not JSON');
  });
  await check('mobile layout has no horizontal overflow', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    const metrics = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    if (metrics.scroll > metrics.width + 2) throw new Error('Horizontal overflow: ' + JSON.stringify(metrics));
  });
} finally {
  await browser.close();
}
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exit(1);
}
console.log('All browser smoke tests passed.');
