require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
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
      .setDescription(`🎉 Congratulations ${user}, your appeal has been accepted!\nYou may now rejoin the server.`)
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

client.login(process.env.TOKEN);
