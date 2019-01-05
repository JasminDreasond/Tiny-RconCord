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

const discordjs = {

    start: function(server, lang, c, plugins, i18, log, globalds, json_stringify, request) {

        request({
            method: 'get',
            headers: {
                "Authorization": `Bot ${c.discord.token}`
            },
            url: 'https://discordapp.com/api/oauth2/applications/@me'
        }, function(erroauth, authresponse, oauth) {
            if (!erroauth && authresponse.statusCode == 200) {

                try {
                    oauth = JSON.parse(oauth);
                    discordjs.oauth = oauth;
                } catch (e) {
                    log.error(e);
                    return;
                }

                // Console INFO and get the module
                log.info(lang.loading_discord + " (Discord.js)");
                const Discord = require('discord.js');

                // Start Bot
                discordjs.bot = new Discord.Client({ autoReconnect: true });

                // Send Message System API
                const sendMessage = function(themessage, callback, timer) {

                    if (typeof timer != "number") {
                        if (typeof callback == "number") {
                            timer = callback;
                            callback = function() {

                            };
                        }
                    }

                    if (server.online.ds == true) {
                        if (timer != undefined) {
                            discordjs.bot.channels.get(themessage.to).send(themessage.message, { embed: themessage.embed }).then(function(mymessage) {

                                globalds.last_message = themessage.message;
                                if (typeof callback == "function") { callback(); }
                                mymessage.delete(timer);

                            }).catch(log.info);
                        } else {
                            discordjs.bot.channels.get(themessage.to).send(themessage.message, { embed: themessage.embed }).then(function() {
                                globalds.last_message = themessage.message;
                                if (typeof callback == "function") { callback(); }
                            }).catch(log.info);
                        }
                    } else {
                        setTimeout(function() {
                            sendMessage(themessage, callback, timer);
                        }, 1000);
                    }

                };

                // Secure Presence Changer
                const securePresence = function(value, timenow, timesize) {

                    if (
                        (!discordjs.bot.user.presence) ||
                        (!discordjs.bot.user.presence.game) ||
                        (discordjs.bot.user.presence.game.name != value)
                    ) {
                        discordjs.bot.user.setActivity(value, { type: 'PLAYING' });
                    }

                };

                // Return Discord Callbacks
                discordjs.sendMessage = sendMessage;
                discordjs.securePresence = securePresence;

                // Get Discord Data for plugins (Secure Mode)
                discordjs.getDS = function() {

                    if (discordjs.bot.user.id) {
                        return {
                            avatar: discordjs.bot.user.avatar,
                            bot: discordjs.bot.user.bot,
                            channels: discordjs.bot.channels,
                            connected: server.online.ds,
                            discriminator: discordjs.bot.user.discriminator,
                            id: discordjs.bot.user.id,
                            mfa_enabled: discordjs.bot.user.mfaEnabled,
                            presenceStatus: discordjs.bot.user.presence,
                            servers: discordjs.bot.guilds,
                            username: discordjs.bot.user.username,
                            users: discordjs.bot.users,
                            verified: discordjs.bot.user.verified,
                            oauth: oauth
                        };
                    } else {
                        return null;
                    }

                };

                // Ready
                discordjs.bot.on('ready', function(event) {

                    // Discord Online
                    server.online.ds = true;

                    // Log Info
                    log.info(discordjs.bot.user.username + ' - ' + discordjs.bot.user.id + ' - ' + lang.connected);

                    // Remove First
                    if (server.first.discord) {
                        server.first.discord = false;
                        log.info(i18(lang.loading_complete, [Date.now() - server.first.timestart]));

                    }

                });

                // Reconnect
                discordjs.bot.on('disconnect', function(erMsg, code) {

                    // Discord Offline
                    server.online.ds = false;

                    // Console Info
                    log.info(i18(lang.deconnected_ds, [code, erMsg]));

                    // Detect Shutdown
                    // Exit App
                    if (server.shutdown == 1) {
                        process.exit(1);
                    }

                });

                // Discord Events
                // Async function for plugins with some await
                discordjs.bot.on('raw', async function(event) {


                    if (c.discord.debug) {
                        log.discord(json_stringify(event, null, 2, 100));
                    }

                    if ((event.t == "MESSAGE_CREATE") && (event.d.author.id !== discordjs.bot.id) && (!event.d.bot)) {

                        // Detect if the message is from server or private message
                        if (
                            (event.d.channel_id == c.discord.channelID.bot) &&
                            (typeof discordjs.bot.channels.get(event.d.channel_id) != "undefined") &&
                            (discordjs.bot.channels.get(event.d.channel_id).guild.id)
                        ) {
                            var guildID = discordjs.bot.channels.get(event.d.channel_id).guild.id;
                        } else {
                            var guildID = null;
                        }

                        if ((c.webhook.use) && (event.d.webhook_id == c.webhook.id)) {
                            return; // ignore webhooks if using a webhook
                        }

                        let special_channel = false;

                        // The message is for a special channel?
                        for (var i = 0; i < plugins.length; i++) {
                            if (typeof plugins[i].ds_special_chat == "function") {

                                // Wait the response from the special channel
                                if (await plugins[i].ds_special_chat({
                                        isBot: event.d.author.bot,
                                        webhookID: event.d.webhook_id,
                                        ownerID: oauth.owner.id,
                                        userID: event.d.author.id,
                                        botName: discordjs.bot.user.username,
                                        guildID: guildID,
                                        channelID: event.d.channel_id,
                                        message: event.d.content,
                                        username: event.d.author.username,
                                        discriminator: event.d.author.discriminator
                                    }, event)) {
                                    special_channel = true;
                                };

                            }
                        }

                        if (!special_channel) {

                            // Send Data
                            if (globalds.message({
                                    isBot: event.d.author.bot,
                                    webhookID: event.d.webhook_id,
                                    ownerID: oauth.owner.id,
                                    userID: event.d.author.id,
                                    botName: discordjs.bot.user.username,
                                    guildID: guildID,
                                    channelID: event.d.channel_id,
                                    message: event.d.content,
                                    username: event.d.author.username,
                                    discriminator: event.d.author.discriminator
                                })) {

                                // If the message is a normal message... Send the message data to Plugins
                                for (var i = 0; i < plugins.length; i++) {
                                    if (typeof plugins[i].ds_chat == "function") {
                                        plugins[i].ds_chat({
                                            isBot: event.d.author.bot,
                                            webhookID: event.d.webhook_id,
                                            ownerID: oauth.owner.id,
                                            userID: event.d.author.id,
                                            botName: discordjs.bot.user.username,
                                            guildID: guildID,
                                            channelID: event.d.channel_id,
                                            message: event.d.content,
                                            username: event.d.author.username,
                                            discriminator: event.d.author.discriminator
                                        }, event);
                                    }
                                }

                            }

                        }

                    } else {

                        // All the Discord Events will be send to plugins here
                        for (var i = 0; i < plugins.length; i++) {
                            if (typeof plugins[i].ds_any == "function") {
                                plugins[i].ds_any(event);
                            }
                        }

                    }


                });

                discordjs.bot.login(c.discord.token);

            } else {
                log.error(erroauth);
            }

        });

    }

};

// Discord.IO
module.exports = discordjs;