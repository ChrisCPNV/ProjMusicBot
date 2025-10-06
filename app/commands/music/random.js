const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('random')
    .setDescription('Donne une playlist aléatoire selon un mood'),

  async execute(interaction) {
    const pl = await interaction.client.playlistManager.getRandomPlaylist();

    if (!pl) {
      return interaction.reply(`Impossible de récupérer une playlist aléatoire.`);
    }

    const embed = new EmbedBuilder()
      .setTitle(pl.title)
      .setURL(pl.url)
      .setDescription(`Mood aléatoire : ${pl.mood}`)
      .setColor(0x1DB954);
    if (pl.image) embed.setThumbnail(pl.image);

    await interaction.reply({ embeds: [embed] });
  },
};
