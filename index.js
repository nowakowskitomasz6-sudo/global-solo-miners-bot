
const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const INVITE_URL = "https://discord.gg/y9jU5djHS";
const DATA_FILE = path.join(__dirname, "miners.json");

if (!TOKEN) {
  throw new Error("Missing DISCORD_BOT_TOKEN environment variable.");
}

function loadMiners() {
  if (!fs.existsSync(DATA_FILE)) return [];

  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    if (!Array.isArray(data)) throw new Error("Invalid miners.json format.");
    return data;
  } catch (error) {
    console.error("Could not load miners.json:", error.message);
    throw new Error("Miner database could not be read. No data was changed.");
  }
}

function saveMiners(miners) {
  const tempFile = DATA_FILE + ".tmp";
  fs.writeFileSync(tempFile, JSON.stringify(miners, null, 2), "utf8");
  fs.renameSync(tempFile, DATA_FILE);
}

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

function formatTH(value) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 6
  }) + " TH/s";
}

function makeSearchLinks(topic) {
  return [
    `[Reddit](https://www.reddit.com/search/?q=${encodeURIComponent(topic)})`,
    `[Discord](https://www.google.com/search?q=${encodeURIComponent("site:discord.com/invite " + topic)})`,
    `[Mining forums](https://www.google.com/search?q=${encodeURIComponent(topic + " Bitcoin mining forum")})`
  ];
}

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
    .setDescription("Show places to find SOLO miners"),

  new SlashCommandBuilder()
    .setName("hunt")
    .setDescription("Search public communities for SOLO miners")
    .addStringOption(option =>
      option.setName("topic")
        .setDescription("Search topic, e.g. Bitcoin solo mining")
        .setRequired(false))
].map(command => command.toJSON());

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("ready", async () => {
  console.log("GLOBAL SOLO MINERS bot is online.");
  console.log(`Bot identity: ${client.user.tag}`);

  try {
    await client.application.commands.set(commands);
    console.log("Slash commands registered successfully.");
  } catch (error) {
    console.error("Command registration failed:", error);
  }
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    const command = interaction.commandName;

    if (command === "ping") {
      return interaction.reply(
        "GLOBAL SOLO MINERS online! +1, bez końca! 🐆"
      );
    }

    if (command === "invite") {
      return interaction.reply(
        `Join GLOBAL SOLO MINERS:\n${INVITE_URL}\n\nEvery miner counts! +1, bez końca!`
      );
    }

    if (command === "opportunities") {
      return interaction.reply(
        "**Public places to find SOLO miners**\n\n" +
        "• Reddit: https://www.reddit.com/search/?q=bitcoin+solo+mining\n" +
        "• Discord: https://www.google.com/search?q=public+Discord+Bitcoin+mining+communities\n" +
        "• BitcoinTalk: https://bitcointalk.org/\n\n" +
        "Check community rules before posting invitations."
      );
    }

    if (command === "hunt") {
      const topic =
        interaction.options.getString("topic") || "Bitcoin solo mining";

      return interaction.reply(
        `**GLOBAL SOLO MINERS — community search**\n` +
        `Topic: **${topic}**\n\n` +
        makeSearchLinks(topic).join("\n\n") +
        `\n\nOur invitation: ${INVITE_URL}\n\n` +
        "_These are search links, not verified contacts. Respect each community's rules; do not spam._"
      );
    }

    const miners = loadMiners();

    if (command === "register") {
      const minerName = interaction.options.getString("miner").trim();
      const input = interaction.options.getString("hashrate");
      const parsed = parseHashrate(input);

      if (!parsed) {
        return interaction.reply({
          content: "Invalid hashrate. Example: `1.2 TH/s` or `600 GH/s`.",
          ephemeral: true
        });
      }

      const index = miners.findIndex(m =>
        m.userId === interaction.user.id &&
        String(m.miner).toLowerCase() === minerName.toLowerCase()
      );

      const record = {
        userId: interaction.user.id,
        user: interaction.user.username,
        miner: minerName,
        hashrate: parsed.original,
        hashrateTH: parsed.th,
        updatedAt: new Date().toISOString()
      };

      if (index >= 0) {
        miners[index] = record;
      } else {
        miners.push(record);
      }

      saveMiners(miners);

      return interaction.reply(
        `Miner ${index >= 0 ? "updated" : "registered"}!\n` +
        `**${minerName}** — ${parsed.original}\n` +
        `Hashrate: **${formatTH(parsed.th)}**`
      );
    }

    if (command === "miners") {
      if (miners.length === 0) {
        return interaction.reply("No miners registered yet. Pantera will be first! 🐆");
      }

      const total = miners.reduce(
        (sum, m) => sum + (Number(m.hashrateTH) || 0), 0
      );

      const lines = miners.slice(0, 25).map((m, i) =>
        `${i + 1}. **${m.miner}** — ${m.hashrate} — <@${m.userId}>`
      );

      return interaction.reply(
        `**Registered miners**\n${lines.join("\n")}` +
        `\n\nDevices: **${miners.length}**` +
        `\nCombined hashrate: **${formatTH(total)}**`
      );
    }

    if (command === "stats" || command === "hashrate") {
      const total = miners.reduce(
        (sum, m) => sum + (Number(m.hashrateTH) || 0), 0
      );

      if (command === "stats") {
        return interaction.reply(
          `**GLOBAL SOLO MINERS**\n` +
          `Registered miners: **${miners.length}**\n` +
          `Combined hashrate: **${formatTH(total)}**\n` +
          `+1, bez końca! 🐆`
        );
      }

      return interaction.reply(
        `**Combined hashrate: ${formatTH(total)}**\n` +
        `Registered devices: ${miners.length}`
      );
    }
  } catch (error) {
    console.error("Command error:", error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "An internal error occurred. Please try again later.",
        ephemeral: true
      });
    }
  }
});

client.login(TOKEN).catch(error => {
  console.error("Discord login failed:", error);
  process.exit(1);
});
