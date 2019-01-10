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
    const JSONStore = require('json-store');
    const request = require('request');
    const json_stringify = require("json-beautify");
    const moment = require('moment');
    const log = require('./lib/log.js');
    const Rcon = require('./lib/rcon.js');
    const minecraft = require('./lib/minecraft.js');
    const hexC = require('./lib/hexCode.js');
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

            // Send Commands
            connCommand: async function(cmd, callback) {
                if (typeof callback != "function") {
                    return await new Promise(function(resolve, reject) {
                        conn.command(cmd, function(err, data) {
                            if (!err) { resolve(data); } else { reject(err); }
                        });
                    });
                } else {
                    conn.command(cmd, callback);
                }
            },

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

                        if (log_control.storage.length < 900) {
                            server.ds.sendMessage({ to: c.discord.channelID.log, message: log_control.storage });
                        } else {
                            server.ds.sendMessage({ to: c.discord.channelID.log, message: lang.long_message });
                        }

                        log_control.storage = "";
                        log_control.timeout = 0;

                    } else if (typeof data == "string") {

                        if (data.length < 900) {
                            server.ds.sendMessage({ to: c.discord.channelID.log, message: data });
                        } else {
                            server.ds.sendMessage({ to: c.discord.channelID.log, message: lang.long_message });
                        }

                    }

                }

            }

        };



        // Start System
        const plugins = [];
        const startServer = {

            sendPlugin: async function(data, type) {

                // Send Bot Mode
                if (plugins.length > 0) {

                    for (var i = 0; i < plugins.length; i++) {

                        if (
                            (typeof plugins[i][type] == "function") && (data) &&
                            (
                                ((Array.isArray(data)) && (typeof data[1] == "string") && (data[1] != "")) ||
                                (typeof data == "string") && (data != "")
                            )
                        ) {

                            if (Array.isArray(data)) {
                                data = await plugins[i][type].apply(this, data);
                            } else {
                                data = await plugins[i][type].apply(this, [data]);
                            }

                        } else if (typeof data != "string") {
                            if ((!data) || (typeof data[0] != "string") || (data[0] == "")) {
                                return;
                            }
                        } else {
                            if ((typeof data != "string") || (data == "")) {
                                return;
                            }
                        }

                    }

                    return data;

                } else {
                    return data;
                }

            },

            logAPI: function() {

                // Read Log
                if (c.server_folder) {

                    if (fs.existsSync(c.server_folder + '/logs/latest.log')) {

                        const tail = new Tail(c.server_folder + '/logs/latest.log');
                        tail.on("line", async function(data) {

                            // Detect if the log is a chat message
                            if (typeof c.minecraft.regex.chat == "string") {
                                var userchat = data.match(new RegExp(c.minecraft.regex.chat));
                            }

                            if (typeof c.minecraft.regex.join == "string") {
                                var userjoin = data.match(new RegExp(c.minecraft.regex.join));
                            }

                            if (typeof c.minecraft.regex.leave == "string") {
                                var userleave = data.match(new RegExp(c.minecraft.regex.leave));
                            }

                            if (typeof c.minecraft.regex.advancement == "string") {
                                var adv = data.match(new RegExp(c.minecraft.regex.advancement));
                            }

                            // Chat
                            if ((typeof c.minecraft.regex.chat == "string") && (userchat)) {

                                // Model Chat
                                userchat = [userchat[1], userchat[2]];
                                userchat = await startServer.sendPlugin(userchat, 'mc_chat');

                                if (
                                    (userchat) &&
                                    (typeof userchat[0] == "string") &&
                                    (typeof userchat[1] == "string") &&
                                    (userchat[1].replace(/ /g, "") != "") &&
                                    (userchat[0].replace(/ /g, "") != "") &&
                                    (c.chatLog)
                                ) {
                                    log.chat(userchat[0], userchat[1]);
                                }

                            }

                            // Join User
                            else if ((typeof c.minecraft.regex.join == "string") && (userjoin)) {

                                // Model Chat
                                userjoin = userjoin[1];
                                userjoin = await startServer.sendPlugin(userjoin, 'mc_join');

                                if (
                                    (typeof userjoin == "string") &&
                                    (userjoin.replace(/ /g, "") != "") &&
                                    (c.minecraft.debug)
                                ) {
                                    log.minecraft(i18(lang.user_join, [userjoin]));
                                }

                            }

                            // Leave User
                            else if ((typeof c.minecraft.regex.leave == "string") && (userleave)) {

                                // Model Chat
                                userleave = userleave[1];
                                userleave = await startServer.sendPlugin(userleave, 'mc_leave');

                                if (
                                    (typeof userleave == "string") &&
                                    (userleave.replace(/ /g, "") != "") &&
                                    (c.minecraft.debug)
                                ) {
                                    log.minecraft(i18(lang.user_leave, [userleave]));
                                }

                            }

                            // Advancement
                            else if ((typeof c.minecraft.regex.advancement == "string") && (adv)) {

                                // Model Chat
                                adv = [adv[1], adv[2]];
                                adv = await startServer.sendPlugin(adv, 'mc_advancement');

                                if (
                                    (typeof adv[0] == "string") &&
                                    (typeof adv[1] == "string") &&
                                    (adv[1].replace(/ /g, "") != "") &&
                                    (adv[0].replace(/ /g, "") != "") &&
                                    (c.minecraft.debug)
                                ) {
                                    log.minecraft(i18(lang.advancement_receive, [adv[0], adv[1]]));
                                }

                            } else {

                                // Log Lines
                                for (var i = 0; i < plugins.length; i++) {
                                    if ((typeof plugins[i].mc_log == "function") && (typeof data == "string") && (data != "")) {
                                        data = await plugins[i].mc_log(data);
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
                        hexC: hexC,
                        minecraft: minecraft,
                        JSONStore: JSONStore,
                        dsBot: server.ds,
                        request: request,
                        plugins: plugins,
                        emojiStrip: emojiStrip,
                        webhook: webhook,
                        json_stringify: json_stringify,
                        moment: moment,
                        lang: lang,
                        log: log,
                        connCommand: server.connCommand,
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
        const startBase = {

            start: async function() {

                await startServer.plugins();
                globalds.start(c, lang, server, plugins, log, tinypack, i18);
                server.ds.start(server, lang, c, plugins, i18, log, globalds, json_stringify, request);
                startServer.logAPI();
                startServer.query();

            },

            fire: function() {

                // Start with RCON
                if (!pgdata) {

                    log.info(lang.connecting_rcon);
                    conn = new Rcon(c.minecraft.rcon.ip, c.minecraft.rcon.port, {

                        data: function(length, id, type, response) {
                            if ((response) && (response.replace(/ /g, "") != "")) {

                                for (var i = 0; i < plugins.length; i++) {
                                    if ((typeof plugins[i].mc_log == "function") && (typeof response == "string") && (response != "")) {
                                        response = plugins[i].mc_log(response);
                                    }
                                }

                                if ((typeof response == "string") && (response.replace(/ /g, "") != "")) {
                                    log_control.send("[RCON] " + response);
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
                            minecraft.start(log, server.connCommand, hexC, plugins);

                            if (c.logs) {
                                conn.command('gamerule sendCommandFeedback ' + c.log.sendCommandFeedback, function(err, data1) {
                                    if (err) { log.error(err); } else {
                                        log.info(data1);
                                        conn.command('gamerule commandBlockOutput ' + c.log.commandBlockOutput, function(err, data2) {
                                            if (err) { log.error(err); } else {
                                                log.info(data2);
                                                conn.command('gamerule logAdminCommands ' + c.log.logAdminCommands, function(err, data3) {
                                                    if (err) { log.error(err); } else {
                                                        log.info(data3);
                                                        log.info(lang.rcon_connected);
                                                        startBase.start();
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            } else {
                                log.info(lang.rcon_connected);
                                startBase.start();
                            }

                        }
                    });

                }

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
            webhook.get(c.webhook.url).then(function(data) {
                try {
                    c.webhook.id = data.id;
                    c.webhook.name = data.name;
                    c.webhook.channel_id = data.channel_id;
                    c.webhook.token = data.token;
                    c.webhook.avatar = data.avatar;
                    c.webhook.guild_id = data.guild_id;
                    log.info(lang.loading_webhook_complete);
                    startBase.fire();
                } catch (e) {;
                    throw e;
                };
            }).catch(function(err) {
                throw err;
            });
        } else {
            startBase.fire();
        }

    });

};