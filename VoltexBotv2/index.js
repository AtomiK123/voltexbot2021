/**
 * Module Imports
 */
const Discord = require("discord.js");
const { Client, Collection } = require("discord.js");
const { readdirSync } = require("fs");
const { join } = require("path");
const { PREFIX } = require("./config.json");

const client = new Client({ disableMentions: "everyone" });

client.commands = new Collection();
client.prefix = PREFIX;
client.queue = new Map();
const cooldowns = new Collection();
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

var prefix = "!"; // à vérifier pour embed
var creatorChannelName = ["Join To Create"]; // Exemple: var creatorChannelName = ["Join To Create", "name wow", "bloabla"];
var temporaryChannelPrefix = "->";

/**
 * Client Events
 */
client.on('ready', () => {
	client.user.setActivity("#BeTheGamer", {
		type: "STREAMING",
		url: "https://www.twitch.tv/voltexoff"
	});
	
console.log(`Bot ${client.user.tag} is now online!`);
});
client.on("warn", (info) => console.log(info));
client.on("error", console.error);

/**
 * Import all commands
 */
const commandFiles = readdirSync(join(__dirname, "commands")).filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(join(__dirname, "commands", `${file}`));
  client.commands.set(command.name, command);
}

client.on("message", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(PREFIX)})\\s*`);
  if (!prefixRegex.test(message.content)) return;

  const [, matchedPrefix] = message.content.match(prefixRegex);

  const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command =
    client.commands.get(commandName) ||
    client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName));

  if (!command) return;

  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || 1) * 1000;

  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return message.reply(
        `please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`
      );
    }
  }

  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

  try {
    command.execute(message, args);
  } catch (error) {
    console.error(error);
    message.reply("There was an error executing that command.").catch(console.error);
  }
});
 
//Command: !embed
client.on('message', message => {
	if (message.content.split(" ")[0].includes('!embed')) {
		console.log('Embed request received!');
		if(message.member.roles.cache.find(r => r.name === "CEO")){
			if(message.content.includes(';')){
				var content = message.content.split(";");
				const embed = new Discord.MessageEmbed()
				.setTitle(content[0].replace('!embed ',''))
				.setColor(0xff0000)
				.setDescription(content[2]);
				// Send the embed to the same channel as the message
				message.channel.send(embed).then(_ => _.react(content[1]));
				
				
			}else{
				message.channel.send('Need little help!? !embed [TITLE];[EMOJI];[DESCRIPTION] *Use **;** as separator.*');
			}
		}
		else{
			console.log("User doesn't meet the requirements!");
		}
	}
});

//Command: kick
client.on('message', message => {
    if (!message.guild) return
    let args = message.content.trim().split(/ +/g)
 
    if (args[0].toLowerCase() === '!kick') {
       if (!message.member.hasPermission('KICK_MEMBERS')) return message.channel.send("You don't have need permissions!")
       let member = message.mentions.members.first()
       if (!member) return message.channel.send("Veuillez mentionner un utilisateur :x:")
       if (member.highestRole.calculatedPosition >= message.member.highestRole.calculatedPosition && message.author.id !== message.guild.owner.id) return message.channel.send("Vous ne pouvez pas kick cet utilisateur :x:")
       if (!member.kickable) return message.channel.send("Je ne peux pas exclure cet utilisateur :sunglass:")
       member.kick()
       message.channel.send('**' + member.user.username + '** à bien était exclu du serveur discord :white_check_mark:')
    }
});

//Command: ban
client.on('message', function (message) {
    if (!message.guild) return
    let args = message.content.trim().split(/ +/g)
 
    if (args[0].toLocaleLowerCase() === '!ban') {
       if (!message.member.hasPermission('BAN_MEMBERS')) return message.channel.send("You don't have need permissions!")
       let member = message.mentions.members.first()
       if (!member) return message.channel.send("Error, Mentionned the user for ban him!")
       if (member.highestRole.calculatedPosition >= message.member.highestRole.calculatedPosition && message.author.id !== message.guild.owner.id) return message.channel.send("Vous ne pouvez pas bannir cet utilisateur :x:")
       if (!member.bannable) return message.channel.send("You can't ban this user! :sunglass:")
       message.guild.ban(member, {days: 7})
       message.channel.send('**' + member.user.username + '** à bien était banni du discord :white_check_mark:')
    }
});

//Create new channel if needed
client.on('voiceStateUpdate', (oldMember, newMember) => {

	let newUserChannel = newMember.voiceChannel;
	let oldUserChannel = oldMember.voiceChannel;
	let channelID;
	var JoinedTheServer;

	userID = newMember.id
	if(newMember.channelID != null) {
		channelID = newMember.channelID 
		JoinedTheServer = true;
	} else {
		channelID = oldMember.channelID
		JoinedTheServer = false;
	}

	const channel = oldMember.guild.channels.cache.find(ch => ch.id === channelID);
	const user = oldMember.guild.members.cache.find(user => user.id === userID);

	if(JoinedTheServer) {
		let lastChannel = oldMember.guild.channels.cache.find(ch => ch.id === oldMember.channelID)
		if (lastChannel != undefined) {
			if(lastChannel.members.size == 0 && lastChannel.name.includes(temporaryChannelPrefix)){
				lastChannel.delete();
				console.log("Delete channel: " + lastChannel.name);
			}
		}

		if(channel.name.includes(temporaryChannelPrefix)) {
			
		} else {
			if(creatorChannelName.find(element => element == channel.name)) {
				console.log(user.user.username + " joined the channel: " + channel.name);
				let newChannelName = temporaryChannelPrefix + " " + user.user.username + "'s channel";
				channel.clone({ name: newChannelName}).finally(console.log("New channel created")).then(newCurrentChannel => newMember.setChannel(newCurrentChannel));
				console.log(user.user.username + "created a new voice channel : '" + newChannelName+ "'");
			}
		}
	} else {
		console.log(user.user.username + " left the channel: " + channel.name);
		if(channel.name.includes(temporaryChannelPrefix) && channel.members.size == 0) {
			channel.delete();
			console.log("Delete channel: " + channel.name);
		}
	}
});

//New member join the discord (add role + send message in welcome channel)
client.on('guildMemberAdd', member => {
	console.log("new member");
	//id channel to change
	const channel = member.guild.channels.cache.find(ch => ch.name === 'welcome');
	console.log(channel);
	if(channel != null){
		channel.send(`Welcome ${member}! **Please read the #rules and have fun ! #BeTheGamer.**`);
	}
	
	
	//id role to change
	const memberRole = member.guild.roles.cache.find(role => role.name === 'Member');
	if(!memberRole) return console.log("Role doesn't exist.");
    member.roles.add(memberRole);
	if(member.roles.cache.has(memberRole.id)){
		console.log(`Role added to ${member.user.tag}!`);
	} else {
		console.log(`I don't have the required permission to add the new role to ${member.user.tag}!`);
	}
});

client.on('message', msg => {
	if (msg.content.toLowerCase() === '!credit') {
		msg.reply('Music commands made by Evobot hosted by Voltex!');
	}
});

/*
//test avec message
client.on('message', message => {
	if (message.content === '!a') {
	//id channel to change
		const membertest = message.member
		const channel = message.member.guild.channels.cache.find(ch => ch.id === '740693902364770531');
		channel.send(`Welcome ${message.member}! **Please read the #rules and have fun ! #BeTheGamer.**`);
		
		//id role to change
		let memberRole = message.guild.roles.cache.get('740693902364770528');
		if(!memberRole) return console.log("Role doesn't exist.");
		message.member.roles.add(memberRole);
		if(message.member.roles.cache.has(memberRole.id)){
			console.log(`Role added to ${membertest.user.tag}!`);
		} else {
			console.log(`I don't have the required permission to add the new role to ${membertest.user.tag}!`);
		}
	}
});
*/


client.login("NjM2MzU1NTQzMzE3MDg2MjA4.Xa-aSA.pXv76kgyHecNZBQsk0X-tvuuuKM");