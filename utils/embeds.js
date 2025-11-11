const { EmbedBuilder } = require('discord.js');

function createJoinLogEmbed(member, assignedId, channel) {
    return new EmbedBuilder()
        .setColor(0x57F287) // Green
        .setTitle('Member Joined & Accepted Rules')
        .setDescription(`${member.user.tag} has accepted the rules.`)
        .addFields(
            { name: 'User', value: member.toString(), inline: true },
            { name: 'Assigned ID', value: assignedId, inline: true },
            { name: 'Channel', value: channel.toString(), inline: true }
        )
        .setTimestamp();
}

function createLeaveLogEmbed(member, userData) {
    return new EmbedBuilder()
        .setColor(0xE74C3C) // Red
        .setTitle('Member Left')
        .setDescription(`${member.user.tag} has left the server.`)
        .addFields(
            { name: 'User', value: member.user.tag, inline: true },
            { name: 'Freed ID', value: userData.assignedId, inline: true },
            { name: 'Deleted Channel', value: `#AGS - ${userData.assignedId}`, inline: true }
        )
        .setTimestamp();
}

function createWelcomeEmbed(member) {
    return new EmbedBuilder()
        .setColor(0x3498DB) // Blue
        .setTitle(`Welcome, ${member.user.username}!`)
        .setDescription('This is your private channel. Only you and admins can see this.')
        .setTimestamp()
        .setThumbnail(member.guild.iconURL());
}

function createGameTagLogEmbed(member, userData) {
    return new EmbedBuilder()
        .setColor(0x3498DB) // Blue
        .setDescription(`Game tag set for **${member.user.tag}** (ID: ${userData.assignedId})`)
        .addFields({ name: 'Game Tag', value: userData.gameTag });
}

function createFullUserLogEmbed(member, userData) {
    return new EmbedBuilder()
        .setColor(0x9B59B6) // Purple
        .setTitle(`New User Profile: ${member.user.tag}`)
        .addFields(
            { name: 'Username', value: member.user.tag, inline: true },
            { name: 'User ID', value: member.id, inline: true },
            { name: 'Assigned ID', value: userData.assignedId, inline: true },
            { name: 'Private Channel', value: `<#${userData.channelId}>`, inline: false },
            { name: 'Game Tag', value: userData.gameTag, inline: false }
        )
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();
}

function createAnnouncementEmbed(message, guild) {
    return new EmbedBuilder()
        .setColor(0x3498DB) // Blue
        .setTitle('Server Announcement')
        .setDescription(message)
        .setTimestamp()
        .setThumbnail(guild.iconURL());
}

function createCategoryAnnouncementEmbed(gameTag, message, guild) {
    return new EmbedBuilder()
        .setColor(0xF1C40F) // Yellow
        .setTitle(`Announcement for ${gameTag} Players`)
        .setDescription(message)
        .setTimestamp()
        .setThumbnail(guild.iconURL());
}

module.exports = {
    createJoinLogEmbed,
    createLeaveLogEmbed,
    createWelcomeEmbed,
    createGameTagLogEmbed,
    createFullUserLogEmbed,
    createAnnouncementEmbed,
    createCategoryAnnouncementEmbed
};