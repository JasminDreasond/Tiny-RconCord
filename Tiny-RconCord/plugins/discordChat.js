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

            curtmsg: function(message, repeat = false, number = 0) {
                if ((message.length > 256) || (pg.hexC.controlled(message).length > 256)) {

                    if (!repeat) {
                        return [chat_st.curtmsg(message.substring(0, 256 - number), true, 50), true];
                    } else {
                        return chat_st.curtmsg(message.substring(0, 256 - number), true, number + 20);
                    }

                } else {
                    if (!repeat) {
                        return [message, false];
                    } else {
                        return message;
                    }
                }
            },

            // Minecraft Message
            minecraftTellraw: function(data) {

                data.message = chat_st.curtmsg(data.message);

                if (data.message[1]) {
                    data.message = data.message[0] + '(...) [' + pg.lang.ds_message_cut + ']'
                } else {
                    data.message = data.message[0];
                }

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

                            if ((message_template[i].hoverEvent) &&
                                (typeof message_template[i].hoverEvent.action == "string") &&
                                (message_template[i].hoverEvent.action == "show_text")) {

                                message_template[i].hoverEvent = {
                                    "action": "show_text",
                                    "value": pg.hexC.controlled(pg.i18(pg.lang.discord_account, [username + "#" + discriminator]), true)
                                };
                                message_template[i].insertion = "<@" + pg.hexC.controlled(username + "#" + discriminator) + ">";

                            } else {

                                message_template[i].hoverEvent = {
                                    "action": "none"
                                };
                                message_template[i].insertion = "";

                            }

                        }
                    }
                }

                // Prepare Message
                for (var i = 0; i < text.msg.length; i++) {

                    if ((typeof text.msg[i] == "string") && (
                            (!text.msg[i].startsWith('http')) ||
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

                                message_template[i].hoverEvent = {
                                    "action": "none"
                                };
                                message_template[i].insertion = "";

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

                                message_template[i].hoverEvent = {
                                    "action": "none"
                                };
                                message_template[i].insertion = "";

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

                            message_template[i].hoverEvent = {
                                "action": "none"
                            };
                            message_template[i].insertion = "";

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
                    userID: data.userID,
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

        // Discord to Minecraft Chat
        chat.ds_special_chat = function(data, event) {

            const ds_data = pg.dsBot.getDS();

            if ((data.channelID == c.channelID) && (data.userID != ds_data.id)) {

                // Attachments
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

                // Mentions
                if (event.d.mentions.length > 0) {

                    for (var i = 0; i < event.d.mentions.length; i++) {

                        data.message = data.message.replace(new RegExp(event.d.mentions[i].id),
                            event.d.mentions[i].username + '#' +
                            event.d.mentions[i].discriminator);

                    }

                }
                if (event.d.mention_roles.length > 0) {

                    for (var i = 0; i < event.d.mention_roles.length; i++) {

                        if (pg.c.discord.lib == "discord.js") {
                            data.message = data.message.replace(new RegExp(event.d.mention_roles[i]),
                                ds_data.servers.get(event.d.guild_id).roles.get(event.d.mention_roles[i]).name);
                        } else {
                            data.message = data.message.replace(new RegExp(event.d.mention_roles[i]),
                                ds_data.servers[event.d.guild_id].roles[event.d.mention_roles[i]].name);
                        }

                    }

                }

                try {

                    data.message = data.message.replace(/<#(.+?)>/g, function(e) {

                        if (pg.c.discord.lib == "discord.js") {
                            return "#" + ds_data.servers.get(event.d.guild_id).channels.get(e.substring(2, e.length - 1)).name;
                        } else {
                            return "#" + ds_data.servers[event.d.guild_id].channels[e.substring(2, e.length - 1)].name;
                        }

                    });

                } catch (e) {}

                // Send Message
                if (data.message.replace(" ", "").length > 0) {

                    if (!data.isBot) {

                        if (pg.c.chatLog) {
                            pg.log.chat(data.username + "#" + data.discriminator, data.message);
                        }
                        chat_st.sendMC(data.message, {
                            userID: data.userID,
                            username: data.username,
                            discriminator: data.discriminator,
                            bot: ""
                        });

                    } else {

                        if (pg.c.chatLog) {
                            pg.log.chat(data.username + "#" + data.discriminator + " (" + pg.lang.bot.toUpperCase() + ")", data.message);
                        }
                        chat_st.sendMC(data.message, {
                            userID: data.userID,
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
        let guildID;
        chat.mc_chat = function(user, message) {

            if (user) {

                const ds_data = pg.dsBot.getDS();

                if (!guildID) {
                    if (pg.c.discord.lib == "discord.js") {
                        guildID = ds_data.channels.get(c.channelID).guild.id;
                    } else {
                        guildID = ds_data.channels[c.channelID].guild.id;
                    }
                }

                if (ds_data) {

                    // Channel
                    try {
                        message = message.replace(/<#(.+?)>/g, function(e) {
                            return "<#" + ds_data.guildsNM[guildID].channels[e.substring(2, e.length - 1)] + ">";
                        });
                    } catch (e) {}

                    // Role
                    try {
                        message = message.replace(/<@&(.+?)>/g, function(e) {
                            return "<@&" + ds_data.guildsNM[guildID].roles[e.substring(3, e.length - 1)] + ">";
                        });
                    } catch (e) {}

                    // Username
                    try {
                        message = message.replace(/<@!(.+?)#(\d{4})>/g, function(e) {
                            return "<@!" + ds_data.usernames[e.substring(3, e.length - 1)] + ">";
                        });
                    } catch (e) {}

                    try {
                        message = message.replace(/<@(.+?)#(\d{4})>/g, function(e) {
                            return "<@" + ds_data.usernames[e.substring(2, e.length - 1)] + ">";
                        });
                    } catch (e) {}

                    // Add everymine
                    message = message.replace(/\@everymine/g, "<@&" + c.everymine + ">");

                    const clearUsername = user.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

                    if (pg.c.webhook.use) {

                        pg.webhook.send(pg.c.webhook, {
                            username: clearUsername,
                            content: message,
                            avatar_url: pg.c.minecraft.avatar_url.replace("%username%", clearUsername)
                        }).catch(function(err) {
                            if (err) {
                                pg.log.error(err);
                                pg.dsBot.sendMessage({ to: c.channelID, message: chat_st.discordMessage(clearUsername, message) });
                            }
                        });

                    } else if (c.channelID) {
                        pg.dsBot.sendMessage({ to: c.channelID, message: chat_st.discordMessage(user, message) });
                    }

                }

            }

            return [user, message];

        };

        // Send Base
        const sendNotiMine = function(username, tlang, extra) {

            if (c.show.join) {

                const ds_data = pg.dsBot.getDS();

                if (ds_data) {

                    if (pg.c.webhook.use) {

                        pg.webhook.send(pg.c.webhook, {
                            username: ds_data.username,
                            content: pg.i18(tlang, extra),
                            avatar_url: pg.c.minecraft.avatar_url.replace("%username%", username)
                        }).catch(function(err) {
                            if (err) {
                                pg.log.error(err);
                                pg.dsBot.sendMessage({ to: c.channelID, message: pg.i18(tlang, extra) });
                            }
                        });

                    } else if (c.channelID) {

                        pg.dsBot.sendMessage({ to: c.channelID, message: pg.i18(tlang, extra) });

                    }

                }

            }

            return username;

        };

        // Minecraft Join
        chat.mc_join = function(userjoin) {
            return sendNotiMine(userjoin, pg.lang.user_join, [userjoin]);
        };

        // Minecraft Leave
        chat.mc_leave = function(userleave) {
            return sendNotiMine(userleave, pg.lang.user_leave, [userleave]);
        };

        // Minecraft Advancement
        chat.mc_advancement = function(user, advancement) {
            return [sendNotiMine(user, pg.lang.advancement_receive, [user, advancement]), advancement];
        };


    }
};

module.exports = chat;