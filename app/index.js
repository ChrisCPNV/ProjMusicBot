// ==============================
//      Modules
// ==============================
const { Client, GatewayIntentBits, Collection, Events, MessageFlags } = require('discord.js');
const { Manager } = require('erela.js');
const fs = require('fs');
const path = require('path');
const MusicManager = require('./MusicManager');
// ==============================
//      Config
// ==============================
const config = require('../config/config.json');
const spotify = { clientId: config.spotify.clientId, clientSecret: config.spotify.clientSecret };

// ==============================
//      Client Discord
// ==============================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});
client.musicManager = new MusicManager(spotify.clientId, spotify.clientSecret);
// ==============================
//      Erela.js Manager
// ==============================
const manager = new Manager({
    nodes: [
        {
            host: '127.0.0.1',
            port: 2333,
            password: config.lavalink.password,
            secure: false,
            identifier: 'MainNode',
            version: 'v4'
        }
    ],
    send(id, payload) {
        const guild = client.guilds.cache.get(id);
        if (guild) guild.shard.send(payload);
    }
});
client.manager = manager;

// ==============================
//      Managers Spotify 
// ==============================
   client.musicManager = new MusicManager(spotify.clientId, spotify.clientSecret);

// ==============================
//      Commandes
// ==============================
client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
if (fs.existsSync(foldersPath)) {
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
                console.warn(`[WARNING] La commande ${filePath} est invalide.`);
            }
        }
    }
}

// ==============================
//      Événements Discord
// ==============================
client.once(Events.ClientReady, async () => {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
    manager.init(client.user.id);
    try {
        await client.musicManager.init();
        console.log("🎵 MusicManager Spotify initialisé");
    } catch (err) {
        console.error("❌ Impossible d'initialiser MusicManager:", err);
    }

});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction, manager);
    } catch (error) {
        console.error('❌ Erreur commande:', error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: '❌ Une erreur est survenue lors de l\'exécution de la commande.',
                flags: MessageFlags.Ephemeral
            });
        } else {
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de l\'exécution de la commande.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
});

// ==============================
//      Erela.js Events
// ==============================
manager.on('nodeConnect', node => {
    console.log(`🔗 Node ${node.options.identifier || node.options.host} connecté avec succès !`);
});

manager.on('nodeError', (node, error) => {
    console.error(`❌ Erreur node ${node.options.identifier || node.options.host}:`, error);
});

manager.on('trackStart', (player, track) => {
    const channel = client.channels.cache.get(player.textChannel);
    if (channel) channel.send(`🎵 Lecture en cours : **${track.title}**`);
});

manager.on('queueEnd', player => {
    const channel = client.channels.cache.get(player.textChannel);
    if (channel) channel.send('✅ La file est terminée !');
    player.destroy();
});

// ==============================
//      Discord Raw Event
// ==============================
client.on('raw', d => manager.updateVoiceState(d));

// ==============================
//      Connexion du bot
// ==============================
client.login(config.discord.token);
