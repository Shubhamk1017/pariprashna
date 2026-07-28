/**
 * WhatsApp Service
 *
 * Manages the WhatsApp Web.js client connection.
 * - Initializes and authenticates via QR code
 * - Sends formatted questions to a configured WhatsApp group
 * - Listens for messages/replies from gurus in the group
 * - Stores incoming answers as pending WhatsAppMessage documents
 *
 * Environment variables:
 *   WHATSAPP_GROUP_ID  — the WhatsApp group ID to post questions to (format: 1234567890-123456@g.us)
 *   SITE_URL           — base URL of the website (for links in messages)
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const { execSync } = require('child_process');

// ── Constants ───────────────────────────────────────────────────────────────
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;
const RECONNECT_DELAY_MS = 10000;
const MAX_RECONNECT_ATTEMPTS = 10;

// ── State ───────────────────────────────────────────────────────────────────
let client = null;
let isReady = false;
let latestQR = null;
let reconnectAttempts = 0;
let reconnectTimer = null;
let isInitializing = false;

// Lazy-load mongoose models to avoid circular deps at startup
let WhatsAppMessage;
let Question;

function getModels() {
  if (!WhatsAppMessage) WhatsAppMessage = require('../models/WhatsAppMessage');
  if (!Question) Question = require('../models/Question');
  return { WhatsAppMessage, Question };
}

// ── Platform-aware Puppeteer configuration ───────────────────────────────────
function getPuppeteerConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isMacOS = process.platform === 'darwin';
  const isWindows = process.platform === 'win32';
  const fs = require('fs');

  const config = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--disable-gpu',
    ],
  };

  // 1. Explicit env var override
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    config.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    console.log('[WhatsApp] Using custom Chrome path from PUPPETEER_EXECUTABLE_PATH:', config.executablePath);
  }
  // 2. Production (Render/Linux): use @sparticuz/chromium
  else if (isProduction) {
    try {
      const chromium = require('@sparticuz/chromium');
      config.executablePath = chromium.executablePath;
      config.args = chromium.args.concat(config.args);
      console.log('[WhatsApp] Using @sparticuz/chromium for production');
    } catch (err) {
      console.error('[WhatsApp] @sparticuz/chromium not found, using bundled puppeteer');
    }
  }
  // 3. Windows local Chrome auto-detection
  else if (isWindows) {
    const winPaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      process.env.LOCALAPPDATA ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe` : null,
      process.env.PROGRAMFILES ? `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe` : null,
      process.env['PROGRAMFILES(X86)'] ? `${process.env['PROGRAMFILES(X86)']}\\Google\\Chrome\\Application\\chrome.exe` : null,
    ].filter(Boolean);

    for (const winPath of winPaths) {
      if (fs.existsSync(winPath)) {
        config.executablePath = winPath;
        console.log('[WhatsApp] Detected local Windows Chrome:', winPath);
        break;
      }
    }
  }

  // macOS: add flags that work on macOS
  if (isMacOS && !isProduction) {
    config.args.push('--disable-extensions');
    config.args.push('--disable-background-networking');
  }

  return config;
}

// ── Kill orphaned Chrome processes from previous sessions ────────────────────
function killOrphanedChromeProcesses() {
  // Unix ps command is not available on Windows
  if (process.platform === 'win32') {
    return;
  }
  try {
    const result = execSync(
      "ps aux | grep -i 'chrome.*whatsapp-session' | grep -v grep | awk '{print $2}'",
      { encoding: 'utf-8', timeout: 5000 }
    ).trim();

    if (result) {
      const pids = result.split('\n').filter(Boolean);
      console.log(`[WhatsApp] Killing ${pids.length} orphaned Chrome process(es): ${pids.join(', ')}`);
      pids.forEach((pid) => {
        try {
          process.kill(parseInt(pid), 'SIGKILL');
        } catch (e) {
          // Process may have already exited
        }
      });
      // Wait for processes to fully die
      execSync('sleep 1', { timeout: 3000 });
    }
  } catch (e) {
    // No orphaned processes found — this is normal
  }
}

// ── Clean stale lock files ───────────────────────────────────────────────────
function cleanStaleLocks() {
  const fs = require('fs');
  const path = require('path');
  const lockDir = path.join(__dirname, '..', 'whatsapp-session', 'session');
  const lockFiles = ['SingletonLock', 'SingletonSocket', 'SingletonCookie'];

  lockFiles.forEach((file) => {
    const filePath = path.join(lockDir, file);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[WhatsApp] Removed stale lock: ${file}`);
      }
    } catch (e) {
      // Ignore — file may be locked by Chrome
    }
  });
}

// ── Initialize the WhatsApp client ───────────────────────────────────────────
function initClient() {
  if (client) {
    console.log('[WhatsApp] Client already exists, skipping initialization');
    return client;
  }

  if (isInitializing) {
    console.log('[WhatsApp] Initialization already in progress, skipping');
    return null;
  }

  isInitializing = true;
  reconnectAttempts = 0;

  // Clean up before starting
  killOrphanedChromeProcesses();
  cleanStaleLocks();

  console.log('[WhatsApp] Initializing client...');

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: './whatsapp-session' }),
    puppeteer: getPuppeteerConfig(),
  });

  // ── Event handlers ──────────────────────────────────────────────────────

  client.on('qr', async (qr) => {
    console.log('[WhatsApp] QR code received. Scan to authenticate.');
    try {
      latestQR = await QRCode.toDataURL(qr);
      console.log('[WhatsApp] QR data URL generated (scan via /api/whatsapp/qr endpoint)');
    } catch (err) {
      console.error('[WhatsApp] QR generation error:', err.message);
    }
  });

  client.on('ready', () => {
    isReady = true;
    isInitializing = false;
    latestQR = null;
    reconnectAttempts = 0;
    console.log('[WhatsApp] ✅ Client is ready and authenticated!');
  });

  client.on('authenticated', () => {
    console.log('[WhatsApp] Authenticated successfully.');
  });

  client.on('auth_failure', (msg) => {
    console.error('[WhatsApp] ❌ Auth failure:', msg);
    isReady = false;
    isInitializing = false;
    // Auth failures are not recoverable — need fresh QR scan
    scheduleReconnect(true);
  });

  client.on('disconnected', (reason) => {
    console.log('[WhatsApp] ⚠️ Disconnected:', reason);
    isReady = false;
    isInitializing = false;
    // Destroy old client before reconnecting
    destroyClient().then(() => {
      scheduleReconnect(false);
    });
  });

  // ── Message listener ────────────────────────────────────────────────────
  client.on('message_create', async (msg) => {
    try {
      await handleMessage(msg);
    } catch (err) {
      console.error('[WhatsApp] Error handling message:', err?.stack || err?.message || err);
    }
  });

  // ── Start initialization with retry ─────────────────────────────────────
  initializeWithRetry(client, 0);

  return client;
}

// ── Initialize with retry logic ──────────────────────────────────────────────
async function initializeWithRetry(clientRef, attempt) {
  try {
    await clientRef.initialize();
  } catch (err) {
    console.error(`[WhatsApp] Initialization error (attempt ${attempt + 1}/${MAX_RETRIES}):`, err?.message || err);

    // If Chrome binary is missing, stop auto-reconnect loop immediately to save CPU/logs
    if (err && typeof err.message === 'string' && (err.message.includes('Could not find Chrome') || err.message.includes('executablePath'))) {
      console.warn('[WhatsApp] ⚠️ Chrome browser missing. Disabling automatic WhatsApp client reconnect.');
      isInitializing = false;
      await destroyClient();
      return;
    }

    if (attempt < MAX_RETRIES - 1) {
      console.log(`[WhatsApp] Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      setTimeout(() => {
        if (client === clientRef && !isReady) {
          initializeWithRetry(clientRef, attempt + 1);
        }
      }, RETRY_DELAY_MS);
    } else {
      console.error('[WhatsApp] ❌ All initialization attempts failed.');
      isInitializing = false;
      await destroyClient();
    }
  }
}

// ── Schedule auto-reconnect ──────────────────────────────────────────────────
function scheduleReconnect(instantRetry) {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error(`[WhatsApp] ❌ Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Manual re-init needed.`);
    return;
  }

  reconnectAttempts++;
  const delay = instantRetry ? RECONNECT_DELAY_MS : RECONNECT_DELAY_MS * reconnectAttempts;

  console.log(`[WhatsApp] Scheduling reconnect (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}) in ${delay / 1000}s...`);

  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    console.log('[WhatsApp] Attempting reconnect...');
    client = null;
    isInitializing = false;
    isReady = false;
    initClient();
  }, delay);
}

// ── Destroy client safely ────────────────────────────────────────────────────
async function destroyClient() {
  if (client) {
    try {
      await client.destroy();
    } catch (e) {
      // Ignore destroy errors
    }
    client = null;
  }
  isReady = false;
}

// ── Handle incoming WhatsApp message ─────────────────────────────────────────
async function handleMessage(msg) {
  if (!msg) return;

  const { WhatsAppMessage, Question } = getModels();
  const configuredGroupId = (process.env.WHATSAPP_GROUP_ID || '').trim().toLowerCase();

  // 1. Group verification
  if (configuredGroupId) {
    const msgFrom = (msg.from || '').trim().toLowerCase();
    const msgTo = (msg.to || '').trim().toLowerCase();
    const isTargetGroup = msgFrom === configuredGroupId || msgTo === configuredGroupId;
    if (!isTargetGroup) return;
  } else {
    const isGroupMsg = (msg.from && msg.from.endsWith('@g.us')) || (msg.to && msg.to.endsWith('@g.us'));
    if (!isGroupMsg) return;
  }

  // 2. Extract quoted text (synchronously from msg._data first, avoiding Puppeteer getQuotedMessage errors)
  let quotedText = msg._data?.quotedBody || msg._data?.quotedMsg?.body || '';

  if (!quotedText && msg.hasQuotedMsg) {
    try {
      const quotedMsg = await msg.getQuotedMessage();
      if (quotedMsg && typeof quotedMsg.body === 'string') {
        quotedText = quotedMsg.body;
      }
    } catch (err) {
      // Ignore async getQuotedMessage failure
    }
  }

  // Fallback: search raw message data if quotedText is still empty
  if (!quotedText && msg._data) {
    try {
      quotedText = JSON.stringify(msg._data);
    } catch (e) {
      // Ignore stringify error
    }
  }

  if (!quotedText || typeof quotedText !== 'string') {
    return;
  }

  // 3. Extract MongoDB Question ID from quoted text
  const questionIdMatch =
    quotedText.match(/🆔\s*([a-f0-9]{24})/i) ||
    quotedText.match(/questions\/([a-f0-9]{24})/i) ||
    quotedText.match(/([a-f0-9]{24})/i);

  if (!questionIdMatch) return;

  const questionId = questionIdMatch[1];

  // 4. Verify question exists
  let question = null;
  try {
    question = await Question.findById(questionId);
  } catch (err) {
    return;
  }
  if (!question) return;

  // 5. Extract answer text
  const answerText = (msg.body || '').trim();
  if (answerText.length < 5) {
    return; // Ignore empty or accidental short messages
  }

  // 6. Safe sender contact details resolution
  let senderName = 'Guru / Scholar';
  let senderPhone = (msg.author || msg.from || '').replace(/@.*$/, '');

  try {
    const contact = await msg.getContact();
    if (contact) {
      senderName = contact.pushname || contact.name || contact.number || senderName;
      if (contact.number) senderPhone = contact.number;
    }
  } catch (err) {
    // Ignore contact resolution error — phone number fallback is already set
  }

  // 7. Deduplicate by WhatsApp message ID
  const msgId = msg.id?.id || msg.id?._serialized || `msg_${Date.now()}`;
  const existing = await WhatsAppMessage.findOne({ whatsappMessageId: msgId });
  if (existing) return;

  // 8. Store the pending answer
  const pendingAnswer = new WhatsAppMessage({
    question: questionId,
    answerText,
    senderPhone,
    senderName,
    whatsappMessageId: msgId,
    status: 'pending',
  });

  await pendingAnswer.save();
  console.log(`[WhatsApp] ✅ Pending answer received from "${senderName}" (${senderPhone}) for question "${question.title}" (${questionId})`);
}

// ── Send a formatted question to the WhatsApp group ──────────────────────────
async function sendQuestionToGroup(question) {
  if (!isReady || !client) {
    console.log('[WhatsApp] Client not ready. Skipping notification.');
    return false;
  }

  const groupId = process.env.WHATSAPP_GROUP_ID;
  if (!groupId) {
    console.log('[WhatsApp] WHATSAPP_GROUP_ID not configured. Skipping.');
    return false;
  }

  const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
  const questionUrl = `${siteUrl}/questions/${question._id}`;

  // Fetch tag names
  let tagNames = '';
  if (question.tags && question.tags.length > 0) {
    const Tag = require('../models/Tag');
    const tags = await Tag.find({ _id: { $in: question.tags } }).select('name');
    tagNames = tags.map((t) => `#${t.name}`).join(' ');
  }

  const message = [
    `🆕 *New Question on Pariprashna*`,
    ``,
    `📝 *${question.title}*`,
    ``,
    question.body ? `${question.body.substring(0, 300)}${question.body.length > 300 ? '...' : ''}` : '',
    ``,
    tagNames ? `📂 ${tagNames}` : '',
    ``,
    `🆔 ${question._id}`,
    ``,
    `💬 *To answer: Reply to this message with your response.*`,
    `🔗 ${questionUrl}`,
  ]
    .filter((line) => line !== undefined)
    .join('\n');

  try {
    await client.sendMessage(groupId, message);
    console.log(`[WhatsApp] ✅ Question sent to group: ${question.title}`);
    return true;
  } catch (err) {
    console.error('[WhatsApp] ❌ Error sending to group:', err.message);
    return false;
  }
}

// ── Get the current connection status ────────────────────────────────────────
function getStatus() {
  return {
    isReady,
    hasQR: !!latestQR,
    groupId: process.env.WHATSAPP_GROUP_ID || null,
    reconnectAttempts,
    isInitializing,
  };
}

// ── Get the latest QR code as a base64 data URL ─────────────────────────────
function getQR() {
  return latestQR;
}

// ── Get connected WhatsApp groups ───────────────────────────────────────────
async function getGroups() {
  if (!isReady || !client) {
    return [];
  }
  try {
    const chats = await client.getChats();
    return chats
      .filter((chat) => chat.isGroup)
      .map((group) => ({
        id: group.id._serialized,
        name: group.name,
      }));
  } catch (err) {
    console.error('[WhatsApp] Error getting groups:', err.message);
    return [];
  }
}

// ── Disconnect the client gracefully ─────────────────────────────────────────
async function disconnect() {
  clearTimeout(reconnectTimer);
  reconnectAttempts = MAX_RECONNECT_ATTEMPTS; // Prevent auto-reconnect
  await destroyClient();
  console.log('[WhatsApp] Disconnected gracefully');
}

module.exports = {
  initClient,
  sendQuestionToGroup,
  getStatus,
  getQR,
  getGroups,
  disconnect,
};
