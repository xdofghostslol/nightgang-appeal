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
     
client.login(process.env.TOKEN);
