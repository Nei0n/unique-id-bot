const fs = require("fs");
const path = require("path");
const {
  Client,
  GatewayIntentBits,
  Partials,
  PermissionsBitField,
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel],
});

// File to store assigned IDs
const DATA_FILE = path.join(__dirname, "assignedIDs.json");

// Load assigned IDs
let assignedIDs = new Set();
if (fs.existsSync(DATA_FILE)) {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    assignedIDs = new Set(data);
    console.log(`📂 Loaded ${assignedIDs.size} assigned IDs from file.`);
  } catch (err) {
    console.error("❌ Failed to load assigned IDs:", err);
  }
}

// Save IDs to file
function saveAssignedIDs() {
  fs.writeFileSync(DATA_FILE, JSON.stringify([...assignedIDs], null, 2));
}

// Create or find admin log channel
async function getLogChannel(guild) {
  let logChannel = guild.channels.cache.find(c => c.name === "admin-log");
  if (!logChannel) {
    logChannel = await guild.channels.create({
      name: "admin-log",
      type: 0, // GUILD_TEXT
      reason: "Private log for join/ID assignment events",
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
      ],
    });
    console.log("🪵 Created private admin log channel: #admin-log");
  }
  return logChannel;
}

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// When a new member joins
client.on("guildMemberAdd", async (member) => {
  try {
    if (member.user.bot) return;

    // Generate unique ID (001–250)
    let id;
    for (let i = 1; i <= 250; i++) {
      const formatted = i.toString().padStart(3, "0");
      if (!assignedIDs.has(formatted)) {
        id = formatted;
        assignedIDs.add(formatted);
        saveAssignedIDs();
        break;
      }
    }

    if (!id) {
      await member.send("Sorry, no more unique IDs available.");
      return;
    }

    const roleName = `Member-${id}`;

    // Create hidden role
    let role = member.guild.roles.cache.find((r) => r.name === roleName);
    if (!role) {
      role = await member.guild.roles.create({
        name: roleName,
        color: "Blue",
        hoist: false, // hidden from member list
        mentionable: false,
        permissions: [],
        reason: `Assign unique hidden ID role to ${member.user.tag}`,
      });
    }

    await member.roles.add(role);

    // Find admin role
    const adminRole = member.guild.roles.cache.find((r) =>
      r.name.toLowerCase().includes("admin")
    );
    const everyoneRole = member.guild.roles.everyone;

    // Restrict all channels
    const channels = member.guild.channels.cache.filter(
      (c) => c.isTextBased() && !c.isThread()
    );

    for (const [, channel] of channels) {
      try {
        await channel.permissionOverwrites.edit(everyoneRole, {
          ViewChannel: false,
        });

        if (adminRole) {
          await channel.permissionOverwrites.edit(adminRole, {
            ViewChannel: true,
            SendMessages: true,
            ManageMessages: true,
          });
        }

        await channel.permissionOverwrites.edit(role, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
          AddReactions: false,
        });
      } catch (err) {
        console.error(
          `⚠️ Failed to set permissions for ${channel.name}:`,
          err.message
        );
      }
    }

    // DM welcome message
    await member.send(
      `👋 Welcome to Arcade GameStore ${member.user.username}!\nYour unique ID is **${id}**.\nYour privacy is protected — only admins can view all members.`
    );

    // Log join event
    const logChannel = await getLogChannel(member.guild);
    if (logChannel) {
      await logChannel.send(
        `🆕 **New Member Joined:** ${member.user.tag}\n🪪 Assigned ID: **${id}**`
      );
    }

    console.log(`✅ ${member.user.tag} joined → Role: ${roleName}`);
  } catch (error) {
    console.error("❌ Error in guildMemberAdd event:", error);
  }
});

// When a member leaves → cleanup
client.on("guildMemberRemove", async (member) => {
  try {
    const idRole = member.roles.cache.find((r) =>
      /^Member-\d{3}$/.test(r.name)
    );

    if (idRole) {
      const id = idRole.name.split("-")[1];

      // Free up the ID
      assignedIDs.delete(id);
      saveAssignedIDs();

      // Delete the role
      await idRole.delete("Member left, cleaning up ID role");

      // Log cleanup
      const logChannel = await getLogChannel(member.guild);
      if (logChannel) {
        await logChannel.send(
          `❌ **Member Left:** ${member.user.tag}\n🧹 Freed ID: **${id}**`
        );
      }

      console.log(`🧹 Cleaned up role and ID for ${member.user.tag} (${id})`);
    }
  } catch (error) {
    console.error("❌ Error cleaning up on member leave:", error);
  }
});

client.login(process.env.DISCORD_TOKEN);
