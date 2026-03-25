import './style.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const MAX_DISPLAY_DIGITS = 16;

// ── State ────────────────────────────────────────────────────────────────────
const state = {
  display: '0',
  firstOperand: null,
  operator: null,
  waitingForSecond: false,
  expression: '',
  hasError: false,
};

// ── DOM scaffold ─────────────────────────────────────────────────────────────
document.querySelector('#app').innerHTML = `
  <div class="calculator">
    <div class="display">
      <div class="display__expression" id="expression"></div>
      <div class="display__value" id="display">0</div>
    </div>
    <div class="buttons">
      <button class="btn btn--clear"  data-action="clear">C</button>
      <button class="btn btn--util"   data-action="negate">+/−</button>
      <button class="btn btn--util"   data-action="backspace">⌫</button>
      <button class="btn btn--op"     data-op="/">÷</button>

      <button class="btn btn--num"    data-digit="7">7</button>
      <button class="btn btn--num"    data-digit="8">8</button>
      <button class="btn btn--num"    data-digit="9">9</button>
      <button class="btn btn--op"     data-op="*">×</button>

      <button class="btn btn--num"    data-digit="4">4</button>
      <button class="btn btn--num"    data-digit="5">5</button>
      <button class="btn btn--num"    data-digit="6">6</button>
      <button class="btn btn--op"     data-op="-">−</button>

      <button class="btn btn--num"    data-digit="1">1</button>
      <button class="btn btn--num"    data-digit="2">2</button>
      <button class="btn btn--num"    data-digit="3">3</button>
      <button class="btn btn--op"     data-op="+">+</button>

      <button class="btn btn--num btn--zero" data-digit="0">0</button>
      <button class="btn btn--num"    data-action="dot">.</button>
      <button class="btn btn--equals" data-action="equals">=</button>
    </div>
  </div>
`;

const $display    = document.getElementById('display');
const $expression = document.getElementById('expression');

// ── Helpers ───────────────────────────────────────────────────────────────────
function opSymbol(op) {
  return { '+': '+', '-': '−', '*': '×', '/': '÷' }[op] ?? op;
}

function formatResult(num) {
  // Limit to MAX_DISPLAY_DIGITS total characters (excluding minus sign and dot)
  let s = String(num);
  // Use toFixed representation only if float string is too long
  const digits = s.replace(/[-\.]/g, '').length;
  if (digits > MAX_DISPLAY_DIGITS) {
    // Try toPrecision to fit
    s = Number(num).toPrecision(MAX_DISPLAY_DIGITS);
    // If it produced exponential notation, keep it readable
  }
  // Strip unnecessary trailing zeros introduced by toPrecision
  if (s.includes('.') && !s.includes('e')) {
    s = s.replace(/\.?0+$/, '');
  }
  return s;
}

function enforceMaxDigits(str) {
  const digits = str.replace(/[-\.]/g, '');
  return digits.length <= MAX_DISPLAY_DIGITS;
}

// ── Render ────────────────────────────────────────────────────────────────────
function render() {
  $display.className = 'display__value';

  if (state.hasError) {
    $display.classList.add('display__error');
    $display.textContent = state.display;
  } else {
    $display.textContent = state.display;
    if (state.display.length > 9) {
      $display.classList.add('long');
    }
  }

  $expression.textContent = state.expression;

  // Highlight active operator button
  document.querySelectorAll('.btn--op').forEach(btn => {
    btn.classList.toggle(
      'active',
      !state.hasError && state.waitingForSecond && btn.dataset.op === state.operator
    );
  });
}

// ── Input handlers ────────────────────────────────────────────────────────────
function handleDigit(digit) {
  if (state.hasError) return;

  if (state.waitingForSecond) {
    state.display = digit;
    state.waitingForSecond = false;
  } else {
    if (state.display === '0' && digit !== '.') {
      state.display = digit;
    } else {
      const next = state.display + digit;
      if (!enforceMaxDigits(next)) return;  // cap at 16 digits
      state.display = next;
    }
  }
  render();
}

function handleDot() {
  if (state.hasError) return;

  if (state.waitingForSecond) {
    state.display = '0.';
    state.waitingForSecond = false;
    render();
    return;
  }
  if (!state.display.includes('.')) {
    const next = state.display + '.';
    if (!enforceMaxDigits(next)) return;
    state.display = next;
    render();
  }
}

function handleOperator(op) {
  if (state.hasError) return;

  // If already waiting for second operand, just swap operator
  if (state.waitingForSecond) {
    state.operator = op;
    state.expression = `${state.firstOperand} ${opSymbol(op)}`;
    render();
    return;
  }

  state.firstOperand = state.display;
  state.operator = op;
  state.expression = `${state.display} ${opSymbol(op)}`;
  state.waitingForSecond = true;
  render();
}

async function handleEquals() {
  if (state.hasError || !state.operator || state.waitingForSecond) return;

  const num1 = parseFloat(state.firstOperand);
  const num2 = parseFloat(state.display);
  const expression = `${state.firstOperand} ${opSymbol(state.operator)} ${state.display} =`;

  try {
    const response = await fetch(`${API_URL}/api/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ num1, num2, operation: state.operator }),
    });

    const data = await response.json();

    if (!response.ok) {
      state.display = data.error || 'Erro';
      state.hasError = true;
    } else {
      state.display = formatResult(data.result);
      state.expression = expression;
      state.firstOperand = null;
      state.operator = null;
      state.waitingForSecond = false;
    }
  } catch {
    state.display = 'Sem conexão';
    state.hasError = true;
  }

  render();
}

function handleClear() {
  state.display = '0';
  state.firstOperand = null;
  state.operator = null;
  state.waitingForSecond = false;
  state.expression = '';
  state.hasError = false;
  render();
}

function handleNegate() {
  if (state.hasError) return;
  if (state.display === '0') return;
  state.display = state.display.startsWith('-')
    ? state.display.slice(1)
    : '-' + state.display;
  render();
}

function handleBackspace() {
  if (state.hasError || state.waitingForSecond) return;
  if (state.display.length <= 1 || state.display === '-0') {
    state.display = '0';
  } else {
    state.display = state.display.slice(0, -1);
    if (state.display === '-') state.display = '0';
  }
  render();
}

// ── Keyboard support ──────────────────────────────────────────────────────────
window.addEventListener('keydown', (e) => {
  if (e.key >= '0' && e.key <= '9') handleDigit(e.key);
  else if (e.key === '.') handleDot();
  else if (e.key === '+') handleOperator('+');
  else if (e.key === '-') handleOperator('-');
  else if (e.key === '*') handleOperator('*');
  else if (e.key === '/') { e.preventDefault(); handleOperator('/'); }
  else if (e.key === 'Enter' || e.key === '=') handleEquals();
  else if (e.key === 'Backspace') handleBackspace();
  else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') handleClear();
});

// ── Click delegation ──────────────────────────────────────────────────────────
document.querySelector('.buttons').addEventListener('click', (e) => {
  const btn = e.target.closest('.btn');
  if (!btn) return;

  const { digit, action, op } = btn.dataset;

  if (digit !== undefined) handleDigit(digit);
  else if (op)             handleOperator(op);
  else if (action === 'equals')    handleEquals();
  else if (action === 'clear')     handleClear();
  else if (action === 'negate')    handleNegate();
  else if (action === 'backspace') handleBackspace();
  else if (action === 'dot')       handleDot();
});

// ── Initial render ────────────────────────────────────────────────────────────
render();
