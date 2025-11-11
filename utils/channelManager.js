const { ChannelType, PermissionsBitField } = require('discord.js');

async function getOrCreateRole(guild, roleName) {
    let role = guild.roles.cache.find((r) => r.name === roleName);
    if (!role) {
        role = await guild.roles.create({ name: roleName, reason: `Role for ${roleName}` });
    }
    return role;
}

async function getOrCreateChannel(guild, channelName, options = {}) {
    let channel = guild.channels.cache.find(c => c.name === channelName);
    if (!channel) {
        channel = await guild.channels.create({
            name: channelName,
            type: options.type || ChannelType.GuildText,
            parent: options.parent || null,
            permissionOverwrites: options.permissionOverwrites || [],
            reason: options.reason || 'Creating channel'
        });
    } else if (options.permissionOverwrites) {
        // Ensure perms are correct on existing channel
        for (const perm of options.permissionOverwrites) {
            await channel.permissionOverwrites.edit(perm.id, perm.allow || perm.deny);
        }
    }
    return channel;
}

module.exports = {
    getOrCreateRole,
    getOrCreateChannel
};