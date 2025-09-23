const themeBtns = document.querySelectorAll('#theme-toggle, #theme-toggle-2, #theme-toggle-3');

function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('light');
  } else {
    document.body.classList.remove('light');
  }
  localStorage.setItem('theme', theme);
}

const savedTheme = localStorage.getItem('theme') || 'dark';
applyTheme(savedTheme);

themeBtns.forEach(btn => btn?.addEventListener('click', () => {
  const current = document.body.classList.contains('light') ? 'light' : 'dark';
  applyTheme(current === 'light' ? 'dark' : 'light');
}));

(() => {
    const MAX_ATTEMPTS = 3;
    const storageKey = 'playlist_state_v3';
  
    const exercises = document.querySelectorAll('.exercise');
    const submitAllBtn = document.getElementById('submit-all');
    const finalFeedback = document.getElementById('final-feedback');
    const triesSpan = document.getElementById('final-tries');
    const scoreEl = document.getElementById('score');
  
    if (!exercises.length || !submitAllBtn || !finalFeedback || !triesSpan || !scoreEl) {
      console.warn('Elementos necessários não encontrados. Verifique o HTML.');
      return;
    }
  
    const defaultState = {
      attempts: MAX_ATTEMPTS,
      locked: false,
      revealed: false,
      answers: {}, 
    };
  
    let state = JSON.parse(localStorage.getItem(storageKey)) || defaultState;

if (state.locked && state.attempts <= 0) {
  state = { ...defaultState };
  localStorage.removeItem(storageKey);
}
  
    function updateTriesUI() {
      triesSpan.textContent = state.attempts;
      const triesParent = triesSpan.closest('.submit-all')?.querySelector('.meta');
      if (triesParent) {
        triesParent.style.display = state.revealed ? '' : 'none';
      }
    }
  
    function setLockedUI() {
      exercises.forEach(ex => {
        ex.querySelectorAll('.option').forEach(b => b.disabled = state.locked);
        const sel = ex.querySelector('select');
        if (sel) sel.disabled = state.locked;
      });
      submitAllBtn.disabled = state.locked;
    }
  
    function restoreSelections() {
      exercises.forEach(ex => {
        const id = ex.id;
        const type = ex.dataset.type;
        const ans = state.answers[id];
  
        if (type === 'single') {
          ex.querySelectorAll('.option').forEach(b => {
            b.classList.toggle('selected', ans && b.textContent.trim() === ans);
          });
        } else if (type === 'multiple') {
          const selArr = ans || [];
          ex.querySelectorAll('.option').forEach(b => {
            b.classList.toggle('selected', selArr.includes(b.textContent.trim()));
          });
        } else if (type === 'combobox') {
          const sel = ex.querySelector('select');
          if (sel && ans) sel.value = ans;
        }
      });
    }
  
    function evaluateAnswers() {
      let score = 0;
      const total = exercises.length;
  
      exercises.forEach(ex => {
        const id = ex.id;
        const type = ex.dataset.type;
        const ans = state.answers[id];
  
        if (type === 'single') {
          const btns = ex.querySelectorAll('.option');
          const chosen = Array.from(btns).find(b => b.textContent.trim() === ans);
          if (chosen && chosen.dataset.correct === 'true') score++;
        }
  
        if (type === 'multiple') {
          const btns = ex.querySelectorAll('.option');
          const correctSet = new Set(
            Array.from(btns).filter(b => b.dataset.correct === 'true').map(b => b.textContent.trim())
          );
          const selSet = new Set(ans || []);
          const equal = selSet.size === correctSet.size && [...selSet].every(x => correctSet.has(x));
          if (equal) score++;
        }
  
        if (type === 'combobox') {
          if (ans === 'colab') score++;
        }
      });
  
      return { score, total };
    }
  
    updateTriesUI();
    restoreSelections();
    setLockedUI();
    if (state.locked) {
      const { score, total } = evaluateAnswers();
      scoreEl.textContent = `${score} / ${total}`;
      finalFeedback.textContent = `Tentativas restantes: ${state.attempts}`;
    }
  
    exercises.forEach(ex => {
      const id = ex.id;
      const type = ex.dataset.type;
  
      if (type === 'single') {
        ex.querySelectorAll('.option').forEach(btn => {
          btn.addEventListener('click', () => {
            if (state.locked) return;
            ex.querySelectorAll('.option').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            state.answers[id] = btn.textContent.trim();
            save();
          });
        });
      }
  
      if (type === 'multiple') {
        ex.querySelectorAll('.option').forEach(btn => {
          btn.addEventListener('click', () => {
            if (state.locked) return;
            const text = btn.textContent.trim();
            const prev = state.answers[id] || [];
            if (prev.includes(text)) {
              state.answers[id] = prev.filter(x => x !== text);
              btn.classList.remove('selected');
            } else {
              state.answers[id] = [...prev, text];
              btn.classList.add('selected');
            }
            save();
          });
        });
      }
  
      if (type === 'combobox') {
        const sel = ex.querySelector('select');
        if (sel) {
          sel.addEventListener('change', () => {
            if (state.locked) return;
            state.answers[id] = sel.value;
            save();
          });
        }
      }
    });
  
    submitAllBtn.addEventListener('click', () => {
      if (state.locked) return;
  
      if (!state.revealed) state.revealed = true;
  
      if (state.attempts <= 0) {
        state.locked = true;
        setLockedUI();
        save();
        return;
      }
  
      state.attempts -= 1;
  
      const { score, total } = evaluateAnswers();
      scoreEl.textContent = `${score} / ${total}`;
      finalFeedback.textContent = `Tentativas restantes: ${state.attempts}`;
  
      if (score === total || state.attempts <= 0) {
        state.locked = true;
        setLockedUI();
      }
  
      updateTriesUI();
      save();
    });
  
    window.PL_RESET = () => { localStorage.removeItem(storageKey); location.reload(); };
  })();
  