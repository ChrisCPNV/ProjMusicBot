const {SlashCommandBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle,EmbedBuilder}= require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('artistsquiz')
    .setDescription('Guess the genre of a random Spotify artist!'),

  async execute(interaction) {
    await interaction.deferReply();

    // 1. Get random artist from Spotify
    const artist = await interaction.client.musicManager.getRandomArtist();
    if (!artist || !artist.genres || artist.genres.length === 0) {
      return interaction.editReply("⚠️ Couldn't fetch a valid artist with genres. Try again!");
    }

    const correctGenre = artist.genres[0]; // Pick the first genre as "correct"

    // 2. Get possible genres from Spotify
    const allGenres = await interaction.client.musicManager.getAvailableGenres();

    // 3. Pick random wrong answers
    const wrongOptions = allGenres
      .filter(g => g.toLowerCase() !== correctGenre.toLowerCase())
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    // Mix correct + wrong answers
    const options = [...wrongOptions, correctGenre].sort(() => 0.5 - Math.random());

    // 4. Create embed
    const embed = new EmbedBuilder()
      .setTitle('🎵 Artist Quiz!')
      .setDescription(`Which genre does **${artist.name}** belong to?`)
      .setColor(0x1DB954);

    // 5. Create buttons
    const row = new ActionRowBuilder().addComponents(
      options.map((genre, i) =>
        new ButtonBuilder()
          .setCustomId(`quiz_${i}_${genre === correctGenre}`)
          .setLabel(genre)
          .setStyle(ButtonStyle.Primary)
      )
    );

    const message = await interaction.editReply({ embeds: [embed], components: [row] });

    // 6. Collector
    const collector = message.createMessageComponentCollector({ time: 15000 });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: "❌ This quiz isn't for you!", flags: 64 }); // ephemeral
      }

      const isCorrect = i.customId.split('_')[2] === 'true';

      if (isCorrect) {
        await i.update({
          content: `✅ Correct! **${artist.name}** is often listed as *${correctGenre}*!`,
          embeds: [],
          components: []
        });
      } else {
        await i.update({
          content: `❌ Wrong! The correct genre was **${correctGenre}**.`,
          embeds: [],
          components: []
        });
      }
      collector.stop();
    });

    collector.on('end', async (_, reason) => {
      if (reason !== 'messageDelete' && !message.deleted) {
        try {
          await message.edit({
            content: `⌛ Time's up! The correct genre was **${correctGenre}**.`,
            embeds: [],
            components: []
          });
        } catch (_) {}
      }
    });
  },
};
