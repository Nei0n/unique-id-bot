const fs = require("fs");
const path = require("path");
const {
  Client,
  GatewayIntentBits,
  Partials,
  PermissionsBitField,
  ChannelType,
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel],
});

// File to store assigned IDs (Brought back from your original code)
const DATA_FILE = path.join(__dirname, "assignedIDs.json");

// Load assigned IDs (Brought back from your original code)
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

// Save IDs to file (Brought back from your original code)
function saveAssignedIDs() {
  fs.writeFileSync(DATA_FILE, JSON.stringify([...assignedIDs], null, 2));
}

// Create or find admin log channel (No change)
async function getLogChannel(guild) {
  let logChannel = guild.channels.cache.find(c => c.name === "admin-log");
  if (!logChannel) {
    logChannel = await guild.channels.create({
      name: "admin-log",
      type: ChannelType.GuildText,
      reason: "Private log for join/leave events",
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

// Helper to find or create the private category (No change)
async function getMemberCategory(guild) {
    let category = guild.channels.cache.find(
        (c) => c.name === "Member Channels" && c.type === ChannelType.GuildCategory
    );
    if (!category) {
        category = await guild.channels.create({
            name: "Member Channels",
            type: ChannelType.GuildCategory,
            reason: "Category for private member channels",
            permissionOverwrites: [
                {
                    id: guild.roles.everyone,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
            ],
        });
        console.log("📂 Created private 'Member Channels' category.");
    }
    return category;
}

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// ### REVISED: When a new member joins ###
client.on("guildMemberAdd", async (member) => {
  try {
    if (member.user.bot) return;

    // Generate unique ID (001+)
    // We will set the limit high (e.g., 999) since we are not limited by roles
    let id;
    for (let i = 1; i <= 9999; i++) {
      const formatted = i.toString().padStart(3, "0");
      if (!assignedIDs.has(formatted)) {
        id = formatted;
        assignedIDs.add(formatted);
        saveAssignedIDs();
        break;
      }
    }

    if (!id) {
      // This will only happen if you have 999 members
      await member.send("Sorry, the server is currently full.");
      return;
    }

    // Use your requested channel name format
    const channelName = `AGS - ${id}`;

    // Find admin role and @everyone role
    const adminRole = member.guild.roles.cache.find((r) =>
      r.name.toLowerCase().includes("admin")
    );
    const everyoneRole = member.guild.roles.everyone;

    // Get the private category
    const category = await getMemberCategory(member.guild);

    // Create a NEW private channel for this member
    const privateChannel = await member.guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: category,
        reason: `Private channel for ${member.user.tag} (ID: ${id})`,
        
        permissionOverwrites: [
            {
                id: everyoneRole,
                deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
                // Add the new member DIRECTLY by their ID
                id: member.id, 
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory,
                ],
            },
            // Add admin role perms if it exists
            ...(adminRole ? [{
                id: adminRole,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ManageMessages,
                ],
            }] : []),
        ],
    });

    // DM welcome message
    await member.send(
      `👋 Welcome to Arcade GameStore ${member.user.username}!\nYour unique ID is **${id}**.\nWe have created a private channel for you.`
    );

    // Send a welcome message in their new private channel
    await privateChannel.send(`Welcome, ${member.user.toString()}! This is your private channel. Only you and admins can see this.`);

    // Log join event
    const logChannel = await getLogChannel(member.guild);
    if (logChannel) {
      await logChannel.send(
        `🆕 **New Member Joined:** ${member.user.tag}\n🪪 Assigned ID: **${id}**\n🔒 Created Channel: ${privateChannel.toString()}`
      );
    }

    console.log(`✅ ${member.user.tag} joined → ID: ${id}, Channel: #${channelName}`);
  } catch (error) {
    console.error("❌ Error in guildMemberAdd event:", error);
  }
});

// ### REVISED: When a member leaves → cleanup ###
client.on("guildMemberRemove", async (member) => {
  try {
    if (member.user.bot) return;

    // Find the channel this member had permission to see
    const channel = member.guild.channels.cache.find(c =>
      c.permissionOverwrites.cache.has(member.id) &&
      c.name.startsWith("AGS - ") // Make sure it's one of our channels
    );

    if (channel) {
      // Get the ID from the channel name (e.g., "AGS - 001" -> "001")
      const id = channel.name.split(" - ")[1];

      // Free up the ID
      if (id) {
        assignedIDs.delete(id);
        saveAssignedIDs();
      }

      // Delete the private channel
      await channel.delete("Member left, cleaning up private channel");

      // Log cleanup
      const logChannel = await getLogChannel(member.guild);
      if (logChannel) {
        await logChannel.send(
          `❌ **Member Left:** ${member.user.tag}\n🧹 Freed ID: **${id}**\n🗑️ Deleted channel: #${channel.name}`
        );
      }
      console.log(`🧹 Cleaned up channel and ID for ${member.user.tag} (${id})`);
    }
  } catch (error) {
    console.error("❌ Error cleaning up on member leave:", error);
  }
});

client.login(process.env.DISCORD_TOKEN);
  
