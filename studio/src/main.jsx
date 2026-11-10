import { render } from 'preact';
import { useState } from 'preact/hooks';
import './style.css';

function App() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('Your lightweight workspace is ready.');
  const [dark, setDark] = useState(true);

  return (
    <main class={dark ? 'app' : 'app light'}>
      <header class="topbar">
        <a class="brand" href="#home" aria-label="Magnanimous Preact Studio home">
          <span class="brand-mark">M</span>
          <span><strong>MAGNANIMOUS</strong><small>PREACT STUDIO</small></span>
        </a>
        <button class="theme-toggle" onClick={() => setDark(!dark)} aria-pressed={!dark}>
          {dark ? 'Light mode' : 'Dark mode'}
        </button>
      </header>

      <section class="hero" id="home">
        <p class="eyebrow"><span class="pulse" /> LIGHTWEIGHT UI LAB</p>
        <h1>Build fast.<br /><span>Keep it simple.</span></h1>
        <p class="intro">A working playground for small, responsive interfaces powered by Preact — designed as a foundation for future Magnanimous tools.</p>
        <div class="hero-actions">
          <a class="primary" href="#playground">Explore the playground <span aria-hidden="true">→</span></a>
          <a class="secondary" href="https://preactjs.com/guide/v10/getting-started" target="_blank" rel="noreferrer">Preact documentation ↗</a>
        </div>
      </section>

      <section class="metrics" aria-label="Studio principles">
        <article><strong>Small</strong><span>Lightweight runtime</span></article>
        <article><strong>Fast</strong><span>Vite-powered builds</span></article>
        <article><strong>Open</strong><span>MIT-licensed framework</span></article>
      </section>

      <section class="playground" id="playground">
        <div class="section-heading"><div><p class="eyebrow">INTERACTIVE DEMO</p><h2>Try a live component</h2></div><span class="tag">PREACT + HOOKS</span></div>
        <div class="demo-grid">
          <article class="demo-card counter">
            <div class="card-icon">＋</div>
            <h3>State counter</h3>
            <p>Change the value and watch Preact update only what needs to change.</p>
            <div class="count" aria-live="polite">{count}</div>
            <div class="controls">
              <button onClick={() => setCount(count - 1)} aria-label="Decrease counter">−</button>
              <button onClick={() => setCount(0)}>Reset</button>
              <button onClick={() => setCount(count + 1)} aria-label="Increase counter">+</button>
            </div>
          </article>
          <article class="demo-card message-card">
            <div class="card-icon">✦</div>
            <h3>Small interaction</h3>
            <p>Send a message to this local demo component.</p>
            <form onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const value = String(data.get('message') || '').trim(); if (value) setMessage(value); }}>
              <label for="message">Your message</label>
              <input id="message" name="message" maxlength="100" placeholder="Type something useful…" />
              <button class="send" type="submit">Update message</button>
            </form>
            <div class="message-output" aria-live="polite">{message}</div>
          </article>
        </div>
      </section>

      <section class="next">
        <p class="eyebrow">BUILT TO GROW</p>
        <h2>A safe starting point, not a platform replacement.</h2>
        <p>This studio is isolated from the main Magnanimous production application. Components can be evaluated here before any integration is proposed.</p>
      </section>

      <footer><span>I Am Magnanimous Way™</span><span>ONE GOD • ONE PEOPLE • A BRIGHTER TOMORROW</span></footer>
    </main>
  );
}

render(<App />, document.getElementById('app'));
