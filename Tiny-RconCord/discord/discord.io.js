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

const discordio = {

    start: function(server, lang, c, plugins, i18, log, globalds, json_stringify) {

        // Console INFO and get the module
        log.info(lang.loading_discord + " (Discord.IO)");
        const Discord = require('discord.io');

        // Start Bot
        discordio.bot = new Discord.Client({ autorun: true, token: c.discord.token });
        discordio.bot.usernames = {};
        discordio.bot.guildsNM = {};

        // Send Message System API
        const sendMessage = function(themessage, callback, timer) {

            if (typeof timer != "number") {
                if (typeof callback == "number") {
                    timer = callback;
                    callback = function() {

                    };
                }
            }

            if (discordio.bot.connected == true) {
                if (timer != undefined) {
                    discordio.bot.sendMessage(themessage, function(error, mymessage) {

                        if (error) {
                            log.info(error);
                        } else {
                            globalds.last_message = themessage.message;
                            if (typeof callback == "function") {
                                callback();
                            }
                            server.timeout(function() { discordio.bot.deleteMessage({ channelID: themessage.to, messageID: mymessage.id }); }, timer);
                        }

                    });
                } else {
                    discordio.bot.sendMessage(themessage, function(error, mymessage) {
                        if (error) {
                            log.info(error);
                        } else if (typeof callback == "function") {
                            globalds.last_message = themessage.message;
                            callback();
                        }
                    });
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
                (!discordio.bot.users[discordio.bot.id].game) ||
                (
                    (timenow > discordio.bot.users[discordio.bot.id].game.created_at + timesize) &&
                    (discordio.bot.users[discordio.bot.id].game.name != value)
                )
            ) {
                discordio.bot.setPresence({ game: { name: value } });
            }

        };

        // Return Discord Callbacks
        discordio.sendMessage = sendMessage;
        discordio.securePresence = securePresence;

        // Get Discord Data for plugins (Secure Mode)
        discordio.getDS = function() {

            if (discordio.bot.id) {
                return {
                    guildsNM: discordio.bot.guildsNM,
                    usernames: discordio.bot.usernames,
                    avatar: discordio.bot.avatar,
                    bot: discordio.bot.bot,
                    channels: discordio.bot.channels,
                    connected: discordio.bot.connected,
                    discriminator: discordio.bot.discriminator,
                    id: discordio.bot.id,
                    mfa_enabled: discordio.bot.mfa_enabled,
                    presenceStatus: discordio.bot.presenceStatus,
                    servers: discordio.bot.servers,
                    username: discordio.bot.username,
                    users: discordio.bot.users,
                    verified: discordio.bot.verified,
                    oauth: discordio.bot.internals.oauth
                };
            } else {
                return null;
            }

        };

        // Ready
        discordio.bot.on('ready', function(event) {

            // Discord Online
            server.online.ds = true;

            // Log Info
            log.info(discordio.bot.username + ' - ' + discordio.bot.id + ' - ' + lang.connected);

            // Remove First
            if (server.first.discord) {
                server.first.discord = false;
                log.info(i18(lang.loading_complete, [Date.now() - server.first.timestart]));

            }

        });

        // Reconnect
        discordio.bot.on('disconnect', function(erMsg, code) {

            // Discord Offline
            server.online.ds = false;

            // Console Info
            log.info(i18(lang.deconnected_ds, [code, erMsg]));

            // Detect Shutdown 

            // Free to reconnect
            if (server.shutdown == 0) {
                discordio.bot.connect();
            }

            // Exit App
            else if (server.shutdown == 1) {
                process.exit(1);
            }

        });

        // Discord Events
        // Async function for plugins with some await
        discordio.bot.on('any', async function(event) {

            if (c.discord.debug) {
                log.discord(json_stringify(event, null, 2, 100));
            }

            // Username
            if (event.t == "GUILD_CREATE") {

                for (var items in event.d.members) {
                    tinyUpName.addUser(event.d.members[items].user.username, event.d.members[items].user.discriminator, event.d.members[items].user.id);
                }

                for (var items in event.d.channels) {
                    tinyUpName.add(event.d.id, 'channels', event.d.channels[items].name, event.d.channels[items].id);
                }

                for (var items in event.d.roles) {
                    tinyUpName.add(event.d.id, 'roles', event.d.roles[items].name, event.d.roles[items].id);
                }

            } else if (event.t == "GUILD_REMOVE") {

                for (var items in event.d.members) {
                    tinyUpName.deleteUser(event.d.members[items].user.username, event.d.members[items].user.discriminator);
                }

                tinyUpName.remove(event.d.id);

            }

            if ((event.t == "MESSAGE_CREATE") && (event.d.author.id !== discordio.bot.id) && (!event.d.bot)) {

                // Detect if the message is from server or private message
                if (
                    (event.d.channel_id == c.discord.channelID.bot) &&
                    (typeof discordio.bot.channels[event.d.channel_id] != "undefined") &&
                    (discordio.bot.channels[event.d.channel_id].guild_id)
                ) {
                    var guildID = discordio.bot.channels[event.d.channel_id].guild_id;
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
                                ownerID: discordio.bot.internals.oauth.owner.id,
                                userID: event.d.author.id,
                                botName: discordio.bot.username,
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
                            ownerID: discordio.bot.internals.oauth.owner.id,
                            userID: event.d.author.id,
                            botName: discordio.bot.username,
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
                                    ownerID: discordio.bot.internals.oauth.owner.id,
                                    userID: event.d.author.id,
                                    botName: discordio.bot.username,
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

        // Update Username
        const tinyUpName = {
            add: function(guildID, type, name, id, old) {
                if (!discordio.bot.guildsNM[guildID]) {
                    discordio.bot.guildsNM[guildID] = {
                        channels: {},
                        roles: {}
                    };
                }
                if ((typeof type == "string") && (typeof name == "string") && ((typeof id == "string") || (typeof id == "number"))) {

                    if (old) {
                        delete discordio.bot.guildsNM[guildID][type][old];
                    }
                    discordio.bot.guildsNM[guildID][type][name] = id;

                }
            },
            remove: function(guildID, type, name) {
                if ((typeof type == "string") && (typeof name == "string")) {
                    delete discordio.bot.guildsNM[guildID][type][name];
                } else if (typeof type != "string") {
                    delete discordio.bot.guildsNM[guildID];
                }
            },
            addUser: function(username, discriminator, id, OLDusername, OLDdiscriminator) {
                if (discriminator != "0000") {
                    discordio.bot.usernames[username + "#" + discriminator] = id;
                }
                if ((typeof OLDusername == "string") && (typeof OLDusername == "string") && (OLDdiscriminator != "0000")) {
                    discordio.bot.usernames[OLDusername + "#" + OLDdiscriminator] = id;
                }
            },
            deleteUser: function(username, discriminator) {

                var confirmed = false;
                for (var x = 0; x < discordio.bot.servers.length; x++) {

                    if (!confirmed) {

                        for (var i = 0; i < discordio.bot.servers[x].members.length; i++) {
                            if (!confirmed) {
                                if ((discordio.bot.servers[x].members[i].user.username == username) && (discordio.bot.servers[x].members[i].user.discriminator == discriminator)) {
                                    confirmed = true;
                                }
                            }
                        }

                    }

                };

                if (!confirmed) {
                    delete discordio.bot.usernames[username + "#" + discriminator];
                }

            },
            guildUser: function(user) {
                tinyUpName.addUser(user.user.username, user.user.discriminator, user.user.id);
            },
            channelST: function(channel, old) {
                tinyUpName.add(discordio.channels.get(channel.id).guild.id, 'channels', channel.name, channel.id, old.name);
            },
            roleST: function(role, old) {
                tinyUpName.add(role.guild.id, 'roles', role.name, role.id, old.name);
            }
        };

        discordio.bot.on('channelCreate', tinyUpName.channelST);
        discordio.bot.on('channelUpdate', function(old, newCh) {
            tinyUpName.channelST(newCh, old);
        });
        discordio.bot.on('channelDelete', function(channel) {
            tinyUpName.remove(discordio.channels.get(channel.id).guild.id, 'channels', channel.name);
        });

        discordio.bot.on('roleCreate', tinyUpName.roleST);
        discordio.bot.on('roleUpdate', function(old, roleCh) {
            tinyUpName.roleST(roleCh, old);
        });
        discordio.bot.on('roleDelete', function(role) {
            tinyUpName.remove(role.guild.id, 'roles', role.name);
        });

        discordio.bot.on('guildMemberAvailable', tinyUpName.guildUser);

        discordio.bot.on('guildMemberAdd', tinyUpName.guildUser);

        discordio.bot.on('guildMemberRemove', function(user) {
            tinyUpName.deleteUser(user.user.username, user.user.discriminator);
        });

        discordio.bot.on('guildMemberUpdate', function(old, newuser) {
            tinyUpName.addUser(newuser.user.username, newuser.user.discriminator, newuser.id);
        });

        discordio.bot.on('userUpdate', function(old, newuser) {
            tinyUpName.addUser(newuser.username, newuser.discriminator, newuser.id, old.username, old.discriminator);
        });

    }

};

// Discord.IO
module.exports = discordio;