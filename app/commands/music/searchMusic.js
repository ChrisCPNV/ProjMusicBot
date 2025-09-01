const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('musique')
    .setDescription('Cherche une musique Spotify')
    .addStringOption(option =>
      option.setName('titre')
        .setDescription('Titre de la musique recherchée')
        .setRequired(true)
    ),

  async execute(interaction) {
    const query = interaction.options.getString('titre');
    const tracks = await interaction.client.musicManager.searchTracks(query, 5);

    if (!tracks || tracks.length === 0) {
      return interaction.reply(`Aucun résultat trouvé pour **${query}**`);
    }

    let index = 0;

    const generateEmbed = (i) => {
      const track = tracks[i];
      return new EmbedBuilder()
        .setTitle(track.title)
        .setURL(track.url)
        .setDescription(`**${track.artist}**\nRésultat ${i + 1} sur ${tracks.length}`)
        .setThumbnail(track.image)
        .setColor(0x1DB954); // Spotify green
    };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('prev')
        .setLabel('⬅️')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('next')
        .setLabel('➡️')
        .setStyle(ButtonStyle.Secondary),
    );

    await interaction.reply({
      embeds: [generateEmbed(index)],
      components: [row],
    });

    const collector = interaction.channel.createMessageComponentCollector({
      time: 60_000, // 1 min
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: "Ce n’est pas ton interaction.", ephemeral: true });
      }

      if (i.customId === 'prev') {
        index = (index - 1 + tracks.length) % tracks.length;
      } else if (i.customId === 'next') {
        index = (index + 1) % tracks.length;
      }

      await i.update({
        embeds: [generateEmbed(index)],
        components: [row],
      });
    });

    collector.on('end', async () => {
      await interaction.editReply({ components: [] }); // disable buttons
    });
  },
};
