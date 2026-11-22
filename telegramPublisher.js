"use strict";

// Optional scheduled announcements for the public SATURN Telegram group.
// Set TELEGRAM_BOT_TOKEN in Railway. TELEGRAM_CHAT_ID can override the default target.
const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const chatId = process.env.TELEGRAM_CHAT_ID?.trim() || "@saturnbtcmining";

if (!token) {
  console.log("Telegram announcements are disabled: set TELEGRAM_BOT_TOKEN in Railway to enable them.");
} else {
  const timezone = "Europe/Warsaw";
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  });

  const posts = {
    "09": "🌍 SATURN BTC MINING\n\nMining solo with Bitaxe or another device? Join the community, register your miner and share its hashrate.\n\nWebsite: http://saturnbtcmining.com\nTelegram: https://t.me/saturnbtcmining\n+1, bez końca!",
    "19": "⛏️ Każda koparka ma znaczenie!\n\nDołącz do SATURN BTC MINING, poznaj społeczność solo minerów i zarejestruj swoją koparkę.\n\nStrona: http://saturnbtcmining.com\nGrupa: https://t.me/saturnbtcmining"
  };

  const sentSlots = new Set();
  let sending = false;

  async function sendTelegramMessage(text) {
    const response = await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true })
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error("Telegram API returned HTTP " + response.status);
    }
  }

  async function checkSchedule() {
    if (sending) return;
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date()).map(part => [part.type, part.value])
    );
    if (parts.minute !== "00" || !posts[parts.hour]) return;

    const slot = parts.year + "-" + parts.month + "-" + parts.day + "-" + parts.hour;
    if (sentSlots.has(slot)) return;

    sending = true;
    try {
      await sendTelegramMessage(posts[parts.hour]);
      sentSlots.add(slot);
      console.log("Telegram announcement sent for " + slot + " (" + timezone + ").");
    } catch (error) {
      console.error("Telegram announcement failed:", error.message);
    } finally {
      sending = false;
    }
  }

  // Check often to handle Europe/Warsaw daylight-saving changes.
  setInterval(checkSchedule, 15_000);
  checkSchedule();
}
"use strict";

// Optional Telegram announcements for GLOBAL SOLO MINERS.
// Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in Railway to enable.
const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

if (!token || !chatId) {
  console.log("Telegram announcements are disabled: set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to enable them.");
} else {
  const timezone = "Europe/Warsaw";
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  });

  const posts = {
    "09": "🌍 GLOBAL SOLO MINERS\n\nEvery solo miner adds to our worldwide community. Register your miner and share its hashrate so we can track the community total.\n\nJoin us: https://discord.gg/y9jU5djHS\n+1, bez końca!",
    "19": "⚡ GLOBAL SOLO MINERS\n\nSmall or large, every miner has a place here. Meet other Bitcoin solo miners, register your device, and follow our combined hashrate.\n\nJoin the community: https://discord.gg/y9jU5djHS"
  };

  const sentSlots = new Set();
  let sending = false;

  async function sendTelegramMessage(text) {
    const response = await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true })
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error("Telegram API returned HTTP " + response.status);
    }
  }

  async function checkSchedule() {
    if (sending) return;
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date()).map(part => [part.type, part.value])
    );
    if (parts.minute !== "00" || !posts[parts.hour]) return;

    const slot = parts.year + "-" + parts.month + "-" + parts.day + "-" + parts.hour;
    if (sentSlots.has(slot)) return;

    sending = true;
    try {
      await sendTelegramMessage(posts[parts.hour]);
      sentSlots.add(slot);
      console.log("Telegram announcement sent for " + slot + " (" + timezone + ").");
    } catch (error) {
      console.error("Telegram announcement failed:", error.message);
    } finally {
      sending = false;
    }
  }

  // Check often to handle the Europe/Warsaw daylight-saving changes.
  setInterval(checkSchedule, 15_000);
  checkSchedule();
}

