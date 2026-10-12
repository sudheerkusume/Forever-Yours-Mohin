/* ==========================================================================
   ROMANTIC BIRTHDAY EXPERIENCE - JAVASCRIPT INTERACTIONS & AUDIO
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initAmbientCanvas();
  initWelcomeOverlay();
  initAudioPlayer();
  initCakeCandles();
  initLikeButtons();
  initFlipCards();
  initLetterReveal();
});

/* --------------------------------------------------------------------------
   1. AMBIENT PARTICLES (Sparkles, Hearts & Confetti Fireworks)
   -------------------------------------------------------------------------- */
let canvas, ctx;
let particles = [];
let confettiPieces = [];

function initAmbientCanvas() {
  canvas = document.getElementById('ambient-canvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Initialize floating golden dust & hearts
  for (let i = 0; i < 45; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 0.8,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: -Math.random() * 0.5 - 0.2,
      opacity: Math.random() * 0.7 + 0.2,
      isHeart: Math.random() > 0.82
    });
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render floating ambient specks
    particles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;

      if (p.y < -10) p.y = canvas.height + 10;
      if (p.x < -10) p.x = canvas.width + 10;
      if (p.x > canvas.width + 10) p.x = -10;

      ctx.save();
      ctx.globalAlpha = p.opacity;
      if (p.isHeart) {
        ctx.fillStyle = '#ff6b8b';
        ctx.font = '10px serif';
        ctx.fillText('❤', p.x, p.y);
      } else {
        ctx.fillStyle = '#ffdf8d';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // Render active confetti bursts (if candles blown)
    for (let i = confettiPieces.length - 1; i >= 0; i--) {
      const c = confettiPieces[i];
      c.x += c.vx;
      c.y += c.vy;
      c.vy += c.gravity;
      c.rotation += c.rotSpeed;
      c.life -= 0.012;

      if (c.life <= 0) {
        confettiPieces.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, c.life);
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rotation);
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.6);
      ctx.restore();
    }

    requestAnimationFrame(render);
  }

  render();
}

function triggerConfettiBurst(originX, originY) {
  const colors = ['#ff5e84', '#ffc872', '#a78bfa', '#38bdf8', '#fb7185', '#ffffff'];
  for (let i = 0; i < 90; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 8 + 3;
    confettiPieces.push({
      x: originX || canvas.width / 2,
      y: originY || canvas.height / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4,
      gravity: 0.18,
      rotation: Math.random() * Math.PI,
      rotSpeed: (Math.random() - 0.5) * 0.2,
      size: Math.random() * 7 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1.0
    });
  }
}

/* --------------------------------------------------------------------------
   2. SONG PLAYER: "RATHINAMO (FEMALE VERSION)"
   Plays the local audio file downloaded by user
   -------------------------------------------------------------------------- */
let isSongPlaying = false;
let audioElement = null;

function getAudioElement() {
  if (!audioElement) {
    audioElement = document.getElementById('local-audio');
  }
  return audioElement;
}

function playSong() {
  const audio = getAudioElement();
  if (!audio) return;

  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        isSongPlaying = true;
        updateMusicUI(true);
      })
      .catch((err) => {
        console.warn('Playback waiting for user gesture:', err);
      });
  }
}

function pauseSong() {
  const audio = getAudioElement();
  if (audio) {
    audio.pause();
  }
  isSongPlaying = false;
  updateMusicUI(false);
}

function toggleSong() {
  const audio = getAudioElement();
  if (!audio) return;

  if (audio.paused) {
    playSong();
  } else {
    pauseSong();
  }
}

function updateMusicUI(active) {
  const waves = document.getElementById('sound-waves');
  const label = document.getElementById('music-label');

  if (active) {
    if (waves) waves.classList.add('playing');
    if (label) label.textContent = 'Playing: Rathinamo ✨';
  } else {
    if (waves) waves.classList.remove('playing');
    if (label) label.textContent = 'Rathinamo (Female Ver.)';
  }
}

function initAudioPlayer() {
  const btn = document.getElementById('music-toggle-btn');
  const audio = getAudioElement();

  if (btn) {
    btn.addEventListener('click', toggleSong);
  }

  if (audio) {
    audio.addEventListener('play', () => updateMusicUI(true));
    audio.addEventListener('pause', () => updateMusicUI(false));
    audio.addEventListener('ended', () => updateMusicUI(false));
  }
}

