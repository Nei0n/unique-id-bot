const { Client, GatewayIntentBits, Partials, PermissionsBitField } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel],
});

// Store assigned IDs in memory (reset on restart)
const assignedIDs = new Set();

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('guildMemberAdd', async (member) => {
  try {
    // Generate unique ID 001-250
    let id;
    for (let i = 1; i <= 250; i++) {
      const formatted = i.toString().padStart(3, '0');
      if (!assignedIDs.has(formatted)) {
        id = formatted;
        assignedIDs.add(formatted);
        break;
      }
    }

    if (!id) {
      return member.send("Sorry, no more unique IDs available.");
    }

    const roleName = `Member-${id}`;

    // Check if role already exists to avoid duplicates
    let role = member.guild.roles.cache.find(r => r.name === roleName);
    if (!role) {
      role = await member.guild.roles.create({
        name: roleName,
        color: 'Blue',
        reason: `Assign unique ID role to ${member.user.tag}`,
      });
    }

    // Assign role to new member
    await member.roles.add(role);

    // For all text channels, set permissions for this role:
    const textChannels = member.guild.channels.cache.filter(
      c => c.isTextBased() && !c.isThread()
    );

    for (const [channelId, channel] of textChannels) {
      try {
        await channel.permissionOverwrites.edit(role, {
          ViewChannel: true,
          SendMessages: false,
          AddReactions: false,
          ReadMessageHistory: true,
        });
      } catch (err) {
        console.error(`Failed to update permissions for channel ${channel.name}:`, err);
      }
    }

    // DM the member their unique ID
    await member.send(`👋 Welcome ${member.user.username}! Your unique ID is **${id}**. You have been assigned the role **${roleName}**.`);

    console.log(`✅ Assigned ${member.user.tag} the role ${roleName} and updated channel permissions.`);
  } catch (error) {
    console.error('Error in guildMemberAdd event:', error);
  }
});

// Login using your token from environment variable
client.login(process.env.DISCORD_TOKEN);
