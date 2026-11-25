const exportBtn = document.getElementById("exportBtn");
const exportStatus = document.getElementById("exportStatus");

const progressTrack = document.createElement("div");
progressTrack.id = "exportProgressTrack";
progressTrack.style.cssText = "width:100%;height:10px;background:#263751;border-radius:20px;overflow:hidden;margin-top:12px;display:none;";
const progressFill = document.createElement("div");
progressFill.id = "exportProgressFill";
progressFill.style.cssText = "width:0%;height:100%;background:linear-gradient(90deg,#d8a832,#ffe08a);border-radius:20px;transition:width .15s ease;";
progressTrack.appendChild(progressFill);
if (exportStatus) exportStatus.insertAdjacentElement("afterend", progressTrack);

const exportPreview = document.getElementById("exportPreview");
const downloadVideo = document.getElementById("downloadVideo");

let exportedVideoUrl = null;

function wrapCanvasText(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";

  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }

  if (line) lines.push(line);
  return lines;
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const lines = wrapCanvasText(ctx, text, maxWidth);
  lines.forEach(line => {
    ctx.fillText(line, x, y);
    y += lineHeight;
  });
  return y;
}

function drawScene(ctx, scene, index, total, progress, sceneElapsed = 0) {
  const w = 1080;
  const h = 1920;
  const format = window.JKPulseSelectedFormat || "classic";

  const themes = {
    classic: {
      top: "#172746", bottom: "#080d19",
      accent: "#f5c451", secondary: "#aab6cc",
      border: "#f5c451"
    },
    challenge: {
      top: "#401b28", bottom: "#100b17",
      accent: "#ff5964", secondary: "#ffd4d7",
      border: "#ff5964"
    },
    fact: {
      top: "#103b42", bottom: "#07171e",
      accent: "#48e0c1", secondary: "#c5f8ec",
      border: "#48e0c1"
    },
    history: {
      top: "#42251f", bottom: "#160e12",
      accent: "#e7b66b", secondary: "#f3dfbd",
      border: "#e7b66b"
    },
    exam: {
      top: "#183b66", bottom: "#081426",
      accent: "#72b9ff", secondary: "#d5e9ff",
      border: "#72b9ff"
    }
  };

  const theme = themes[format] || themes.classic;

  const gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, theme.top);
  gradient.addColorStop(1, theme.bottom);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  // Decorative format-specific backgrounds
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 4;

  if (format === "challenge") {
    for (let i = -500; i < 1500; i += 180) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 900, 1920);
      ctx.stroke();
    }
  } else if (format === "fact") {
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.arc(900, 350 + i * 210, 90 + i * 18, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (format === "history") {
    ctx.strokeRect(25, 25, 1030, 1870);
    ctx.strokeRect(45, 45, 990, 1830);
  } else if (format === "exam") {
    for (let x = 60; x < 1080; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1920);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 1;

  // Brand heading
  ctx.fillStyle = theme.accent;
  ctx.font = "bold 64px Arial";
  ctx.textAlign = "center";
  ctx.fillText("JK PULSE", w / 2, 150);

  const subtitles = {
    classic: "DAILY KNOWLEDGE CHALLENGE",
    challenge: "BEAT THE CLOCK",
    fact: "DID YOU KNOW?",
    history: "HISTORY MYSTERY",
    exam: "EXAM PRACTICE"
  };

  ctx.fillStyle = theme.secondary;
  ctx.font = "30px Arial";
  ctx.fillText(subtitles[format] || subtitles.classic, w / 2, 215);

  // Main content frame
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = format === "history" ? 6 : 3;
  ctx.strokeRect(65, 285, 950, 1320);

  if (format === "history") {
    ctx.strokeRect(85, 305, 910, 1280);
  }

  ctx.fillStyle = theme.accent;
  ctx.font = "bold 42px Arial";
  ctx.fillText(scene.title || "MCQ", w / 2, 385);

  const doc = new DOMParser().parseFromString(
    scene.content || "",
    "text/html"
  );

  const sceneRoot = doc.querySelector(".scene") || doc.body;
  const blocks = Array.from(sceneRoot.querySelectorAll(
    ".scene-number, h2, .option, .countdown, .correct-letter, .explanation, .slide-footer, p"
  ));
  let y = 520;

  ctx.textAlign = "center";

  for (const block of blocks) {
    const text = block.textContent.trim();
    if (!text) continue;

    const isTimer = ["Countdown", "Timer"].includes(scene.title);
    if (isTimer && text === "5") continue;

    const isOption = /^([A-D][.)]|Option [A-D])/i.test(text);
    const isAnswer = /correct answer|answer:/i.test(text);

    ctx.font = isOption ? "bold 38px Arial" : "bold 46px Arial";
    ctx.fillStyle = isAnswer ? "#7be0a3" : "#ffffff";

    if (isOption) {
      ctx.fillStyle = theme.secondary;
      ctx.textAlign = "left";
      y = drawWrappedText(ctx, text, 125, y, 830, 58);
      y += 35;
      ctx.textAlign = "center";
    } else {
      y = drawWrappedText(ctx, text, w / 2, y, 850, 68);
      y += 55;
    }

    if (y > 1430) break;
  }

  // Animated timer for countdown scenes
  if (["Countdown", "Timer"].includes(scene.title)) {
    const number = Math.max(1, 5 - Math.floor(sceneElapsed));
    const cx = w / 2;
    const cy = 1050;

    ctx.beginPath();
    ctx.arc(cx, cy, 190, 0, Math.PI * 2);
    ctx.strokeStyle = "#33415f";
    ctx.lineWidth = 22;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(
      cx, cy, 190,
      -Math.PI / 2,
      -Math.PI / 2 + (Math.PI * 2 * (number / 5))
    );
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 22;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.lineCap = "butt";

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 230px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(number), cx, cy);

    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = theme.accent;
    ctx.font = "bold 38px Arial";
    ctx.fillText("TIME TO ANSWER", cx, 1350);
  }

  // Video progress and footer
  ctx.fillStyle = theme.accent;
  ctx.fillRect(65, 1645, 950 * progress, 9);

  ctx.fillStyle = theme.secondary;
  ctx.font = "28px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`SCENE ${index + 1} / ${total}`, w / 2, 1735);
  ctx.fillText("FOLLOW JK PULSE FOR MORE MCQs", w / 2, 1810);
}

