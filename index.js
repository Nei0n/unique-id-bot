const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');

// Get the token from Railway's environment variables
const token = process.env.DISCORD_TOKEN;

if (!token) {
    console.error("Fatal Error: DISCORD_TOKEN is not defined in environment variables.");
    process.exit(1); // Stop the bot if the token is missing
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // Required for game tag
    ],
    partials: [Partials.Channel],
});

// --- Load Commands ---
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`[Loading] Command loaded: /${command.data.name}`);
    } else {
        console.warn(`[Warning] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// --- Load Events ---
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
    console.log(`[Loading] Event loaded: ${event.name}`);
}

// Login to Discord
client.login(token);