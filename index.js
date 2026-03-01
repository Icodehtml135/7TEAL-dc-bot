require("dotenv").config();
const { 
  Client, 
  GatewayIntentBits, 
  PermissionsBitField 
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
});

const warnings = new Map();

// Add real words here
const bannedWords = ["shit", "fuck", "bitch"];
const racistWords = ["racist1", "racist2"];

client.once("clientReady", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();
  const userId = message.author.id;

  // ❌ Rule 2 - Homework channels
  if (message.channel.name.toLowerCase().includes("homework")) {
    await message.delete().catch(() => {});
    warnUser(message, "Do not message in homework channels.");
    return;
  }

  // ❌ Rule 1 - Swearing
  if (bannedWords.some(word => content.includes(word))) {
    await message.delete().catch(() => {});
    warnUser(message, "Swearing is not allowed.");
  }

  // ❌ Rule 5 - Racism
  if (racistWords.some(word => content.includes(word))) {
    await message.delete().catch(() => {});
    warnUser(message, "Racism is NOT tolerated.");
    await message.member.timeout(60 * 60 * 1000).catch(() => {});
  }

  // ❌ Rule 6 - Disrespect Admin
  if (content.includes("admin is trash")) {
    warnUser(message, "Do not disrespect admins.");
  }
});

async function warnUser(message, reason) {
  const userId = message.author.id;

  if (!warnings.has(userId)) {
    warnings.set(userId, 1);
  } else {
    warnings.set(userId, warnings.get(userId) + 1);
  }

  const count = warnings.get(userId);

  const warningChannel = message.guild.channels.cache.find(
    ch => ch.name === "warnings"
  );
  if (warningChannel) {
    warningChannel.send(
      `⚠️ ${message.author} Warning ${count}/3 - ${reason}`
    );
  }

  if (count >= 3) {
    // Prevent crashing if trying to timeout server owner
    if (message.member.id === message.guild.ownerId) {
      return;
    }

    await message.member.timeout(30 * 60 * 1000).catch(() => {});
    message.channel.send(
      `${message.author} has been timed out for repeated warnings.`
    );
  }
}

client.login(process.env.TOKEN);