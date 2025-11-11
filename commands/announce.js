const { SlashCommandBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const { categoryName, logChannelName } = require('../config.json');
const { createAnnouncementEmbed } = require('../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Sends an announcement to all member channels.')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message to announce')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild), // Admin only
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const message = interaction.options.getString('message');
        const guild = interaction.guild;

        const category = guild.channels.cache.find(
            (c) => c.name === categoryName && c.type === ChannelType.GuildCategory
        );

        if (!category) {
            return interaction.editReply('Error: Member category not found.');
        }

        const memberChannels = guild.channels.cache.filter(
            (c) => c.parentId === category.id && c.type === ChannelType.GuildText && c.name !== logChannelName
        );

        if (memberChannels.size === 0) {
            return interaction.editReply('No member channels found to send to.');
        }

        const announcementEmbed = createAnnouncementEmbed(message, guild);

        let count = 0;
        for (const channel of memberChannels.values()) {
            try {
                await channel.send({ embeds: [announcementEmbed] });
                count++;
            } catch (err) {
                console.error(`Failed to send to #${channel.name}:`, err);
            }
        }

        await interaction.editReply(`Announcement sent to ${count} member channels.`);
    },
};