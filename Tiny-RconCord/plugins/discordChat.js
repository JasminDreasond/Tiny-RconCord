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

            clone: function(obj) {
                if (null == obj || "object" != typeof obj) return obj;
                var copy = obj.constructor();
                for (var attr in obj) {
                    if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
                }
                return copy;
            },

            // URL Regex
            regex: /(https?:\/\/[^\s]+)/g,

            // Minecraft Message
            minecraftTellraw: function(data) {

                // Prepare
                const username = pg.emojiStrip(data.username);
                const discriminator = data.discriminator;
                data.message = pg.emojiStrip(data.message);
                let text = {
                    msg: data.message.split(chat_st.regex),
                    result: ""
                };

                let bot = '';

                if (data.bot != "") {
                    bot = " " + c.template.bot_discord.replace('%text%', data.bot);
                }

                // Message
                const message_template = [];

                // Get Username
                for (var i = 0; i < c.template.tellraw.user.length; i++) {
                    if (c.template.tellraw.user[i].text) {

                        message_template.push(chat_st.clone(c.template.tellraw.user[i]));
                        if (message_template[i].text) {
                            message_template[i].text = message_template[i].text
                                .replace('%username%', username)
                                .replace('%discriminator%', discriminator)
                                .replace('%bot%', bot);
                        }

                    }
                }

                // Prepare Message
                for (var i = 0; i < text.msg.length; i++) {

                    if ((typeof text.msg[i] == "string") && (
                            (!text.msg[i].startsWith('https')) ||
                            (!text.msg[i].startsWith('https'))
                        )) { text.result += text.msg[i]; } else {

                        // Insert Text
                        for (var y = 0; y < c.template.tellraw.message.length; y++) {
                            if (c.template.tellraw.message[y].text) {

                                message_template.push(chat_st.clone(c.template.tellraw.message[y]));

                                var x = message_template.length - 1;
                                if (message_template[x].text) {
                                    message_template[x].text = message_template[x].text.replace('%message%', text.result);
                                }

                            }
                        }

                        text.result = '';

                        // Insert URL

                        for (var y = 0; y < c.template.tellraw.url.length; y++) {
                            if ((c.template.tellraw.url[y].clickEvent) && (c.template.tellraw.url[y].clickEvent.action == "open_url")) {

                                message_template.push(chat_st.clone(c.template.tellraw.url[y]));

                                var x = message_template.length - 1;

                                message_template[x].text = text.msg[i];
                                message_template[x].clickEvent.value = text.msg[i];

                            }
                        }

                    }

                }

                if (text.result != "") {

                    // Insert Text
                    for (var i = 0; i < c.template.tellraw.message.length; i++) {
                        if (c.template.tellraw.message[i].text) {

                            message_template.push(chat_st.clone(c.template.tellraw.message[i]));

                            var x = message_template.length - 1;
                            if (message_template[x].text) {
                                message_template[x].text = message_template[x].text.replace('%message%', text.result);
                            }

                        }
                    }

                }

                console.log(message_template);
                return message_template;

            },

            // Discord Message
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
        chat.ds_special_chat = function(data, event) {

            if ((data.channelID == c.channelID) && (data.userID != pg.getDS().id)) {

                if (event.d.attachments.length > 0) {

                    const tinynb = data.message.replace(" ", "").length;

                    for (var i = 0; i < event.d.attachments.length; i++) {
                        if (tinynb > 0) {
                            data.message += '\n' + event.d.attachments[i].url;
                        } else {
                            data.message += event.d.attachments[i].url;
                        }
                    }

                }

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

        };

        // Minecraft Join
        chat.mc_join = function(userjoin) {

            if (c.show.join) {

                if (pg.c.webhook.use) {

                    pg.webhook.send(pg.c.webhook, {
                        username: pg.getDS().username,
                        content: pg.i18(pg.lang.user_join, [userjoin]),
                        avatar_url: pg.c.minecraft.avatar_url.replace("%username%", userjoin)
                    });

                } else if (c.channelID) {

                    pg.dsBot.sendMessage({ to: c.channelID, message: pg.i18(pg.lang.user_join, [userjoin]) });

                }

                return null;

            } else {
                return userjoin;
            }

        };

        // Minecraft Leave
        chat.mc_leave = function(userleave) {

            if (c.show.leave) {

                if (pg.c.webhook.use) {

                    pg.webhook.send(pg.c.webhook, {
                        username: pg.getDS().username,
                        content: pg.i18(pg.lang.user_leave, [userleave]),
                        avatar_url: pg.c.minecraft.avatar_url.replace("%username%", userleave)
                    });

                } else if (c.channelID) {
                    pg.dsBot.sendMessage({ to: c.channelID, message: pg.i18(pg.lang.user_leave, [userleave]) });
                }

                return null;

            } else {
                return userleave;
            }

        };

        // Minecraft Advancement
        chat.mc_advancement = function(adv) {

            if (c.show.advancement) {

                if (pg.c.webhook.use) {

                    pg.webhook.send(pg.c.webhook, {
                        username: pg.getDS().username,
                        content: pg.i18(pg.lang.advancement_receive, [adv[0], adv[1]]),
                        avatar_url: pg.c.minecraft.avatar_url.replace("%username%", adv[0])
                    });

                } else if (c.channelID) {
                    pg.dsBot.sendMessage({ to: c.channelID, message: pg.i18(pg.lang.advancement_receive, [adv[0], adv[1]]) });
                }

            }

            return adv;

        };


    }
};

module.exports = chat;