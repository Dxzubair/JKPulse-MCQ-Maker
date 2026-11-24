const previewBtn = document.getElementById("previewBtn");
const slide = document.getElementById("slide");

let scenes = [];
let recordings = {};
let activeRecorder = null;
let activeStream = null;
let activeScene = null;
let chunks = [];
let previewAudio = null;
let previewAudioUrl = null;

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[c]);
}

function createScene(title, content, narration) {
  return { title, content, narration };
}

function renderScene(index) {
  const scene = scenes[index];
  if (scene) slide.innerHTML = scene.content;
}

function renderRecordingPanel() {
  let panel = document.getElementById("sceneRecordings");

  if (!panel) {
    panel = document.createElement("section");
    panel.id = "sceneRecordings";
    panel.className = "editor";
    slide.parentNode.insertBefore(panel, slide.nextSibling);
  }

  panel.innerHTML = `
    <h2>Record Your Voice</h2>
    <p>Record narration separately for each scene.</p>
    <p id="recordingStatus">All scenes are ready.</p>
    <div id="sceneList"></div>
  `;

  const list = document.getElementById("sceneList");

  scenes.forEach((scene, index) => {
    const card = document.createElement("div");
    card.style.cssText = `
      padding:15px;margin:14px 0;border:1px solid #b99a48;
      border-radius:12px;background:#111c30;
    `;

    card.innerHTML = `
      <h3>Scene ${index + 1}: ${escapeHTML(scene.title)}</h3>
      <p>${escapeHTML(scene.narration)}</p>
      <button type="button" data-action="preview" data-index="${index}">Preview Slide</button>
      <button type="button" data-action="record" data-index="${index}">Record Voice</button>
      <button type="button" data-action="stop" data-index="${index}" disabled>Stop</button>
      <button type="button" data-action="play" data-index="${index}" ${recordings[index] ? "" : "disabled"}>Play Voice</button>
      <button type="button" data-action="download" data-index="${index}" ${recordings[index] ? "" : "disabled"}>Download Audio</button>
      <p class="scene-audio-status" id="status-${index}">
        ${recordings[index] ? "Voice recording saved." : "No recording yet."}
      </p>
    `;

    list.appendChild(card);
  });
}

previewBtn.addEventListener("click", () => {
  const question = document.getElementById("question").value.trim();

  const options = {
    A: document.getElementById("optionA").value.trim(),
    B: document.getElementById("optionB").value.trim(),
    C: document.getElementById("optionC").value.trim(),
    D: document.getElementById("optionD").value.trim()
  };

  const answer = document.getElementById("answer").value;
  const explanation = document.getElementById("explanation").value.trim();

  if (!question || Object.values(options).some(v => !v) || !explanation) {
    alert("Please fill in the question, all four options and explanation.");
    return;
  }

  if (!options[answer]) {
    alert("Please select the correct answer.");
    return;
  }

  if (activeRecorder && activeRecorder.state === "recording") {
    alert("Stop the current recording before generating another MCQ.");
    return;
  }

  const q = escapeHTML(question);
  const exp = escapeHTML(explanation);
  const answerText = escapeHTML(options[answer]);

  const optionHTML = Object.entries(options).map(([key, value]) =>
    `<div class="option"><strong>${key}.</strong> ${escapeHTML(value)}</div>`
  ).join("");

  const makeSlide = (label, heading, body) => `
    <div class="scene">
      <h3>JK PULSE</h3>
      <div class="scene-number">${label}</div>
      <h2>${heading}</h2>
      ${body}
    </div>
  `;

  scenes = [
    createScene(
      "Introduction",
      makeSlide("DAILY KNOWLEDGE CHALLENGE", "TEST YOUR KNOWLEDGE",
        '<p class="slide-footer">LET’S BEGIN</p>'),
      "Welcome to JK Pulse. Let's test your knowledge with today's question."
    ),
    createScene(
      "Question",
      makeSlide("QUESTION", q, `<div class="options">${optionHTML}</div>`),
      `Here is your question. ${question}. The options are: A, ${options.A}. B, ${options.B}. C, ${options.C}. D, ${options.D}.`
    ),
    createScene(
      "Think",
      makeSlide("YOUR TURN", "THINK CAREFULLY!",
        '<p class="slide-footer">YOU HAVE FIVE SECONDS</p>'),
      "Take a moment to think and comment your answer."
    ),
    createScene(
      "Countdown",
      makeSlide("TIME TO ANSWER", "5 SECONDS",
        '<div class="countdown">5</div><p class="slide-footer">COMMENT YOUR ANSWER</p>'),
      "Five, four, three, two, one. Time is up."
    ),
    createScene(
      "Correct Answer",
      makeSlide("CORRECT ANSWER",
        `<div class="correct-letter">${answer}</div><h2>${answer}. ${answerText}</h2>`, ""),
      `The correct answer is option ${answer}. ${options[answer]}.`
    ),
    createScene(
      "Explanation",
      makeSlide("EXPLANATION", answerText,
        `<p class="explanation">${exp}</p>`),
      `Let's understand why. ${explanation}`
    ),
    createScene(
      "Outro",
      makeSlide("JK PULSE", "HOW MANY DID YOU GET RIGHT?",
        '<p class="slide-footer">LIKE • SHARE • FOLLOW</p>'),
      "Follow JK Pulse for more interesting questions. Like and share this video."
    )
  ];

  recordings = {};
  renderScene(0);
  renderRecordingPanel();

  document.getElementById("recordingStatus").textContent =
    "Seven scenes generated. Record your voice for each scene.";
});

