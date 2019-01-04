/***************************************************************************
 *
 *  Tiny-RconCord
 *  Author: Jasmin Dreasond
 *  Copyright: © 2019 Jasmin Dreasond
 *
 *  Github: https://github.com/JasminDreasond
 *  License: MIT
 *
 ***************************************************************************/

const chat = {
    name: "Mine Discord Chat",
    description: "A simple plugin that connects Discord chat to Minecraft chat",
    author: "Jasmin Dreasond",
    page: "https://github.com/JasminDreasond/Tiny-RconCord",
    issues: "https://github.com/JasminDreasond/Tiny-RconCord/issues",
    version: "1.0",
    index: -1,
    start: function(pg) {

        const c = require(pg.folder + "/config.json");

        // Scripts base
        const chat_st = {

            minecraftTellraw: function(data) {

                const username = pg.emojiStrip(data.username);
                const discriminator = data.discriminator;
                let text = pg.emojiStrip(data.message);

                let bot = '';

                if (data.bot != "") {
                    bot = " " + c.template.bot_discord.replace('%text%', data.bot);
                }

                text = text.replace(/[ÀÁÂÃÄÅ]/, "A");
                text = text.replace(/[àáâãäå]/, "a");
                text = text.replace(/[ÈÉÊË]/, "E");
                text = text.replace(/[èéêë]/, "e");
                text = text.replace(/[ÒÓôö]/, "O");
                text = text.replace(/[òóôö]/, "o");
                text = text.replace(/[ÙÚûü]/, "U");
                text = text.replace(/[ùúûü]/, "u");
                text = text.replace(/[Ç]/, "C");
                text = text.replace(/[ç]/, "c");

                return c.template.tellraw
                    .replace('%username%', username)
                    .replace('%discriminator%', discriminator)
                    .replace('%bot%', bot)
                    .replace('%message%', text);

            },

            discordMessage: function(username, message) {
                // make a discord message string by formatting the configured template with the given parameters
                return c.template.discord
                    .replace('%username%', username)
                    .replace('%message%', message)
            },

            //Send Minecraft
            sendMC: function(message, data) {

                if (data) {
                    if (data.type == "user") {
                        var cmd = chat_st.minecraftTellraw({
                            message: message,
                            username: data.username,
                            discriminator: data.discriminator,
                            bot: data.bot
                        });
                    } else {
                        var cmd = message;
                    }
                } else {
                    var cmd = message;
                }

                pg.connCommand('tellraw @a ' + cmd, function(err) {
                    if (err) {
                        pg.log.error(err);
                        if (pg.c.discord.channelID.rcon) {
                            server.ds.sendMessage({ to: pg.c.discord.channelID.rcon, message: pg.lang['[ERROR]'] + ' ' + JSON.stringify(err) });
                        }
                    }
                });

            }

        };

        // Discord Special Chat
        chat.ds_special_chat = function(data) {

            if (data.channelID == c.channelID) {

                if (data.message.replace(" ", "").length > 0) {

                    if (!data.isBot) {

                        if (pg.c.chatLog) {
                            pg.log.chat(data.username + "#" + data.discriminator, data.message);
                        }
                        chat_st.sendMC(data.message, {
                            type: "user",
                            username: data.username,
                            discriminator: data.discriminator,
                            bot: ""
                        });

                    } else {

                        if (pg.c.chatLog) {
                            pg.log.chat(data.username + "#" + data.discriminator + " (" + pg.lang.bot.toUpperCase() + ")", data.message);
                        }
                        chat_st.sendMC(data.message, {
                            type: "user",
                            username: data.username,
                            discriminator: data.discriminator,
                            bot: pg.lang.bot.toUpperCase()
                        });

                    }

                }

                return true;

            } else {
                return false;
            }

        };

        // Minecraft Chat
        chat.mc_log = function(data) {

            // Detect if the log is a chat message
            var userchat = data.match(new RegExp(c.regex));
            if ((typeof c.regex == "string") && (userchat)) {

                // Model Chat
                userchat = [userchat[1], userchat[2]];

                // Add everymine
                userchat[1] = userchat[1].replace(/\@everymine/g, "<@&" + c.everymine + ">");

                // Send Bot Mode
                if (pg.plugins.length > 0) {
                    for (var i = 0; i < pg.plugins.length; i++) {
                        if (typeof pg.plugins[i].mc_chat == "function") {
                            userchat = pg.plugins[i].mc_chat(userchat[0], userchat[1]);
                        }
                    }
                }

                if (pg.c.chatLog) {
                    pg.log.chat(userchat[0], userchat[1]);
                }

                if (pg.c.webhook.use) {

                    pg.webhook.send(pg.c.webhook, {
                        username: userchat[0],
                        content: userchat[1],
                        avatar_url: pg.c.minecraft.avatar_url.replace("%username%", userchat[0])
                    });

                } else if (c.channelID) {
                    pg.server.ds.sendMessage({ to: c.channelID, message: chat_st.discordMessage(userchat[0], userchat[1]) });
                }

                // Finish the Log Get
                return null;

            } else {
                return data;
            }

        };


    }
};

module.exports = chat;