const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playsound')
        .setDescription('Joue un morceau depuis SoundCloud')
        .addStringOption(option =>
            option.setName('url')
                  .setDescription('Lien SoundCloud du morceau')
                  .setRequired(true)
        ),
    async execute(interaction, manager) {
        const url = interaction.options.getString('url');

        // Vérifie que l'utilisateur est dans un channel vocal
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            return interaction.reply({ content: '❌ Tu dois être dans un salon vocal pour jouer de la musique.', ephemeral: true });
        }

        // Vérifie le lien SoundCloud
        if (!/soundcloud\.com/i.test(url)) {
            return interaction.reply({ content: '⚠️ Seuls les liens SoundCloud sont supportés.', ephemeral: true });
        }

        // Cherche le track sur le node disponible
        let res;
        try {
            res = await manager.search(url, interaction.user);
        } catch (err) {
            console.error(err);
            return interaction.reply({ content: '❌ Impossible de récupérer le track.', ephemeral: true });
        }

        if (!res || !res.tracks.length) {
            return interaction.reply({ content: '❌ Aucun résultat trouvé pour ce lien SoundCloud.', ephemeral: true });
        }

        // Récupère ou crée le player
        const player = manager.create({
            guild: interaction.guild.id,
            voiceChannel: voiceChannel.id,
            textChannel: interaction.channel.id,
            selfDeafen: true,
        });

        // Connecte le player si nécessaire
        if (player.state !== 'CONNECTED') await player.connect();

        // Ajoute le track à la queue et joue si ce n'est pas déjà le cas
        player.queue.add(res.tracks[0]);
        if (!player.playing && !player.paused && !player.queue.size) {
            await player.play();
        }

        return interaction.reply(`🎵 Ajouté à la file : **${res.tracks[0].title}**`);
    },
};
