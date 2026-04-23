require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

const BOOST_CHANNEL_ID = "1493226820299001919";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ===== READY =====
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName('accept')
      .setDescription('Accept an appeal')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('User')
          .setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName('deny')
      .setDescription('Deny an appeal')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('User')
          .setRequired(true)
      )
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands }
  );

  console.log("Commands registered");
});

// ===== COMMAND HANDLER =====
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const user = interaction.options.getUser('user');

  // ACCEPT
  if (interaction.commandName === 'accept') {
    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("Appeal Accepted")
      .setDescription(
  `<:tick:1496537866283647026> **Appeal Accepted**\n\n` +
  `> Congratulations ${user}, your appeal has been accepted!\n` +
  `> You may now rejoin the server.`
)
      .setFooter({ text: "NightGang Appeals" })
      .setTimestamp();

    await interaction.reply({ content: "✅ Done", ephemeral: true });
    await interaction.channel.send({ embeds: [embed] });
  }

  // DENY
  if (interaction.commandName === 'deny') {
    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle("Appeal Denied")
      .setDescription(
  `<:no:1496537935959294213> ${user}, your appeal has been denied.\nYou may try again later.`
)
      .setFooter({ text: "NightGang Appeals" })
      .setTimestamp();

    await interaction.reply({ content: "❌ Done", ephemeral: true });
    await interaction.channel.send({ embeds: [embed] });
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith('!mute')) {
    if (!message.member.permissions.has("ModerateMembers")) {
      return message.reply("❌ You don't have permission.");
    }

    const user = message.mentions.members.first();
    if (!user) return message.reply("Mention a user to mute.");

    try {
      await user.timeout(10 * 60 * 1000); // 10 minutes

      const embed = new EmbedBuilder()
        .setColor("Orange")
        .setDescription(
          `<:muted:1496555318598177020> ${user} has been muted.\nDuration: 10 minutes.`
        )
        .setTimestamp();

      message.channel.send({ embeds: [embed] });

    } catch (err) {
      console.error(err);
      message.reply("❌ Failed to mute user.");
    }
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith('!unmute')) {
    if (!message.member.permissions.has("ModerateMembers")) {
      return message.reply("❌ You don't have permission.");
    }

    const user = message.mentions.members.first();
    if (!user) return message.reply("Mention a user to unmute.");

    try {
      await user.timeout(null);

      const embed = new EmbedBuilder()
        .setColor("Green")
        .setDescription(
          `<:unmute:1496555365200826469> ${user} has been unmuted.`
        )
        .setTimestamp();

      message.channel.send({ embeds: [embed] });

    } catch (err) {
      console.error(err);
      message.reply("❌ Failed to unmute user.");
    }
  }
});

const fs = require('fs');
const path = require('path');

const BANLIST_PATH = path.join(__dirname, 'banlist.json');

// Load / save banlist (simple persistence)
function loadBanlist() {
  try {
    return JSON.parse(fs.readFileSync(BANLIST_PATH, 'utf8'));
  } catch {
    return [];
  }
}
function saveBanlist(list) {
  fs.writeFileSync(BANLIST_PATH, JSON.stringify(list, null, 2));
}

// ===== FORCEBAN COMMAND =====
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith('!forceban')) {
    if (!message.member.permissions.has("BanMembers")) {
      return message.reply("❌ You don't have permission.");
    }

    const args = message.content.trim().split(/\s+/);
    const userId = args[1];

    if (!userId || !/^\d{17,20}$/.test(userId)) {
      return message.reply("Provide a valid **user ID**.");
    }

    try {
      // 1) Ban by ID (works even if user not in server)
      await message.guild.members.ban(userId, {
        deleteMessageSeconds: 7 * 24 * 60 * 60, // delete last 7 days of messages
        reason: `Force banned by ${message.author.tag}`
      });

      // 2) Persist to local banlist (for rejoin protection)
      const banlist = loadBanlist();
      if (!banlist.includes(userId)) {
        banlist.push(userId);
        saveBanlist(banlist);
      }

      const embed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(
          `<:ban:1496554683601260714> User ID **${userId}** has been **permanently force banned**.\n` +
          `• Recent messages removed (up to 7 days)\n` +
          `• Added to server banlist (auto-ban on join)`
        )
        .setFooter({ text: `By ${message.author.tag}` })
        .setTimestamp();

      message.channel.send({ embeds: [embed] });

    } catch (err) {
      console.error(err);
      message.reply(`❌ Failed to force ban user.\n${err.message}`);
    }
  }
});

// ===== AUTO-REBAN ON JOIN (blocklist) =====
client.on('guildMemberAdd', async (member) => {
  const banlist = loadBanlist();
  if (banlist.includes(member.id)) {
    try {
      await member.ban({ reason: "Auto-ban: on banlist" });
    } catch (e) {
      console.error("Auto-ban failed:", e.message);
    }
  }

  // Optional: basic anti-alt (kick very new accounts, e.g., < 3 days old)
  const ACCOUNT_AGE_MS = 3 * 24 * 60 * 60 * 1000;
  if (Date.now() - member.user.createdTimestamp < ACCOUNT_AGE_MS) {
    try {
      await member.kick("Account too new (anti-alt)");
    } catch (e) {
      console.error("Anti-alt kick failed:", e.message);
    }
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith('!announce')) {
    if (!message.member.permissions.has("ManageGuild")) {
      return message.reply("❌ You don't have permission.");
    }

    const args = message.content.split(" ").slice(1);
    const text = args.join(" ");
    if (!text) return message.reply("Provide a message.");

    const embed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle("<:announcement:1496542405405704192> Announcement")
      .setDescription(text)
      .setThumbnail(message.guild.iconURL())
      .setFooter({ text: `By ${message.author.tag}` })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith('!kick')) {
    if (!message.member.permissions.has("KickMembers")) {
      return message.reply("❌ You don't have permission.");
    }

    const args = message.content.split(" ").slice(1);
    if (!args[0]) return message.reply("Provide a user mention or ID.");

    let member;

    // Try mention first
    member = message.mentions.members.first();

    // If no mention, try ID
    if (!member) {
      try {
        member = await message.guild.members.fetch(args[0]);
      } catch {
        return message.reply("❌ User not found.");
      }
    }

    const reason = args.slice(1).join(" ") || "No reason provided.";

    if (!member.kickable) {
      return message.reply("❌ I cannot kick this user.");
    }

    try {
      // DM user before kick
      try {
        await member.send(
          `You have been kicked from **${message.guild.name}**.\nReason: ${reason}`
        );
      } catch {
        // ignore if DMs closed
      }

      await member.kick(reason);

      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("<:tick:1496537866283647026> User Kicked")
        .setDescription(
          `${member} has been kicked.\n\n**Reason:** ${reason}`
        )
        .setFooter({ text: `By ${message.author.tag}` })
        .setTimestamp();

      message.channel.send({ embeds: [embed] });

    } catch (err) {
      console.error(err);
      message.reply("❌ Failed to kick user.");
    }
  }
});

client.login(process.env.TOKEN);
