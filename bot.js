// Change is on this line: added 'Events'
const {
  Client,
  Events, // <-- ADDED THIS
  GatewayIntentBits,
  Partials,
  PermissionsBitField,
  ChannelType,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

// --- Configuration ---
const CONFIG = {
  logChannelName: "admin-log",
  categoryName: "Member Channels",
  rulesChannelName: "rules",
  tempRoleName: "Pending", // Role for new members
  tempRoleDuration: 300000, // 5 minutes in milliseconds
  announcementChannelNames: ["updates", "announcement"], // Channels to forward FROM
};
// ---------------------

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

const DATA_FILE = path.join(__dirname, "assignedIDs.json");

// Load assigned IDs
let assignedIDs = new Set();
if (fs.existsSync(DATA_FILE)) {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    assignedIDs = new Set(data);
    console.log(`Loaded ${assignedIDs.size} assigned IDs from file.`);
  } catch (err) {
    console.error("Failed to load assigned IDs:", err);
  }
}

// Save IDs to file
function saveAssignedIDs() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify([...assignedIDs], null, 2));
  } catch (err) {
    console.error("Failed to save assigned IDs:", err);
  }
}

// --- Helper Functions ---

async function getLogChannel(guild) {
  let logChannel = guild.channels.cache.find(
    (c) => c.name === CONFIG.logChannelName
  );
  if (!logChannel) {
    try {
      logChannel = await guild.channels.create({
        name: CONFIG.logChannelName,
        type: ChannelType.GuildText,
        reason: "Private log for join/leave events",
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
        ],
      });
      console.log(`Created private log channel: #${CONFIG.logChannelName}`);
    } catch (err) {
      console.error("Could not create log channel:", err);
    }
  }
  return logChannel;
}

async function getMemberCategory(guild) {
  let category = guild.channels.cache.find(
    (c) =>
      c.name === CONFIG.categoryName && c.type === ChannelType.GuildCategory
  );
  if (!category) {
    category = await guild.channels.create({
      name: CONFIG.categoryName,
      type: ChannelType.GuildCategory,
      reason: "Category for private member channels",
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
      ],
    });
    console.log(`Created private category: "${CONFIG.categoryName}"`);
  }
  return category;
}

async function getOrCreateRole(guild, roleName) {
  let role = guild.roles.cache.find((r) => r.name === roleName);
  if (!role) {
    role = await guild.roles.create({
      name: roleName,
      reason: "Temporary role for new members",
    });
    console.log(`Created role: @${roleName}`);
  }
  return role;
}

// --- Bot Events ---

// Change is on this line: "ready" became Events.ClientReady
client.once(Events.ClientReady, () => { // <-- CHANGED THIS
  console.log(`Logged in as ${client.user.tag}`);
});

/**
 * NEW: Handle new member joining
 * 1. Give temporary role
 * 2. Set 5-minute timer
 * 3. After timer, remove role and create private channel
 */
