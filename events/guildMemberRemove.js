const { Events } = require('discord.js');
const { logChannelName } = require('../config.json');
const { loadMemberData, saveMemberData } = require('../utils/dataManager');
const { getOrCreateChannel } = require('../utils/channelManager');
const { createLeaveLogEmbed } = require('../utils/embeds');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member) {
        if (member.user.bot) return;

        const memberData = loadMemberData();
        const userData = memberData[member.id];

        if (userData) {
            const channel = member.guild.channels.cache.get(userData.channelId);
            if (channel) {
                try { await channel.delete('Member left'); } catch (err) { console.error(err); }
            }

            delete memberData[member.id];
            saveMemberData(memberData);

            const logChannel = await getOrCreateChannel(member.guild, logChannelName);
            await logChannel.send({ embeds: [createLeaveLogEmbed(member, userData)] });
        }
    },
};