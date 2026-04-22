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

client.login(process.env.TOKEN);