client.on("guildMemberAdd", async (member) => {
  if (member.user.bot) return;

  try {
    // 1. Find or create the temporary role
    const tempRole = await getOrCreateRole(member.guild, CONFIG.tempRoleName);

    // 2. Find or create the rules channel and set its permissions
    let rulesChannel = member.guild.channels.cache.find(
      (c) => c.name === CONFIG.rulesChannelName
    );
    if (!rulesChannel) {
      rulesChannel = await member.guild.channels.create({
        name: CONFIG.rulesChannelName,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: member.guild.roles.everyone, // Hide from @everyone
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: tempRole.id, // Show *only* to temp role
            allow: [PermissionsBitField.Flags.ViewChannel],
            deny: [PermissionsBitField.Flags.SendMessages], // Read-only
          },
        ],
      });
      console.log(`Created #${CONFIG.rulesChannelName}`);
    }

    // 3. Add the role to the member
    await member.roles.add(tempRole);
    await member.send(
      `👋 Welcome to Arcade GameStore, ${member.user.username}!\n` +
      `Please read the server rules in the #${CONFIG.rulesChannelName} channel. ` +
      `You will get access to your private channel in 5 minutes.`
    );

    // 4. Set the 5-minute timer
    setTimeout(async () => {
      try {
        // Ensure member is still in the server
        if (!member.guild.members.cache.has(member.id)) {
          console.log(`Member ${member.user.tag} left before timer finished.`);
          return;
        }

        // 5. Remove the temporary role
        await member.roles.remove(tempRole);

        // 6. Proceed with original channel creation logic
        let id;
        for (let i = 1; i <= 999; i++) {
          const formatted = i.toString().padStart(3, "0");
          if (!assignedIDs.has(formatted)) {
            id = formatted;
            assignedIDs.add(formatted);
            saveAssignedIDs();
            break;
          }
        }

        if (!id) {
          await member.send("Sorry, the server is currently full.");
          return;
        }

        const channelName = `AGS - ${id}`;
        const category = await getMemberCategory(member.guild);
        const adminRole = member.guild.roles.cache.find((r) =>
          r.name.toLowerCase().includes("admin")
        );

        const privateChannel = await member.guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: category,
          reason: `Private channel for ${member.user.tag} (ID: ${id})`,
          permissionOverwrites: [
            {
              id: member.guild.roles.everyone,
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: member.id, // Add member directly
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
              ],
            },
            ...(adminRole
              ? [
                  {
                    id: adminRole,
                    allow: [
                      PermissionsBitField.Flags.ViewChannel,
                      PermissionsBitField.Flags.SendMessages,
                      PermissionsBitField.Flags.ManageMessages,
                    ],
                  },
                ]
              : []),
          ],
        });

        await member.send(
          `Your unique ID is **${id}**. We have created your private channel: ${privateChannel.toString()}`
        );
        await privateChannel.send(
          `Welcome, ${member.user.toString()}! This is your private channel.`
        );

        const logChannel = await getLogChannel(member.guild);
        if (logChannel) {
          await logChannel.send(
            `New Member: ${member.user.tag}\nAssigned ID: **${id}**\nCreated Channel: ${privateChannel.toString()}`
          );
        }
        console.log(
          `Member ${member.user.tag} processed → ID: ${id}, Channel: #${channelName}`
        );
      } catch (err) {
        console.error("Error during member processing timer:", err);
      }
    }, CONFIG.tempRoleDuration);
  } catch (error) {
    console.error("Error in guildMemberAdd event:", error);
  }
});

/**
 * REVISED: Handle member leaving
 * Logic is sound. Finds the channel this member had explicit perms for and deletes it.
 */
client.on("guildMemberRemove", async (member) => {
  if (member.user.bot) return;

  try {
    // Find the channel this member had permission to see
    const channel = member.guild.channels.cache.find(
      (c) =>
        c.permissionOverwrites.cache.has(member.id) &&
        c.name.startsWith("AGS - ")
    );

    if (channel) {
      const id = channel.name.split(" - ")[1];

      if (id) {
        assignedIDs.delete(id);
        saveAssignedIDs();
      }

      await channel.delete("Member left, cleaning up private channel");

      const logChannel = await getLogChannel(member.guild);
      if (logChannel) {
        await logChannel.send(
          `Member Left: ${member.user.tag}\nFreed ID: **${id}**\nDeleted channel: #${channel.name}`
        );
      }
      console.log(`Cleaned up channel and ID for ${member.user.tag} (${id})`);
    }
  } catch (error) {
    console.error("Error cleaning up on member leave:", error);
  }
});

/**
 * NEW: Handle message forwarding
 * 1. Check if message is in an announcement channel
 * 2. Find all private member channels
 * 3. Forward the message content, embeds, and files
 */
client.on("messageCreate", async (message) => {
  // Ignore bots and messages not in an announcement channel
  if (message.author.bot) return;
  if (!CONFIG.announcementChannelNames.includes(message.channel.name)) return;

  try {
    // Find the category for "Member Channels"
    const category = message.guild.channels.cache.find(
      (c) =>
        c.name === CONFIG.categoryName && c.type === ChannelType.GuildCategory
    );
    if (!category) return; // No member category found

    // Find all text channels in that category (excluding the log channel)
    const memberChannels = message.guild.channels.cache.filter(
      (c) =>
        c.parentId === category.id &&
        c.type === ChannelType.GuildText &&
        c.name !== CONFIG.logChannelName
    );

    if (memberChannels.size === 0) return; // No member channels to post to

    console.log(
      `Forwarding message from #${message.channel.name} to ${memberChannels.size} member channels...`
    );

    // Prepare the message content for forwarding
    const messageOptions = {
      content: message.content,
      embeds: message.embeds,
      files: [...message.attachments.values()],
    };

    // Send to all channels
    for (const channel of memberChannels.values()) {
      try {
        await channel.send(messageOptions);
      } catch (err) {
        console.error(`Failed to send message to #${channel.name}:`, err);
      }
    }
  } catch (err) {
    console.error("Error in message forwarding:", err);
  }
});

client.login(process.env.DISCORD_TOKEN);
		
