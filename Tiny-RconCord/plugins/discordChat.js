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
    index: 100,
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

                const message_template = [];

                for (var i = 0; i < c.template.tellraw.length; i++) {
                    message_template.push(Object.create(c.template.tellraw[i]));
                    if (
                        (message_template[i].text) &&
                        (c.template.tellraw[i].text)
                    ) {
                        message_template[i].text = c.template.tellraw[i].text
                            .replace('%username%', username)
                            .replace('%discriminator%', discriminator)
                            .replace('%bot%', bot)
                            .replace('%message%', text);
                    }
                }

                return message_template;

            },

            discordMessage: function(username, message) {
                // make a discord message string by formatting the configured template with the given parameters
                return c.template.discord
                    .replace('%username%', username)
                    .replace('%message%', message)
            },

            //Send Minecraft
            sendMC: function(message, data) {

                new pg.minecraft.send(chat_st.minecraftTellraw({
                    message: message,
                    username: data.username,
                    discriminator: data.discriminator,
                    bot: data.bot
                })).exe(function(err) {
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
                            username: data.username,
                            discriminator: data.discriminator,
                            bot: ""
                        });

                    } else {

                        if (pg.c.chatLog) {
                            pg.log.chat(data.username + "#" + data.discriminator + " (" + pg.lang.bot.toUpperCase() + ")", data.message);
                        }
                        chat_st.sendMC(data.message, {
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

        // Chat Minecraft
        chat.mc_chat = function(user, message) {

            if (user) {

                // Add everymine
                message = message.replace(/\@everymine/g, "<@&" + c.everymine + ">");

                if (pg.c.webhook.use) {

                    pg.webhook.send(pg.c.webhook, {
                        username: user,
                        content: message,
                        avatar_url: pg.c.minecraft.avatar_url.replace("%username%", user)
                    });

                } else if (c.channelID) {
                    pg.dsBot.sendMessage({ to: c.channelID, message: chat_st.discordMessage(user, message) });
                }

            }

            return [user, message];

        };

        // Minecraft Log
        chat.mc_log = function(data) {

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

            // Join User
            if ((typeof c.join == "string") && (userjoin)) {

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