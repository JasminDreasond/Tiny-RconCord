const discordio = {

    start: function(server, lang, conn, c, plugins, i18, log, globalds) {

        // Console INFO and get the module
        log.info(lang.loading_discord + " (Discord.IO)");
        const Discord = require('discord.io');

        // Start Bot
        discordio.bot = new Discord.Client({ autorun: true, token: c.discord.token });

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
            log.info(i18(lang.deconnectedDS, [code, erMsg]));

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

        // Receive Message
        discordio.bot.on('message', function(user, userID, channelID, message, event) {
            if ((userID !== discordio.bot.id) && (!event.d.bot)) {

                // Detect if the message is from server or private message
                if (
                    (channelID == c.discord.channelID.bot) &&
                    (typeof discordio.bot.channels[channelID] != "undefined") &&
                    (discordio.bot.channels[channelID].guild_id)
                ) {
                    var guildID = discordio.bot.channels[channelID].guild_id;
                } else {
                    var guildID = null;
                }

                // Send Data
                if (globalds.message({
                        webhookID: event.d.webhookID,
                        ownerID: discordio.bot.internals.oauth.owner.id,
                        userID: userID,
                        botName: discordio.bot.username,
                        guildID: guildID,
                        channelID: channelID,
                        message: message,
                        username: event.d.author.username,
                        discriminator: event.d.author.discriminator
                    })) {

                    // If the message is a normal message... Send the message data to Plugins
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