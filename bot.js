const dockerComposeFile = '/home/$user/docker-minecraft/docker-compose.yml';
const dockerContainerName = 'mcserver'; // the name of your docker container, sometimes called mc with itzg/minecraft-server
const YourGuildID = 'YOUR_GUILD_ID'; //Right click on your discord server and Copy ID down at the bottom
const CntdwnTimer = 15; // 15 seconds counter for the poll in Discord
//
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const { spawn } = require('child_process');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ]
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
  console.log(`---------------------------------`);
  console.log(`Logged in as ${client.user.tag}!`);
  console.log(`---------------------------------`);
  console.log(new Date().toString());
  console.log(`...`);
  console.log(`Discord server ID set in the const YourGuildID: ${YourGuildID}`);
  console.log(`Docker container name set in the config: ${dockerContainerName}`);
  console.log(`...`);
  try {
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, (YourGuildID)),
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
      const collector = pollMessage.createReactionCollector({ filter, time: CntdwnTimer * 1000 });

      const userReactions = new Map();

      let countdown = CntdwnTimer;
      const countdownInterval = setInterval(() => {
        countdown -= 1;
        if (countdown <= 0) {
          clearInterval(countdownInterval);
        } else {
          interaction.editReply(`Should we restart the Docker machine? Time left: ${countdown} seconds`);
        }
      }, 1000);

      collector.on('collect', (reaction, user) => {
        if (userReactions.has(user.id)) {
          const previousReaction = userReactions.get(user.id);
          if (previousReaction !== reaction.emoji.name) {
            const previousEmoji = pollMessage.reactions.cache.get(previousReaction);
            if (previousEmoji) previousEmoji.users.remove(user.id);
          }
        }
        userReactions.set(user.id, reaction.emoji.name);
        console.log(`[${new Date().toISOString()}] ${user.tag} reacted with ${reaction.emoji.name}`);
      });

      collector.on('end', async collected => {
        clearInterval(countdownInterval);
        const thumbsUpCount = Array.from(userReactions.values()).filter(emoji => emoji === '👍').length;
        const thumbsDownCount = Array.from(userReactions.values()).filter(emoji => emoji === '👎').length;

        console.log(`[${new Date().toISOString()}] Poll ended with ${thumbsUpCount} thumbs up and ${thumbsDownCount} thumbs down.`);

        if (thumbsUpCount > 0 && thumbsDownCount === 0) {
          console.log(`[${new Date().toISOString()}] Restarting Docker machine.`);
          const yaml = require('js-yaml');
          const fs = require('fs');

          // Read the contents of the YAML file
          let fileContent;
          try {
            fileContent = fs.readFileSync(dockerComposeFile, 'utf8');
          } catch (err) {
            console.error(`Error reading Docker Compose file: ${err}`);
            await interaction.followUp(`Failed to read Docker Compose file: ${err.message}`);
            return;
          }

          // Parse the contents and extract the container name of interest
          const parsedContent = yaml.load(fileContent);
          const dockerContainerName = Object.keys(parsedContent.services)[0];

          // Build and execute the Docker stop command for the specific service/container
          try {
            const command = './docker-restart.sh';
            const args = [dockerContainerName];
            const child = spawn(command, args);

            const logStream = fs.createWriteStream('debug.log', { flags: 'a' });

            child.stdout.on('data', (data) => {
              const logLine = `${new Date().toISOString()} :: ${data}`;
              process.stdout.write(logLine);
              logStream.write(logLine);
            });

            child.stderr.on('data', (data) => {
              const logLine = `${new Date().toISOString()} :: ${data}`;
              process.stderr.write(logLine);
              logStream.write(logLine);
            });

            child.on('close', (code) => {
              logStream.end();
              if (code === 0) {
                console.log('Docker machine restarted successfully.');
                interaction.followUp('Docker machine restarted successfully.');
              } else {
                console.error(`docker-restart.sh script exited with code ${code}`);
                interaction.followUp(`Failed to restart Docker machine: script exited with code ${code}`);
              }
            });
          } catch (error) {
            console.error(`Spawn error: ${error}`);
            interaction.followUp(`Failed to restart Docker machine: ${error.message}`);
          }
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
