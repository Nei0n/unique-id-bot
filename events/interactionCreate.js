const { Events, PermissionsBitField, ChannelType } = require('discord.js');
const { logChannelName, categoryName, tempRoleName } = require('../config.json');
const { loadMemberData, saveMemberData, findNextId } = require('../utils/dataManager');
const { getOrCreateChannel, getOrCreateRole } = require('../utils/channelManager');
const { createJoinLogEmbed, createWelcomeEmbed } = require('../utils/embeds');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
            }
        }
        else if (interaction.isButton()) {
            if (interaction.customId === 'accept_rules') {
                await interaction.deferReply({ ephemeral: true });

                const member = interaction.member;
                const guild = interaction.guild;
                const tempRole = await getOrCreateRole(guild, tempRoleName);
                
                if (tempRole) await member.roles.remove(tempRole);

                const memberData = loadMemberData();
                const assignedId = findNextId(memberData);
                
                const category = await getOrCreateChannel(guild, categoryName, { type: ChannelType.GuildCategory });
                const adminRole = guild.roles.cache.find(r => r.permissions.has(PermissionsBitField.Flags.ManageGuild));

                const privateChannel = await getOrCreateChannel(guild, `AGS - ${assignedId}`, {
                    parent: category,
                    permissionOverwrites: [
                        { id: guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] },
                        { id: member.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
                        ...(adminRole ? [{ id: adminRole.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }] : []),
                    ]
                });

                memberData[member.id] = {
                    assignedId: assignedId,
                    channelId: privateChannel.id,
                    gameTag: null
                };
                saveMemberData(memberData);

                const logChannel = await getOrCreateChannel(guild, logChannelName, {
                    permissionOverwrites: [{ id: guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] }]
                });
                
                await logChannel.send({ embeds: [createJoinLogEmbed(member, assignedId, privateChannel)] });
                
                await privateChannel.send({ embeds: [createWelcomeEmbed(member)] });
                await privateChannel.send('To complete your setup, **please reply with the name of the game you play.**');

                await interaction.editReply({ content: `Rules accepted! Your private channel ${privateChannel.toString()} has been created.`, ephemeral: true });
            }
        }
    },
};