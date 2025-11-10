require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

let assignedIDs = new Set();

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('guildMemberAdd', async (member) => {
  try {
    // Generate a unique ID (001–250)
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
    const role = await member.guild.roles.create({
      name: roleName,
      color: 'Blue',
      reason: `Assigned to ${member.user.tag}`,
    });

    await member.roles.add(role);
    await member.send(`👋 Welcome ${member.user.username}! Your unique ID is ${id}.`);

    console.log(`✅ Assigned ${member.user.tag} the role ${roleName}`);
  } catch (error) {
    console.error(error);
  }
});

client.login(process.env.DISCORD_TOKEN);
