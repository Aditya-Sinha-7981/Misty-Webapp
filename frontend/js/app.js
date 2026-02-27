const content = document.getElementById("content");

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("active");
}

function loadPage(page) {

  if (window.innerWidth <= 900) {
    document.getElementById("sidebar").classList.remove("active");
  }

  if (page === "voice") {

    content.innerHTML = `
      <header>
        <h1>Misty AI</h1>
        <div id="status" class="status">Ready</div>
      </header>

      <section class="recorder">
        <div id="holdBtn" class="mic-circle">
          <div class="mic-inner"></div>
        </div>
        <p>Hold to Talk</p>
        <button id="toggleBtn" class="toggle-btn">▶ Start Recording</button>
      </section>

      <section class="results">
        <div class="card">
          <h3>You Said</h3>
          <textarea id="transcription" readonly></textarea>
        </div>

        <div class="card">
          <h3>Misty Response</h3>
          <textarea id="response" readonly></textarea>
        </div>
      </section>

      <div class="answer-options">
        <div class="option-tag">detailed</div>
        <div class="option-tag">example</div>
        <div class="option-tag">bullet</div>
        <div class="option-tag">step</div>
        <div class="option-tag">technical</div>
        <div class="option-tag">beginner</div>
        <div class="option-tag">table</div>
        <div class="option-tag">real_world</div>
        <div class="option-tag">interview</div>
      </div>
    `;

    initializeVoice();
    return;
  }

  content.innerHTML = `<h1>${page.toUpperCase()}</h1>`;
}

loadPage("voice");

function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('active');
}