const discordio = {

    start: function(server, lang, conn, c, plugins, i18) {

        console.log(lang.loading_discord + " (Discord.IO)");
        const Discord = require(c.DISCORD_LIB);

        // Start Bot
        const bot = new Discord.Client({ autorun: true, token: c.DISCORD_TOKEN });

        // Send Message
        const sendMessage = function(themessage, callback, timer) {

            if (typeof timer != "number") {
                if (typeof callback == "number") {
                    timer = callback;
                    callback = function() {

                    };
                }
            }

            if (bot.connected == true) {
                if (timer != undefined) {
                    bot.sendMessage(themessage, function(error, mymessage) {

                        if (error) {
                            console.log(error);
                        } else {
                            if (typeof callback == "function") {
                                callback();
                            }
                            server.timeout(function() { bot.deleteMessage({ channelID: themessage.to, messageID: mymessage.id }); }, timer);
                        }

                    });
                } else {
                    bot.sendMessage(themessage, function(error, mymessage) {
                        if (error) {
                            console.log(error);
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
                (!bot.users[bot.id].game) ||
                (
                    (timenow > bot.users[bot.id].game.created_at + timesize) &&
                    (bot.users[bot.id].game.name != value)
                )
            ) {
                bot.setPresence({ game: { name: value } });
            }

        };

        // Ready
        bot.on('ready', function(event) {
            server.online.ds = true;
            console.log(bot.username + ' - ' + bot.id + ' - ' + lang.connected);
            if (server.first.discord) {
                server.first.discord = false;
                console.log(i18(lang.loading_complete, [Date.now() - server.first.timestart]));
            }
        });

        // Reconnect
        bot.on('disconnect', function(erMsg, code) {
            server.online.ds = false;
            console.log(i18(lang.deconnectedDS, [code, erMsg]));
            if (server.shutdown == 0) {
                bot.connect();
            } else if (server.shutdown == 1) {
                process.exit(1);
            } else if (server.shutdown == 3) {
                bot = {};
                bot = new Discord.Client({ autorun: true, token: c.DISCORD_TOKEN });
                bot_generator();
            }
        });

        // Receive Message
        bot.on('message', function(user, userID, channelID, message, event) {
            if ((userID !== bot.id) && (!event.d.bot)) {


                if (c.USE_WEBHOOKS && event.d.webhookID) {
                    return // ignore webhooks if using a webhook
                }

                if (channelID == c.DISCORD_CHANNEL_ID_CHAT) {
                    server.sendMC(event);
                } else if ((channelID == c.DISCORD_CHANNEL_ID_COMMANDS) && message.startsWith("/")) {
                    message = message.substring(1, message.length);
                    conn.command(message, function(err) {
                        if (err) {
                            console.error(lang['[ERROR]'], err);
                            sendMessage({ to: c.DISCORD_CHANNEL_ID_COMMANDS, message: lang['[ERROR]'] + ' ' + JSON.stringify(err) });
                        }
                    });
                } else if (
                    (channelID == c.DISCORD_CHANNEL_ID_BOT) ||
                    (
                        (bot.channels[channelID] == undefined) ||
                        (bot.channels[channelID].guild_id == undefined) ||
                        (bot.channels[channelID].guild_id != null)
                    )
                ) {

                    if (message.startsWith("/minecraftstatus")) {

                        server.forceQuery();

                        server.timeout(function() {
                            if (server.query) {

                                const fields = [{
                                        name: lang.serverip,
                                        value: String(c.MINECRAFT_SERVER_IP) + ":" + String(c.MINECRAFT_SERVER_PORT),
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

                    } else if (message.startsWith("/minecraftplayers")) {

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

                    } else {
                        for (var i = 0; i < plugins.length; i++) {
                            if (typeof plugins[i].mc == "function") {
                                plugins[i].ds(bot, user, userID, channelID, message, event);
                            }
                        }
                    }

                } else {
                    for (var i = 0; i < plugins.length; i++) {
                        if (typeof plugins[i].mc == "function") {
                            plugins[i].ds(bot, user, userID, channelID, message, event);
                        }
                    }
                }

            }
        });

        // Return Discord Callbacks
        discordio.sendMessage = sendMessage;
        discordio.securePresence = securePresence;

    }

};

// Discord.IO
module.exports = discordio;