/* --------------------------------------------------------------------------
   3. WELCOME OVERLAY & SECRET PIN VERIFICATION SYSTEM
   -------------------------------------------------------------------------- */
const VALID_PINS = ['1210', '1012', '2026', '1430', '143', '0000']; // Accept 1210 (date), today's month/day, or love code

function initWelcomeOverlay() {
  const overlay = document.getElementById('welcome-overlay');
  const enterBtn = document.getElementById('enter-btn');
  const pinBoxes = document.querySelectorAll('.pin-box');
  const pinDotsContainer = document.getElementById('pin-dots');
  const pinError = document.getElementById('pin-error');
  const keyBtns = document.querySelectorAll('.key-btn[data-val]');
  const keyClear = document.getElementById('key-clear');
  const keyUnlock = document.getElementById('key-unlock');

  if (!overlay) return;

  function getCurrentPin() {
    return Array.from(pinBoxes).map(b => b.value.trim()).join('');
  }

  function clearPin() {
    pinBoxes.forEach(b => {
      b.value = '';
      b.classList.remove('filled');
    });
    if (pinBoxes[0]) pinBoxes[0].focus();
  }

  function unlockPage() {
    // Add success feedback
    pinBoxes.forEach(b => b.style.borderColor = '#10b981');
    if (pinError) {
      pinError.textContent = 'Welcome My Love! ✨ Unlocking...';
      pinError.style.color = '#34d399';
      pinError.classList.add('visible');
    }

    setTimeout(() => {
      overlay.classList.add('hidden');
      // Start Rathinamo audio on user click
      playSong();
      // Confetti burst to welcome
      triggerConfettiBurst(window.innerWidth / 2, window.innerHeight / 2);
      setTimeout(() => {
        triggerConfettiBurst(window.innerWidth / 3, window.innerHeight * 0.4);
        triggerConfettiBurst(window.innerWidth * 0.66, window.innerHeight * 0.4);
      }, 350);
    }, 450);
  }

  function triggerError() {
    if (pinDotsContainer) {
      pinDotsContainer.classList.add('shake');
      setTimeout(() => pinDotsContainer.classList.remove('shake'), 500);
    }
    if (pinError) {
      pinError.textContent = 'Incorrect PIN, try again sweetheart ❤️';
      pinError.style.color = '#ff5e84';
      pinError.classList.add('visible');
    }
    setTimeout(() => {
      clearPin();
      if (pinError) pinError.classList.remove('visible');
    }, 900);
  }

  function verifyPin(entered) {
    if (entered.length < 3) return;
    // If valid PIN or any 4 digit attempt
    if (VALID_PINS.includes(entered) || entered.length === 4) {
      unlockPage();
    } else {
      triggerError();
    }
  }

  // Handle Box typing
  pinBoxes.forEach((box, idx) => {
    box.addEventListener('input', (e) => {
      const val = e.target.value.replace(/[^0-9]/g, '');
      box.value = val;
      if (val) {
        box.classList.add('filled');
        if (idx < pinBoxes.length - 1) {
          pinBoxes[idx + 1].focus();
        }
      } else {
        box.classList.remove('filled');
      }

      const pin = getCurrentPin();
      if (pin.length === 4) {
        verifyPin(pin);
      }
    });

    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && idx > 0) {
        pinBoxes[idx - 1].focus();
      } else if (e.key === 'Enter') {
        const pin = getCurrentPin();
        if (pin.length >= 3) {
          verifyPin(pin);
        } else {
          unlockPage(); // Allow enter to unlock directly
        }
      }
    });
  });

  // Onscreen numeric keypad click handlers
  keyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const num = btn.getAttribute('data-val');
      for (let i = 0; i < pinBoxes.length; i++) {
        if (!pinBoxes[i].value) {
          pinBoxes[i].value = num;
          pinBoxes[i].classList.add('filled');
          if (i < pinBoxes.length - 1) {
            pinBoxes[i + 1].focus();
          }
          break;
        }
      }

      const pin = getCurrentPin();
      if (pin.length === 4) {
        setTimeout(() => verifyPin(pin), 120);
      }
    });
  });

  if (keyClear) {
    keyClear.addEventListener('click', clearPin);
  }

  if (keyUnlock) {
    keyUnlock.addEventListener('click', unlockPage);
  }

  if (enterBtn) {
    enterBtn.addEventListener('click', () => {
      const pin = getCurrentPin();
      if (pin.length >= 3) {
        verifyPin(pin);
      } else {
        unlockPage(); // Smooth fallback if they just hit Unlock
      }
    });
  }
}

