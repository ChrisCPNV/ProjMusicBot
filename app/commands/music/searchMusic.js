const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('musique')
    .setDescription('Cherche une musique Spotify par titre')
    .addStringOption(option =>
      option.setName('titre')
        .setDescription('Titre ou mot-clé de la musique recherchée')
        .setRequired(true)
    ),

  async execute(interaction) {
    const titre = interaction.options.getString('titre');

    try {
      // Appel à MusicManager
      const track = await interaction.client.musicManager.searchTrack(titre);

      if (!track) {
        return interaction.reply(`Aucun résultat trouvé pour **${titre}**`);
      }

      // Embed Discord
      const embed = new EmbedBuilder()
        .setTitle(track.title)
        .setURL(track.url)
        .setDescription(`**Artiste(s):** ${track.artist}`)
        .setColor(0x1DB954); // Vert Spotify
      if (track.image) embed.setThumbnail(track.image);

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply(`Erreur lors de la recherche de **${titre}**`);
    }
  },
};
