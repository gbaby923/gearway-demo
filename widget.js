(function () {
  'use strict';

  // ─── Config ──────────────────────────────────────────────────────────────────
  var CONFIG = {
    shopName: 'Gearway Auto',
    phone: '(818) 386-8889',
    address: '14333 Victory Blvd, Van Nuys, CA 91401',
    chatEndpoint: '/api/chat',
    bookingEndpoint: '/api/bookings',
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
      height: 560px;
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
    #gw-header-name {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      letter-spacing: 0.01em;
    }
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

    /* Booking confirmation card */
    .gw-booking-card {
      background: #0f1e18;
      border: 1px solid #1a3329;
      border-radius: 12px;
      padding: 14px;
      align-self: flex-start;
      max-width: 92%;
      font-size: 13px;
    }
    .gw-booking-card h4 {
      color: #6ee7b7;
      margin: 0 0 10px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .gw-booking-card .gw-booking-row {
      display: flex;
      gap: 6px;
      margin-bottom: 5px;
      color: #e0e0e0;
    }
    .gw-booking-card .gw-booking-label {
      color: #666;
      flex-shrink: 0;
      min-width: 70px;
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
      width: 6px;
      height: 6px;
      border-radius: 50%;
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
    .gw-chip:hover {
      background: #2a2a2a;
      border-color: #555;
      color: #fff;
    }

    /* Input */
    #gw-input-row {
      padding: 10px 14px 12px;
      display: flex;
      gap: 8px;
      align-items: flex-end;
      border-top: 1px solid #1a1a1a;
      flex-shrink: 0;
    }
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
      width: 36px;
      height: 36px;
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
    #gw-footer a {
      color: #444;
      text-decoration: none;
    }
    #gw-footer a:hover { color: #666; }

    /* Notification dot */
    #gw-notif-dot {
      position: absolute;
      top: 0;
      right: 0;
      width: 14px;
      height: 14px;
      background: #6ee7b7;
      border-radius: 50%;
      border: 2px solid #0a0a0a;
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
        bottom: 0;
        right: 0;
        width: 100%;
        height: 100%;
        border-radius: 0;
        border: none;
      }
      #gw-widget-btn {
        bottom: 16px;
        right: 16px;
      }
    }
  `;

  // ─── State ────────────────────────────────────────────────────────────────────
  var state = {
    open: false,
    messages: [],        // {role: 'user'|'assistant', content: string}
    loading: false,
    greeted: false,
  };

  // ─── DOM ──────────────────────────────────────────────────────────────────────
  var btn, panel, messagesEl, inputEl, sendBtn, chipsEl, notifDot;

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

  function createButton() {
    var wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;';

    btn = document.createElement('button');
    btn.id = 'gw-widget-btn';
    btn.setAttribute('aria-label', 'Chat with service advisor');
    btn.innerHTML = `
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 2C7.477 2 3 6.477 3 12c0 1.89.523 3.658 1.43 5.168L3 23l5.832-1.43A9.963 9.963 0 0013 22c5.523 0 10-4.477 10-10S18.523 2 13 2z" fill="#0a0a0a"/>
        <circle cx="9" cy="12" r="1.4" fill="#fff"/>
        <circle cx="13" cy="12" r="1.4" fill="#fff"/>
        <circle cx="17" cy="12" r="1.4" fill="#fff"/>
      </svg>`;

    notifDot = document.createElement('div');
    notifDot.id = 'gw-notif-dot';

    btn.appendChild(notifDot);
    btn.addEventListener('click', togglePanel);
    wrap.appendChild(btn);
    document.body.appendChild(wrap);
  }

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
      <div id="gw-input-row">
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

    messagesEl = panel.querySelector('#gw-messages');
    inputEl    = panel.querySelector('#gw-input');
    sendBtn    = panel.querySelector('#gw-send-btn');
    chipsEl    = panel.querySelector('#gw-chips');

    panel.querySelector('#gw-close-btn').addEventListener('click', togglePanel);

    sendBtn.addEventListener('click', handleSend);
    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });
    inputEl.addEventListener('input', autoResizeTextarea);
  }

  function autoResizeTextarea() {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + 'px';
  }

  // ─── Panel toggle ─────────────────────────────────────────────────────────────
  function togglePanel() {
    state.open = !state.open;
    if (state.open) {
      panel.classList.add('gw-open');
      hideNotifDot();
      if (!state.greeted) {
        state.greeted = true;
        setTimeout(sendGreeting, 300);
      }
      setTimeout(function () { inputEl.focus(); }, 350);
      // Change button icon to X
      btn.innerHTML = `
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M4 4l14 14M18 4L4 18" stroke="#0a0a0a" stroke-width="2" stroke-linecap="round"/>
        </svg>`;
      btn.appendChild(notifDot);
    } else {
      panel.classList.remove('gw-open');
      btn.innerHTML = `
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
          <path d="M13 2C7.477 2 3 6.477 3 12c0 1.89.523 3.658 1.43 5.168L3 23l5.832-1.43A9.963 9.963 0 0013 22c5.523 0 10-4.477 10-10S18.523 2 13 2z" fill="#0a0a0a"/>
          <circle cx="9" cy="12" r="1.4" fill="#fff"/>
          <circle cx="13" cy="12" r="1.4" fill="#fff"/>
          <circle cx="17" cy="12" r="1.4" fill="#fff"/>
        </svg>`;
      btn.appendChild(notifDot);
    }
  }

  function showNotifDot() {
    if (!state.open) {
      notifDot.style.display = 'block';
    }
  }
  function hideNotifDot() {
    notifDot.style.display = 'none';
  }

  // ─── Greeting ─────────────────────────────────────────────────────────────────
  function sendGreeting() {
    var greetings = [
      "Hey! I'm your Gearway service advisor. What's going on with your vehicle today? Describe any sounds, symptoms, or concerns and I'll help you figure out what you're dealing with.",
      "Hi there — what can I help you with? Got a noise, a warning light, or something that just doesn't feel right? Tell me what's happening and we'll work through it.",
    ];
    var msg = greetings[Math.floor(Math.random() * greetings.length)];
    appendBotMessage(msg);
    showChips(['Squeaking brakes', 'Check engine light', 'Car won\'t start', 'Strange noise', 'Book a service']);
  }

  // ─── Message rendering ────────────────────────────────────────────────────────
  function appendBotMessage(text) {
    var div = document.createElement('div');
    div.className = 'gw-msg gw-msg-bot';
    div.innerHTML = formatText(text);
    messagesEl.appendChild(div);
    scrollToBottom();
    return div;
  }

  function appendUserMessage(text) {
    var div = document.createElement('div');
    div.className = 'gw-msg gw-msg-user';
    div.textContent = text;
    messagesEl.appendChild(div);
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
      <h4>Appointment Request Sent</h4>
      <div class="gw-booking-row"><span class="gw-booking-label">Name:</span><span>${escHtml(booking.name)}</span></div>
      <div class="gw-booking-row"><span class="gw-booking-label">Phone:</span><span>${escHtml(booking.phone)}</span></div>
      <div class="gw-booking-row"><span class="gw-booking-label">Email:</span><span>${escHtml(booking.email || '—')}</span></div>
      <div class="gw-booking-row"><span class="gw-booking-label">Vehicle:</span><span>${escHtml(booking.vehicle)}</span></div>
      <div class="gw-booking-row"><span class="gw-booking-label">Service:</span><span>${escHtml(booking.service)}</span></div>
      <div class="gw-booking-row"><span class="gw-booking-label">Preferred:</span><span>${escHtml(booking.preferred_time)}</span></div>
    `;
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
    return div;
  }

  function removeTyping() {
    var t = document.getElementById('gw-typing-indicator');
    if (t) t.remove();
  }

  function formatText(text) {
    // Bold **text**
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Newlines
    text = text.replace(/\n/g, '<br>');
    // Phone links
    text = text.replace(/(\(818\) 386-8889)/g, '<a href="tel:+18183868889" style="color:#6ee7b7;text-decoration:none;">$1</a>');
    return text;
  }

  function escHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // ─── Quick reply chips ────────────────────────────────────────────────────────
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

  function clearChips() {
    chipsEl.innerHTML = '';
  }

  // ─── Send & API ───────────────────────────────────────────────────────────────
  function handleSend() {
    var text = inputEl.value.trim();
    if (!text || state.loading) return;

    inputEl.value = '';
    inputEl.style.height = 'auto';
    appendUserMessage(text);

    state.messages.push({ role: 'user', content: text });
    sendToAPI();
  }

  function sendToAPI() {
    state.loading = true;
    sendBtn.disabled = true;
    clearChips();

    var typing = showTyping();

    fetch(CONFIG.chatEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: state.messages }),
    })
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
            // Strip the JSON block from displayed text
            var displayText = reply.replace(/```booking\n[\s\S]*?```/, '').trim();
            if (displayText) appendBotMessage(displayText);
            appendBookingCard(booking);
            saveBooking(booking);
          } catch (e) {
            appendBotMessage(reply);
          }
        } else {
          appendBotMessage(reply);
        }

        // Show context-aware chips
        if (data.chips && data.chips.length) {
          showChips(data.chips);
        } else {
          inferChips(reply);
        }
      })
      .catch(function (err) {
        removeTyping();
        state.loading = false;
        sendBtn.disabled = false;
        appendBotMessage("Sorry, I'm having a connection issue right now. Give us a call directly at **(818) 386-8889** and we'll take care of you.");
        console.error('[Gearway Widget]', err);
      });
  }

  function inferChips(reply) {
    var lower = reply.toLowerCase();
    if (lower.includes('book') || lower.includes('appointment') || lower.includes('schedule')) {
      showChips(['Yes, book me in', 'What\'s your availability?', 'Just have a question']);
    } else if (lower.includes('brake') || lower.includes('rotor') || lower.includes('pad')) {
      showChips(['How much does it cost?', 'Book a brake inspection', 'Walk-in or appointment?']);
    } else if (lower.includes('engine') || lower.includes('check engine')) {
      showChips(['What causes this?', 'How urgent is it?', 'Book a diagnostic']);
    } else if (lower.includes('oil') || lower.includes('filter')) {
      showChips(['Book an oil change', 'How often should I do it?', 'What oil do you use?']);
    }
  }

  // ─── Booking save ─────────────────────────────────────────────────────────────
  function saveBooking(booking) {
    fetch(CONFIG.bookingEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking),
    }).catch(function (err) {
      console.error('[Gearway Widget] Booking save failed:', err);
    });
  }

  // ─── Boot ─────────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
