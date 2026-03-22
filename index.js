require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const warnings = new Map();

// keep these lowercase
const bannedWords = ["shit", "fuck", "bitch", "goon", "sex"];
const racistWords = ["niger", "ching chong"];

client.once("clientReady", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const content = message.content;
  const lowerContent = content.toLowerCase();

  // 📊 Wordle detection (auto move to #wordle-scores)
  if (lowerContent.includes("wordle")) {
    const wordleChannel = message.guild.channels.cache.find(
      (ch) => ch.name === "wordle-scores"
    );

    if (wordleChannel && message.channel.name !== "wordle-scores") {
      await wordleChannel.send(
        `📊 ${message.author} posted a Wordle score:\n\n${content}`
      );
      await message.delete().catch(() => {});
      return;
    }
  }

  // ❌ Rule 2 - Homework channels
  if (message.channel.name.toLowerCase().includes("homework")) {
    await message.delete().catch(() => {});
    await warnUser(message, "Do not message in homework channels.");
    return;
  }

  // ❌ Rule 1 - Swearing
  if (bannedWords.some((word) => lowerContent.includes(word))) {
    await message.delete().catch(() => {});
    await warnUser(message, "Swearing is not allowed.");
    return;
  }

  // ❌ Rule 5 - Racism
  if (racistWords.some((word) => lowerContent.includes(word))) {
    await message.delete().catch(() => {});
    await warnUser(message, "Racism is NOT tolerated.");
    await message.member.timeout(60 * 60 * 1000).catch(() => {});
    return;
  }

  // ❌ Rule 6 - Disrespect Admin
  if (lowerContent.includes("admin is trash")) {
    await warnUser(message, "Do not disrespect admins.");
    return;
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
    (ch) => ch.name === "warnings"
  );

  if (warningChannel) {
    await warningChannel.send(
      `⚠️ ${message.author} Warning ${count}/3 - ${reason}`
    );
  }

  if (count >= 3) {
    // prevent crashing if trying to timeout server owner
    if (message.member.id === message.guild.ownerId) {
      return;
    }

    await message.member.timeout(30 * 60 * 1000).catch(() => {});
    await message.channel.send(
      `${message.author} has been timed out for repeated warnings.`
    );
  }
}

client.login(process.env.TOKEN);