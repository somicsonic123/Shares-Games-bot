require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
} = require("discord.js");

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  throw new Error("Missing DISCORD_TOKEN, CLIENT_ID, or GUILD_ID in .env");
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const commands = [
  new SlashCommandBuilder()
    .setName("hello")
    .setDescription("The bot says hello."),
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Checks whether the bot is online."),
  new SlashCommandBuilder()
    .setName("add")
    .setDescription("Adds two numbers.")
    .addNumberOption((option) =>
      option
        .setName("first")
        .setDescription("The first number.")
        .setRequired(true)
    )
    .addNumberOption((option) =>
      option
        .setName("second")
        .setDescription("The second number.")
        .setRequired(true)
    ),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

async function registerCommands() {
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
    body: commands,
  });
  console.log("Slash commands registered.");
}

client.once("ready", (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "hello") {
    await interaction.reply("Hello! I am online.");
  } else if (interaction.commandName === "ping") {
    await interaction.reply("Pong!");
  } else if (interaction.commandName === "add") {
    const first = interaction.options.getNumber("first");
    const second = interaction.options.getNumber("second");
    await interaction.reply(`The answer is ${first + second}.`);
  }
});

async function startBot() {
  await registerCommands();
  await client.login(DISCORD_TOKEN);
}

startBot().catch((error) => {
  console.error("The bot could not start:", error);
});
