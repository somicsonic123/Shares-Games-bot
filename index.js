require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
} = require("discord.js");

const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  NoSubscriberBehavior,
  AudioPlayerStatus,
  getVoiceConnection,
} = require("@discordjs/voice");

const ytdl = require("ytdl-core");

const {
  DISCORD_TOKEN,
  CLIENT_ID,
  GUILD_ID,
  OWNER_ID,
} = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID || !OWNER_ID) {
  throw new Error(
    "Missing DISCORD_TOKEN, CLIENT_ID, GUILD_ID, or OWNER_ID in .env"
  );
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const isOwner = (userId) => userId === OWNER_ID;
const guildMusic = new Map();

function getGuildState(guildId) {
  if (!guildMusic.has(guildId)) {
    guildMusic.set(guildId, {
      player: createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Pause,
        },
      }),
      queue: [],
      connection: null,
      playing: false,
      nowPlaying: null,
    });
  }

  return guildMusic.get(guildId);
}

function isValidYouTubeUrl(input) {
  return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(input);
}

async function playNext(guildId) {
  const state = guildMusic.get(guildId);

  if (!state || state.queue.length === 0) {
    state.playing = false;
    state.nowPlaying = null;

    const connection = getVoiceConnection(guildId);
    if (connection) {
      connection.destroy();
    }

    guildMusic.delete(guildId);
    return;
  }

  const url = state.queue[0];

  try {
    const info = await ytdl.getBasicInfo(url);
    const title = info.videoDetails.title;
    state.nowPlaying = title;
    const stream = ytdl.downloadFromInfo(info, {
      filter: "audioonly",
      quality: "highestaudio",
      highWaterMark: 1 << 25,
    });

    const resource = createAudioResource(stream);
    state.player.play(resource);

    if (state.connection) {
      state.connection.subscribe(state.player);
    }

    state.player.once(AudioPlayerStatus.Idle, () => {
      state.queue.shift();
      state.nowPlaying = null;
      if (state.queue.length > 0) {
        playNext(guildId);
      } else {
        state.playing = false;
        const connection = getVoiceConnection(guildId);
        if (connection) {
          connection.destroy();
        }
        guildMusic.delete(guildId);
      }
    });
  } catch (error) {
    console.error("Unable to play YouTube track:", error);
    state.queue.shift();
    if (state.queue.length > 0) {
      playNext(guildId);
    } else {
      state.playing = false;
      const connection = getVoiceConnection(guildId);
      if (connection) {
        connection.destroy();
      }
      guildMusic.delete(guildId);
    }
  }
}

const commands = [
  new SlashCommandBuilder()
    .setName("hello")
    .setDescription("The bot says hello."),
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Checks whether the bot is online."),
  new SlashCommandBuilder()
    .setName("owner")
    .setDescription("Shows who the bot owner is."),
  new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a YouTube video in your voice channel.")
    .addStringOption((option) =>
      option
        .setName("url")
        .setDescription("A valid YouTube URL")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Pause the current track."),
  new SlashCommandBuilder()
    .setName("resume")
    .setDescription("Resume the current track."),
  new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skip the current track."),
  new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Stop music and leave the voice channel."),
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
  console.log(`Bot owner ID: ${OWNER_ID}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "hello") {
    await interaction.reply(
      isOwner(interaction.user.id)
        ? `Hello, owner <@${interaction.user.id}>!`
        : "Hello! I am online."
    );
    return;
  }

  if (interaction.commandName === "ping") {
    await interaction.reply("Pong!");
    return;
  }

  if (interaction.commandName === "owner") {
    await interaction.reply(
      `The bot owner is <@${OWNER_ID}> (${OWNER_ID}).`
    );
    return;
  }

  if (interaction.commandName === "play") {
    const url = interaction.options.getString("url");

    if (!interaction.member.voice?.channel) {
      await interaction.reply("Join a voice channel before using /play.");
      return;
    }

    if (!isValidYouTubeUrl(url)) {
      await interaction.reply("Please provide a valid YouTube URL.");
      return;
    }

    const state = getGuildState(interaction.guildId);
    const channel = interaction.member.voice.channel;

    if (!state.connection) {
      state.connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: interaction.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });
    }

    state.queue.push(url);

    if (!state.playing) {
      state.playing = true;
      const info = await ytdl.getBasicInfo(url);
      await interaction.reply(`Playing: ${info.videoDetails.title}`);
      await playNext(interaction.guildId);
    } else {
      await interaction.reply("Added to the queue.");
    }
    return;
  }

  if (interaction.commandName === "pause") {
    const state = guildMusic.get(interaction.guildId);
    if (!state || !state.player) {
      await interaction.reply("Nothing is playing right now.");
      return;
    }

    state.player.pause();
    await interaction.reply("Paused the music.");
    return;
  }

  if (interaction.commandName === "resume") {
    const state = guildMusic.get(interaction.guildId);
    if (!state || !state.player) {
      await interaction.reply("Nothing is playing right now.");
      return;
    }

    state.player.unpause();
    await interaction.reply("Resumed the music.");
    return;
  }

  if (interaction.commandName === "skip") {
    const state = guildMusic.get(interaction.guildId);
    if (!state || state.queue.length === 0) {
      await interaction.reply("There is nothing to skip.");
      return;
    }

    state.queue.shift();
    if (state.queue.length === 0) {
      state.player.stop();
      const connection = getVoiceConnection(interaction.guildId);
      if (connection) {
        connection.destroy();
      }
      guildMusic.delete(interaction.guildId);
      await interaction.reply("Skipped the current track and cleared the queue.");
    } else {
      state.player.stop();
      await interaction.reply("Skipped the current track.");
      await playNext(interaction.guildId);
    }
    return;
  }

  if (interaction.commandName === "stop") {
    const state = guildMusic.get(interaction.guildId);
    if (!state) {
      await interaction.reply("The bot is not currently playing music.");
      return;
    }

    state.queue = [];
    state.player.stop();

    const connection = getVoiceConnection(interaction.guildId);
    if (connection) {
      connection.destroy();
    }

    guildMusic.delete(interaction.guildId);
    await interaction.reply("Stopped the music and left the voice channel.");
    return;
  }

  if (interaction.commandName === "add") {
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
