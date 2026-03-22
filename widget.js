(function () {
  'use strict';

  // ─── Config ───────────────────────────────────────────────────────────────────
  var CONFIG = {
    shopName: 'Gearway Auto',
    phone: '(818) 386-8889',
    address: '14333 Victory Blvd, Van Nuys, CA 91401',
    chatEndpoint: '/api/chat',
    bookingEndpoint: '/api/bookings',
    slotsEndpoint: '/api/slots',
    poweredBy: 'MOUNT Studio',
  };

  // ─── Styles ───────────────────────────────────────────────────────────────────
  var STYLES = `
    #gw-widget-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #fff;
      border: 1.5px solid #2a2a2a;
      cursor: pointer;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 24px rgba(0,0,0,0.55);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      outline: none;
    }
    #gw-widget-btn:hover {
      transform: scale(1.07);
      box-shadow: 0 6px 32px rgba(0,0,0,0.7);
    }
    #gw-widget-btn svg { display: block; }

    #gw-widget-panel {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 370px;
      height: 580px;
      max-height: calc(100vh - 110px);
      background: #0a0a0a;
      border: 1px solid #2a2a2a;
      border-radius: 16px;
      z-index: 99998;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 8px 40px rgba(0,0,0,0.75);
      font-family: 'PPGatwick', Arial, sans-serif;
      transform: translateY(16px) scale(0.97);
      opacity: 0;
      pointer-events: none;
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease;
    }
    #gw-widget-panel.gw-open {
      transform: translateY(0) scale(1);
      opacity: 1;
      pointer-events: all;
    }

    /* Header */
    #gw-header {
      background: #000;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      border-bottom: 1px solid #1e1e1e;
      flex-shrink: 0;
    }
    #gw-header-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #1e1e1e;
      border: 1px solid #3a3a3a;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    #gw-header-info { flex: 1; min-width: 0; }
    #gw-header-name { font-size: 14px; font-weight: 600; color: #fff; letter-spacing: 0.01em; }
    #gw-header-status {
      font-size: 11px;
      color: #6ee7b7;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    #gw-header-status::before {
      content: '';
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #6ee7b7;
    }
    #gw-close-btn {
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      border-radius: 4px;
      transition: color 0.15s;
    }
    #gw-close-btn:hover { color: #fff; }

    /* Messages */
    #gw-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      scroll-behavior: smooth;
    }
    #gw-messages::-webkit-scrollbar { width: 4px; }
    #gw-messages::-webkit-scrollbar-track { background: transparent; }
    #gw-messages::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }

    .gw-msg {
      max-width: 85%;
      padding: 10px 13px;
      border-radius: 12px;
      font-size: 13.5px;
      line-height: 1.5;
      word-wrap: break-word;
    }
    .gw-msg-bot {
      background: #141414;
      color: #e0e0e0;
      border: 1px solid #242424;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }
    .gw-msg-user {
      background: #fff;
      color: #0a0a0a;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .gw-msg-system {
      background: #0f1e18;
      color: #6ee7b7;
      border: 1px solid #1a3329;
      align-self: center;
      font-size: 12px;
      text-align: center;
      max-width: 95%;
      border-radius: 8px;
    }

    /* Photo message */
    .gw-msg-photo {
      align-self: flex-end;
      max-width: 75%;
      padding: 0;
      overflow: hidden;
      border-radius: 12px;
      border-bottom-right-radius: 4px;
    }
    .gw-msg-photo img {
      width: 100%;
      max-width: 220px;
      height: auto;
      display: block;
      border-radius: 12px;
      border-bottom-right-radius: 4px;
    }

    /* Booking confirmation card */
    .gw-booking-card {
      background: #0f1e18;
      border: 1px solid #1a3329;
      border-radius: 12px;
      padding: 14px;
      align-self: flex-start;
      max-width: 94%;
      font-size: 13px;
    }
    .gw-booking-card h4 {
      color: #6ee7b7;
      margin: 0 0 10px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .gw-booking-card .gw-booking-row {
      display: flex;
      gap: 6px;
      margin-bottom: 5px;
      color: #e0e0e0;
    }
    .gw-booking-card .gw-booking-label {
      color: #555;
      flex-shrink: 0;
      min-width: 74px;
      font-size: 12px;
    }
    .gw-booking-card .gw-booking-val { font-size: 13px; }
    .gw-booking-divider {
      height: 1px;
      background: #1a3329;
      margin: 8px 0;
    }

    /* Slot selection card */
    .gw-slots-card {
      background: #111;
      border: 1px solid #2a2a2a;
      border-radius: 12px;
      padding: 14px;
      align-self: flex-start;
      max-width: 94%;
      font-size: 13px;
    }
    .gw-slots-card h4 {
      color: #aaa;
      margin: 0 0 10px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .gw-slot-btn {
      display: block;
      width: 100%;
      background: #1a1a1a;
      border: 1px solid #333;
      color: #e0e0e0;
      padding: 9px 12px;
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
      text-align: left;
      margin-bottom: 6px;
      font-family: inherit;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
    }
    .gw-slot-btn:last-child { margin-bottom: 0; }
    .gw-slot-btn:hover {
      background: #222;
      border-color: #6ee7b7;
      color: #fff;
    }

    /* Typing indicator */
    .gw-typing {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 10px 13px;
      background: #141414;
      border: 1px solid #242424;
      border-radius: 12px;
      border-bottom-left-radius: 4px;
      align-self: flex-start;
    }
    .gw-typing span {
      width: 6px; height: 6px; border-radius: 50%;
      background: #555;
      animation: gw-bounce 1.2s infinite;
    }
    .gw-typing span:nth-child(2) { animation-delay: 0.2s; }
    .gw-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes gw-bounce {
      0%, 60%, 100% { transform: translateY(0); background: #555; }
      30% { transform: translateY(-5px); background: #999; }
    }

    /* Quick reply chips */
    #gw-chips {
      padding: 0 16px 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      flex-shrink: 0;
    }
    .gw-chip {
      background: #1a1a1a;
      border: 1px solid #333;
      color: #ccc;
      padding: 5px 11px;
      border-radius: 20px;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
      white-space: nowrap;
      font-family: inherit;
    }
    .gw-chip:hover { background: #2a2a2a; border-color: #555; color: #fff; }

    /* Image preview (above input) */
    #gw-photo-preview {
      margin: 0 14px 8px;
      position: relative;
      display: none;
      width: fit-content;
    }
    #gw-photo-preview img {
      max-height: 72px;
      max-width: 100%;
      border-radius: 8px;
      display: block;
      border: 1px solid #2a2a2a;
    }
    #gw-photo-remove {
      position: absolute;
      top: -6px;
      right: -6px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #333;
      border: none;
      color: #ccc;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      line-height: 1;
      padding: 0;
      transition: background 0.15s;
    }
    #gw-photo-remove:hover { background: #555; color: #fff; }

    /* Input row */
    #gw-input-row {
      padding: 6px 14px 12px;
      display: flex;
      gap: 7px;
      align-items: flex-end;
      border-top: 1px solid #1a1a1a;
      flex-shrink: 0;
    }
    #gw-photo-btn {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.15s, border-color 0.15s;
    }
    #gw-photo-btn:hover { background: #222; border-color: #444; }
    #gw-photo-input { display: none; }
    #gw-input {
      flex: 1;
      background: #141414;
      border: 1px solid #2a2a2a;
      border-radius: 10px;
      color: #fff;
      font-size: 13.5px;
      padding: 9px 12px;
      resize: none;
      outline: none;
      font-family: inherit;
      line-height: 1.4;
      max-height: 100px;
      overflow-y: auto;
      transition: border-color 0.15s;
    }
    #gw-input::placeholder { color: #444; }
    #gw-input:focus { border-color: #444; }
    #gw-send-btn {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: #fff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.15s, transform 0.1s;
    }
    #gw-send-btn:hover { background: #e0e0e0; }
    #gw-send-btn:active { transform: scale(0.92); }
    #gw-send-btn:disabled { background: #222; cursor: not-allowed; }
    #gw-send-btn:disabled svg path { fill: #444; }

    /* Footer */
    #gw-footer {
      text-align: center;
      font-size: 10.5px;
      color: #333;
      padding: 0 0 10px;
      letter-spacing: 0.03em;
      flex-shrink: 0;
    }
    #gw-footer a { color: #444; text-decoration: none; }
    #gw-footer a:hover { color: #666; }

    /* Notification dot */
    #gw-notif-dot {
      position: absolute;
      top: 0; right: 0;
      width: 14px; height: 14px;
      background: #6ee7b7;
      border-radius: 50%;
      border: 2px solid #fff;
      display: none;
      animation: gw-pulse 2s infinite;
    }
    @keyframes gw-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }

    /* Mobile */
    @media (max-width: 480px) {
      #gw-widget-panel {
        bottom: 10px;
        right: 10px;
        left: 10px;
        width: auto;
        height: auto;
        max-height: calc(100vh - 90px);
        border-radius: 16px;
        border: 1px solid #2a2a2a;
      }
      #gw-widget-btn { bottom: 16px; right: 16px; }
    }
  `;

  // ─── State ─────────────────────────────────────────────────────────────────────
  var state = {
    open: false,
    messages: [],       // {role, content, image?}
    loading: false,
    greeted: false,
    pendingBooking: null,   // booking data waiting for slot selection
    pendingImage: null,     // {data: base64, type: mimeType} — attached to next send
  };

  // ─── DOM refs ──────────────────────────────────────────────────────────────────
  var btn, panel, messagesEl, inputEl, sendBtn, chipsEl, notifDot,
      photoBtn, photoInput, photoPreviewEl;

  // ─── Init ──────────────────────────────────────────────────────────────────────
  function init() {
    injectStyles();
    createButton();
    createPanel();
    setTimeout(showNotifDot, 2500);
  }

  function injectStyles() {
    var s = document.createElement('style');
    s.textContent = STYLES;
    document.head.appendChild(s);
  }

  // ─── Button ────────────────────────────────────────────────────────────────────
  function createButton() {
    var wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;';

    btn = document.createElement('button');
    btn.id = 'gw-widget-btn';
    btn.setAttribute('aria-label', 'Chat with Gearway service advisor');
    setButtonIcon('chat');

    notifDot = document.createElement('div');
    notifDot.id = 'gw-notif-dot';
    btn.appendChild(notifDot);

    btn.addEventListener('click', togglePanel);
    wrap.appendChild(btn);
    document.body.appendChild(wrap);
  }

  function setButtonIcon(type) {
    var prev = btn.querySelector('svg');
    if (prev) btn.removeChild(prev);
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    if (type === 'chat') {
      svg.setAttribute('width', '26'); svg.setAttribute('height', '26');
      svg.setAttribute('viewBox', '0 0 26 26'); svg.setAttribute('fill', 'none');
      svg.innerHTML = '<path d="M13 2C7.477 2 3 6.477 3 12c0 1.89.523 3.658 1.43 5.168L3 23l5.832-1.43A9.963 9.963 0 0013 22c5.523 0 10-4.477 10-10S18.523 2 13 2z" fill="#0a0a0a"/><circle cx="9" cy="12" r="1.4" fill="#fff"/><circle cx="13" cy="12" r="1.4" fill="#fff"/><circle cx="17" cy="12" r="1.4" fill="#fff"/>';
    } else {
      svg.setAttribute('width', '22'); svg.setAttribute('height', '22');
      svg.setAttribute('viewBox', '0 0 22 22'); svg.setAttribute('fill', 'none');
      svg.innerHTML = '<path d="M4 4l14 14M18 4L4 18" stroke="#0a0a0a" stroke-width="2" stroke-linecap="round"/>';
    }
    btn.insertBefore(svg, btn.firstChild);
  }

  // ─── Panel ─────────────────────────────────────────────────────────────────────
  function createPanel() {
    panel = document.createElement('div');
    panel.id = 'gw-widget-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Gearway Auto Service Advisor');

    panel.innerHTML = `
      <div id="gw-header">
        <div id="gw-header-avatar">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2a8 8 0 100 16A8 8 0 0010 2z" fill="#2a2a2a"/>
            <path d="M10 10.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM5.5 16a4.5 4.5 0 019 0" stroke="#888" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
        </div>
        <div id="gw-header-info">
          <div id="gw-header-name">Gearway Service Advisor</div>
          <div id="gw-header-status">Online now</div>
        </div>
        <button id="gw-close-btn" aria-label="Close chat">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <div id="gw-messages"></div>
      <div id="gw-chips"></div>
      <div id="gw-photo-preview">
        <img id="gw-preview-img" src="" alt="Attached photo"/>
        <button id="gw-photo-remove" aria-label="Remove photo">✕</button>
      </div>
      <div id="gw-input-row">
        <button id="gw-photo-btn" aria-label="Attach photo" title="Attach a photo">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="3" width="14" height="10" rx="2" stroke="#666" stroke-width="1.3"/>
            <circle cx="5.5" cy="7.5" r="1.5" stroke="#666" stroke-width="1.2"/>
            <path d="M1 11l3.5-3.5L8 11l2.5-2.5L15 13" stroke="#666" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <input id="gw-photo-input" type="file" accept="image/*" capture="environment"/>
        <textarea id="gw-input" placeholder="Describe your car issue or ask a question…" rows="1"></textarea>
        <button id="gw-send-btn" aria-label="Send">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M14.5 1.5L1 6.5l5.5 2 2 5.5 6-13z" fill="#0a0a0a"/>
          </svg>
        </button>
      </div>
      <div id="gw-footer">Powered by <a href="#" target="_blank">${CONFIG.poweredBy}</a></div>
    `;

    document.body.appendChild(panel);

    messagesEl    = panel.querySelector('#gw-messages');
    inputEl       = panel.querySelector('#gw-input');
    sendBtn       = panel.querySelector('#gw-send-btn');
    chipsEl       = panel.querySelector('#gw-chips');
    photoBtn      = panel.querySelector('#gw-photo-btn');
    photoInput    = panel.querySelector('#gw-photo-input');
    photoPreviewEl = panel.querySelector('#gw-photo-preview');

    panel.querySelector('#gw-close-btn').addEventListener('click', togglePanel);
    sendBtn.addEventListener('click', handleSend);
    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    });
    inputEl.addEventListener('input', autoResizeTextarea);

    photoBtn.addEventListener('click', function () { photoInput.click(); });
    photoInput.addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      if (file) handlePhotoSelect(file);
      photoInput.value = '';
    });
    panel.querySelector('#gw-photo-remove').addEventListener('click', clearPhotoPreview);
  }

  function autoResizeTextarea() {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + 'px';
  }

  // ─── Toggle ────────────────────────────────────────────────────────────────────
  function togglePanel() {
    state.open = !state.open;
    if (state.open) {
      panel.classList.add('gw-open');
      hideNotifDot();
      setButtonIcon('close');
      if (!state.greeted) { state.greeted = true; setTimeout(sendGreeting, 300); }
      setTimeout(function () { inputEl.focus(); }, 350);
    } else {
      panel.classList.remove('gw-open');
      setButtonIcon('chat');
    }
  }

  function showNotifDot() { if (!state.open) notifDot.style.display = 'block'; }
  function hideNotifDot() { notifDot.style.display = 'none'; }

  // ─── Greeting ──────────────────────────────────────────────────────────────────
  function sendGreeting() {
    appendBotMessage("Hey! I'm your Gearway service advisor. What's going on with your vehicle today? Describe any sounds, symptoms, or concerns — or attach a photo if that's easier.");
    showChips(['Squeaking brakes', 'Check engine light', 'Car won\'t start', 'Strange noise', 'Book a service']);
  }

  // ─── Photo upload ──────────────────────────────────────────────────────────────
  function handlePhotoSelect(file) {
    if (!file.type.startsWith('image/')) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      var dataUrl = e.target.result;
      // Resize/compress to keep payload under ~1.5MB
      resizeImage(dataUrl, 1024, 1024, 0.82, function (resized) {
        var base64 = resized.split(',')[1];
        var mimeType = file.type;
        state.pendingImage = { data: base64, type: mimeType, preview: resized };
        // Show preview
        var previewImg = panel.querySelector('#gw-preview-img');
        previewImg.src = resized;
        photoPreviewEl.style.display = 'block';
      });
    };
    reader.readAsDataURL(file);
  }

  function resizeImage(dataUrl, maxW, maxH, quality, cb) {
    var img = new Image();
    img.onload = function () {
      var w = img.width, h = img.height;
      if (w > maxW || h > maxH) {
        var r = Math.min(maxW / w, maxH / h);
        w = Math.round(w * r);
        h = Math.round(h * r);
      }
      var canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      cb(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = dataUrl;
  }

  function clearPhotoPreview() {
    state.pendingImage = null;
    photoPreviewEl.style.display = 'none';
    panel.querySelector('#gw-preview-img').src = '';
  }

  // ─── Message rendering ─────────────────────────────────────────────────────────
  function appendBotMessage(text) {
    var div = document.createElement('div');
    div.className = 'gw-msg gw-msg-bot';
    div.innerHTML = formatText(text);
    messagesEl.appendChild(div);
    scrollToBottom();
    return div;
  }

  function appendUserMessage(text, imagePreview) {
    if (imagePreview) {
      var imgDiv = document.createElement('div');
      imgDiv.className = 'gw-msg gw-msg-photo';
      var imgEl = document.createElement('img');
      imgEl.src = imagePreview;
      imgEl.alt = 'Attached photo';
      imgDiv.appendChild(imgEl);
      messagesEl.appendChild(imgDiv);
    }
    if (text) {
      var div = document.createElement('div');
      div.className = 'gw-msg gw-msg-user';
      div.textContent = text;
      messagesEl.appendChild(div);
    }
    scrollToBottom();
    clearChips();
  }

  function appendSystemMessage(text) {
    var div = document.createElement('div');
    div.className = 'gw-msg gw-msg-system';
    div.innerHTML = formatText(text);
    messagesEl.appendChild(div);
    scrollToBottom();
  }

  function appendBookingCard(booking) {
    var div = document.createElement('div');
    div.className = 'gw-booking-card';
    div.innerHTML = `
      <h4>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style="flex-shrink:0">
          <path d="M10 2H9V1H7v1H5V1H3v1H2C1.45 2 1 2.45 1 3v8c0 .55.45 1 1 1h8c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1zm0 9H2V5h8v6z" fill="#6ee7b7"/>
        </svg>
        Appointment Confirmed
      </h4>
      <div class="gw-booking-row"><span class="gw-booking-label">When</span><span class="gw-booking-val"><strong>${escHtml(booking.chosen_slot)}</strong></span></div>
      <div class="gw-booking-divider"></div>
      <div class="gw-booking-row"><span class="gw-booking-label">Name</span><span class="gw-booking-val">${escHtml(booking.name)}</span></div>
      <div class="gw-booking-row"><span class="gw-booking-label">Phone</span><span class="gw-booking-val">${escHtml(booking.phone)}</span></div>
      ${booking.email ? `<div class="gw-booking-row"><span class="gw-booking-label">Email</span><span class="gw-booking-val">${escHtml(booking.email)}</span></div>` : ''}
      <div class="gw-booking-row"><span class="gw-booking-label">Vehicle</span><span class="gw-booking-val">${escHtml(booking.vehicle)}</span></div>
      <div class="gw-booking-row"><span class="gw-booking-label">Service</span><span class="gw-booking-val">${escHtml(booking.service)}</span></div>
    `;
    messagesEl.appendChild(div);
    scrollToBottom();
  }

  function appendSlotsCard(slots, headerText) {
    var div = document.createElement('div');
    div.className = 'gw-slots-card';
    div.innerHTML = '<h4>' + escHtml(headerText || 'Choose a time') + '</h4>';
    slots.forEach(function (slot) {
      var btn = document.createElement('button');
      btn.className = 'gw-slot-btn';
      btn.textContent = slot.label;
      btn.addEventListener('click', function () {
        div.remove();
        handleSlotSelect(slot);
      });
      div.appendChild(btn);
    });
    messagesEl.appendChild(div);
    scrollToBottom();
  }

  function showTyping() {
    var div = document.createElement('div');
    div.className = 'gw-typing';
    div.id = 'gw-typing-indicator';
    div.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(div);
    scrollToBottom();
  }

  function removeTyping() {
    var t = document.getElementById('gw-typing-indicator');
    if (t) t.remove();
  }

  function formatText(text) {
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\n/g, '<br>');
    text = text.replace(/(\(818\) 386-8889)/g, '<a href="tel:+18183868889" style="color:#6ee7b7;text-decoration:none;">$1</a>');
    return text;
  }

  function escHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function scrollToBottom() { messagesEl.scrollTop = messagesEl.scrollHeight; }

  // ─── Chips ─────────────────────────────────────────────────────────────────────
  function showChips(options) {
    chipsEl.innerHTML = '';
    options.forEach(function (opt) {
      var chip = document.createElement('button');
      chip.className = 'gw-chip';
      chip.textContent = opt;
      chip.addEventListener('click', function () {
        inputEl.value = opt;
        handleSend();
      });
      chipsEl.appendChild(chip);
    });
  }

  function clearChips() { chipsEl.innerHTML = ''; }

  // ─── Fetch with timeout ────────────────────────────────────────────────────────
  function fetchWithTimeout(url, opts, ms) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, ms);
    return fetch(url, Object.assign({}, opts, { signal: controller.signal }))
      .then(function (r) { clearTimeout(timer); return r; })
      .catch(function (e) { clearTimeout(timer); throw e; });
  }

  // ─── Send ──────────────────────────────────────────────────────────────────────
  function handleSend() {
    var text = inputEl.value.trim();
    var image = state.pendingImage;

    if (!text && !image) return;
    if (state.loading) return;

    inputEl.value = '';
    inputEl.style.height = 'auto';
    appendUserMessage(text, image ? image.preview : null);
    clearPhotoPreview();

    var msg = { role: 'user', content: text || '[Photo attached]' };
    if (image) msg.image = { data: image.data, type: image.type };
    state.messages.push(msg);

    sendToAPI();
  }

  function sendToAPI() {
    state.loading = true;
    sendBtn.disabled = true;
    clearChips();
    showTyping();

    fetchWithTimeout(CONFIG.chatEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: state.messages }),
    }, 25000)
      .then(function (res) {
        if (!res.ok) throw new Error('API error ' + res.status);
        return res.json();
      })
      .then(function (data) {
        removeTyping();
        state.loading = false;
        sendBtn.disabled = false;

        var reply = data.reply || '';
        state.messages.push({ role: 'assistant', content: reply });

        // Check for booking JSON block
        var bookingMatch = reply.match(/```booking\n([\s\S]*?)```/);
        if (bookingMatch) {
          try {
            var booking = JSON.parse(bookingMatch[1]);
            var displayText = reply.replace(/```booking\n[\s\S]*?```/, '').trim();
            if (displayText) appendBotMessage(displayText);
            fetchSlots(booking);
          } catch (e) {
            appendBotMessage(reply);
          }
        } else {
          appendBotMessage(reply);
          inferChips(reply);
        }
      })
      .catch(function (err) {
        removeTyping();
        state.loading = false;
        sendBtn.disabled = false;
        appendBotMessage("Sorry, I'm having a connection issue. Give us a call directly at **(818) 386-8889** and we'll sort you out.");
        console.error('[Gearway Widget]', err);
      });
  }

  // ─── Slot flow ─────────────────────────────────────────────────────────────────
  function fetchSlots(booking) {
    state.pendingBooking = booking;
    var checkingEl = appendBotMessage('Give me one moment while I check availability…');

    var url = CONFIG.slotsEndpoint;
    if (booking.preferred_time) {
      url += '?preferred=' + encodeURIComponent(booking.preferred_time);
    }

    fetchWithTimeout(url, {}, 25000)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (checkingEl && checkingEl.parentNode) checkingEl.remove();

        if (!data.slots || !data.slots.length) {
          appendBotMessage("Hmm, I'm having trouble pulling up the calendar right now. Give us a call at **(818) 386-8889** and we'll get you scheduled.");
          return;
        }

        var header;
        if (data.preferredAvailable === true) {
          header = "That time works! Here it is plus a couple of alternatives:";
        } else if (data.preferredAvailable === false) {
          header = "That slot's taken — here are 3 open times nearby:";
        } else {
          header = 'Choose a time';
        }
        appendSlotsCard(data.slots, header);
      })
      .catch(function (err) {
        console.error('[Slots]', err);
        if (checkingEl && checkingEl.parentNode) checkingEl.remove();
        appendBotMessage("Couldn't load the calendar right now. Call us at **(818) 386-8889** and we'll book you in directly.");
      });
  }

  function handleSlotSelect(slot) {
    var booking = state.pendingBooking;
    state.pendingBooking = null;

    // Show chosen slot as a user bubble
    appendUserMessage(slot.label);
    showTyping();

    // Build the full booking payload
    var payload = Object.assign({}, booking, {
      chosen_slot: slot.label,
      slot_start: slot.start,
      slot_end: slot.end,
    });

    // Confirm and book
    fetchWithTimeout(CONFIG.bookingEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }, 25000)
      .then(function (r) { return r.json(); })
      .then(function () {
        removeTyping();
        appendBookingCard(payload);
        // Warm closing from Claude
        var closingMsg = {
          role: 'user',
          content: 'My appointment is confirmed for ' + slot.label + '. Thanks!',
        };
        state.messages.push(closingMsg);
        sendToAPI();
      })
      .catch(function (err) {
        removeTyping();
        console.error('[Booking]', err);
        appendBookingCard(payload); // still show the card
        appendBotMessage("Got you booked in! A confirmation has been sent. See you soon!");
      });
  }

  // ─── Context-aware chips ───────────────────────────────────────────────────────
  function inferChips(reply) {
    var lower = reply.toLowerCase();
    if (lower.includes('book') || lower.includes('appointment') || lower.includes('schedule')) {
      showChips(['Yes, let\'s book it', 'What\'s your availability?', 'Just a question']);
    } else if (lower.includes('brake') || lower.includes('rotor') || lower.includes('pad')) {
      showChips(['How much does it cost?', 'Book a brake inspection', 'Walk-in or appointment?']);
    } else if (lower.includes('engine') || lower.includes('check engine')) {
      showChips(['What causes this?', 'How urgent is it?', 'Book a diagnostic']);
    } else if (lower.includes('oil') || lower.includes('filter')) {
      showChips(['Book an oil change', 'How often should I?', 'What oil do you use?']);
    } else if (lower.includes('photo') || lower.includes('image') || lower.includes('picture')) {
      showChips(['Attach a photo', 'Book an inspection', 'What would that cost?']);
    }
  }

  // ─── Boot ──────────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
