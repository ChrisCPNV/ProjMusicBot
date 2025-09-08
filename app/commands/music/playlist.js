const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('playlist')
    .setDescription('Cherche une playlist Spotify selon un mood')
    .addStringOption(option =>
      option.setName('mood')
        .setDescription('Mood recherché (ex: chill, sport, focus)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const mood = interaction.options.getString('mood');
    const pl = await interaction.client.playlistManager.getPlaylist(mood);

    if (!pl) {
      return interaction.reply(`Aucune playlist trouvée pour le mood **${mood}**`);
    }

    const embed = new EmbedBuilder()
      .setTitle(pl.title)
      .setURL(pl.url)
      .setDescription(`Mood: ${pl.mood}`)
      .setColor(0x1DB954); // Vert Spotify
    if (pl.image) embed.setThumbnail(pl.image);

    await interaction.reply({ embeds: [embed] });
  },
};
