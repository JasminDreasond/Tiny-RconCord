module.exports = function(pgdata) {

    // FS
    const fs = require('fs');

    if (!fs.existsSync(__dirname + '/logs')) {
        fs.mkdirSync(__dirname + '/logs');
    }

    //const mineflayer = require('mineflayer');
    const moment = require('moment');
    const log = require('./lib/log.js');
    const Rcon = require('./lib/rcon.js');
    const c = require('./config.json');
    const globalds = require('./discord/global.js');
    const webhook = require("webhook-discord");
    const Hook = new webhook.Webhook(c.webhook.url);
    const mcauth = require('./lib/mcauth.js');

    const lang = require('./i18/' + c.lang + '.json');
    moment.locale(c.lang);

    if (c.lang != "en") {
        var tinylang = require("./i18/en.json");
        for (items in tinylang) {
            if (typeof lang[items] != "string") {
                lang[items] = tinylang[items];
            }
        }

        delete tinylang;
    }

    log.startApp(moment, {
        warn: lang['warn'],
        error: lang['error'],
        info: lang['info'],
        minecraft: lang['minecraft'],
        debug: lang['debug'],
        chat: lang['chat']
    });

    const emojiStrip = require('emoji-strip');

    if (c.server_folder) {
        var Tail = require('tail').Tail;
    }

    function makeMinecraftTellraw(data) {

        const username = emojiStrip(data.username);
        const discriminator = data.discriminator;
        let text = emojiStrip(data.message);

        let bot = '';

        if (data.bot != "") {
            bot = " " + c.minecraft.bot_discord_template.replace('%text%', data.bot);
        }

        text = text.replace(/[ÀÁÂÃÄÅ]/, "A");
        text = text.replace(/[àáâãäå]/, "a");
        text = text.replace(/[ÈÉÊË]/, "E");
        text = text.replace(/[èéêë]/, "e");
        text = text.replace(/[ÒÓôö]/, "O");
        text = text.replace(/[òóôö]/, "o");
        text = text.replace(/[ÙÚûü]/, "U");
        text = text.replace(/[ùúûü]/, "u");
        text = text.replace(/[Ç]/, "C");
        text = text.replace(/[ç]/, "c");

        return c.minecraft.tellraw_template
            .replace('%username%', username)
            .replace('%discriminator%', discriminator)
            .replace('%bot%', bot)
            .replace('%message%', text);

    };

    function makeDiscordMessage(username, message) {
        // make a discord message string by formatting the configured template with the given parameters
        return c.discord.template
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
        ds: require('./discord/' + c.discord.lib + '.js'),

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
        sendMC: function(message, data) {

            if (data) {
                if (data.type == "user") {
                    var cmd = makeMinecraftTellraw({
                        message: message,
                        username: data.username,
                        discriminator: data.discriminator,
                        bot: data.bot
                    });
                } else {
                    var cmd = message;
                }
            } else {
                var cmd = message;
            }

            conn.command('tellraw @a ' + cmd, function(err) {
                if (err) {
                    log.error(err);
                    if (c.discord.channelID.rcon) {
                        server.ds.sendMessage({ to: c.discord.channelID.rcon, message: lang['[ERROR]'] + ' ' + JSON.stringify(err) });
                    }
                }
            });

        }

    };






    // Start System
    const plugins = [];
    const startServer = {

        logAPI: function() {

            // Read Log
            if (c.server_folder) {

                if (fs.existsSync(c.server_folder + '/logs/latest.log')) {
                    const tail = new Tail(c.server_folder + '/logs/latest.log');
                    tail.on("line", function(data) {

                        // Log Lines

                        // is Chat?
                        let userchat = data.match(new RegExp(c.regex.chat_mc));
                        if (userchat) {

                            // Model Chat
                            userchat = [userchat[1], userchat[2]];

                            // Add everymine
                            userchat[1] = userchat[1].replace(/\@everymine/g, "<@&" + c.discord.everymine + ">");

                            // Send Bot Mode
                            if (plugins.length > 0) {
                                for (var i = 0; i < plugins.length; i++) {
                                    if (typeof plugins[i].mc == "function") {
                                        userchat = plugins[i].mc(userchat[0], userchat[1]);
                                    }
                                }
                            }

                            if (c.chatLog) {
                                log.chat(userchat[0], userchat[1]);
                            }

                            if (c.webhook.use) {

                                //mcauth.getMojangProfile(userchat[0], function(profile) {

                                const tinymessage = new webhook.MessageBuilder()
                                    .setName(userchat[0])
                                    .setText(userchat[1])
                                    //.setImage("Image url")
                                ;

                                tinymessage.data.avatar_url = c.minecraft.avatar_url.replace("%username%", userchat[0]);

                                delete tinymessage.data.attachments;

                                Hook.send(tinymessage);

                                //console.log(profile);

                                //});

                            } else if (c.discord.channelID.chat) {
                                server.ds.sendMessage({ to: c.discord.channelID.chat, message: makeDiscordMessage(userchat[0], userchat[1]) });
                            }

                        }

                        // Nope
                        else {

                            for (var i = 0; i < plugins.length; i++) {
                                if (typeof plugins[i].mslog == "function") {
                                    data = plugins[i].mslog(data);
                                }
                            }

                            if (c.minecraft.debug) {
                                log.minecraft(data);
                            }

                            if (c.discord.channelID.log) {

                            }

                        }

                    });
                    tail.on("error", function(error) {
                        log.error(error);
                    });
                } else {
                    log.warn(lang.no_game_log);
                }
            } else {
                log.warn(lang.no_game_folder);
            }

        },

        query: function() {

            const mcquery = require('./lib/mcquery.js');

            // Query
            server.forceQuery = mcquery(c.minecraft.rcon.ip, c.minecraft.query.port, 120000, function(err, stat) {
                if (err) {
                    server.query = null;
                    log.error(err);
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

        pluginLoader: async function(pluginName, pluginFolder) {

            plugins.push(require(pluginFolder + pluginName));
            var i = plugins.length - 1;
            var tinyfolder = __dirname + "/plugins/" + pluginName.substring(0, pluginName.length - 3)

            // Load Language
            if ((fs.existsSync(tinyfolder + "/i18")) && (fs.existsSync(tinyfolder + "/i18/en.json"))) {

                if ((c.lang != "en") && (fs.existsSync(tinyfolder + "/i18/" + c.lang + ".json"))) {

                    var tinylang = require(tinyfolder + "/i18/" + c.lang + ".json");
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

                await plugins[i].start({
                    moment: moment,
                    lang: lang,
                    log: log,
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
                log.info(i18(lang.loadedplugin, [plugins[i].name]));

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
                log.warn(i18(lang.failedplugin, [pluginName, failmotive]));

            }

        },

        // Loading Plugins
        plugins: async function() {

            const pluginlist = fs.readdirSync(__dirname + "/plugins", { withFileTypes: true });

            if ((pluginlist.length > 0) || ((c.npmPlugins) && (c.npmPlugins.length > 0))) {

                log.info(lang.loadingplugins);

                if ((c.npmPlugins) && (c.npmPlugins.length > 0)) {
                    for (var i = 0; i < c.npmPlugins.length; i++) {
                        await startServer.pluginLoader(c.npmPlugins[i], "");
                    }
                }

                if (pluginlist.length > 0) {
                    for (var i = 0; i < pluginlist.length; i++) {
                        if (pluginlist[i].endsWith(".js")) {
                            await startServer.pluginLoader(pluginlist[i], "./plugins/");
                        }
                    }
                }

                log.info(lang.loadingpluginscomplete);

            }

        }

    };


    let conn;

    // Start with RCON
    if (!pgdata) {

        log.info(lang.connecting_rcon);
        conn = new Rcon(c.minecraft.rcon.ip, c.minecraft.rcon.port, {

            data: function(length, id, type, response) {
                if ((response) && (response.replace(/ /g, "") != "")) {

                    for (var i = 0; i < plugins.length; i++) {
                        if (typeof plugins[i].rcon == "function") {
                            response = plugins[i].rcon(response);
                        }
                    }

                    server.ds.sendMessage({ to: c.discord.channelID.rcon, message: response });

                }
            },

            connect: function() { server.online.mc = true; },
            close: function() { server.online.mc = false; },

            lookup: function(err, address, family, host) {
                if (!err) {
                    log.info(lang.minecraftconnection, address, family, host);
                } else {
                    log.error(lang.minecraftconnection, err);
                }
            }

        }, log);

        // Auth RCON
        conn.auth(c.minecraft.rcon.password, async function() {
            if (server.first.rcon == true) {

                server.first.rcon = false;

                await startServer.plugins();
                globalds.start(c, lang, conn, server, plugins, log);
                server.ds.start(server, lang, conn, c, plugins, i18, log, globalds);
                startServer.logAPI();
                startServer.query();

            }
        });

    }


};