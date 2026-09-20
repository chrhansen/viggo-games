function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function createNoiseBuffer(context, seconds = 1.2) {
  const sampleCount = Math.floor(context.sampleRate * seconds);
  const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < sampleCount; i += 1) {
    data[i] = randomRange(-1, 1);
  }
  return buffer;
}

function applyEnvelope(gainParam, start, peak, attack, release) {
  const attackTime = Math.max(0.001, attack);
  const releaseTime = Math.max(0.01, release);
  gainParam.setValueAtTime(0.0001, start);
  gainParam.exponentialRampToValueAtTime(Math.max(0.0002, peak), start + attackTime);
  gainParam.exponentialRampToValueAtTime(0.0001, start + attackTime + releaseTime);
}

export function createWeaponSoundEffects() {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    return {
      warmup() {},
      play() {},
    };
  }

  let context = null;
  let compressor = null;
  let noiseBuffer = null;

  function ensureAudioGraph() {
    if (context) {
      return true;
    }
    try {
      context = new AudioContextCtor();
    } catch {
      return false;
    }

    compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.knee.value = 20;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.16;

    const master = context.createGain();
    master.gain.value = 0.32;
    compressor.connect(master);
    master.connect(context.destination);

    noiseBuffer = createNoiseBuffer(context);
    return true;
  }

  function runWhenReady(run) {
    if (!ensureAudioGraph()) {
      return;
    }
    if (context.state === "running") {
      run();
      return;
    }
    context
      .resume()
      .then(() => {
        if (context.state === "running") {
          run();
        }
      })
      .catch(() => {});
  }

  function warmup() {
    runWhenReady(() => {});
  }

  function playTone({
    start,
    duration,
    peak,
    startFrequency,
    endFrequency = startFrequency,
    type = "sine",
    attack = 0.002,
    filterType,
    filterFrequency = 1200,
    filterQ = 0.7,
  }) {
    if (!context || !compressor) {
      return;
    }
    const osc = context.createOscillator();
    const gain = context.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(startFrequency, start);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(20, endFrequency),
      start + Math.max(0.01, duration)
    );

    if (filterType) {
      const filter = context.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.setValueAtTime(filterFrequency, start);
      filter.Q.value = filterQ;
      osc.connect(filter);
      filter.connect(gain);
    } else {
      osc.connect(gain);
    }

    applyEnvelope(gain.gain, start, peak, attack, duration - attack);
    gain.connect(compressor);
    osc.start(start);
    osc.stop(start + duration + 0.03);
  }

  function playNoise({
    start,
    duration,
    peak,
    attack = 0.002,
    filterType = "bandpass",
    filterFrequency = 900,
    filterQ = 0.5,
    playbackRate = 1,
  }) {
    if (!context || !compressor || !noiseBuffer) {
      return;
    }
    const noise = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    noise.buffer = noiseBuffer;
    noise.loop = true;
    noise.playbackRate.value = playbackRate;
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFrequency, start);
    filter.Q.value = filterQ;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(compressor);
    applyEnvelope(gain.gain, start, peak, attack, duration - attack);

    noise.start(start);
    noise.stop(start + duration + 0.03);
  }

  function playRifle() {
    const t = context.currentTime;
    playNoise({
      start: t,
      duration: 0.09,
      peak: 1.05,
      filterType: "highpass",
      filterFrequency: randomRange(1300, 1700),
      playbackRate: randomRange(1.25, 1.45),
    });
    playTone({
      start: t,
      duration: 0.14,
      peak: 0.68,
      startFrequency: randomRange(150, 190),
      endFrequency: randomRange(52, 66),
      type: "triangle",
    });
    playNoise({
      start: t + 0.02,
      duration: 0.2,
      peak: 0.24,
      filterType: "bandpass",
      filterFrequency: randomRange(360, 500),
      filterQ: 0.45,
      playbackRate: randomRange(0.78, 0.92),
    });
  }

  function playBow() {
    const t = context.currentTime;
    playNoise({
      start: t,
      duration: 0.045,
      peak: 0.23,
      filterType: "highpass",
      filterFrequency: randomRange(2200, 2800),
      playbackRate: randomRange(1.7, 1.95),
    });
    playTone({
      start: t,
      duration: 0.16,
      peak: 0.26,
      startFrequency: randomRange(360, 440),
      endFrequency: randomRange(140, 190),
      type: "square",
      filterType: "bandpass",
      filterFrequency: randomRange(900, 1250),
      filterQ: 1.5,
    });
    playTone({
      start: t + 0.012,
      duration: 0.18,
      peak: 0.16,
      startFrequency: randomRange(240, 300),
      endFrequency: randomRange(110, 150),
      type: "triangle",
    });
  }

  function playKnife() {
    const t = context.currentTime;
    playNoise({
      start: t,
      duration: 0.11,
      peak: 0.34,
      filterType: "bandpass",
      filterFrequency: randomRange(1450, 2100),
      filterQ: 0.7,
      playbackRate: randomRange(1.05, 1.24),
    });
    playTone({
      start: t + 0.004,
      duration: 0.095,
      peak: 0.14,
      startFrequency: randomRange(620, 760),
      endFrequency: randomRange(220, 290),
      type: "sine",
      filterType: "highpass",
      filterFrequency: 500,
      filterQ: 0.5,
    });
  }

  function playSquirt() {
    const t = context.currentTime;
    for (let i = 0; i < 4; i += 1) {
      playNoise({
        start: t + i * 0.028,
        duration: randomRange(0.06, 0.09),
        peak: Math.max(0.08, 0.18 - i * 0.025),
        filterType: "lowpass",
        filterFrequency: randomRange(720, 980),
        filterQ: 0.35,
        playbackRate: randomRange(0.92, 1.1),
      });
    }
    playTone({
      start: t,
      duration: 0.18,
      peak: 0.085,
      startFrequency: randomRange(380, 460),
      endFrequency: randomRange(140, 200),
      type: "sine",
      filterType: "lowpass",
      filterFrequency: 1050,
      filterQ: 0.4,
    });
  }

  function play(weaponName) {
    runWhenReady(() => {
      if (weaponName === "rifle") {
        playRifle();
        return;
      }
      if (weaponName === "bow") {
        playBow();
        return;
      }
      if (weaponName === "knife") {
        playKnife();
        return;
      }
      playSquirt();
    });
  }

  return { warmup, play };
}
