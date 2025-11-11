const { Events, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionsBitField } = require('discord.js');
const { rulesChannelName, tempRoleName } = require('../config.json');
const { getOrCreateRole, getOrCreateChannel } = require('../utils/channelManager');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        if (member.user.bot) return;

        try {
            const tempRole = await getOrCreateRole(member.guild, tempRoleName);
            
            const rulesChannel = await getOrCreateChannel(member.guild, rulesChannelName, {
                permissionOverwrites: [
                    { id: member.guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: tempRole.id, allow: [PermissionsBitField.Flags.ViewChannel], deny: [PermissionsBitField.Flags.SendMessages] }
                ]
            });

            await member.roles.add(tempRole);

            const messages = await rulesChannel.messages.fetch({ limit: 10 });
            const botMessage = messages.find(m => m.author.id === member.client.user.id && m.components.length > 0);

            if (!botMessage) {
                const rulesEmbed = new EmbedBuilder()
                    .setTitle(`Welcome to ${member.guild.name}!`)
                    .setDescription('Please read our server rules. By clicking "Accept", you agree to follow them. This will grant you access to the server.')
                    .setColor(0x57F287); // Green

                const acceptButton = new ButtonBuilder()
                    .setCustomId('accept_rules')
                    .setLabel('I Accept the Rules')
                    .setStyle(ButtonStyle.Success);

                const row = new ActionRowBuilder().addComponents(acceptButton);

                await rulesChannel.send({ embeds: [rulesEmbed], components: [row] });
            }

        } catch (error) {
            console.error('Error in guildMemberAdd event:', error);
        }
    },
};