async function exportJKPulseVideo() {
  const scenes = window.JKPulse.getScenes();
  const recordings = window.JKPulse.getRecordings();

  if (!scenes || scenes.length !== 7) {
    exportStatus.textContent = "Generate the seven scenes first.";
    return;
  }

  const missing = scenes.findIndex((scene, index) => !recordings[index]);
  if (missing !== -1) {
    exportStatus.textContent =
      `Please record voice for scene ${missing + 1} first.`;
    return;
  }

  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
    exportStatus.textContent = "Video recording is not supported in this browser.";
    return;
  }

  exportBtn.disabled = true;
  exportStatus.textContent = "Preparing scenes and audio...";

  let audioContext;
  let musicSource;
  let musicGain;

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");

    const minDuration = Math.max(
      2,
      Number(document.getElementById("sceneDuration").value) || 4
    );

    audioContext = new AudioContext();
    await audioContext.resume();

    const audioDestination = audioContext.createMediaStreamDestination();

    const voiceBuffers = [];
    for (let i = 0; i < scenes.length; i++) {
      const blob = recordings[i];
      const buffer = await audioContext.decodeAudioData(
        await blob.arrayBuffer()
      );
      voiceBuffers.push(buffer);
    }

    const durations = voiceBuffers.map(buffer =>
      Math.max(minDuration, buffer.duration + 0.5)
    );

    const musicFile = document.getElementById("musicFile");
    if (musicFile && musicFile.files && musicFile.files[0]) {
      const musicBuffer = await audioContext.decodeAudioData(
        await musicFile.files[0].arrayBuffer()
      );

      musicSource = audioContext.createBufferSource();
      musicSource.buffer = musicBuffer;
      musicSource.loop = true;

      musicGain = audioContext.createGain();
      musicGain.gain.value = window.JKPulse.getMusicVolume();

      musicSource.connect(musicGain);
      musicGain.connect(audioDestination);
    }

    const canvasStream = canvas.captureStream(30);
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audioDestination.stream.getAudioTracks()
    ]);

    const mimeTypes = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm"
    ];

    const mimeType = mimeTypes.find(type =>
      MediaRecorder.isTypeSupported(type)
    );

    if (!mimeType) throw new Error("No supported WebM video format found.");

    const recorder = new MediaRecorder(combinedStream, { mimeType });
    const chunks = [];

    recorder.ondataavailable = event => {
      if (event.data && event.data.size) chunks.push(event.data);
    };

    const recordingFinished = new Promise((resolve, reject) => {
      recorder.onstop = () => resolve();
      recorder.onerror = event => reject(event.error || new Error("Recording failed."));
    });

    const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);
    const startAt = audioContext.currentTime + 0.25;
    let offset = 0;

    for (let i = 0; i < voiceBuffers.length; i++) {
      const source = audioContext.createBufferSource();
      source.buffer = voiceBuffers[i];
      source.connect(audioDestination);
      source.start(startAt + offset);
      offset += durations[i];
    }

    if (musicSource) musicSource.start(startAt);

    recorder.start(1000);
    exportStatus.textContent = "Rendering video...";

    const wallStart = performance.now();
    let sceneIndex = 0;
    let sceneStart = 0;
    let previousFrame = null;
    let previousIndex = -1;

    const transitionCanvas = document.createElement("canvas");
    transitionCanvas.width = canvas.width;
    transitionCanvas.height = canvas.height;
    const transitionCtx = transitionCanvas.getContext("2d");
    const transitionDuration = 0.6;

    await new Promise(resolve => {
      function renderFrame(now) {
        const elapsed = (now - wallStart) / 1000;

        while (
          sceneIndex < durations.length - 1 &&
          elapsed >= sceneStart + durations[sceneIndex]
        ) {
          sceneStart += durations[sceneIndex];
          sceneIndex++;
        }

        if (sceneIndex !== previousIndex) {
          if (previousIndex !== -1) {
            transitionCtx.clearRect(0, 0, canvas.width, canvas.height);
            transitionCtx.drawImage(canvas, 0, 0);
            previousFrame = transitionCanvas;
          }
          previousIndex = sceneIndex;
        }

        const progress = Math.min(1, elapsed / totalDuration);
        drawScene(ctx, scenes[sceneIndex], sceneIndex, scenes.length, progress, elapsed - sceneStart);

        const sceneElapsed = elapsed - sceneStart;
        if (previousFrame && sceneElapsed < transitionDuration) {
          ctx.save();
          ctx.globalAlpha = 1 - (sceneElapsed / transitionDuration);
          ctx.drawImage(previousFrame, 0, 0);
          ctx.restore();
        }

        const percent = Math.min(100, Math.round(progress * 100));
        exportStatus.textContent = `Rendering Scene ${sceneIndex + 1} of ${scenes.length} — ${percent}%`;
        progressTrack.style.display = "block";
        progressFill.style.width = percent + "%";

        if (elapsed < totalDuration) {
          requestAnimationFrame(renderFrame);
        } else {
          resolve();
        }
      }

      requestAnimationFrame(renderFrame);
    });

    recorder.stop();
    await recordingFinished;

    if (musicSource) {
      try { musicSource.stop(); } catch (_) {}
    }

    combinedStream.getTracks().forEach(track => track.stop());
    await audioContext.close();

    const videoBlob = new Blob(chunks, { type: mimeType });

    if (exportedVideoUrl) URL.revokeObjectURL(exportedVideoUrl);
    exportedVideoUrl = URL.createObjectURL(videoBlob);

    exportPreview.src = exportedVideoUrl;
    exportPreview.style.display = "block";

    downloadVideo.href = exportedVideoUrl;
    downloadVideo.style.display = "inline-block";

    exportStatus.textContent =
      `Video ready. Size: ${(videoBlob.size / (1024 * 1024)).toFixed(1)} MB`;

  } catch (error) {
    console.error(error);
    exportStatus.textContent = "Export failed: " + error.message;
    if (audioContext && audioContext.state !== "closed") {
      await audioContext.close();
    }
  } finally {
    exportBtn.disabled = false;
  }
}

if (exportBtn) {
  exportBtn.addEventListener("click", exportJKPulseVideo);
}
