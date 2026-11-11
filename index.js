
"use strict";

const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

// ==========================================
// GLOBAL SOLO MINERS - CONFIGURATION
// ==========================================

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const INVITE_URL = "https://discord.gg/y9jU5djHS";
const DATA_FILE = path.join(__dirname, "miners.json");

if (!TOKEN || !TOKEN.trim()) {
  console.error("ERROR: DISCORD_BOT_TOKEN is missing.");
  process.exit(1);
}

// ==========================================
// HASHRATE FUNCTIONS
// Internal calculations use TH/s.
// ==========================================

function parseHashrate(input) {
  const match = String(input).trim().match(
    /^(\d+(?:[.,]\d+)?)\s*(PH|TH|GH|MH|KH|H)\s*(?:\/\s*s)?$/i
  );

  if (!match) return null;

  const amount = Number(match[1].replace(",", "."));
  const unit = match[2].toUpperCase();

  if (!Number.isFinite(amount) || amount <= 0) return null;

  const factors = {
    PH: 1000,
    TH: 1,
    GH: 0.001,
    MH: 0.000001,
    KH: 0.000000001,
    H: 0.000000000001
  };

  return {
    original: String(input).trim(),
    th: amount * factors[unit]
  };
}

function getMinerTH(miner) {
  const stored = Number(miner.hashrateTH);

  if (Number.isFinite(stored) && stored > 0) {
    return stored;
  }

  const parsed = parseHashrate(miner.hashrate || "");
  return parsed ? parsed.th : 0;
}

function formatTH(value) {
  return Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 6
  }) + " TH/s";
}

// ==========================================
// MINER DATABASE
// ==========================================

function loadMiners() {
  if (!fs.existsSync(DATA_FILE)) return [];

  try {
    const data = JSON.parse(
      fs.readFileSync(DATA_FILE, "utf8")
    );

    if (!Array.isArray(data)) {
      throw new Error("miners.json must contain a JSON array.");
    }

    return data;
  } catch (error) {
    console.error("DATABASE ERROR:", error.message);
    throw new Error(
      "Could not read miners.json. Existing data was not overwritten."
    );
  }
}

function saveMiners(miners) {
  const temporaryFile = DATA_FILE + ".tmp";

  fs.writeFileSync(
    temporaryFile,
    JSON.stringify(miners, null, 2),
    "utf8"
  );

  fs.renameSync(temporaryFile, DATA_FILE);
}

function getTotalHashrate(miners) {
  return miners.reduce(
    (sum, miner) => sum + getMinerTH(miner),
    0
  );
}

// ==========================================
// PUBLIC COMMUNITY SEARCH LINKS
// ==========================================

function createSearchLinks(topic) {
  const reddit = encodeURIComponent(topic);
  const discord = encodeURIComponent(
    "site:discord.com/invite " + topic
  );
  const forums = encodeURIComponent(
    topic + " Bitcoin mining forum"
  );

  return [
    `[Reddit search](https://www.reddit.com/search/?q=${reddit})`,
    `[Public Discord search](https://www.google.com/search?q=${discord})`,
    `[Mining forums search](https://www.google.com/search?q=${forums})`,
    `[BitcoinTalk](https://bitcointalk.org/)`
  ];
}

// ==========================================
// DISCORD SLASH COMMANDS
// ==========================================

const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check if GLOBAL SOLO MINERS is online"),

  new SlashCommandBuilder()
    .setName("register")
    .setDescription("Register or update your Bitcoin miner")
    .addStringOption(option =>
      option.setName("miner")
        .setDescription("Miner name and model")
        .setRequired(true))
    .addStringOption(option =>
      option.setName("hashrate")
        .setDescription("Example: 1.2 TH/s or 600 GH/s")
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName("miners")
    .setDescription("Show registered miners"),

  new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Show project statistics"),

  new SlashCommandBuilder()
    .setName("hashrate")
    .setDescription("Show combined registered hashrate"),

  new SlashCommandBuilder()
    .setName("invite")
    .setDescription("Get the community invitation link"),

  new SlashCommandBuilder()
    .setName("opportunities")
    .setDescription("Show public places to find SOLO miners"),

  new SlashCommandBuilder()
    .setName("hunt")
    .setDescription("Find public searches for potential SOLO miners")
    .addStringOption(option =>
      option.setName("topic")
        .setDescription("Example: Bitcoin solo mining")
        .setRequired(false))
].map(command => command.toJSON());

// ==========================================
// DISCORD CLIENT
// ==========================================

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("ready", async () => {
  console.log("GLOBAL SOLO MINERS bot is online.");
  console.log("Bot identity:", client.user.tag);
  console.log("Application ID:", client.application.id);

  try {
    await client.application.commands.set(commands);
    console.log("Slash commands registered successfully.");
  } catch (error) {
    console.error("Slash command registration failed:", error);
  }
});

