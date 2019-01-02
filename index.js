module.exports = function() {

    //const mineflayer = require('mineflayer');
    const Rcon = require('./lib/rcon.js');
    const c = require('./config.json');
    const lang = require('./i18/' + c.LANG + '.json');
    const emojiStrip = require('emoji-strip');
    const Discord = require('discord.io');
    const mcquery = require('./lib/mcquery.js');
    const fs = require('fs');

    if (c.SERVER_FOLDER) {
        var Tail = require('tail').Tail;
    }

    function makeMinecraftTellraw(message) {

        const username = emojiStrip(message.d.author.username);
        const discriminator = message.d.author.discriminator;
        let text = emojiStrip(message.d.content);

        text = text.replace(/[ÀÁÂÃÄÅ]/, "A");
        text = text.replace(/[àáâãäå]/, "a");
        text = text.replace(/[ÈÉÊË]/, "E");
        text = text.replace(/[èéêë]/, "e");
        text = text.replace(/[ÒÓôö]/, "O");
        text = text.replace(/[òóôö]/, "o");
        text = text.replace(/[Ç]/, "C");
        text = text.replace(/[ç]/, "c");

        return c.MINECRAFT_TELLRAW_TEMPLATE
            .replace('%username%', username)
            .replace('%discriminator%', discriminator)
            .replace('%message%', text);

    };

    function makeDiscordMessage(username, message) {
        // make a discord message string by formatting the configured template with the given parameters
        return c.DISCORD_MESSAGE_TEMPLATE
            .replace('%username%', username)
            .replace('%message%', message)
    }

    function i18(text, replaces) {

        for (var i = 0; i < replaces.length; i++) {
            text = text.replace("{" + i + "}", replaces[i]);
        }

        return text;

    }

    // Server

    const server = {

        online: { ds: false, mc: false },
        first: {
            discord: true,
            rcon: true,
            timestart: new Date()
        },
        shutdown: 0,

        forceQuery: null,
        query: null,

        timeout: function(callback, timer) {
            setTimeout(function() {
                if (server.online.ds == true) { callback(); } else {
                    if (timer < 1000) {
                        timer = 1000;
                    }
                    server.timeout(callback, timer);
                }
            }, timer);
        },

        securePresence: function(value, timenow, timesize) {

            if (
                (!server.send.dsbot.users[server.send.dsbot.id].game) ||
                (
                    (timenow > server.send.dsbot.users[server.send.dsbot.id].game.created_at + timesize) &&
                    (server.send.dsbot.users[server.send.dsbot.id].game.name != value)
                )
            ) {
                server.send.dsbot.setPresence({ game: { name: value } });
            }

        },

        send: {

            dsbot: null,

            ds: function(themessage, callback, timer) {

                if (typeof timer != "number") {
                    if (typeof callback == "number") {
                        timer = callback;
                        callback = function() {

                        };
                    }
                }

                if (server.send.dsbot.connected == true) {
                    if (timer != undefined) {
                        server.send.dsbot.sendMessage(themessage, function(error, mymessage) {

                            if (error) {
                                console.log(error);
                            } else {
                                if (typeof callback == "function") {
                                    callback();
                                }
                                server.timeout(function() { server.send.dsbot.deleteMessage({ channelID: themessage.to, messageID: mymessage.id }); }, timer);
                            }

                        });
                    } else {
                        server.send.dsbot.sendMessage(themessage, function(error, mymessage) {
                            if (error) {
                                console.log(error);
                            } else if (typeof callback == "function") {
                                callback();
                            }
                        });
                    }
                } else {
                    setTimeout(function() {
                        server.send.ds(themessage, callback, timer);
                    }, 1000);
                }

            },

            mc: function(message) {
                conn.command('tellraw @a ' + makeMinecraftTellraw(message), function(err) {
                    if (err) {
                        console.error(lang['[ERROR]'], err);
                        server.send.ds({ to: c.DISCORD_CHANNEL_ID_COMMANDS, message: lang['[ERROR]'] + ' ' + JSON.stringify(err) });
                    }
                });
            }

        }

    };

    // Loading Plugins
    console.log(lang.loadingplugins);

    const pluginslist = fs.readdirSync(__dirname + "/plugins", { withFileTypes: true });
    console.log(pluginslist);

    const plugins = [];

    // RCON
    console.log(lang.connecting_rcon);
    const conn = new Rcon(c.MINECRAFT_SERVER_RCON_IP, c.MINECRAFT_SERVER_RCON_PORT, {

        data: function(length, id, type, response) {
            if ((response) && (response.replace(/ /g, "") != "")) { server.send.ds({ to: c.DISCORD_CHANNEL_ID_COMMANDS, message: response }); }
        },

        connect: function() { server.online.mc = true; },
        close: function() { server.online.mc = false; },

        lookup: function(err, address, family, host) {
            if (!err) {
                console.log(lang.minecraftconnection, address, family, host);
            } else {
                console.error(lang.minecraftconnection, err);
            }
        }

    });

    // Auth RCON
    conn.auth(c.MINECRAFT_SERVER_RCON_PASSWORD, function() {
        if (server.first.rcon == true) {

            // Read Log
            if (c.SERVER_FOLDER) {

                if (fs.existsSync(c.SERVER_FOLDER + '/logs/latest.log')) {
                    const tail = new Tail(c.SERVER_FOLDER + '/logs/latest.log');
                    tail.on("line", function(data) {

                        // Log Lines

                        // is Chat?
                        const userchat = data.match(new RegExp(c.REGEX_MATCH_CHAT_MC));
                        if (userchat) {

                            userchat[2] = userchat[2].replace(/\@everymine/g, "<@&529850331904081950>");

                            // Send Bot Mode

                            for (var i = 0; i < plugins.length; i++) {
                                if (typeof plugins[i].mc == "function") {
                                    userchat = plugins[i].mc(userchat[1], userchat[2]);
                                }
                            }

                            server.send.ds({ to: c.DISCORD_CHANNEL_ID_CHAT, message: makeDiscordMessage(userchat[0], userchat[1]) });

                        }

                        // Nope
                        else {

                            console.log(data);

                        }

                    });
                    tail.on("error", function(error) {
                        console.error(lang['[ERROR]'], error);
                    });
                } else {
                    console.warn(lang.no_game_log);
                }
            } else {
                console.warn(lang.no_game_folder);
            }

            server.first.rcon = false;

            console.log(lang.loading_discord + " (Discord.IO)");

            // Start Bot
            server.send.dsbot = new Discord.Client({ autorun: true, token: c.DISCORD_TOKEN });

            // Ready
            server.send.dsbot.on('ready', function(event) {
                server.online.ds = true;
                console.log(server.send.dsbot.username + ' - ' + server.send.dsbot.id + ' - ' + lang.connected);
                if (server.first.discord) {
                    server.first.discord = false;
                    console.log(i18(lang.loading_complete, [Date.now() - server.first.timestart]));
                }
            });

            // Reconnect
            server.send.dsbot.on('disconnect', function(erMsg, code) {
                server.online.ds = false;
                console.log(i18(lang.deconnectedDS, [code, erMsg]));
                if (server.shutdown == 0) {
                    server.send.dsbot.connect();
                } else if (server.shutdown == 1) {
                    process.exit(1);
                } else if (server.shutdown == 3) {
                    server.send.dsbot = {};
                    server.send.dsbot = new Discord.Client({ autorun: true, token: c.DISCORD_TOKEN });
                    bot_generator();
                }
            });

            // Receive Message
            server.send.dsbot.on('message', function(user, userID, channelID, message, event) {
                if ((userID !== server.send.dsbot.id) && (!event.d.bot)) {


                    if (c.USE_WEBHOOKS && event.d.webhookID) {
                        return // ignore webhooks if using a webhook
                    }

                    if (channelID == c.DISCORD_CHANNEL_ID_CHAT) {
                        server.send.mc(event);
                    } else if ((channelID == c.DISCORD_CHANNEL_ID_COMMANDS) && message.startsWith("/")) {
                        message = message.substring(1, message.length);
                        conn.command(message, function(err) {
                            if (err) {
                                console.error(lang['[ERROR]'], err);
                                server.send.ds({ to: c.DISCORD_CHANNEL_ID_COMMANDS, message: lang['[ERROR]'] + ' ' + JSON.stringify(err) });
                            }
                        });
                    } else if (
                        (channelID == c.DISCORD_CHANNEL_ID_BOT) ||
                        (
                            (server.send.dsbot.channels[channelID] == undefined) ||
                            (server.send.dsbot.channels[channelID].guild_id == undefined) ||
                            (server.send.dsbot.channels[channelID].guild_id != null)
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

                                    server.send.ds({
                                        "to": channelID,
                                        "embed": {
                                            "title": lang.minecraftserver + " " + String(server.query.hostname),
                                            "fields": fields
                                        }
                                    });

                                } else {
                                    server.send.ds({
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

                                    server.send.ds({
                                        "to": channelID,
                                        "embed": {
                                            "title": lang.minecraftserver + " " + String(server.query.hostname),
                                            "fields": fields
                                        }
                                    });

                                } else {
                                    server.send.ds({
                                        "to": channelID,
                                        "message": lang.offlineserver
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

            // Query
            server.forceQuery = mcquery(c.MINECRAFT_SERVER_RCON_IP, c.MINECRAFT_SERVER_QUERY_PORT, 120000, function(err, stat) {
                if (err) {
                    server.query = null;
                    console.error(err);
                    server.timeout(function() {
                        server.securePresence(lang.offlineserver, new Date(), 120000);
                    }, 500);
                }
                server.query = stat;
                server.timeout(function() {
                    server.securePresence(lang.players + " " + String(server.query.numplayers) + "/" + String(server.query.maxplayers), new Date(), 120000);
                }, 500);
            });

        }
    });

};