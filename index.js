const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

const fs = require("fs");

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const APP_ID = process.env.DISCORD_APPLICATION_ID;

if (!TOKEN || !APP_ID) {
  throw new Error("Missing Discord credentials in environment variables.");
}

const DATA_FILE = "./miners.json";

function loadMiners() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function saveMiners(miners) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(miners, null, 2));
}

const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check if GLOBAL SOLO MINERS bot is online"),

  new SlashCommandBuilder()
    .setName("register")
    .setDescription("Register your Bitcoin miner")
    .addStringOption(option =>
      option.setName("miner")
        .setDescription("Miner name and model")
        .setRequired(true))
    .addStringOption(option =>
      option.setName("hashrate")
        .setDescription("Hashrate, for example 1.2 TH/s")
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName("miners")
    .setDescription("Show registered miners"),

  new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Show GLOBAL SOLO MINERS statistics"),

  new SlashCommandBuilder()
    .setName("hashrate")
    .setDescription("Show combined registered hashrate")
].map(command => command.toJSON());

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

async function start() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);

  await rest.put(
    Routes.applicationCommands(APP_ID),
    { body: commands }
  );

  console.log("Slash commands registered.");

  await client.login(TOKEN);
}

client.once("ready", () => {
  console.log(`GLOBAL SOLO MINERS online as ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const miners = loadMiners();

  if (interaction.commandName === "ping") {
    return interaction.reply("GLOBAL SOLO MINERS online! +1, bez końca!");
  }

  if (interaction.commandName === "register") {
    const miner = interaction.options.getString("miner");
    const hashrate = interaction.options.getString("hashrate");

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
    if (!miners.length) {
      return interaction.reply("No miners registered yet. Pantera will be first!");
    }

    return interaction.reply(
      miners.map((m, i) =>
        `${i + 1}. ${m.miner} — ${m.hashrate}`
      ).join("\n")
    );
  }

  if (interaction.commandName === "stats") {
    return interaction.reply(
      `GLOBAL SOLO MINERS\nRegistered miners: ${miners.length}`
    );
  }

  if (interaction.commandName === "hashrate") {
    return interaction.reply(
      "Combined hashrate will be calculated after we standardize miner hashrate units."
    );
  }
});

start().catch(console.error);
