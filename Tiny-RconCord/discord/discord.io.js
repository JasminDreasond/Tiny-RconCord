const discordio = {

    start: function(server, lang, conn, c, plugins, i18, log) {

        log.info(lang.loading_discord + " (Discord.IO)");
        const Discord = require(c.discord.lib);

        // Start Bot
        discordio.bot = new Discord.Client({ autorun: true, token: c.discord.token });

        // Send Message
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
                    avatar: discordio.bot.avatar,
                    bot: discordio.bot.bot,
                    channels: discordio.bot.channels,
                    connected: discordio.bot.connected,
                    directMessages: discordio.bot.directMessages,
                    discriminator: discordio.bot.discriminator,
                    id: discordio.bot.id,
                    inviteURL: discordio.bot.inviteURL,
                    mfa_enabled: discordio.bot.mfa_enabled,
                    presenceStatus: discordio.bot.presenceStatus,
                    servers: discordio.bot.servers,
                    username: discordio.bot.username,
                    users: discordio.bot.users,
                    verified: discordio.bot.verified,
                    internals: {
                        heartbeat: discordio.bot.internals.heartbeat,
                        sequence: discordio.bot.internals.sequence,
                        version: discordio.bot.internals.version,
                        settings: discordio.bot.internals.settings,
                        oauth: discordio.bot.internals.oauth
                    }
                };
            } else {
                return null;
            }

        };

        // Ready
        discordio.bot.on('ready', function(event) {
            server.online.ds = true;
            log.info(discordio.bot.username + ' - ' + discordio.bot.id + ' - ' + lang.connected);
            if (server.first.discord) {
                server.first.discord = false;
                log.info(i18(lang.loading_complete, [Date.now() - server.first.timestart]));
            }
        });

        // Reconnect
        discordio.bot.on('disconnect', function(erMsg, code) {
            server.online.ds = false;
            log.info(i18(lang.deconnectedDS, [code, erMsg]));
            if (server.shutdown == 0) {
                discordio.bot.connect();
            } else if (server.shutdown == 1) {
                process.exit(1);
            } else if (server.shutdown == 3) {
                discordio.bot = {};
                discordio.bot = new Discord.Client({ autorun: true, token: c.discord.token });
                bot_generator();
            }
        });

        // Receive Message
        discordio.bot.on('message', function(user, userID, channelID, message, event) {
            if ((userID !== discordio.bot.id) && (!event.d.bot)) {


                if (c.webhook.part.use && event.d.webhookID) {
                    return // ignore webhooks if using a webhook
                }

                if (channelID == c.discord.channelID.chat) {
                    if (message.replace(" ", "").length > 0) {
                        server.sendMC(event);
                    }
                } else if ((channelID == c.discord.channelID.commands) && message.startsWith(c.discord.prefix)) {
                    message = message.substring(1, message.length);
                    conn.command(message, function(err) {
                        if (err) {
                            log.error(err);
                            sendMessage({ to: c.discord.channelID.commands, message: lang['[ERROR]'] + ' ' + JSON.stringify(err) });
                        }
                    });
                } else if (
                    (channelID == c.discord.channelID.bot) ||
                    (
                        (discordio.bot.channels[channelID] == undefined) ||
                        (discordio.bot.channels[channelID].guild_id == undefined) ||
                        (discordio.bot.channels[channelID].guild_id != null)
                    )
                ) {

                    if (message.startsWith(c.discord.prefix + "minecraftstatus")) {

                        server.forceQuery();

                        server.timeout(function() {
                            if (server.query) {

                                const fields = [{
                                        name: lang.serverip,
                                        value: String(c.minecraft.serverIP) + ":" + String(c.minecraft.port),
                                        inline: true
                                    },
                                    {
                                        name: lang.players,
                                        value: String(server.query.numplayers) + "/" + String(server.query.maxplayers),
                                        inline: true
                                    },
                                    {
                                        name: lang.mineversion,
                                        value: String(server.query.version),
                                        inline: true
                                    },
                                    {
                                        name: lang.gameid,
                                        value: String(server.query.game_id),
                                        inline: true
                                    },
                                    {
                                        name: lang.gametype,
                                        value: String(server.query.gametype),
                                        inline: true
                                    },
                                    {
                                        name: lang.type,
                                        value: String(server.query.type),
                                        inline: true
                                    }
                                ];

                                if (server.query.plugins) {
                                    fields.push({
                                        name: lang.plugins,
                                        value: String(server.query.plugins)
                                    });
                                }

                                sendMessage({
                                    "to": channelID,
                                    "embed": {
                                        "title": lang.minecraftserver + " " + String(server.query.hostname),
                                        "fields": fields
                                    }
                                });

                            } else {
                                sendMessage({
                                    "to": channelID,
                                    "message": lang.offlineserver
                                });
                            }

                        }, 500);

                    } else if (message.startsWith(c.discord.prefix + "minecraftplayers")) {

                        server.forceQuery();

                        server.timeout(function() {
                            if (server.query) {

                                const fields = [];

                                if (server.query.player_.length > 0) {
                                    for (var i = 0; i < server.query.player_.length; i++) {
                                        fields.push({
                                            name: String(i + 1),
                                            value: String(server.query.player_[i]),
                                            inline: true
                                        });
                                    }
                                } else {
                                    fields.push({
                                        name: lang.emptylist,
                                        value: lang.noneplayers
                                    });
                                }

                                sendMessage({
                                    "to": channelID,
                                    "embed": {
                                        "title": lang.minecraftserver + " " + String(server.query.hostname),
                                        "fields": fields
                                    }
                                });

                            } else {
                                sendMessage({
                                    "to": channelID,
                                    "message": lang.offlineserver
                                });
                            }

                        }, 500);

                    } else if (message.startsWith(c.discord.prefix + "nodeplugins")) {

                        server.timeout(function() {

                            if (userID == discordio.bot.internals.oauth.owner.id) {

                                const fields = [];

                                if (plugins.length > 0) {
                                    for (var i = 0; i < plugins.length; i++) {

                                        if (plugins.issues) {

                                            fields.push({
                                                name: plugins[i].name + " (" + plugins[i].version + ")",
                                                value: plugins[i].author +
                                                    "\n" + lang.dspage + " " + +plugins[i].page +
                                                    "\n" + lang.dsissues + " " + +plugins[i].issues
                                            });

                                        } else {

                                            fields.push({
                                                name: plugins[i].name + " (" + plugins[i].version + ")",
                                                value: plugins[i].author +
                                                    "\n" + lang.dspage + " " + plugins[i].page
                                            });

                                        }

                                    }
                                } else {
                                    fields.push({
                                        name: lang.emptylist,
                                        value: lang.noneplugins
                                    });
                                }

                                sendMessage({
                                    "to": channelID,
                                    "embed": {
                                        "title": lang.plugins + " - " + discordio.bot.username,
                                        "fields": fields
                                    }
                                });

                            } else {

                                sendMessage({
                                    "to": channelID,
                                    "message": lang.nopermission
                                });

                            }

                        }, 500);

                    } else {
                        for (var i = 0; i < plugins.length; i++) {
                            if (typeof plugins[i].mc == "function") {
                                plugins[i].ds(user, userID, channelID, message, event);
                            }
                        }
                    }

                } else {
                    for (var i = 0; i < plugins.length; i++) {
                        if (typeof plugins[i].mc == "function") {
                            plugins[i].ds(user, userID, channelID, message, event);
                        }
                    }
                }

            }
        });

    }

};

// Discord.IO
module.exports = discordio;