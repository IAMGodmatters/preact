import { render } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import './style.css';

const STORAGE_KEY = 'magnanimous-studio-workspace-v1';
const THEME_KEY = 'magnanimous-studio-theme-v1';
const TOOLS = [
  { id: 'tasks', label: 'Tasks', icon: '✓', description: 'Capture the next thing to do.' },
  { id: 'notes', label: 'Notes', icon: '✎', description: 'Keep useful thoughts in one place.' },
  { id: 'planner', label: 'Planner', icon: '▦', description: 'Give your plans a date and time.' },
  { id: 'focus', label: 'Focus Timer', icon: '◷', description: 'Work in focused sessions.' },
  { id: 'habits', label: 'Habits', icon: '↗', description: 'Build small, steady routines.' },
  { id: 'calculator', label: 'Calculator', icon: '＋', description: 'Work out everyday calculations.' },
  { id: 'converter', label: 'Unit Converter', icon: '⇄', description: 'Convert common measurements.' },
  { id: 'text', label: 'Text Tools', icon: 'T', description: 'Count, clean and transform text.' },
  { id: 'json', label: 'JSON Formatter', icon: '{ }', description: 'Validate and format JSON.' },
  { id: 'backup', label: 'Backup & Restore', icon: '↥', description: 'Export or restore your workspace.' },
];

const EMPTY_DATA = { tasks: [], notes: [], plans: [], habits: [] };
const UNITS = {
  Length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, ft: 0.3048, in: 0.0254, mi: 1609.344 },
  Weight: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.45359237, oz: 0.028349523125 },
  Volume: { L: 1, mL: 0.001, gal: 3.785411784, cup: 0.2365882365 },
};

function localDate() {
  const date = new Date();
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

function makeId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + '-' + String(Math.random()).slice(2);
}

function loadWorkspace() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return {
      tasks: Array.isArray(saved && saved.tasks) ? saved.tasks : [],
      notes: Array.isArray(saved && saved.notes) ? saved.notes : [],
      plans: Array.isArray(saved && saved.plans) ? saved.plans : [],
      habits: Array.isArray(saved && saved.habits) ? saved.habits : [],
    };
  } catch {
    return { ...EMPTY_DATA };
  }
}

function calculate(source) {
  const compact = String(source || '').replace(/\s+/g, '');
  if (!compact || !/^[0-9.+\-*/%()]+$/.test(compact)) throw new Error('Enter a valid arithmetic expression.');
  const tokens = compact.match(/\d+(?:\.\d+)?|[()+\-*/%]/g) || [];
  if (tokens.join('') !== compact) throw new Error('Check the expression and try again.');
  let index = 0;
  function primary() {
    const token = tokens[index++];
    if (token === '(') {
      const value = expression();
      if (tokens[index++] !== ')') throw new Error('A closing parenthesis is missing.');
      return value;
    }
    if (token === undefined || !/^\d+(?:\.\d+)?$/.test(token)) throw new Error('A number is missing.');
    return Number(token);
  }
  function unary() {
    if (tokens[index] === '+') { index++; return unary(); }
    if (tokens[index] === '-') { index++; return -unary(); }
    return primary();
  }
  function term() {
    let value = unary();
    while (['*', '/', '%'].includes(tokens[index])) {
      const op = tokens[index++];
      const right = unary();
      if ((op === '/' || op === '%') && right === 0) throw new Error('Division by zero is not allowed.');
      value = op === '*' ? value * right : op === '/' ? value / right : value % right;
    }
    return value;
  }
  function expression() {
    let value = term();
    while (tokens[index] === '+' || tokens[index] === '-') {
      const op = tokens[index++];
      const right = term();
      value = op === '+' ? value + right : value - right;
    }
    return value;
  }
  const result = expression();
  if (index !== tokens.length || !Number.isFinite(result)) throw new Error('The expression could not be calculated.');
  return Number(result.toPrecision(12));
}

function convert(value, category, from, to) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) throw new Error('Enter a valid number.');
  if (category === 'Temperature') {
    const celsius = from === '°C' ? amount : from === '°F' ? (amount - 32) * 5 / 9 : amount - 273.15;
    return to === '°C' ? celsius : to === '°F' ? celsius * 9 / 5 + 32 : celsius + 273.15;
  }
  const units = UNITS[category];
  if (!units || !units[from] || !units[to]) throw new Error('Choose valid units.');
  return amount * units[from] / units[to];
}

