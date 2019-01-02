module.exports = function(pgdata) {

    //const mineflayer = require('mineflayer');
    const Rcon = require('./lib/rcon.js');
    const c = require('./config.json');
    const lang = require('./i18/' + c.LANG + '.json');
    const emojiStrip = require('emoji-strip');
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

        // Basic
        online: { ds: false, mc: false },
        first: {
            discord: true,
            rcon: true,
            timestart: new Date()
        },
        shutdown: 0,

        forceQuery: null,
        query: null,

        // Discord
        ds: require('./discord/' + c.DISCORD_LIB + '.js'),

        // Timeout
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

        //Send Minecraft
        sendMC: function(message) {
            conn.command('tellraw @a ' + makeMinecraftTellraw(message), function(err) {
                if (err) {
                    console.error(lang['[ERROR]'], err);
                    server.ds.sendMessage({ to: c.DISCORD_CHANNEL_ID_COMMANDS, message: lang['[ERROR]'] + ' ' + JSON.stringify(err) });
                }
            });
        }

    };





    // Loading Plugins
    console.log(lang.loadingplugins);

    const pluginslist = fs.readdirSync(__dirname + "/plugins", { withFileTypes: true });
    console.log(pluginslist);

    const plugins = [];






    // Start System
    const startServer = {

        logAPI: function() {

            // Read Log
            if (c.SERVER_FOLDER) {

                if (fs.existsSync(c.SERVER_FOLDER + '/logs/latest.log')) {
                    const tail = new Tail(c.SERVER_FOLDER + '/logs/latest.log');
                    tail.on("line", function(data) {

                        // Log Lines

                        // is Chat?
                        let userchat = data.match(new RegExp(c.REGEX_MATCH_CHAT_MC));
                        if (userchat) {

                            userchat[2] = userchat[2].replace(/\@everymine/g, "<@&529850331904081950>");

                            // Send Bot Mode

                            if (plugins.length > 0) {
                                for (var i = 0; i < plugins.length; i++) {
                                    if (typeof plugins[i].mc == "function") {
                                        userchat = plugins[i].mc(userchat[1], userchat[2]);
                                    }
                                }
                            } else {
                                userchat = [userchat[1], userchat[2]];
                            }

                            server.ds.sendMessage({ to: c.DISCORD_CHANNEL_ID_CHAT, message: makeDiscordMessage(userchat[0], userchat[1]) });

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

        },

        query: function() {

            const mcquery = require('./lib/mcquery.js');

            // Query
            server.forceQuery = mcquery(c.MINECRAFT_SERVER_RCON_IP, c.MINECRAFT_SERVER_QUERY_PORT, 120000, function(err, stat) {
                if (err) {
                    server.query = null;
                    console.error(err);
                    server.timeout(function() {
                        server.ds.securePresence(lang.offlineserver, new Date(), 120000);
                    }, 500);
                }
                server.query = stat;
                server.timeout(function() {
                    server.ds.securePresence(lang.players + " " + String(server.query.numplayers) + "/" + String(server.query.maxplayers), new Date(), 120000);
                }, 500);
            });

        }

    };




    // Start with RCON
    if (!pgdata) {

        console.log(lang.connecting_rcon);
        const conn = new Rcon(c.MINECRAFT_SERVER_RCON_IP, c.MINECRAFT_SERVER_RCON_PORT, {

            data: function(length, id, type, response) {
                if ((response) && (response.replace(/ /g, "") != "")) { server.ds.sendMessage({ to: c.DISCORD_CHANNEL_ID_COMMANDS, message: response }); }
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

                server.first.rcon = false;
                startServer.logAPI();
                server.ds.start(server, lang, conn, c, plugins, i18);
                startServer.query();

            }
        });

    }


};