require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// When bot is ready
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Register /accept command
  const commands = [
    new SlashCommandBuilder()
      .setName('accept')
      .setDescription('Accept an appeal')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('User')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('reason')
          .setDescription('Reason')
          .setRequired(false))
      .toJSON()
  ];

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands }
  );

  console.log("Slash command registered");
});

// Handle command
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'accept') {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || "No reason provided";

    const msg = `🎉 Congratulations ${user}, your appeal was **accepted**!
You can now rejoin the server.

**Reason:** ${reason}`;

    await interaction.reply(msg);
  }
});

client.login(process.env.TOKEN);