function App() {
  const [workspace, setWorkspace] = useState(loadWorkspace);
  const [active, setActive] = useState('tasks');
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
  });
  const [taskTitle, setTaskTitle] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [editingNoteId, setEditingNoteId] = useState('');
  const [editingNoteTitle, setEditingNoteTitle] = useState('');
  const [editingNoteBody, setEditingNoteBody] = useState('');
  const [planTitle, setPlanTitle] = useState('');
  const [planDate, setPlanDate] = useState(localDate());
  const [planTime, setPlanTime] = useState('09:00');
  const [habitName, setHabitName] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState('Focus');
  const [calcInput, setCalcInput] = useState('12 * (3 + 2)');
  const [calcResult, setCalcResult] = useState('60');
  const [calcError, setCalcError] = useState('');
  const [unitCategory, setUnitCategory] = useState('Length');
  const [unitValue, setUnitValue] = useState('1');
  const [unitFrom, setUnitFrom] = useState('km');
  const [unitTo, setUnitTo] = useState('m');
  const [textInput, setTextInput] = useState('');
  const [textOutput, setTextOutput] = useState('');
  const [jsonInput, setJsonInput] = useState('{\n  "magnanimous": "ready"\n}');
  const [jsonOutput, setJsonOutput] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [backupMessage, setBackupMessage] = useState('');

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace)); } catch { /* Keep the current session usable if storage is full. */ }
  }, [workspace]);

  useEffect(() => {
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* Theme still works for this session. */ }
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (!timerRunning) return undefined;
    const interval = setInterval(() => {
      setTimerSeconds((remaining) => {
        if (remaining <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return remaining - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  useEffect(() => {
    const units = unitCategory === 'Temperature' ? ['°C', '°F', 'K'] : Object.keys(UNITS[unitCategory]);
    if (!units.includes(unitFrom) || !units.includes(unitTo)) {
      setUnitFrom(units[0]);
      setUnitTo(units[1] || units[0]);
    }
  }, [unitCategory, unitFrom, unitTo]);

  const today = localDate();
  const activeTool = TOOLS.find((tool) => tool.id === active) || TOOLS[0];
  const completedTasks = workspace.tasks.filter((task) => task.done).length;
  const conversion = useMemo(() => {
    try {
      const result = convert(unitValue, unitCategory, unitFrom, unitTo);
      return Number(result.toFixed(8)).toString() + ' ' + unitTo;
    } catch {
      return 'Enter a value to convert.';
    }
  }, [unitValue, unitCategory, unitFrom, unitTo]);
  const words = textInput.trim() ? textInput.trim().split(/\s+/).length : 0;
  const minutes = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
  const seconds = String(timerSeconds % 60).padStart(2, '0');

  function addTask(event) {
    event.preventDefault();
    const title = taskTitle.trim();
    if (!title) return;
    setWorkspace((old) => ({ ...old, tasks: [{ id: makeId(), title, done: false, createdAt: Date.now() }, ...old.tasks] }));
    setTaskTitle('');
  }
  function addNote(event) {
    event.preventDefault();
    const title = noteTitle.trim();
    if (!title && !noteBody.trim()) return;
    setWorkspace((old) => ({ ...old, notes: [{ id: makeId(), title: title || 'Untitled note', body: noteBody, updatedAt: Date.now() }, ...old.notes] }));
    setNoteTitle('');
    setNoteBody('');
  }
  function beginEditNote(note) {
    setEditingNoteId(note.id);
    setEditingNoteTitle(note.title);
    setEditingNoteBody(note.body);
  }
  function saveNoteEdit(event) {
    event.preventDefault();
    setWorkspace((old) => ({ ...old, notes: old.notes.map((note) => note.id === editingNoteId ? { ...note, title: editingNoteTitle.trim() || 'Untitled note', body: editingNoteBody, updatedAt: Date.now() } : note) }));
    setEditingNoteId('');
  }
  function addPlan(event) {
    event.preventDefault();
    if (!planTitle.trim()) return;
    setWorkspace((old) => ({ ...old, plans: [...old.plans, { id: makeId(), title: planTitle.trim(), date: planDate, time: planTime }].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)) }));
    setPlanTitle('');
  }
  function addHabit(event) {
    event.preventDefault();
    if (!habitName.trim()) return;
    setWorkspace((old) => ({ ...old, habits: [{ id: makeId(), name: habitName.trim(), doneOn: '' }, ...old.habits] }));
    setHabitName('');
  }
  function setTimer(mode) {
    setTimerRunning(false);
    setTimerMode(mode);
    setTimerSeconds(mode === 'Focus' ? 25 * 60 : 5 * 60);
  }
  function runCalculation(event) {
    event.preventDefault();
    try {
      setCalcResult(String(calculate(calcInput)));
      setCalcError('');
    } catch (error) {
      setCalcResult('');
      setCalcError(error.message || 'Could not calculate that expression.');
    }
  }
  function runTextTool(action) {
    if (action === 'Uppercase') setTextOutput(textInput.toUpperCase());
    if (action === 'Lowercase') setTextOutput(textInput.toLowerCase());
    if (action === 'Title Case') setTextOutput(textInput.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()));
    if (action === 'Trim') setTextOutput(textInput.trim().replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n'));
    if (action === 'Reverse') setTextOutput(Array.from(textInput).reverse().join(''));
  }
  function formatJson(mode) {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(mode === 'Minify' ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2));
      setJsonError('');
    } catch (error) {
      setJsonOutput('');
      setJsonError(error.message || 'Invalid JSON.');
    }
  }
  function downloadBackup() {
    const backup = { app: 'Magnanimous Preact Studio', version: 1, exportedAt: new Date().toISOString(), theme, workspace };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'magnanimous-studio-backup.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setBackupMessage('Backup created. Keep the JSON file somewhere safe.');
  }
  async function restoreBackup(event) {
    const input = event.currentTarget;
    const file = input.files && input.files[0];
    if (!file) return;
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error('Backup file is larger than 2 MB.');
      const backup = JSON.parse(await file.text());
      const data = backup.workspace || backup;
      if (!data || !Array.isArray(data.tasks) || !Array.isArray(data.notes) || !Array.isArray(data.plans) || !Array.isArray(data.habits)) {
        throw new Error('This file is not a valid Magnanimous Studio backup.');
      }
      if (!window.confirm('Restore this backup and replace the data in this browser?')) return;
      setWorkspace({ tasks: data.tasks, notes: data.notes, plans: data.plans, habits: data.habits });
      if (backup.theme === 'light' || backup.theme === 'dark') setTheme(backup.theme);
      setBackupMessage('Backup restored in this browser.');
    } catch (error) {
      setBackupMessage(error.message || 'Backup could not be restored.');
    } finally {
      input.value = '';
    }
  }
  function toggleTask(id) {
    setWorkspace((old) => ({ ...old, tasks: old.tasks.map((task) => task.id === id ? { ...task, done: !task.done } : task) }));
  }
  function deleteItem(key, id) {
    setWorkspace((old) => ({ ...old, [key]: old[key].filter((item) => item.id !== id) }));
  }
  function toggleHabit(id) {
    setWorkspace((old) => ({ ...old, habits: old.habits.map((habit) => habit.id === id ? { ...habit, doneOn: habit.doneOn === today ? '' : today } : habit) }));
  }

  return (
    <main class={'app ' + theme}>
      <header class="topbar">
        <a class="brand" href="#home" aria-label="Magnanimous Studio home">
          <span class="brand-mark">M</span>
          <span><strong>MAGNANIMOUS</strong><small>PREACT STUDIO</small></span>
        </a>
        <div class="topbar-actions">
          <span class="save-indicator"><i /> Saved in this browser</span>
          <button class="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-pressed={theme === 'light'}>
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
      </header>

      <div class="layout">
        <aside class="sidebar" aria-label="Studio tools">
          <div class="sidebar-heading"><small>YOUR WORKSPACE</small><strong>Simple tools. Clear mind.</strong></div>
          <nav class="tool-nav">
            {TOOLS.map((tool) => (
              <button type="button" key={tool.id} class={'nav-item ' + (active === tool.id ? 'selected' : '')} aria-current={active === tool.id ? 'page' : undefined} onClick={() => setActive(tool.id)}>
                <span class="nav-icon">{tool.icon}</span><span>{tool.label}</span>
              </button>
            ))}
          </nav>
          <div class="sidebar-note">Your information stays in this browser. Export a backup before clearing browser data.</div>
        </aside>

        <section class="workspace">
          <div class="page-heading">
            <div><small>MAGNANIMOUS STUDIO</small><h1>{activeTool.label}</h1><p>{activeTool.description}</p></div>
            <span class="local-badge">LOCAL-FIRST</span>
          </div>

          {active === 'tasks' && (
            <section class="panel">
              <div class="panel-heading"><div><h2>My tasks</h2><p>{completedTasks} of {workspace.tasks.length} completed</p></div><span class="count-badge">{workspace.tasks.length}</span></div>
              <form class="entry-form" onSubmit={addTask}><input aria-label="New task" value={taskTitle} onInput={(event) => setTaskTitle(event.currentTarget.value)} placeholder="What needs to get done?" maxlength="180" /><button type="submit" class="primary-button">Add task</button></form>
              {workspace.tasks.length === 0 ? <div class="empty-state"><span>✓</span><strong>Nothing on your list yet.</strong><p>Add one small next step to get started.</p></div> : (
                <ul class="item-list">{workspace.tasks.map((task) => <li key={task.id} class={'task-item ' + (task.done ? 'is-done' : '')}><label><input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} /><span>{task.title}</span></label><button class="icon-button" type="button" aria-label={'Delete ' + task.title} onClick={() => deleteItem('tasks', task.id)}>×</button></li>)}</ul>
              )}
            </section>
          )}

          {active === 'notes' && (
            <section class="panel">
              <div class="panel-heading"><div><h2>Quick notes</h2><p>Write it down so you can return to it.</p></div><span class="count-badge">{workspace.notes.length}</span></div>
              <form class="stack-form" onSubmit={addNote}><input aria-label="Note title" value={noteTitle} onInput={(event) => setNoteTitle(event.currentTarget.value)} placeholder="Note title" maxlength="120" /><textarea aria-label="Note text" value={noteBody} onInput={(event) => setNoteBody(event.currentTarget.value)} placeholder="Start writing..." rows="5" /><button type="submit" class="primary-button">Save note</button></form>
              <div class="note-grid">{workspace.notes.map((note) => editingNoteId === note.id ? <form class="note-card edit-note" key={note.id} onSubmit={saveNoteEdit}><input aria-label="Edit note title" value={editingNoteTitle} onInput={(event) => setEditingNoteTitle(event.currentTarget.value)} /><textarea aria-label="Edit note text" rows="4" value={editingNoteBody} onInput={(event) => setEditingNoteBody(event.currentTarget.value)} /><div class="button-row"><button class="primary-button" type="submit">Save changes</button><button class="secondary-button" type="button" onClick={() => setEditingNoteId('')}>Cancel</button></div></form> : <article class="note-card" key={note.id}><div><h3>{note.title}</h3><p>{note.body}</p><button class="text-button" type="button" onClick={() => beginEditNote(note)}>Edit note</button></div><button class="icon-button" type="button" aria-label={'Delete note ' + note.title} onClick={() => deleteItem('notes', note.id)}>×</button></article>)}</div>
              {workspace.notes.length === 0 && <div class="empty-state"><span>✎</span><strong>Your notes will appear here.</strong></div>}
            </section>
          )}

          {active === 'planner' && (
            <section class="panel">
              <div class="panel-heading"><div><h2>Plan ahead</h2><p>Add an event or a reminder to your day.</p></div><span class="count-badge">{workspace.plans.length}</span></div>
              <form class="entry-form planner-form" onSubmit={addPlan}><input aria-label="Plan title" value={planTitle} onInput={(event) => setPlanTitle(event.currentTarget.value)} placeholder="What are you planning?" maxlength="180" /><input aria-label="Plan date" type="date" value={planDate} onInput={(event) => setPlanDate(event.currentTarget.value)} /><input aria-label="Plan time" type="time" value={planTime} onInput={(event) => setPlanTime(event.currentTarget.value)} /><button type="submit" class="primary-button">Add plan</button></form>
              {workspace.plans.length === 0 ? <div class="empty-state"><span>▦</span><strong>Your calendar is clear.</strong><p>Add your next appointment, goal or reminder.</p></div> : <ul class="item-list">{workspace.plans.map((plan) => <li class="plan-item" key={plan.id}><div class="date-tile"><strong>{plan.date.slice(8, 10)}</strong><small>{plan.date.slice(5, 7)}</small></div><div class="plan-copy"><strong>{plan.title}</strong><small>{plan.date} · {plan.time}</small></div><button class="icon-button" type="button" aria-label={'Delete plan ' + plan.title} onClick={() => deleteItem('plans', plan.id)}>×</button></li>)}</ul>}
            </section>
          )}

          {active === 'focus' && (
            <section class="panel focus-panel">
              <div class="panel-heading"><div><h2>Make space for focus</h2><p>The timer runs while this page stays open.</p></div><span class="count-badge">01</span></div>
              <div class="timer-tabs"><button type="button" class={timerMode === 'Focus' ? 'active' : ''} onClick={() => setTimer('Focus')}>25 min focus</button><button type="button" class={timerMode === 'Break' ? 'active' : ''} onClick={() => setTimer('Break')}>5 min break</button></div>
              <div class="timer-face" aria-live="polite"><span>{minutes}:{seconds}</span><small>{timerMode} session</small></div>
              <div class="timer-controls"><button type="button" class="primary-button" onClick={() => setTimerRunning(!timerRunning)}>{timerRunning ? 'Pause' : 'Start'}</button><button type="button" class="secondary-button" onClick={() => { setTimerRunning(false); setTimerSeconds(timerMode === 'Focus' ? 25 * 60 : 5 * 60); }}>Reset</button></div>
              {timerSeconds === 0 && <p class="success-message" role="status">Session complete. Take a moment before the next one.</p>}
            </section>
          )}

          {active === 'habits' && (
            <section class="panel">
              <div class="panel-heading"><div><h2>Small steps, repeated</h2><p>Check off each habit when you complete it today.</p></div><span class="count-badge">{workspace.habits.filter((habit) => habit.doneOn === today).length}/{workspace.habits.length}</span></div>
              <form class="entry-form" onSubmit={addHabit}><input aria-label="New habit" value={habitName} onInput={(event) => setHabitName(event.currentTarget.value)} placeholder="Add a habit (for example, read 10 minutes)" maxlength="120" /><button type="submit" class="primary-button">Add habit</button></form>
              {workspace.habits.length === 0 ? <div class="empty-state"><span>↗</span><strong>Start with one small habit.</strong></div> : <ul class="item-list">{workspace.habits.map((habit) => <li class={'task-item ' + (habit.doneOn === today ? 'is-done' : '')} key={habit.id}><label><input type="checkbox" checked={habit.doneOn === today} onChange={() => toggleHabit(habit.id)} /><span>{habit.name}</span></label><button class="icon-button" type="button" aria-label={'Delete habit ' + habit.name} onClick={() => deleteItem('habits', habit.id)}>×</button></li>)}</ul>}
            </section>
          )}

          {active === 'calculator' && (
            <section class="panel tool-panel">
              <div class="panel-heading"><div><h2>Everyday calculator</h2><p>Use +, −, ×, ÷, %, and parentheses.</p></div><span class="count-badge">02</span></div>
              <form class="stack-form" onSubmit={runCalculation}><input aria-label="Calculator expression" value={calcInput} onInput={(event) => setCalcInput(event.currentTarget.value)} placeholder="Example: 12 * (3 + 2)" /><button type="submit" class="primary-button">Calculate</button></form>
              {calcError && <p class="error-message" role="alert">{calcError}</p>}
              {calcResult && <div class="result-card"><small>RESULT</small><strong>{calcResult}</strong></div>}
            </section>
          )}

          {active === 'converter' && (
            <section class="panel tool-panel">
              <div class="panel-heading"><div><h2>Convert a measurement</h2><p>Length, weight, volume and temperature.</p></div><span class="count-badge">03</span></div>
              <div class="converter-grid"><label>Category<select aria-label="Unit category" value={unitCategory} onChange={(event) => setUnitCategory(event.currentTarget.value)}>{['Length', 'Weight', 'Volume', 'Temperature'].map((name) => <option value={name}>{name}</option>)}</select></label><label>Amount<input aria-label="Amount to convert" type="number" value={unitValue} onInput={(event) => setUnitValue(event.currentTarget.value)} /></label><label>From<select aria-label="From unit" value={unitFrom} onChange={(event) => setUnitFrom(event.currentTarget.value)}>{(unitCategory === 'Temperature' ? ['°C', '°F', 'K'] : Object.keys(UNITS[unitCategory])).map((unit) => <option value={unit}>{unit}</option>)}</select></label><label>To<select aria-label="To unit" value={unitTo} onChange={(event) => setUnitTo(event.currentTarget.value)}>{(unitCategory === 'Temperature' ? ['°C', '°F', 'K'] : Object.keys(UNITS[unitCategory])).map((unit) => <option value={unit}>{unit}</option>)}</select></label></div>
              <div class="result-card"><small>CONVERTED VALUE</small><strong>{conversion}</strong></div>
            </section>
          )}

          {active === 'text' && (
            <section class="panel tool-panel">
              <div class="panel-heading"><div><h2>Text helper</h2><p>Count words and quickly transform text.</p></div><span class="count-badge">04</span></div>
              <textarea aria-label="Text input" rows="7" value={textInput} onInput={(event) => setTextInput(event.currentTarget.value)} placeholder="Paste or type your text here..." />
              <div class="text-stats"><span><strong>{words}</strong> words</span><span><strong>{textInput.length}</strong> characters</span><span><strong>{textInput.split(/\n/).length}</strong> lines</span></div>
              <div class="button-row">{['Uppercase', 'Lowercase', 'Title Case', 'Trim', 'Reverse'].map((action) => <button type="button" class="secondary-button" onClick={() => runTextTool(action)}>{action}</button>)}</div>
              {textOutput && <div class="output-box"><div class="output-heading"><strong>Result</strong><button type="button" class="text-button" onClick={() => navigator.clipboard && navigator.clipboard.writeText(textOutput)}>Copy result</button></div><p>{textOutput}</p></div>}
            </section>
          )}

          {active === 'json' && (
            <section class="panel tool-panel">
              <div class="panel-heading"><div><h2>JSON formatter</h2><p>Format or minify JSON and catch syntax errors.</p></div><span class="count-badge">05</span></div>
              <textarea class="code-input" aria-label="JSON input" rows="8" spellcheck={false} value={jsonInput} onInput={(event) => setJsonInput(event.currentTarget.value)} />
              <div class="button-row"><button type="button" class="primary-button" onClick={() => formatJson('Format')}>Format JSON</button><button type="button" class="secondary-button" onClick={() => formatJson('Minify')}>Minify</button></div>
              {jsonError && <p class="error-message" role="alert">{jsonError}</p>}
              {jsonOutput && <pre class="json-output">{jsonOutput}</pre>}
            </section>
          )}

          {active === 'backup' && (
            <section class="panel tool-panel">
              <div class="panel-heading"><div><h2>Your data belongs to you</h2><p>Make a portable copy or restore a previous backup.</p></div><span class="count-badge">06</span></div>
              <div class="backup-card"><div><strong>Download a backup</strong><p>Save tasks, notes, plans, habits and your theme as a JSON file.</p></div><button type="button" class="primary-button" onClick={downloadBackup}>Download backup</button></div>
              <div class="backup-card"><div><strong>Restore a backup</strong><p>Choose a Magnanimous Studio backup. Restoring replaces the data in this browser.</p></div><label class="file-button">Choose backup file<input aria-label="Restore backup" type="file" accept="application/json,.json" onChange={restoreBackup} /></label></div>
              {backupMessage && <p class="success-message" role="status">{backupMessage}</p>}
              <p class="privacy-note">This studio uses browser storage only. Your information is not uploaded to a server and does not sync between devices.</p>
            </section>
          )}

          <footer class="workspace-footer"><span>I Am Magnanimous Way™</span><span>ONE GOD • ONE PEOPLE • A BRIGHTER TOMORROW</span></footer>
        </section>
      </div>
    </main>
  );
}

render(<App />, document.getElementById('app'));
