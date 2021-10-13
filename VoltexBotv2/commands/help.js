const { MessageEmbed } = require("discord.js");

module.exports = {
  name: "help",
  aliases: ["h"],
  description: "Display all commands and descriptions",
  execute(message) {
    let commands = message.client.commands.array();

    let helpEmbed = new MessageEmbed()
      .setTitle("VoltexBot Help")
      .setDescription("List of all commands")
      .setColor("#FF0000");

    commands.forEach((cmd) => {
      helpEmbed.addField(
        `**${message.client.prefix}${cmd.name} ${cmd.aliases ? `(${cmd.aliases})` : ""}**`,
        `${cmd.description}`,
        true
      );
    });

    helpEmbed.setTimestamp();
    helpEmbed.setFooter('Music commands made by Evobot hosted by Voltex!');

    return message.channel.send(helpEmbed).catch(console.error);
  }
};
