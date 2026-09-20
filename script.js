const canvas = document.getElementById("confetti");
const ctx = canvas.getContext("2d");
let particles = [];
let animationId = null;

const COLORS = [
  "#ff6b9d", "#ff9f43", "#ffd93d", "#6bcb77",
  "#4d96ff", "#9b59b6", "#ff4757", "#1dd1a1",
  "#f093fb", "#f5576c", "#667eea", "#ffe66d",
];

/* ── Happy Birthday song — loops forever ── */
const NOTE_FREQ = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
  G4: 392.0,  A4: 440.0,  B4: 493.88, C5: 523.25,
  Bb4: 466.16, "rest": 0,
};

const HAPPY_BIRTHDAY = [
  { n: "C4", d: 0.35 }, { n: "C4", d: 0.15 }, { n: "D4", d: 0.5 },  { n: "C4", d: 0.5 },
  { n: "F4", d: 0.5 },  { n: "E4", d: 0.75 },
  { n: "C4", d: 0.35 }, { n: "C4", d: 0.15 }, { n: "D4", d: 0.5 },  { n: "C4", d: 0.5 },
  { n: "G4", d: 0.5 },  { n: "F4", d: 0.75 },
  { n: "C4", d: 0.35 }, { n: "C4", d: 0.15 }, { n: "C5", d: 0.5 },  { n: "A4", d: 0.5 },
  { n: "F4", d: 0.5 },  { n: "E4", d: 0.5 },  { n: "D4", d: 0.75 },
  { n: "Bb4", d: 0.35 }, { n: "Bb4", d: 0.15 }, { n: "A4", d: 0.5 }, { n: "F4", d: 0.5 },
  { n: "G4", d: 0.5 },  { n: "F4", d: 1.0 },
];

const LOOP_DURATION = HAPPY_BIRTHDAY.reduce((s, { d }) => s + d, 0) + 0.6;

let audioCtx = null;
let musicMuted = false;
let musicStarted = false;
let loopTimer = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playNote(freq, duration, startTime) {
  if (!freq || musicMuted) return;
  const actx = getAudioContext();
  const osc = actx.createOscillator();
  const gain = actx.createGain();

  osc.type = "triangle";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.22, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(actx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

function playOneLoop() {
  if (musicMuted) return;

  const actx = getAudioContext();
  let time = actx.currentTime + 0.05;

  HAPPY_BIRTHDAY.forEach(({ n, d }) => {
    playNote(NOTE_FREQ[n], d * 0.9, time);
    time += d;
  });
}

function scheduleNextLoop() {
  clearTimeout(loopTimer);
  if (!musicStarted || musicMuted) return;

  playOneLoop();
  loopTimer = setTimeout(scheduleNextLoop, LOOP_DURATION * 1000);
}

function setDancing(on) {
  document.querySelectorAll(".cute-person").forEach((p) => {
    p.classList.toggle("dancing", on);
  });
}

function updateMusicBtn() {
  const btn = document.getElementById("musicBtn");
  const label = btn.querySelector(".music-label");
  if (musicMuted) {
    btn.classList.remove("playing");
    label.textContent = "Song Off";
  } else {
    btn.classList.add("playing");
    label.textContent = "Song On";
  }
}

function startMusicLoop() {
  const actx = getAudioContext();
  if (actx.state === "suspended") actx.resume();

  musicStarted = true;
  musicMuted = false;

  document.getElementById("startOverlay").classList.add("hidden");
  setDancing(true);
  updateMusicBtn();
  clearTimeout(loopTimer);
  scheduleNextLoop();
}

function toggleMute() {
  musicMuted = !musicMuted;
  updateMusicBtn();
  setDancing(!musicMuted);

  if (!musicMuted) {
    if (!musicStarted) musicStarted = true;
    scheduleNextLoop();
  } else {
    clearTimeout(loopTimer);
  }
}

function tryAutoplay() {
  startMusicLoop();
}

function setupAutoplayFallback() {
  const overlay = document.getElementById("startOverlay");

  const unlock = () => {
    startMusicLoop();
    overlay.classList.add("hidden");
    document.removeEventListener("click", unlock);
    document.removeEventListener("touchstart", unlock);
    document.removeEventListener("keydown", unlock);
  };

  document.addEventListener("click", unlock);
  document.addEventListener("touchstart", unlock);
  document.addEventListener("keydown", unlock);

  overlay.addEventListener("click", unlock);
}

/* ── Confetti ── */
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function createParticle() {
  const shapes = ["rect", "circle", "star"];
  return {
    x: Math.random() * canvas.width,
    y: -10,
    size: Math.random() * 10 + 5,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    speedY: Math.random() * 4 + 2,
    speedX: Math.random() * 3 - 1.5,
    rotation: Math.random() * 360,
    rotationSpeed: Math.random() * 12 - 6,
    shape: shapes[Math.floor(Math.random() * shapes.length)],
    wobble: Math.random() * 0.05,
    wobbleOffset: Math.random() * Math.PI * 2,
  };
}

function drawStar(cx, cy, size) {
  const spikes = 5;
  const outer = size;
  const inner = size * 0.4;
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outer);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * inner, cy + Math.sin(rot) * inner);
    rot += step;
  }
  ctx.closePath();
  ctx.fill();
}

function launchConfetti(count = 150) {
  for (let i = 0; i < count; i++) {
    particles.push(createParticle());
  }
  if (!animationId) animate();
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles = particles.filter((p) => p.y < canvas.height + 30);

  particles.forEach((p) => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.fillStyle = p.color;

    if (p.shape === "circle") {
      ctx.beginPath();
      ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.shape === "star") {
      drawStar(0, 0, p.size / 2);
    } else {
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
    }

    ctx.restore();
    p.y += p.speedY;
    p.x += p.speedX + Math.sin(Date.now() * p.wobble + p.wobbleOffset) * 1.5;
    p.rotation += p.rotationSpeed;
  });

  animationId = particles.length > 0 ? requestAnimationFrame(animate) : null;
}

function blowOutCandles() {
  const flames = document.querySelectorAll(".cake-section .flame");
  flames.forEach((flame, i) => {
    setTimeout(() => flame.classList.add("out"), i * 200);
  });

  setTimeout(() => launchConfetti(200), flames.length * 200 + 300);

  setTimeout(() => {
    flames.forEach((flame) => flame.classList.remove("out"));
  }, 4000);
}

/* ── Events ── */
window.addEventListener("resize", resizeCanvas);
resizeCanvas();
setupAutoplayFallback();

document.querySelector(".scroll-btn").addEventListener("click", () => {
  document.getElementById("wishes").scrollIntoView({ behavior: "smooth" });
});

document.getElementById("celebrateBtn").addEventListener("click", () => {
  launchConfetti(250);
});

document.getElementById("blowBtn").addEventListener("click", blowOutCandles);
document.getElementById("musicBtn").addEventListener("click", toggleMute);

window.addEventListener("load", () => {
  setTimeout(() => launchConfetti(180), 600);
  tryAutoplay();

  setTimeout(() => {
    const actx = getAudioContext();
    if (actx.state === "suspended" || !musicStarted) {
      document.getElementById("startOverlay").classList.remove("hidden");
    }
  }, 400);
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && musicStarted && !musicMuted) {
    getAudioContext().resume();
    scheduleNextLoop();
  }
});
