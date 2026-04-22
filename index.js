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

new SlashCommandBuilder()
  .setName('announce')
  .setDescription('Send an announcement')
  .addStringOption(option =>
    option.setName('message')
      .setDescription('Announcement message')
      .setRequired(true)
  )

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
      .setDescription(`❌ Sorry ${user}, your appeal has been denied.\nYou may appeal again later.`)
      .setFooter({ text: "NightGang Appeals" })
      .setTimestamp();

    await interaction.reply({ content: "❌ Done", ephemeral: true });
    await interaction.channel.send({ embeds: [embed] });
  }
});

if (interaction.commandName === 'announce') {
  const msg = interaction.options.getString('message');

  const embed = new EmbedBuilder()
    .setColor("Blue")
    .setDescription(
      `<:announcement:1496542405405704192> **Announcement**\n\n` +
      `> ${msg}`
    )
    .setThumbnail(interaction.guild.iconURL())
    .setTimestamp();

  // Private reply (only you see)
  await interaction.reply({
    content: "📢 Announcement sent",
    ephemeral: true
  });

  // Public message
  await interaction.channel.send({ embeds: [embed] });
}

client.on('guildMemberUpdate', (oldMember, newMember) => {
  if (!oldMember.premiumSince && newMember.premiumSince) {

    const channel = newMember.guild.channels.cache.get(BOOST_CHANNEL_ID);
    if (!channel) return;

    channel.send(
      `🚀 ${newMember} just boosted **${newMember.guild.name}**!\n\n` +
      `🎁 Rewards:\n` +
      `• VIP Chat Access\n` +
      `• Temp Mod (1 Month)\n` +
      `• 25k Night Bucks`
    );
  }
});

client.on('messageCreate', (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith('!boost')) {
    const user = message.mentions.users.first();
    if (!user) return message.reply("Mention a user");

    const channel = message.guild.channels.cache.get(BOOST_CHANNEL_ID);
    if (!channel) return;

    channel.send(
      `🚀 ${user} just boosted **${message.guild.name}**!\n\n` +
      `🎁 Rewards:\n` +
      `• VIP Chat Access\n` +
      `• Temp Mod (1 Month)\n` +
      `• 25k Night Bucks`
    );
  }
});

client.login(process.env.TOKEN);
