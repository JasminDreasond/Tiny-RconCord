module.exports = function(pgdata) {

    // FS
    const fs = require('fs');

    if (!fs.existsSync(__dirname + '/logs')) {
        fs.mkdirSync(__dirname + '/logs');
    }

    //const mineflayer = require('mineflayer');
    const json_stringify = require("json-beautify");
    const moment = require('moment');
    const log = require('./lib/log.js');
    const Rcon = require('./lib/rcon.js');
    const c = require('./config.json');
    const globalds = require('./discord/global.js');
    const webhook = require("./discord/webhook.js");

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

                        // Prepare Regex
                        let userchat = data.match(new RegExp(c.regex.chat_mc));
                        let useradvanc = data.match(new RegExp(c.regex.advancement_mc));
                        let prespawn = data.match(new RegExp(c.regex.preparing_spawn_mc));
                        let leftgame = data.match(new RegExp(c.regex.left_mc));
                        let joingame = data.match(new RegExp(c.regex.join_mc));

                        // is Chat?
                        if ((typeof c.regex.chat_mc == "string") && (userchat)) {

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

                                webhook.send(c.webhook, {
                                    username: userchat[0],
                                    content: userchat[1],
                                    avatar_url: c.minecraft.avatar_url.replace("%username%", userchat[0])
                                });

                            } else if (c.discord.channelID.chat) {
                                server.ds.sendMessage({ to: c.discord.channelID.chat, message: makeDiscordMessage(userchat[0], userchat[1]) });
                            }

                        }

                        // is Advancement?
                        else if ((typeof c.regex.advancement_mc == "string") && (useradvanc)) {

                            console.log(useradvanc[1], useradvanc[2]);

                        }

                        // is Player lefting?
                        else if ((typeof c.regex.left_mc == "string") && (leftgame)) {

                            console.log(leftgame[1]);

                        }

                        // is New Player?
                        else if ((typeof c.regex.join_mc == "string") && (joingame)) {

                            console.log(joingame[1]);

                        }

                        // is Spawn Loading?
                        else if ((typeof c.regex.preparing_spawn_mc == "string") && (prespawn)) {
                            if (c.minecraft.debug) {
                                log.minecraft(i18(lang.loading_world, [prespawn[1]]));
                            }
                        }

                        // Nope
                        else {

                            for (var i = 0; i < plugins.length; i++) {
                                if (typeof plugins[i].mc_log == "function") {
                                    data = plugins[i].mc_log(data);
                                }
                            }

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
                    json_stringify: json_stringify,
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
                log.info(i18(lang.loaded_plugin, [plugins[i].name]));

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
                log.warn(i18(lang.failed_plugin, [pluginName, failmotive]));

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
                            if (typeof plugins[i].rcon == "function") {
                                response = plugins[i].rcon(response);
                            }
                        }

                        server.ds.sendMessage({ to: c.discord.channelID.rcon, message: response });

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
                    globalds.start(c, lang, conn, server, plugins, log);
                    server.ds.start(server, lang, conn, c, plugins, i18, log, globalds, json_stringify);
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
        webhook.get(c.webhook.url, log, function(data) {
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

};