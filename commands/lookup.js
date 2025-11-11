const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { loadMemberData } = require('../utils/dataManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lookup')
        .setDescription('Looks up a member\'s private channel and game tag.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to look up')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild), // Admin only
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const user = interaction.options.getUser('user');
        const memberData = loadMemberData();
        const userData = memberData[user.id];

        if (!userData) {
            return interaction.editReply('User not found in the member database.');
        }

        const lookupEmbed = new EmbedBuilder()
            .setColor(0xF1C40F) // Yellow color
            .setTitle(`Lookup: ${user.tag}`)
            .addFields(
                { name: 'Assigned ID', value: userData.assignedId, inline: true },
                { name: 'Private Channel', value: `<#${userData.channelId}>`, inline: true },
                { name: 'Game Tag', value: userData.gameTag || 'Not set', inline: false }
            );

        await interaction.editReply({ embeds: [lookupEmbed], ephemeral: true });
    },
};