(function () {
  'use strict';

  /* ── DOM refs ── */
  const emailInput    = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');
  const togglePw      = document.getElementById('togglePw');
  const eyeIcon       = document.getElementById('eyeIcon');
  const eyeOffIcon    = document.getElementById('eyeOffIcon');
  const loginBtn      = document.getElementById('loginBtn');
  const errorMsg      = document.getElementById('errorMsg');
  const stage         = document.querySelector('.stage');
  const leftPanel     = document.getElementById('leftPanel');

  /* Pupil elements for all 4 characters */
  const pupils = [
    { L: document.getElementById('pupil1L'), R: document.getElementById('pupil1R') },
    { L: document.getElementById('pupil2L'), R: document.getElementById('pupil2R') },
    { L: document.getElementById('pupil3L'), R: document.getElementById('pupil3R') },
    { L: document.getElementById('pupil4L'), R: document.getElementById('pupil4R') },
  ];

  /* ── State ── */
  let passwordVisible = false;
  let isPasswordFocused = false;
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let rafId = null;
  const easing = 0.15; /* Smoothing factor for eye tracking */

  /* ── Eye data for pupil positioning ── */
  const eyeData = [
    { eyeL: { x: 70, y: 190 }, eyeR: { x: 110, y: 190 }, radius: 10 },
    { eyeL: { x: 215, y: 380 }, eyeR: { x: 285, y: 380 }, radius: 13 },
    { eyeL: { x: 330, y: 215 }, eyeR: { x: 370, y: 215 }, radius: 9 },
    { eyeL: { x: 390, y: 200 }, eyeR: { x: 430, y: 200 }, radius: 9 },
  ];

  /* SVG viewBox dimensions */
  const svgViewBox = { width: 500, height: 600 };

  /* ── Utility: move pupil within eye bounds ── */
  function movePupilSVG(pupilEl, eyePos, targetX, targetY, maxDist) {
    const svgEl = leftPanel.querySelector('svg');
    if (!svgEl) return;

    const rect = svgEl.getBoundingClientRect();
    const svgX = eyePos.x * (rect.width / svgViewBox.width);
    const svgY = eyePos.y * (rect.height / svgViewBox.height);
    const screenEyeX = rect.left + svgX;
    const screenEyeY = rect.top + svgY;

    const dx = targetX - screenEyeX;
    const dy = targetY - screenEyeY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const ratio = Math.min(1, maxDist / (dist || 1));
    const ox = dx * ratio;
    const oy = dy * ratio;

    /* Convert offset back to SVG coordinates */
    const offsetX = (ox / rect.width) * svgViewBox.width;
    const offsetY = (oy / rect.height) * svgViewBox.height;

    const newCx = eyePos.x + offsetX;
    const newCy = eyePos.y + offsetY;

    pupilEl.setAttribute('cx', newCx.toFixed(1));
    pupilEl.setAttribute('cy', newCy.toFixed(1));
  }

  /* ── Eye tracking loop ── */
  function trackEyes() {
    if (isPasswordFocused && !passwordVisible) return; /* eyes hidden */

    pupils.forEach((pupilPair, idx) => {
      const eye = eyeData[idx];
      const maxDist = eye.radius * 0.35;

      movePupilSVG(pupilPair.L, eye.eyeL, mouseX, mouseY, maxDist);
      movePupilSVG(pupilPair.R, eye.eyeR, mouseX, mouseY, maxDist);
    });
  }

  /* ── Cursor tracking ── */
  document.addEventListener('mousemove', (e) => {
    /* Smooth interpolation for smoother eye movement */
    mouseX += (e.clientX - mouseX) * easing;
    mouseY += (e.clientY - mouseY) * easing;

    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(trackEyes);
  });

  /* ── Look toward right-panel when email focused ── */
  function lookRight() {
    const target = { x: window.innerWidth * 0.75, y: window.innerHeight * 0.5 };
    pupils.forEach((pupilPair, idx) => {
      const eye = eyeData[idx];
      const maxDist = eye.radius * 0.35;

      movePupilSVG(pupilPair.L, eye.eyeL, target.x, target.y, maxDist);
      movePupilSVG(pupilPair.R, eye.eyeR, target.x, target.y, maxDist);
    });
  }

  emailInput.addEventListener('focus', () => {
    /* Staggered look toward email field */
    const target = { x: window.innerWidth * 0.65, y: window.innerHeight * 0.4 };
    pupils.forEach((pupilPair, idx) => {
      setTimeout(() => {
        const eye = eyeData[idx];
        const maxDist = eye.radius * 0.35;
        movePupilSVG(pupilPair.L, eye.eyeL, target.x, target.y, maxDist);
        movePupilSVG(pupilPair.R, eye.eyeR, target.x, target.y, maxDist);
      }, idx * 50); /* Stagger by 50ms per character */
    });
  });

  emailInput.addEventListener('blur', () => {
    if (!isPasswordFocused) {
      trackEyes();
    }
  });

  /* ── Password field: flip characters, hide tracking ── */
  passwordInput.addEventListener('focus', () => {
    isPasswordFocused = true;
    if (!passwordVisible) {
      /* Smooth flip with slight delay for better feel */
      setTimeout(() => {
        if (stage) stage.classList.add('flipped');
      }, 50);
    }
  });

  passwordInput.addEventListener('blur', () => {
    isPasswordFocused = false;
    if (!passwordVisible) {
      stage.classList.remove('flipped');
    }
    trackEyes();
  });

  /* ── Toggle password visibility ── */
  togglePw.addEventListener('click', () => {
    passwordVisible = !passwordVisible;

    if (passwordVisible) {
      passwordInput.type = 'text';
      eyeIcon.classList.add('hidden');
      eyeOffIcon.classList.remove('hidden');
      /* Keep flipped state when password is visible */
      if (stage) stage.classList.add('flipped');
    } else {
      passwordInput.type = 'password';
      eyeIcon.classList.remove('hidden');
      eyeOffIcon.classList.add('hidden');
      /* Unflip if not focused on password */
      if (!isPasswordFocused && stage) {
        stage.classList.remove('flipped');
      }
    }
  });

  /* ── Error message display ── */
  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.add('visible');

    setTimeout(() => {
      errorMsg.classList.remove('visible');
    }, 3500);
  }

  /* ── Fake login logic ── */
  loginBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    const pass  = passwordInput.value;

    if (!email) {
      showError('Please enter your email address.');
      emailInput.focus();
      return;
    }

    if (!isValidEmail(email)) {
      showError('That doesn\'t look like a valid email.');
      emailInput.focus();
      return;
    }

    if (!pass) {
      showError('Please enter your password.');
      passwordInput.focus();
      return;
    }

    if (pass.length < 6) {
      showError('Password must be at least 6 characters.');
      passwordInput.focus();
      return;
    }

    /* Simulate always-failing auth */
    showError('Incorrect email or password. Please try again.');
  });

  function isValidEmail(str) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  }

  /* ── Allow Enter key on inputs ── */
  [emailInput, passwordInput].forEach(inp => {
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') loginBtn.click();
    });
  });

  /* ── Initial eye center ── */
  requestAnimationFrame(trackEyes);

})();
