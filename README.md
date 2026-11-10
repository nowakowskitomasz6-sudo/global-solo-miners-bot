# GLOBAL SOLO MINERS

Global community of independent Bitcoin solo miners.
const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder
} = require("discord.js");

const fs = require("fs");

const TOKEN = process.env.DISCORD_BOT_TOKEN?.trim();

if (!TOKEN) {
  throw new Error("Missing DISCORD_BOT_TOKEN");
}

const DATA_FILE = "./miners.json";

function loadMiners() {
  let miners = [];

  if (fs.existsSync(DATA_FILE)) {
    try {
      miners = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      if (!Array.isArray(miners)) miners = [];
    } catch {
      miners = [];
    }
  }

  // Pantera – pierwszy miner GLOBAL SOLO MINERS
  const hasPantera = miners.some(m =>
    String(m.miner).toLowerCase().includes("pantera")
  );

  if (!hasPantera) {
    miners.unshift({
      user: "GLOBAL SOLO MINERS",
      miner: "Pantera – Bitaxe Gamma 601",
      hashrate: "1.2 TH/s"
    });
    saveMiners(miners);
  }

  return miners;
}

function saveMiners(miners) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(miners, null, 2));
}

// Przeliczanie wszystkich mocy na TH/s
function toTH(value) {
  const match = String(value)
    .trim()
    .match(/^(\d+(?:[.,]\d+)?)\s*(EH|PH|TH|GH|MH|KH)?\s*(?:\/s)?$/i);

  if (!match) return null;

  const number = Number(match[1].replace(",", "."));
  const unit = (match[2] || "TH").toUpperCase();

  const factors = {
    EH: 1000000,
    PH: 1000,
    TH: 1,
    GH: 0.001,
    MH: 0.000001,
    KH: 0.000000001
  };

  return number * factors[unit];
}

function formatHashrate(th) {
  if (th >= 1000000) return `${(th / 1000000).toFixed(3)} PH/s`;
  if (th >= 1000) return `${(th / 1000).toFixed(3)} PH/s`;
  return `${th.toFixed(3)} TH/s`;
}

function getTotalHashrate(miners) {
  return miners.reduce((total, miner) => {
    const value = toTH(miner.hashrate);
    return total + (value ?? 0);
  }, 0);
}

const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check if GLOBAL SOLO MINERS is online"),

  new SlashCommandBuilder()
    .setName("register")
    .setDescription("Register your Bitcoin miner")
    .addStringOption(option =>
      option.setName("miner")
        .setDescription("Miner name and model")
        .setRequired(true))
    .addStringOption(option =>
      option.setName("hashrate")
        .setDescription("Example: 1.2 TH/s")
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName("miners")
    .setDescription("Show all miners and combined hashrate"),

  new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Show GLOBAL SOLO MINERS statistics"),

  new SlashCommandBuilder()
    .setName("hashrate")
    .setDescription("Show combined mining power")
].map(command => command.toJSON());

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("ready", async () => {
  console.log(`GLOBAL SOLO MINERS online as ${client.user.tag}`);

  try {
    await client.application.commands.set(commands);
    console.log("Commands registered successfully.");
  } catch (error) {
    console.error("COMMAND REGISTRATION FAILED:", error.message);
  }
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    const miners = loadMiners();
    const total = getTotalHashrate(miners);

    if (interaction.commandName === "ping") {
      return interaction.reply(
        "GLOBAL SOLO MINERS online! +1, bez końca!"
      );
    }

    if (interaction.commandName === "register") {
      const miner = interaction.options.getString("miner");
      const hashrate = interaction.options.getString("hashrate");

      if (toTH(hashrate) === null) {
        return interaction.reply({
          content: "Invalid hashrate. Example: 1.2 TH/s",
          ephemeral: true
        });
      }

      miners.push({
        user: interaction.user.username,
        miner,
        hashrate
      });

      saveMiners(miners);

      return interaction.reply(
        `Miner registered: **${miner}** — ${hashrate}`
      );
    }

    if (interaction.commandName === "miners") {
      const currentMiners = loadMiners();
      const combined = getTotalHashrate(currentMiners);

      const list = currentMiners.map((m, i) =>
        `${i + 1}. **${m.miner}** — ${m.hashrate}`
      ).join("\n");

      return interaction.reply({
        content:
          `🌍 **GLOBAL SOLO MINERS**\n` +
          `⛏️ Registered miners: ${currentMiners.length}\n\n` +
          `${list}\n\n` +
          `⚡ **Combined hashrate: ${formatHashrate(combined)}**\n` +
          `+1, bez końca!`,
        allowedMentions: { parse: [] }
      });
    }

    if (interaction.commandName === "stats") {
      return interaction.reply(
        `🌍 GLOBAL SOLO MINERS\n` +
        `Registered miners: ${miners.length}\n` +
        `Combined hashrate: ${formatHashrate(total)}`
      );
    }

    if (interaction.commandName === "hashrate") {
      return interaction.reply(
        `⚡ Combined hashrate: **${formatHashrate(total)}**`
      );
    }

  } catch (error) {
    console.error("COMMAND ERROR:", error.message);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "An internal error occurred.",
        ephemeral: true
      });
    }
  }
});

client.login(TOKEN).catch(error => {
  console.error("DISCORD LOGIN FAILED:", error.message);
  process.exit(1);
});


## Mission
Connect solo miners worldwide and track their combined hashrate.

## First miner
Pantera – Bitaxe Gamma 601.

+1, bez końca!
