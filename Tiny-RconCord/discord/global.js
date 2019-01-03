const globalds = {

    start: function(c, lang, conn, server, plugins, log) {

        globalds.message = function(data) {

            if (c.webhook.use && data.webhookID) {
                return false; // ignore webhooks if using a webhook
            }

            // Minecraft Chat Message
            if (data.channelID == c.discord.channelID.chat) {

                if (data.message.replace(" ", "").length > 0) {

                    if (!data.isBot) {

                        if (c.chatLog) {
                            log.chat(data.username + "#" + data.discriminator, data.message);
                        }
                        server.sendMC(data.message, {
                            type: "user",
                            username: data.username,
                            discriminator: data.discriminator,
                            bot: ""
                        });

                    } else {

                        if (c.chatLog) {
                            log.chat(data.username + "#" + data.discriminator + " (" + lang.bot.toUpperCase() + ")", data.message);
                        }
                        server.sendMC(data.message, {
                            type: "user",
                            username: data.username,
                            discriminator: data.discriminator,
                            bot: lang.bot.toUpperCase()
                        });

                    }

                }

                return false;

            }

            // RCON Message
            else if ((data.channelID == c.discord.channelID.rcon) && data.message.startsWith(c.discord.prefix)) {

                data.message = data.message.substring(1, data.message.length);
                conn.command(data.message, function(err) {
                    if (err) {
                        log.error(err);
                        sendMessage({ to: c.discord.channelID.rcon, message: lang['[ERROR]'] + ' ' + JSON.stringify(err) });
                    }
                });

                return false;

            }

            // Chat Bot Message
            else if ((data.channelID == c.discord.channelID.bot) || (!data.guildID)) {

                // Server Status
                if (data.message.startsWith(c.discord.prefix + "minecraftstatus")) {

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
                                "to": data.channelID,
                                "embed": {
                                    "title": lang.minecraftserver + " " + String(server.query.hostname),
                                    "fields": fields
                                }
                            });

                        } else {
                            sendMessage({
                                "to": data.channelID,
                                "message": lang.offlineserver
                            });
                        }

                    }, 500);

                    return false;

                }

                // Server Players
                else if (data.message.startsWith(c.discord.prefix + "minecraftplayers")) {

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
                                "to": data.channelID,
                                "embed": {
                                    "title": lang.minecraftserver + " " + String(server.query.hostname),
                                    "fields": fields
                                }
                            });

                        } else {
                            sendMessage({
                                "to": data.channelID,
                                "message": lang.offlineserver
                            });
                        }

                    }, 500);

                    return false;

                }

                // Node Plugins
                else if (data.message.startsWith(c.discord.prefix + "nodeplugins")) {

                    server.timeout(function() {

                        if (data.userID == data.ownerID) {

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
                                "to": data.channelID,
                                "embed": {
                                    "title": lang.plugins + " - " + data.botName,
                                    "fields": fields
                                }
                            });

                        } else {

                            sendMessage({
                                "to": data.channelID,
                                "message": lang.nopermission
                            });

                        }

                    }, 500);

                    return false;

                }

                // Nothing
                else {
                    return true;
                }

            }

            // Nothing
            else {
                return true;
            }


        }

    }

};

module.exports = globalds;