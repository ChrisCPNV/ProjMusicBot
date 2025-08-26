const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('joel')
        .setDescription('secret'),
    async execute(interaction) {
        await interaction.reply('Joel est un gambling addict')
    },
};