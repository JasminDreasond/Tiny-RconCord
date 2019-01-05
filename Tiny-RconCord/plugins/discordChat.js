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

                text = text.replace(/[ÀÁÂÃÄÅ]/g, "A");
                text = text.replace(/[àáâãäå]/g, "a");
                text = text.replace(/[ÈÉÊË]/g, "E");
                text = text.replace(/[èéêë]/g, "e");
                text = text.replace(/[ÒÓôö]/g, "O");
                text = text.replace(/[òóôö]/g, "o");
                text = text.replace(/[ÙÚûü]/g, "U");
                text = text.replace(/[ùúûü]/g, "u");
                text = text.replace(/[Ç]/g, "C");
                text = text.replace(/[ç]/g, "c");

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
                            pg.dsBot.sendMessage({ to: pg.c.discord.channelID.rcon, message: pg.lang['[ERROR]'] + ' ' + JSON.stringify(err) });
                        }
                    }
                });

            }

        };

        // Discord Special Chat
        chat.ds_special_chat = function(data) {

            if ((data.channelID == c.channelID) && (data.userID != pg.getDS().id)) {

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
            if (typeof c.chat == "string") {
                var userchat = data.match(new RegExp(c.chat));
            }

            if (typeof c.join == "string") {
                var userjoin = data.match(new RegExp(c.join));
            }

            if (typeof c.leave == "string") {
                var userleave = data.match(new RegExp(c.leave));
            }

            if (typeof c.advancement == "string") {
                var adv = data.match(new RegExp(c.advancement));
            }

            // Start looking data

            // Chat
            if ((typeof c.chat == "string") && (userchat)) {

                // Model Chat
                userchat = [userchat[1], userchat[2]];

                // Add everymine
                userchat[1] = userchat[1].replace(/\@everymine/g, "<@&" + c.everymine + ">");

                // Send Bot Mode
                if (pg.plugins.length > 0) {
                    for (var i = 0; i < pg.plugins.length; i++) {
                        if (
                            (typeof pg.plugins[i].mc_chat == "function") && (userchat) &&
                            (
                                (typeof userchat[1] == "string") && (userchat[1] != "") &&
                                (typeof userchat[0] == "string") && (userchat[0] != "")
                            )
                        ) {
                            userchat = pg.plugins[i].mc_chat(userchat[0], userchat[1]);
                        }
                    }
                }

                if (userchat) {

                    if ((typeof userchat[1] == "string") && (userchat[1].replace(/ /g, "") != "")) {

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
                            pg.dsBot.sendMessage({ to: c.channelID, message: chat_st.discordMessage(userchat[0], userchat[1]) });
                        }

                    } else if ((userchat[1].replace(/ /g, "") != "")) {

                        if (pg.c.minecraft.debug) {
                            pg.log.minecraft(userchat[1]);
                        }

                        if (c.channelID) {
                            pg.dsBot.sendMessage({ to: c.channelID, message: userchat[1] });
                        }

                    }

                }

                // Finish the Log Get
                return null;

            }

            // Join User
            else if ((typeof c.join == "string") && (userjoin)) {

                // Model Chat
                userjoin = userjoin[1];

                if (pg.c.minecraft.debug) {
                    pg.log.minecraft(pg.i18(pg.lang.user_join, [userjoin]));
                }

                if (pg.c.webhook.use) {

                    pg.webhook.send(pg.c.webhook, {
                        username: pg.getDS().username,
                        content: pg.i18(pg.lang.user_join, [userjoin]),
                        avatar_url: pg.c.minecraft.avatar_url.replace("%username%", userjoin)
                    });

                } else if (c.channelID) {

                    pg.dsBot.sendMessage({ to: c.channelID, message: pg.i18(pg.lang.user_join, [userjoin]) });

                }

                // Finish the Log Get
                return null;

            }

            // Leave User
            else if ((typeof c.leave == "string") && (userleave)) {

                // Model Chat
                userleave = userleave[1];

                if (pg.c.minecraft.debug) {
                    pg.log.minecraft(pg.i18(pg.lang.user_leave, [userleave]));
                }

                if (pg.c.webhook.use) {

                    pg.webhook.send(pg.c.webhook, {
                        username: pg.getDS().username,
                        content: pg.i18(pg.lang.user_leave, [userleave]),
                        avatar_url: pg.c.minecraft.avatar_url.replace("%username%", userleave)
                    });

                } else if (c.channelID) {
                    pg.dsBot.sendMessage({ to: c.channelID, message: pg.i18(pg.lang.user_leave, [userleave]) });
                }

                // Finish the Log Get
                return null;

            }

            // Advancement
            else if ((typeof c.advancement == "string") && (adv)) {

                // Model Chat
                adv = [adv[1], adv[2]];

                if (pg.c.minecraft.debug) {
                    pg.log.minecraft(pg.i18(pg.lang.advancement_receive, [adv[0], adv[1]]));
                }

                if (pg.c.webhook.use) {

                    pg.webhook.send(pg.c.webhook, {
                        username: pg.getDS().username,
                        content: pg.i18(pg.lang.advancement_receive, [adv[0], adv[1]]),
                        avatar_url: pg.c.minecraft.avatar_url.replace("%username%", adv[0])
                    });

                } else if (c.channelID) {
                    pg.dsBot.sendMessage({ to: c.channelID, message: pg.i18(pg.lang.advancement_receive, [adv[0], adv[1]]) });
                }

                // Finish the Log Get
                return null;

            }

            // Nothing
            else {
                return data;
            }

        };


    }
};

module.exports = chat;