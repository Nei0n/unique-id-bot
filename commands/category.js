const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const { loadMemberData } = require('../utils/dataManager');
const { createCategoryAnnouncementEmbed } = require('../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('category')
        .setDescription('Sends an announcement to a specific game category.')
        .addStringOption(option =>
            option.setName('game_tag')
                .setDescription('The game tag to send this to (e.g., "pubg")')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message to announce')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild), // Admin only
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const gameTag = interaction.options.getString('game_tag').toLowerCase();
        const message = interaction.options.getString('message');
        const guild = interaction.guild;

        const memberData = loadMemberData();
        const matchingChannels = [];

        for (const userId in memberData) {
            const userData = memberData[userId];
            // Check if gameTag exists and includes the search term (case-insensitive)
            if (userData.gameTag && userData.gameTag.toLowerCase().includes(gameTag)) {
                matchingChannels.push(userData.channelId);
            }
        }

        if (matchingChannels.length === 0) {
            return interaction.editReply(`No members found with the game tag "${gameTag}".`);
        }

        const announcementEmbed = createCategoryAnnouncementEmbed(gameTag, message, guild);

        let count = 0;
        for (const channelId of matchingChannels) {
            try {
                const channel = await guild.channels.fetch(channelId);
                await channel.send({ embeds: [announcementEmbed] });
                count++;
            } catch (err) {
                console.error(`Failed to send to channel ${channelId}:`, err);
            }
        }

        await interaction.editReply(`Announcement sent to ${count} members with the "${gameTag}" tag.`);
    },
};