// ==========================================
// INTERACTION HANDLER
// ==========================================

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    const command = interaction.commandName;

    // PING
    if (command === "ping") {
      return interaction.reply(
        "GLOBAL SOLO MINERS online! +1, bez końca! 🐆"
      );
    }

    // INVITATION
    if (command === "invite") {
      return interaction.reply(
        "**Join GLOBAL SOLO MINERS!**\n" +
        INVITE_URL +
        "\n\nEvery miner counts. +1, bez końca!"
      );
    }

    // COMMUNITY OPPORTUNITIES
    if (command === "opportunities") {
      return interaction.reply(
        "**Public places to find SOLO miners**\n\n" +
        "• Reddit: https://www.reddit.com/search/?q=bitcoin+solo+mining\n" +
        "• Discord: https://www.google.com/search?q=public+Bitcoin+mining+Discord+communities\n" +
        "• BitcoinTalk: https://bitcointalk.org/\n\n" +
        "Check community rules before sharing invitations."
      );
    }

    // COMMUNITY HUNT
    if (command === "hunt") {
      const topic =
        interaction.options.getString("topic") ||
        "Bitcoin solo mining";

      return interaction.reply(
        "**GLOBAL SOLO MINERS — COMMUNITY SEARCH**\n\n" +
        "Topic: **" + topic + "**\n\n" +
        createSearchLinks(topic).join("\n\n") +
        "\n\nOur invitation:\n" +
        INVITE_URL +
        "\n\nThese are public search links, not verified contacts. " +
        "Respect community rules. No spam or unsolicited mass messages."
      );
    }

    // LOAD DATABASE
    const miners = loadMiners();

    // REGISTER OR UPDATE MINER
    if (command === "register") {
      const minerName = interaction.options
        .getString("miner")
        .trim();

      const hashrateInput = interaction.options
        .getString("hashrate");

      if (!minerName || minerName.length > 100) {
        return interaction.reply({
          content: "Miner name must contain 1–100 characters.",
          ephemeral: true
        });
      }

      const parsed = parseHashrate(hashrateInput);

      if (!parsed) {
        return interaction.reply({
          content:
            "Invalid hashrate. Examples: `1.2 TH/s`, `600 GH/s`, `500 MH/s`.",
          ephemeral: true
        });
      }

      const existingIndex = miners.findIndex(miner =>
        miner.userId === interaction.user.id &&
        String(miner.miner).toLowerCase() ===
        minerName.toLowerCase()
      );

      const record = {
        userId: interaction.user.id,
        user: interaction.user.username,
        miner: minerName,
        hashrate: parsed.original,
        hashrateTH: parsed.th,
        updatedAt: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        miners[existingIndex] = record;
      } else {
        miners.push(record);
      }

      saveMiners(miners);

      return interaction.reply(
        `Miner ${existingIndex >= 0 ? "updated" : "registered"}!\n` +
        `Device: **${minerName}**\n` +
        `Hashrate: **${parsed.original}**\n` +
        `Calculated: **${formatTH(parsed.th)}**`
      );
    }

    // REGISTERED MINERS
    if (command === "miners") {
      if (miners.length === 0) {
        return interaction.reply(
          "No miners registered yet. Pantera will be first! 🐆"
        );
      }

      const total = getTotalHashrate(miners);

      const lines = miners.slice(0, 25).map((miner, index) => {
        const owner = miner.userId
          ? ` — <@${miner.userId}>`
          : "";

        const rate = miner.hashrate || "Hashrate not recorded";

        return (
          `${index + 1}. **${miner.miner || "Unnamed miner"}** — ` +
          `${rate}${owner}`
        );
      });

      return interaction.reply(
        "**GLOBAL SOLO MINERS — REGISTERED MINERS**\n" +
        lines.join("\n") +
        `\n\nRegistered devices: **${miners.length}**` +
        `\nCombined hashrate: **${formatTH(total)}**`
      );
    }

    // PROJECT STATISTICS
    if (command === "stats") {
      const total = getTotalHashrate(miners);

      return interaction.reply(
        "**GLOBAL SOLO MINERS**\n" +
        `Registered miners: **${miners.length}**\n` +
        `Combined hashrate: **${formatTH(total)}**\n` +
        "Community motto: **+1, bez końca!** 🐆"
      );
    }

    // COMBINED HASHRATE
    if (command === "hashrate") {
      const total = getTotalHashrate(miners);

      return interaction.reply(
        `**Combined registered hashrate: ${formatTH(total)}**\n` +
        `Registered devices: ${miners.length}`
      );
    }

  } catch (error) {
    console.error("COMMAND ERROR:", error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "An internal error occurred. Please try again later.",
        ephemeral: true
      });
    }
  }
});

// ==========================================
// BOT LOGIN
// ==========================================

client.login(TOKEN).catch(error => {
  console.error("DISCORD LOGIN FAILED:", error.message);
  process.exit(1);
});