document.addEventListener("click", async event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const index = Number(button.dataset.index);

  if (!scenes[index]) return;

  if (action === "preview") {
    renderScene(index);

    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
      previewAudio = null;
    }

    if (previewAudioUrl) {
      URL.revokeObjectURL(previewAudioUrl);
      previewAudioUrl = null;
    }

    if (recordings[index]) {
      previewAudioUrl = URL.createObjectURL(recordings[index]);
      previewAudio = new Audio(previewAudioUrl);

      previewAudio.onended = () => {
        URL.revokeObjectURL(previewAudioUrl);
        previewAudioUrl = null;
        previewAudio = null;
      };

      previewAudio.play().catch(error => {
        document.getElementById("recordingStatus").textContent =
          "Tap Play Voice to hear the recording: " + error.message;
      });

      document.getElementById("recordingStatus").textContent =
        `Playing narration for Scene ${index + 1}.`;
    } else {
      document.getElementById("recordingStatus").textContent =
        `Scene ${index + 1} has no voice recording yet.`;
    }
    return;
  }

  if (action === "record") {
    if (activeRecorder && activeRecorder.state === "recording") {
      alert("Stop the current recording first.");
      return;
    }

    try {
      activeStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks = [];
      activeScene = index;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      activeRecorder = new MediaRecorder(activeStream, { mimeType });

      activeRecorder.ondataavailable = e => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      activeRecorder.onstop = () => {
        recordings[index] = new Blob(chunks, { type: activeRecorder.mimeType });

        activeStream.getTracks().forEach(track => track.stop());
        activeStream = null;

        document.getElementById(`status-${index}`).textContent =
          "Recording saved. You can play it or record again.";

        document.getElementById("recordingStatus").textContent =
          `Scene ${index + 1} recording saved.`;

        renderRecordingPanel();
      };

      activeRecorder.start();

      document.getElementById(`status-${index}`).textContent =
        "Recording in progress...";

      document.getElementById("recordingStatus").textContent =
        `Recording Scene ${index + 1}. Speak now.`;

      button.disabled = true;
      const stopButton = document.querySelector(
        `button[data-action="stop"][data-index="${index}"]`
      );
      stopButton.disabled = false;

    } catch (error) {
      document.getElementById("recordingStatus").textContent =
        "Microphone error: " + error.message;
    }
    return;
  }

  if (action === "stop") {
    if (activeRecorder && activeRecorder.state === "recording" &&
        activeScene === index) {
      activeRecorder.stop();
      return;
    }
  }

  if (action === "play") {
    if (recordings[index]) {
      const url = URL.createObjectURL(recordings[index]);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      audio.play();
    }
    return;
  }

  if (action === "download") {
    if (recordings[index]) {
      const url = URL.createObjectURL(recordings[index]);
      const link = document.createElement("a");
      link.href = url;
      link.download = `JK-Pulse-Scene-${index + 1}.webm`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
  }
});

// Remove the old voice-cloning and single-sample recording panels.
document.getElementById("voicePanel")?.remove();
document.getElementById("recordingPanel")?.remove();

// JK Pulse background music controls
let backgroundMusic = null;
let musicObjectUrl = null;

const musicFile = document.getElementById("musicFile");
const musicVolume = document.getElementById("musicVolume");
const musicVolumeValue = document.getElementById("musicVolumeValue");
const playMusicBtn = document.getElementById("playMusicBtn");
const stopMusicBtn = document.getElementById("stopMusicBtn");
const musicStatus = document.getElementById("musicStatus");

musicFile.addEventListener("change", () => {
  const file = musicFile.files[0];
  if (!file) return;

  if (backgroundMusic) {
    backgroundMusic.pause();
    backgroundMusic = null;
  }

  if (musicObjectUrl) URL.revokeObjectURL(musicObjectUrl);

  musicObjectUrl = URL.createObjectURL(file);
  backgroundMusic = new Audio(musicObjectUrl);
  backgroundMusic.loop = true;
  backgroundMusic.volume = Number(musicVolume.value) / 100;

  musicStatus.textContent = `Selected: ${file.name}`;
});

musicVolume.addEventListener("input", () => {
  const volume = Number(musicVolume.value);
  musicVolumeValue.textContent = `${volume}%`;

  if (backgroundMusic) {
    backgroundMusic.volume = volume / 100;
  }
});

playMusicBtn.addEventListener("click", async () => {
  if (!backgroundMusic) {
    musicStatus.textContent = "Please upload an audio file first.";
    return;
  }

  try {
    await backgroundMusic.play();
    musicStatus.textContent = "Background music playing.";
  } catch (error) {
    musicStatus.textContent = "Unable to play music: " + error.message;
  }
});

stopMusicBtn.addEventListener("click", () => {
  if (backgroundMusic) {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
    musicStatus.textContent = "Background music stopped.";
  }
});

// Public interface for the separate video export engine
window.JKPulse = {
  getScenes: () => scenes,
  getRecordings: () => recordings,
  getBackgroundMusic: () => backgroundMusic,
  getMusicVolume: () => Number(musicVolume.value) / 100
};
