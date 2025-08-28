const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior, AudioPlayerStatus } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('canard')
        .setDescription('Fait un bruit de canard dans le channel vocal'),
    
    async execute(interaction) {
        let hasReplied = false;

        try {
            const member = interaction.member;
            
            if (!member.voice?.channel) {
                hasReplied = true;
                return await interaction.reply({ 
                    content: '❌ Vous devez être dans un channel vocal!', 
                    flags: 64
                });
            }

            const targetChannel = member.voice.channel;

            // Vérifier les permissions du bot
            const botMember = interaction.guild.members.me;
            if (!botMember.permissionsIn(targetChannel).has(PermissionsBitField.Flags.Connect) || 
                !botMember.permissionsIn(targetChannel).has(PermissionsBitField.Flags.Speak)) {
                hasReplied = true;
                return await interaction.reply({ 
                    content: '❌ Permissions insuffisantes!', 
                    flags: 64
                });
            }

            await interaction.deferReply();
            hasReplied = true;

            // Rejoindre le channel vocal
            const connection = joinVoiceChannel({
                channelId: targetChannel.id,
                guildId: targetChannel.guild.id,
                adapterCreator: targetChannel.guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false
            });

            // Créer le player audio
            const player = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Stop,
                },
            });

            // Chemin vers un fichier audio local
            const soundPath = path.join(__dirname, 'canard.mp3');
            
            // Vérifier si le fichier existe
            if (!fs.existsSync(soundPath)) {
                connection.destroy();
                return await interaction.editReply({ 
                    content: '❌ Fichier audio non trouvé! Placez un fichier canard.mp3 dans le même dossier que cette commande.'
                });
            }

            // Créer la ressource audio à partir du fichier local
            const resource = createAudioResource(soundPath);

            // Connecter et jouer
            connection.subscribe(player);
            player.play(resource);
            

            player.on('error', (error) => {
                console.error('Erreur audio:', error);
                connection.destroy();
                interaction.editReply({ 
                    content: '❌ Erreur de lecture audio! (FFmpeg requis)'
                });
            });

            await interaction.editReply({ 
                content: `🦆 **COIN COIN!** Dans ${targetChannel.name}!`
            });

        } catch (error) {
            console.error('Erreur générale:', error);
            
            if (!hasReplied) {
                await interaction.reply({ 
                    content: '❌ Erreur: ' + error.message, 
                    flags: 64
                });
            } else if (interaction.deferred) {
                await interaction.editReply({ 
                    content: '❌ Erreur FFmpeg! Installez FFmpeg sur votre système.'
                });
            }
        }
    }
};