const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('music')
    .setDescription('Search for a song on Spotify and play its preview')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Song title or artist')
        .setRequired(true)
    ),

  async execute(interaction) {
    const query = interaction.options.getString('query');
    const tracks = await interaction.client.musicManager.searchTracks(query, 5);

    if (!tracks || tracks.length === 0) {
      return interaction.reply(`❌ No tracks found for **${query}**`);
    }

    // Track navigation
    let index = 0;

    const embed = (i) => {
      const t = tracks[i];
      const e = new EmbedBuilder()
        .setTitle(t.title)
        .setURL(t.url)
        .setDescription(`By **${t.artist}**`)
        .setColor(0x1DB954);
      if (t.image) e.setThumbnail(t.image);
      return e;
    };

    const row = (i) => new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('prev')
        .setLabel('⬅️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(i === 0),
      new ButtonBuilder()
        .setCustomId('next')
        .setLabel('➡️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(i === tracks.length - 1),
      new ButtonBuilder()
        .setCustomId('play')
        .setLabel('▶️ Play Preview')
        .setStyle(ButtonStyle.Success)
    );

    const message = await interaction.reply({ embeds: [embed(index)], components: [row(index)], fetchReply: true });

    const collector = message.createMessageComponentCollector({ time: 60000 });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: "❌ You can't use these buttons.", ephemeral: true });
      }

      if (i.customId === 'prev') {
        index--;
        await i.update({ embeds: [embed(index)], components: [row(index)] });
      }

      if (i.customId === 'next') {
        index++;
        await i.update({ embeds: [embed(index)], components: [row(index)] });
      }

      if (i.customId === 'play') {
        const track = tracks[index];

        // Voice channel check
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
          return i.reply({ content: '⚠️ Join a voice channel to play the preview!', ephemeral: true });
        }

        if (!track.preview_url) {
          return i.reply({ content: '⚠️ No preview available for this track!', ephemeral: true });
        }

        const connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: interaction.guild.id,
          adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        const resource = createAudioResource(track.preview_url);

        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => connection.destroy());

        await i.update({ content: `▶️ Playing preview of **${track.title}**`, embeds: [], components: [] });
        collector.stop();
      }
    });

    collector.on('end', () => {
      message.edit({ components: [] }).catch(() => {});
    });
  },
};