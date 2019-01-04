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

module.exports = function(pgdata) {

    // FS
    const fs = require('fs');

    if (!fs.existsSync(__dirname + '/logs')) {
        fs.mkdirSync(__dirname + '/logs');
    }

    // Starting Modules
    const request = require('request');
    const json_stringify = require("json-beautify");
    const moment = require('moment');
    const log = require('./lib/log.js');
    const Rcon = require('./lib/rcon.js');
    const c = require('./config.json');
    const globalds = require('./discord/global.js');
    const webhook = require("./discord/webhook.js");
    const tinypack = require('../package.json');

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
        chat: lang['chat'],
        discord: lang['discord']
    });

    webhook.start(request, log);

    const emojiStrip = require('emoji-strip');

    if (c.server_folder) {
        var Tail = require('tail').Tail;
    }

    function i18(text, replaces) {

        for (var i = 0; i < replaces.length; i++) {
            text = text.replace("{" + i + "}", replaces[i]);
        }

        return text;

    }

    // Start Message

    if (!tinypack.name) {
        tinypack.name = lang.unknown;
    }

    if (!tinypack.version) {
        tinypack.version = "0.0.0";
    }

    if (!tinypack.author) {
        tinypack.author = lang.unknown;
    }

    log.info('----------------------------------------------------');
    log.info(i18(lang.loading_app, [tinypack.name, tinypack.version, tinypack.author]));

    if (tinypack.repository) {

        if (typeof tinypack.repository == "string") {
            log.info(i18(lang.show_repository, [tinypack.repository]));
        } else {
            log.info(i18(lang.show_repository, [tinypack.repository.type + " - " + tinypack.repository.url]));
        }

    }

    if (tinypack.bugs) {

        if (typeof tinypack.bugs.url == "string") {
            log.info(i18(lang.issues_url, [tinypack.bugs.url]));
        }

        if (typeof tinypack.bugs.email == "string") {
            log.info(i18(lang.issues_email, [tinypack.bugs.email]));
        }

    }

    // Check for updates from Github Repository
    request({
        url: 'https://api.github.com/repos/' + tinypack.homepage.replace("https://github.com/", "") + '/releases/latest',
        headers: {
            'User-Agent': 'https://api.github.com/meta'
        }
    }, function(gitErr, gitRes, github) {
        if (!gitErr && gitRes.statusCode == 200) {
            try {

                github = JSON.parse(github);

                if ((github.tag_name != tinypack.version) && (github.tag_name) && (github.html_url)) {
                    log.warn(i18(lang.new_version, [github.tag_name, github.html_url]));
                }

            } catch (e) {
                log.error(e);
            }
        } else {
            log.error(gitErr);
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
            }

        };



        // Log Control
        const log_control = {

            // Data
            timeout: 0,
            storage: "",

            // Main
            send: function(data) {

                if (typeof data == "string") {

                    log_control.timeout++;
                    setTimeout(function() {
                        log_control.timeout--;
                        log_control.send(false);
                    }, c.discord.log_delay);

                    if (log_control.timeout > 0) {
                        log_control.storage += "\n" + data;
                    } else {
                        log_control.storage = data;
                    }

                }

                if ((log_control.timeout < 1) || (log_control.timeout > 15)) {

                    if (log_control.storage != "") {
                        server.ds.sendMessage({ to: c.discord.channelID.log, message: log_control.storage });
                        log_control.storage = "";
                        log_control.timeout = 0;
                    } else if (typeof data == "string") {
                        server.ds.sendMessage({ to: c.discord.channelID.log, message: data });
                    }

                }

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

                            for (var i = 0; i < plugins.length; i++) {
                                if ((typeof plugins[i].mc_log == "function") && (typeof data == "string") && (data != "")) {
                                    data = plugins[i].mc_log(data);
                                }
                            }

                            if ((typeof data == "string") && (data.replace(/ /g, "") != "")) {

                                if (c.minecraft.debug) {
                                    log.minecraft(data);
                                }

                                if (c.discord.channelID.log) {
                                    log_control.send(data);
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
                server.forceQuery = mcquery(c.minecraft.rcon.ip, c.minecraft.query.port, c.minecraft.query.delay, function(err, stat) {
                    if (err) {
                        server.query = null;
                        log.error(err);
                        server.timeout(function() {
                            server.ds.securePresence(lang.offline + " | " + i18(lang.help_presence, [c.discord.prefix + "help"]), new Date(), 120000);
                        }, 500);
                    } else {
                        server.query = stat;
                        server.timeout(function() {
                            server.ds.securePresence(lang.players + " " + String(server.query.numplayers) + "/" + String(server.query.maxplayers) + " | " + i18(lang.help_presence, [c.discord.prefix + "help"]), new Date(), 120000);
                        }, 500);
                    }
                });

            },

            pluginLoader: async function(pluginName, pluginFolder) {

                plugins.push(require(pluginFolder + pluginName));
                var i = plugins.length - 1;

                if (pluginFolder != "") {
                    var tinyfolder = __dirname + "/plugins/" + pluginName.substring(0, pluginName.length - 3);
                } else {
                    var tinyfolder = __dirname + "/plugins/" + pluginName;
                }

                // Load Language
                if (fs.existsSync(tinyfolder + "/i18")) {

                    if (fs.existsSync(tinyfolder + "/i18/en.json")) {

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

                    } else {
                        log.error(i18(lang.no_english, [pluginName]));
                    }

                }

                // Load System
                if (
                    (typeof plugins[i].index == "number") &&
                    (typeof plugins[i].name == "string") &&
                    (typeof plugins[i].description == "string") &&
                    (typeof plugins[i].author == "string") &&
                    (typeof plugins[i].version == "string") &&
                    (typeof plugins[i].start == "function")
                ) {

                    await plugins[i].start({
                        dsBot: server.ds,
                        request: request,
                        plugins: plugins,
                        emojiStrip: emojiStrip,
                        webhook: webhook,
                        json_stringify: json_stringify,
                        moment: moment,
                        lang: lang,
                        log: log,
                        connCommand: function(cmd, callback) {
                            conn.command(cmd, callback);
                        },
                        i18: i18,
                        c: c,
                        server: {

                            online: function() { return server.online; },
                            first: function() { return server.first; },
                            shutdown: function() { return server.shutdown; },
                            query: function() { return server.query; },

                            forceQuery: server.forceQuery,
                            timeout: server.timeout

                        },
                        getDS: function() { return server.ds.getDS(); },
                        folder: tinyfolder
                    });

                    log.info(i18(lang.loaded_plugin, [plugins[i].name, plugins[i].version]));

                }

                // Fail Load
                else {

                    var failmotive = '';
                    if (typeof plugins[i].index != "number") {
                        failmotive += ' index';
                    }
                    if (typeof plugins[i].name != "string") {
                        failmotive += ' name';
                    }
                    if (typeof plugins[i].description != "fuction") {
                        failmotive += ' description';
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
                    log.warn(i18(lang.failed_plugin, [pluginName, failmotive]));
                    plugins.splice(i, 1);

                }

            },

            // Loading Plugins
            plugins: async function() {

                const pluginlist = fs.readdirSync(__dirname + "/plugins", { withFileTypes: true });

                if ((pluginlist.length > 0) || ((c.npmPlugins) && (c.npmPlugins.length > 0))) {

                    log.info(lang.loading_plugins);

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

                    // Sort Array
                    plugins.sort(function sortfunction(a, b) {
                        return (a.index - b.index)
                    });

                    log.info(lang.loading_plugins_complete);

                }

            }

        };


        // Start
        let conn;
        const startBase = function() {

            // Start with RCON
            if (!pgdata) {

                log.info(lang.connecting_rcon);
                conn = new Rcon(c.minecraft.rcon.ip, c.minecraft.rcon.port, {

                    data: function(length, id, type, response) {
                        if ((response) && (response.replace(/ /g, "") != "")) {

                            for (var i = 0; i < plugins.length; i++) {
                                if ((typeof plugins[i].rcon == "function") && (typeof response == "string") && (response != "")) {
                                    response = plugins[i].rcon(response);
                                }
                            }

                            if ((c.discord.channelID.rcon) && (typeof response == "string") && (response.replace(/ /g, "") != "")) {
                                server.ds.sendMessage({ to: c.discord.channelID.rcon, message: response });
                            }

                        }
                    },

                    net: function(port, ip) {
                        log.info(i18(lang.rcon_auth, [ip, port]));
                    },

                    connect: function() { server.online.mc = true; },
                    close: function() { server.online.mc = false; },

                    lookup: function(err, address, family, host) {
                        if (!err) {
                            log.info(lang.minecraft_connection, address, family, host);
                        } else {
                            log.error(lang.minecraft_connection, err);
                        }
                    }

                }, log);

                // Auth RCON
                conn.auth(c.minecraft.rcon.password, async function() {
                    if (server.first.rcon == true) {

                        server.first.rcon = false;

                        await startServer.plugins();
                        globalds.start(c, lang, conn, server, plugins, log, tinypack, i18);
                        server.ds.start(server, lang, c, plugins, i18, log, globalds, json_stringify, request);
                        startServer.logAPI();
                        startServer.query();

                    }
                });

            }

        };

        // Validate Webhook Config
        if (
            (c.webhook.use) && (
                (typeof c.webhook.id != "string") ||
                (typeof c.webhook.name != "string") ||
                (typeof c.webhook.channel_id != "string") ||
                (typeof c.webhook.token != "string") ||
                (typeof c.webhook.avatar != "string") ||
                (typeof c.webhook.guild_id != "string")
            )) {
            log.info(lang.loading_webhook);
            webhook.get(c.webhook.url, function(data) {
                try {
                    c.webhook.id = data.id;
                    c.webhook.name = data.name;
                    c.webhook.channel_id = data.channel_id;
                    c.webhook.token = data.token;
                    c.webhook.avatar = data.avatar;
                    c.webhook.guild_id = data.guild_id;
                    log.info(lang.loading_webhook_complete);
                    startBase();
                } catch (e) {
                    log.error(e);
                };
            });
        } else {
            startBase();
        }

    });

};