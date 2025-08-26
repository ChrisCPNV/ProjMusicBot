const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('moov')
        .setDescription('Déplace le bot dans un channel vocal')
        .addChannelOption(option =>
            option.setName('input')
                .setDescription('Nom du channel vocal')
                .setRequired(true)),
    
    async execute(interaction) {
        try {
            if (!interaction.guild) {
                return interaction.reply({ 
                    content: '❌ Cette commande ne peut être utilisée que sur un serveur!', 
                    flags: 64
                });
            }

            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                return interaction.reply({ 
                    content: '❌ Vous n\'avez pas la permission d\'utiliser cette commande!', 
                    flags: 64
                });
            }

            const channel = interaction.options.getChannel('input');
            
            if (channel.type !== 2) {
                return interaction.reply({ 
                    content: '❌ Veuillez spécifier un channel vocal valide!', 
                    flags: 64
                });
            }

            // Vérifier les permissions du bot
            const botMember = interaction.guild.members.me;
            if (!botMember.permissionsIn(channel).has(PermissionsBitField.Flags.Connect)) {
                return interaction.reply({ 
                    content: '❌ Je n\'ai pas la permission de me connecter à ce channel!', 
                    flags: 64
                });
            }

            // Vérifier si le bot est déjà connecté à un canal vocal
            const existingConnection = getVoiceConnection(interaction.guildId);
            if (existingConnection) {
                existingConnection.destroy();
            }

            // Rejoindre le nouveau canal vocal avec @discordjs/voice
            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
                selfDeaf: false, // Le bot ne sera pas sourd
                selfMute: false  // Le bot ne sera pas muet
            });

            await interaction.reply({ 
                content: `✅ Bot déplacé dans le channel ${channel.name}!`
            });
            
        } catch (error) {
            console.error('Erreur détaillée:', error);
            await interaction.reply({ 
                content: `❌ Erreur: ${error.message}`, 
                flags: 64
            });
        }
    }
};