const { Events } = require('discord.js');
const { logChannelName, userLogChannelName } = require('../config.json');
const { loadMemberData, saveMemberData } = require('../utils/dataManager');
const { getOrCreateChannel } = require('../utils/channelManager');
const { createGameTagLogEmbed, createFullUserLogEmbed } = require('../utils/embeds');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;

        const memberData = loadMemberData();
        const userData = memberData[message.author.id];

        // Check if user is in their private channel and hasn't set a tag yet
        if (userData && userData.channelId === message.channel.id && !userData.gameTag) {
            
            const gameTag = message.content;
            userData.gameTag = gameTag;
            saveMemberData(memberData);

            await message.reply('Thanks! Your game tag has been set.');

            // Log to main admin-log
            const logChannel = await getOrCreateChannel(message.guild, logChannelName);
            await logChannel.send({ embeds: [createGameTagLogEmbed(message.member, userData)] });

            // Send full profile to the new user-log
            const userLog = await getOrCreateChannel(message.guild, userLogChannelName, {
                 permissionOverwrites: [{ id: message.guild.roles.everyone, deny: [Events.ViewChannel] }]
            });
            await userLog.send({ embeds: [createFullUserLogEmbed(message.member, userData)] });
        }
    },
};