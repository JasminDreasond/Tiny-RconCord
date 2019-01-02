module.exports = function(pgdata) {

    //const mineflayer = require('mineflayer');
    const Rcon = require('./lib/rcon.js');
    const c = require('./config.json');

    const lang = require('./i18/' + c.LANG + '.json');

    if (c.LANG != "en") {
        var tinylang = require("./i18/en.json");
        for (items in tinylang) {
            if (typeof lang[items] != "string") {
                lang[items] = tinylang[items];
            }
        }

        delete tinylang;
    }

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






    // Start System
    const plugins = [];
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

        },

        // Loading Plugins
        plugins: function() {

            console.log(lang.loadingplugins);

            const pluginlist = fs.readdirSync(__dirname + "/plugins", { withFileTypes: true });
            for (var i = 0; i < pluginlist.length; i++) {
                if (pluginlist[i].endsWith(".js")) {

                    plugins.push(require('./plugins/' + pluginlist[i]));
                    var tinyfolder = __dirname + "/plugins/" + pluginlist[i].substring(0, pluginlist[i].length - 3)

                    // Load Language
                    if ((fs.existsSync(tinyfolder + "/i18")) && (fs.existsSync(tinyfolder + "/i18/en.json"))) {

                        if ((c.LANG != "en") && (fs.existsSync(tinyfolder + "/i18/" + c.LANG + ".json"))) {

                            var tinylang = require(tinyfolder + "/i18/" + c.LANG + ".json");
                            for (items in tinylang) {
                                if (typeof tinylang[items] == "string") {
                                    lang[items] = tinylang[items];
                                }
                            }

                            var tinylang = require(tinyfolder + "/i18/en.json");
                            for (items in tinylang) {
                                if (typeof lang[items] != "string") {
                                    lang[items] = tinylang[items];
                                }
                            }

                        } else {
                            var tinylang = require(tinyfolder + "/i18/en.json");
                            for (items in tinylang) {
                                if (typeof tinylang[items] == "string") {
                                    lang[items] = tinylang[items];
                                }
                            }
                        }

                    }

                    // Load System
                    if (
                        (typeof plugins[i].name == "string") &&
                        (typeof plugins[i].author == "string") &&
                        (typeof plugins[i].version == "string") &&
                        (typeof plugins[i].start == "function")
                    ) {

                        plugins[i].start({
                            connCommand: conn.command,
                            i18: i18,
                            c: c,
                            server: {

                                online: function() { return server.online; },
                                first: function() { return server.first; },
                                shutdown: function() { return server.shutdown; },
                                query: function() { return server.query; },

                                forceQuery: server.forceQuery,
                                timeout: server.timeout,
                                sendMC: server.sendMC

                            },
                            getDS: function() { return server.ds.getDS(); },
                            folder: tinyfolder
                        });
                        console.log(i18(lang.loadedplugin, [plugins[i].name]));

                    }

                    // Fail Load
                    else {

                        var failmotive = '';
                        if (typeof plugins[i].name != "string") {
                            failmotive += ' name';
                        }
                        if (typeof plugins[i].author != "string") {
                            failmotive += ' author';
                        }
                        if (typeof plugins[i].version != "string") {
                            failmotive += ' version';
                        }
                        if (typeof plugins[i].start != "fuction") {
                            failmotive += ' start';
                        }
                        console.warn(i18(lang.failedplugin, [pluginlist[i], failmotive]));

                    }

                }
            }

            delete tinyfolder;
            delete tinylang;

        }

    };


    let conn;

    // Start with RCON
    if (!pgdata) {

        console.log(lang.connecting_rcon);
        conn = new Rcon(c.MINECRAFT_SERVER_RCON_IP, c.MINECRAFT_SERVER_RCON_PORT, {

            data: function(length, id, type, response) {
                if ((response) && (response.replace(/ /g, "") != "")) {

                    for (var i = 0; i < plugins.length; i++) {
                        if (typeof plugins[i].mslog == "function") {
                            response = plugins[i].mslog(response);
                        }
                    }

                    server.ds.sendMessage({ to: c.DISCORD_CHANNEL_ID_COMMANDS, message: response });

                }
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

                server.ds.start(server, lang, conn, c, plugins, i18);
                startServer.plugins();
                startServer.logAPI();
                startServer.query();

            }
        });

    }


};