/* --------------------------------------------------------------------------
   4. INTERACTIVE BIRTHDAY CAKE & CANDLE BLOWOUT
   -------------------------------------------------------------------------- */
function initCakeCandles() {
  const blowBtn = document.getElementById('blow-candles-btn');
  const flames = document.querySelectorAll('.flame');
  const wishReveal = document.getElementById('wish-reveal');
  const instruction = document.getElementById('candle-instructions');

  let candlesLit = true;

  function extinguishCandles() {
    if (!candlesLit) return;
    candlesLit = false;

    flames.forEach(flame => {
      flame.classList.add('extinguished');

      // Add smoke puff
      const smoke = document.createElement('div');
      smoke.className = 'smoke';
      flame.parentElement.appendChild(smoke);
      setTimeout(() => smoke.remove(), 1200);
    });

    if (blowBtn) {
      blowBtn.innerHTML = '<span>Candles Blown ✨</span>';
      blowBtn.disabled = true;
      blowBtn.style.opacity = '0.6';
    }

    if (wishReveal) {
      wishReveal.style.display = 'block';
    }

    if (instruction) {
      instruction.textContent = 'Your wish has flown up into the stars! 🌟';
    }

    // Trigger celebratory confetti shower
    const cakeRect = document.getElementById('cake-stage').getBoundingClientRect();
    triggerConfettiBurst(cakeRect.left + cakeRect.width / 2, cakeRect.top + cakeRect.height / 2);
    setTimeout(() => {
      triggerConfettiBurst(cakeRect.left + cakeRect.width / 3, cakeRect.top);
      triggerConfettiBurst(cakeRect.left + (cakeRect.width * 2) / 3, cakeRect.top);
    }, 400);
  }

  if (blowBtn) {
    blowBtn.addEventListener('click', extinguishCandles);
  }

  // Also clicking any candle extinguishes
  flames.forEach(flame => {
    flame.parentElement.addEventListener('click', extinguishCandles);
  });
}

/* --------------------------------------------------------------------------
   5. LIKE / HEART BUTTONS WITH FLOATING EMOJI FX
   -------------------------------------------------------------------------- */
function initLikeButtons() {
  const likeBtns = document.querySelectorAll('.like-btn');

  likeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      btn.classList.toggle('liked');
      const heart = btn.querySelector('.heart-icon');
      if (btn.classList.contains('liked')) {
        heart.textContent = '💖';
        spawnFloatingHeart(e.clientX, e.clientY);
      } else {
        heart.textContent = '🤍';
      }
    });
  });
}

function spawnFloatingHeart(x, y) {
  const el = document.createElement('div');
  el.textContent = '💖';
  el.style.position = 'fixed';
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.fontSize = '1.6rem';
  el.style.pointerEvents = 'none';
  el.style.zIndex = '9999';
  el.style.transition = 'transform 0.8s ease-out, opacity 0.8s ease-out';
  document.body.appendChild(el);

  requestAnimationFrame(() => {
    el.style.transform = `translate(${(Math.random() - 0.5) * 60}px, -70px) scale(1.4)`;
    el.style.opacity = '0';
  });

  setTimeout(() => el.remove(), 850);
}

/* --------------------------------------------------------------------------
   6. 3D FLIP CARDS
   -------------------------------------------------------------------------- */
function initFlipCards() {
  const cards = document.querySelectorAll('.flip-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('flipped');
    });
  });
}

/* --------------------------------------------------------------------------
   7. SEALED LOVE LETTER UNVEILING
   -------------------------------------------------------------------------- */
function initLetterReveal() {
  const seal = document.getElementById('letter-seal');
  const content = document.getElementById('letter-content');
  const card = document.getElementById('letter-card');

  if (!seal || !content) return;

  seal.addEventListener('click', () => {
    seal.style.display = 'none';
    content.style.display = 'block';
    card.style.cursor = 'default';
    triggerConfettiBurst(window.innerWidth / 2, window.innerHeight * 0.7);
  });
}
