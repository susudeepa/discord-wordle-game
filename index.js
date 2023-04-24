const {Client, GatewayIntentBits, Partials} = require('discord.js');
const fs = require('fs');
const {prefix, token, emoji_stash_servers} = require('./config.json');
const {words, ALL_WORDS} = require('./words.js');
const emojis = require('./emojis.json');

//instance of the bot
const client = new Client({
  intents: [
   GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.on('ready', async () => { 
  console.log(`Logged in as ${client.user.tag}!`);
  await setupEmote();
});

let games = {};

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;
  const args = message.content.slice(prefix.length).split(' ');
  const command = args.shift().toLowerCase();
  switch (command) {
    case 'help':
      sendHelp(message);
      break;
    case 'start':
      sendGame(message);
      break;
    case 'add-green':
      await addEmote(message, 'green');
      break;
case 'add-gray':
      await addEmote(message, 'gray');
      break;
      case 'add-yellow':
      await addEmote(message, 'yellow');
      break;

  }
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton() && interaction.customId == 'guess') {
    if (interaction.message.content.includes(interaction.user.id)) {
      interaction.showModal({
        custom_id: `guessed`,
        title: `Enter your guess`,
        components: [
          {
            type: 1, // Component row
            components: [
              {
                type: 4, // Text input component, only valid in modals
                custom_id: 'answer',
                label: `Enter a valid word:`,
                style: 1, // 1 for line, 2 for paragraph
                min_length: 5,
                max_length: 5,
                placeholder: 'adieu',
                required: true,
              },
            ],
          },
        ],
      });
    } else {
      interaction.reply({content: 'This is not your game.', ephemeral: true});
    }
  } else if (interaction.isModalSubmit() && interaction.customId == 'guessed') {
    interaction.deferUpdate();
    const value = interaction.fields.getTextInputValue('answer');
    if (ALL_WORDS.includes(value.toLowerCase())) {
      const answer = games[interaction.message.id];
      const wordArr = getColoredWord(answer, value);
      const newWord = wordArr.join(' ');
      const currentChances = parseInt(
        interaction.message.embeds[0].fields[0].value
      );
      const chances = currentChances - 1;
      let arr = interaction.message.embeds[0].description.split('\n').reverse();
      arr[chances] = newWord;
      let newDesc = arr.reverse().join('\n');

      const count = arr.reduce(
        (count, el) => (!el.includes('◻️') ? count + 1 : count),
        0
      );
      let msg = {
        content: `<@${interaction.user.id}>'s game`,
        tts: false,
        components: [
          {
            type: 1,
            components: [
              {
                style: 1,
                label: `GUESS`,
                custom_id: `guess`,
                disabled: true,
                emoji: {
                  id: null,
                  name: `🧐`,
                },
                type: 2,
              },
            ],
          },
        ],
        embeds: [
          {
            type: 'rich',
            title: `WORDLE- GAME OVER`,
            description: `${newDesc}`,
            color: 0xff0000,
            fields: [
              {
                name: `🏆 YOU WON`,
                value: `Your performance: \`${count}/6\``,
              },
            ],
            footer: {
              text: `Use ${prefix}help for rules and context about the game`,
            },
          },
        ],
      };
      if (!wordArr.some((element) => !element.includes('green'))) {
        delete games[interaction.message.id];
      } else if (currentChances == 1) {
        msg.embeds[0].fields[0].name = '🦆 You Lost';
        msg.embeds[0].fields[0].value = `The word was ${str1}`;
        delete games[interaction.message.id];
      } else {
        msg.components[0].components[0].disabled = false;
        msg.embeds[0].fields[0].name = '🎚️ Chances Left :';
        msg.embeds[0].fields[0].value = chances;
        msg.embeds[0].title = 'WORDLE';
        msg.embeds[0].description = newDesc;
      }
      interaction.message.edit(msg);
    } else {
      interaction.reply({
        content: 'Please enter a valid word.',
        ephemeral: true,
      });
    }
  }
});

