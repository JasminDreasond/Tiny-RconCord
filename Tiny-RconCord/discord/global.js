const globalds = {

    start: function(c, lang, conn, server, plugins, log) {

        globalds.message = function(data) {

            if ((c.webhook.use) && (data.webhookID == c.webhook.id)) {
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
                        server.ds.sendMessage({ to: c.discord.channelID.rcon, message: lang['[ERROR]'] + ' ' + JSON.stringify(err) });
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
                                    name: lang.server_ip,
                                    value: String(c.minecraft.serverIP) + ":" + String(c.minecraft.port),
                                    inline: true
                                },
                                {
                                    name: lang.players,
                                    value: String(server.query.numplayers) + "/" + String(server.query.maxplayers),
                                    inline: true
                                },
                                {
                                    name: lang.mine_version,
                                    value: String(server.query.version),
                                    inline: true
                                },
                                {
                                    name: lang.game_id,
                                    value: String(server.query.gameid),
                                    inline: true
                                },
                                {
                                    name: lang.game_type,
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

                            server.ds.sendMessage({
                                "to": data.channelID,
                                "embed": {
                                    "title": lang.minecraft_server + " " + String(server.query.hostname),
                                    "fields": fields
                                }
                            });

                        } else {
                            server.ds.sendMessage({
                                "to": data.channelID,
                                "message": lang.offline_server
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
                                    name: lang.empty_list,
                                    value: lang.no_players
                                });
                            }

                            server.ds.sendMessage({
                                "to": data.channelID,
                                "embed": {
                                    "title": lang.minecraft_server + " " + String(server.query.hostname),
                                    "fields": fields
                                }
                            });

                        } else {
                            server.ds.sendMessage({
                                "to": data.channelID,
                                "message": lang.offline_server
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
                                                "\n" + lang.ds_page + " " + +plugins[i].page +
                                                "\n" + lang.ds_issues + " " + +plugins[i].issues
                                        });

                                    } else {

                                        fields.push({
                                            name: plugins[i].name + " (" + plugins[i].version + ")",
                                            value: plugins[i].author +
                                                "\n" + lang.ds_page + " " + plugins[i].page
                                        });

                                    }

                                }
                            } else {
                                fields.push({
                                    name: lang.empty_list,
                                    value: lang.no_plugins
                                });
                            }

                            server.ds.sendMessage({
                                "to": data.channelID,
                                "embed": {
                                    "title": lang.plugins + " - " + data.botName,
                                    "fields": fields
                                }
                            });

                        } else {

                            server.ds.sendMessage({
                                "to": data.channelID,
                                "message": lang.no_permission
                            });

                        }

                    }, 500);

                    return false;

                }

                // Help
                else if (data.message.startsWith(c.discord.prefix + "help")) {

                    server.timeout(function() {

                        const fields = [];

                        if (server.query) {

                            fields.push({
                                name: c.discord.prefix + "minecraftstatus",
                                value: lang.help_minecraftstatus
                            });

                            fields.push({
                                name: c.discord.prefix + "minecraftplayers",
                                value: lang.help_minecraftplayers
                            });

                        }

                        if (data.userID == data.ownerID) {

                            fields.push({
                                name: c.discord.prefix + "nodeplugins",
                                value: lang.help_nodeplugins
                            });

                        }

                        if (plugins.length > 0) {
                            for (var i = 0; i < plugins.length; i++) {
                                if (typeof plugins[i].help == "function") {
                                    var tinyhelp = plugins[i].help();
                                    if (tinyhelp.length > 0) {
                                        for (var x = 0; x < tinyhelp.length; x++) {
                                            fields.push({
                                                name: tinyhelp[x].name,
                                                value: tinyhelp[x].value,
                                                inline: tinyhelp[x].inline
                                            });
                                        }
                                    }
                                }
                            }
                        }

                        server.ds.sendMessage({
                            "to": data.channelID,
                            "embed": {
                                "title": lang.help,
                                "fields": fields
                            }
                        });

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