const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const { exec } = require('child_process');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessageReactions]
});

const commands = [
  new SlashCommandBuilder()
    .setName('restart')
    .setDescription('Create a poll to restart the Docker machine'),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

let lastUsed = 0;
const cooldown = 60 * 1000; // 1 minute cooldown

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  try {
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, 'YOUR_GUILD_ID'), // replace 'YOUR_GUILD_ID' with your Discord server ID
      { body: commands }
    );
    console.log('Successfully registered application commands.');
  } catch (error) {
    console.error('Error registering application commands:', error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'restart') {
    const now = Date.now();
    if (now - lastUsed < cooldown) {
      const remaining = cooldown - (now - lastUsed);
      await interaction.reply(`Please wait ${Math.ceil(remaining / 1000)} seconds before using this command again.`);
      return;
    }
    lastUsed = now;

    console.log(`[${new Date().toISOString()}] Received command: ${commandName} from ${interaction.user.tag}`);

    try {
      const pollMessage = await interaction.reply({ content: 'Should we restart the Docker machine?', fetchReply: true });

      await pollMessage.react('👍');
      await pollMessage.react('👎');

      const filter = (reaction, user) => (reaction.emoji.name === '👍' || reaction.emoji.name === '👎') && !user.bot;
      const collector = pollMessage.createReactionCollector({ filter, time: 60000 });

      let countdown = 60;
      const countdownInterval = setInterval(() => {
        countdown -= 1;
        if (countdown <= 0) {
          clearInterval(countdownInterval);
        } else {
          interaction.editReply(`Should we restart the Docker machine? Time left: ${countdown} seconds`);
        }
      }, 1000);

      collector.on('collect', (reaction, user) => {
        console.log(`[${new Date().toISOString()}] ${user.tag} reacted with ${reaction.emoji.name}`);
      });

      collector.on('end', collected => {
        clearInterval(countdownInterval);
        const thumbsUpCount = collected.filter(reaction => reaction.emoji.name === '👍').size;
        const thumbsDownCount = collected.filter(reaction => reaction.emoji.name === '👎').size;

        console.log(`[${new Date().toISOString()}] Poll ended with ${thumbsUpCount} thumbs up and ${thumbsDownCount} thumbs down.`);

        if (thumbsUpCount > 0 && thumbsDownCount === 0) {
          console.log(`[${new Date().toISOString()}] Restarting Docker machine.`);
          exec('docker compose up -d', (error, stdout, stderr) => {
            if (error) {
              console.error(`exec error: ${error}`);
              interaction.followUp(`Failed to restart Docker machine: ${error.message}`);
              return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
            interaction.followUp('Docker machine restarted successfully.');
          });
        } else {
          interaction.followUp('Poll closed without action.');
        }
      });
    } catch (error) {
      console.error('Error handling restart command:', error);
      interaction.followUp('An error occurred while processing the command.');
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
