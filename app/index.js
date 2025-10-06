// Require the necessary discord.js classes
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, MessageFlags } = require('discord.js');
const { discord, spotify } = require('../config/config.json');
const PlaylistManager = require('./playlistManager');
const MusicManager = require('./MusicManager');

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Managers
client.playlistManager = new PlaylistManager(spotify.clientId, spotify.clientSecret);
client.musicManager = new MusicManager(spotify.clientId, spotify.clientSecret);

// Load commands
client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
}

// Ready event
client.once(Events.ClientReady, async readyClient => {
  console.log(`✅ Ready! Logged in as ${readyClient.user.tag}`);

  // ✅ Initialize Spotify token when bot starts
  try {
    await client.musicManager.init();
    console.log("🎵 MusicManager initialized with Spotify API");
  } catch (err) {
    console.error("❌ Failed to initialize MusicManager:", err);
  }
});

// Handle interactions
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: '❌ There was an error while executing this command!',
        flags: MessageFlags.Ephemeral
      });
    } else {
      await interaction.reply({
        content: '❌ There was an error while executing this command!',
        flags: MessageFlags.Ephemeral
      });
    }
  }
});

// Log in to Discord
client.login(discord.token);
