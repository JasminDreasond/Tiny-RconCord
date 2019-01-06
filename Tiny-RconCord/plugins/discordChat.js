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

            // URL Regex
            regex: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g,

            // Minecraft Message
            minecraftTellraw: function(data) {

                // Prepare
                let removelast = false;
                const username = pg.emojiStrip(data.username);
                const discriminator = data.discriminator;
                data.message = pg.emojiStrip(data.message);
                let text = {
                    msg: data.message.split(chat_st.regex),
                    urls: data.message.match(chat_st.regex),
                    result: ""
                };
                console.log(text);

                let bot = '';

                if (data.bot != "") {
                    bot = " " + c.template.bot_discord.replace('%text%', data.bot);
                }

                // Message
                const message_template = [];

                // Get Username
                for (var i = 0; i < c.template.tellraw.user.length; i++) {
                    if (c.template.tellraw.user[i].text) {

                        message_template.push(Object.create(c.template.tellraw.user[i]));
                        if (message_template[i].text) {
                            message_template[i].text = message_template[i].text
                                .replace('%username%', username)
                                .replace('%discriminator%', discriminator)
                                .replace('%bot%', bot);
                        }

                    }
                }

                // Prepare Message
                let y = 0;
                for (var i = 0; i < text.msg.length; i++) {

                    if (typeof text.msg[i] == "string") {

                        if (
                            (removelast) &&
                            (text.msg[i].startsWith('/'))
                        ) {
                            text.result += text.msg[i].substring(1, text.msg[i].length);
                        } else {
                            text.result += text.msg[i];
                        }

                        removelast = false;

                    } else {

                        if (text.urls[y].endsWith('/')) {
                            removelast = true;
                        }

                        // Insert Text
                        for (var i = 0; i < c.template.tellraw.message.length; i++) {
                            if (c.template.tellraw.message[i].text) {

                                message_template.push(Object.create(c.template.tellraw.message[i]));

                                var x = message_template.length - 1;
                                if (message_template[x].text) {
                                    message_template[x].text = message_template[x].text.replace('%message%', text.result);
                                }

                            }
                        }

                        text.result = '';

                        // Insert URL
                        if (text.urls) {

                            for (var i = 0; i < c.template.tellraw.url.length; i++) {
                                if ((c.template.tellraw.url[i].clickEvent) && (c.template.tellraw.url[i].clickEvent.action == "open_url")) {

                                    message_template.push(Object.create(c.template.tellraw.url[i]));

                                    var x = message_template.length - 1;

                                    message_template[x].text = text.urls[y];
                                    message_template[x].clickEvent.value = text.urls[y];


                                }
                            }

                            y++;
                        }

                    }

                }

                if (text.result != "") {

                    // Insert Text
                    for (var i = 0; i < c.template.tellraw.message.length; i++) {
                        if (c.template.tellraw.message[i].text) {

                            message_template.push(Object.create(c.template.tellraw.message[i]));

                            var x = message_template.length - 1;
                            if (message_template[x].text) {
                                message_template[x].text = message_template[x].text.replace('%message%', text.result);
                            }

                        }
                    }

                }

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