async function sendGame(message) {
  let msg = await message.reply({
    content: `<@${message.author.id}>'s game`,
    tts: false,
    components: [
      {
        type: 1,
        components: [
          {
            style: 1,
            label: `GUESS`,
            custom_id: `guess`,
            disabled: false,
            emoji: {
              id: null,
              name: `🧐`,
            },
            type: 2,
          },
        ],
      },
    ],
    embeds: [
      {
        type: 'rich',
        title: `WORDLE`,
        description: [
          `◻️ ◻️ ◻️ ◻️ ◻️`,
          `◻️ ◻️ ◻️ ◻️ ◻️`,
          `◻️ ◻️ ◻️ ◻️ ◻️`,
          `◻️ ◻️ ◻️ ◻️ ◻️`,
          `◻️ ◻️ ◻️ ◻️ ◻️`,
          `◻️ ◻️ ◻️ ◻️ ◻️`,
        ].join('\n'),
        color: 0xff0000,
        fields: [
          {
            name: `🎚️ Chances Left :`,
            value: `6`,
          },
        ],
        footer: {
          text: `Use ${prefix}help for rules and context about the game`,
        },
      },
    ],
  });
  games[msg.id] = words[Math.floor(Math.random() * words.length)];
}
function sendHelp(message) {
  message.channel.send({
    content: `**HOW TO PLAY**`,
    tts: false,
    embeds: [
      {
        type: 'rich',
        title: `Guess the WORDLE in 6 tries.`,
        description: `• After each guess, the color of the tiles will change to show how close your guess was to the word.\n\n**Tile color meanings:**\n\n${emojis.green.w} ${emojis.gray.e} ${emojis.gray.a} ${emojis.gray.r} ${emojis.gray.y}\nThe letter **W** is present in this word and is in the correct spot.\n\n${emojis.gray.p} ${emojis.gray.i} ${emojis.yellow.v} ${emojis.gray.o} ${emojis.gray.t}\nThe letter **V** is in the word but in wrong spot.\n\n${emojis.green.v} ${emojis.green.a} ${emojis.gray.l} ${emojis.green.u} ${emojis.green.e}\nThe letter **L** is not in the word in any spot`,
        color: 0xa9f,
        footer: {
          text: `Play now ${prefix}start`,
        },
      },
    ],
  });
}

function getColoredWord(answer, guess) {
  let coloredWord = [];
  for (let i = 0; i < guess.length; i++) {
    coloredWord.push(emojis.gray[guess[i]]);
  }
  let guessLetters = guess.split('');
  let answerLetters = answer.split('');

  for (let i = 0; i < guessLetters.length; i++) {
    if (guessLetters[i] === answerLetters[i]) {
      coloredWord[i] = emojis.green[guessLetters[i]];
      answerLetters[i] = null;
      guessLetters[i] = null;
    }
  }

  for (let i = 0; i < guessLetters.length; i++) {
    if (guessLetters[i] && answerLetters.includes(guessLetters[i])) {
      coloredWord[i] = emojis.yellow[guessLetters[i]];
      answerLetters[answerLetters.indexOf(guessLetters[i])] = null;
    }
  }
  return coloredWord;
}
function getAlphabetIndex(int) {
  const baseCharCode = 'a'.charCodeAt(0);
  return String.fromCharCode(baseCharCode + int);
}
async function setupEmote () {
  console.log('Setting up Emotes...\nPlease wait till it’s completes...');
  
let emojiObj = {};
let colors = ['green', 'yellow', 'gray'];
for (let i = 0; i < 3; i++) {
  console.log(`Adding ${colors[i]} emojis...`);
  let guild = client.guilds.cache.get(emoji_stash_servers[i]);
  for (let j = 0; j < 26; j++) {
   let crEmote = emojis[colors[i]][getAlphabetIndex(j)];
const regex = /\d+(\.\d+)?/g;
const matches = crEmote.match(regex);
   let attachment = `https://cdn.discordapp.com/emojis/${matches[0]}.png`;
     let name = `${colors[i]}_${getAlphabetIndex(j)}`;
  let emoji = await guild.emojis.create({ attachment: attachment, name: name });
  emojiObj.green[getAlphabetIndex(j)] = `<:${emoji.name}:${emoji.id}>`;
}
  console.log(`Done!`);
}
console.log(`Updating emojis.json file...`);
let json = JSON.stringify(emojiObj);
  fs.writeFile('emojis.json', json, (err) => {
  if (err) throw err;
  console.log('Process Completed\nemojis.json file configured successfully!');
});
 

}

client.on('error', function (err) {
  console.log(err);
  client.login(token);
});

client.login(token);
  