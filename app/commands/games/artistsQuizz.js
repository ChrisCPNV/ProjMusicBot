const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('musicquiz')
    .setDescription('Guess the genre of a random Spotify artist!'),

  async execute(interaction) {
    await interaction.deferReply();

    // 1. Choose a random artist from a fixed list
    const artistPool = ['Coldplay', 'Drake', 'Taylor Swift', 'Eminem', 'Daft Punk'];
    const randomArtist = artistPool[Math.floor(Math.random() * artistPool.length)];

    // 2. Fetch artist info from Spotify
    const artist = await interaction.client.musicManager.getArtistGenres(randomArtist);
    if (!artist || !artist.genres || artist.genres.length === 0) {
      return interaction.editReply(`⚠️ Couldn't fetch genres for **${randomArtist}**.`);
    }

    // Pick one correct genre
    const correctGenre = artist.genres[0];

    // 3. Build wrong answers (dummy genres)
    const dummyGenres = ['jazz', 'classical', 'metal', 'hip hop', 'blues', 'country'];
    const wrongOptions = dummyGenres
      .filter(g => g.toLowerCase() !== correctGenre.toLowerCase())
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    // Mix correct + wrong answers
    const allOptions = [...wrongOptions, correctGenre].sort(() => 0.5 - Math.random());

    // 4. Create embed
    const embed = new EmbedBuilder()
      .setTitle('🎵 Music Quiz!')
      .setDescription(`Which genre does **${artist.name}** belong to?`)
      .setColor(0x1DB954);

    // 5. Create buttons
    const row = new ActionRowBuilder().addComponents(
      allOptions.map((genre, i) =>
        new ButtonBuilder()
          .setCustomId(`quiz_${i}_${genre === correctGenre}`)
          .setLabel(genre)
          .setStyle(ButtonStyle.Primary)
      )
    );

    const message = await interaction.editReply({ embeds: [embed], components: [row] });

    // 6. Collector to handle button clicks
    const collector = message.createMessageComponentCollector({ time: 15000 }); // 15s

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: "❌ This quiz isn't for you!", flags: 64 }); // ephemeral replacement
      }

      const isCorrect = i.customId.split('_')[2] === 'true';

      if (isCorrect) {
        await i.update({ content: `✅ Correct! **${artist.name}** is often listed as *${correctGenre}*!`, embeds: [], components: [] });
      } else {
        await i.update({ content: `❌ Wrong! The correct genre was **${correctGenre}**.`, embeds: [], components: [] });
      }
      collector.stop();
    });

    collector.on('end', () => {
      if (!collector.ended) {
        message.edit({ content: `⌛ Time's up! The correct genre was **${correctGenre}**.`, embeds: [], components: [] }).catch(() => {});
      }
    });
  },
};
