const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('moods')
    .setDescription('Liste les moods disponibles'),

  async execute(interaction) {
    const moods = interaction.client.playlistManager.listMoods();
    await interaction.reply("🎶 Moods disponibles : " + moods.join(", "));
  },
};
