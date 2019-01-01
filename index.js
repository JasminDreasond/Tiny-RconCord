//const mineflayer = require('mineflayer');
const Rcon = require('./lib/rcon.js');
const c = require('./config.json');
const lang = require('./i18/' + c.LANG + '.json');
const emojiStrip = require('emoji-strip');
const Discord = require('discord.io');
const receiptor = require('./receiptor.js');
const mcquery = require('./lib/mcquery.js');
let bot;

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
        .replace('%username%', username + "#" + discriminator)
        .replace('%message%', text);

};

function i18(text, replaces) {

    for (var i = 0; i < replaces.length; i++) {
        text = text.replace("{" + i + "}", replaces[i]);
    }

    return text;

}

// Server

const server = {

    online: { ds: false, mc: false },
    first: true,
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

    send: {

        getDiscord: function() { return bot; },

        ds: function(themessage, callback, timer) {

            if (typeof timer != "number") {
                if (typeof callback == "number") {
                    timer = callback;
                    callback = function() {

                    };
                }
            }

            if (bot.connected == true) {
                if (timer != undefined) {
                    bot.sendMessage(themessage, function(error, mymessage) {

                        if (error) {
                            console.log(error);
                            server.send.ds(themessage, callback, timer);
                        } else {
                            if (typeof callback == "function") {
                                callback();
                            }
                            server.timeout(function() { bot.deleteMessage({ channelID: themessage.to, messageID: mymessage.id }); }, timer);
                        }

                    });
                } else {
                    bot.sendMessage(themessage, function(error, mymessage) {
                        if (error) {
                            console.log(error);
                            server.send.ds(themessage, callback, timer);
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

// RCON
const conn = new Rcon(c.MINECRAFT_SERVER_RCON_IP, c.MINECRAFT_SERVER_RCON_PORT, {

    data: function(length, id, type, response) {
        if (type == 0) { server.send.ds({ to: c.DISCORD_CHANNEL_ID_COMMANDS, message: response }); }
    },

    connect: function() { server.online.mc = true; },
    close: function() { server.online.mc = false; },

    lookup: function(err, address, family, host) {
        console.log(lang.minecraftconnection, err, address, family, host);
    }

});

// Auth RCON
conn.auth(c.MINECRAFT_SERVER_RCON_PASSWORD, function() {
    if (server.first == true) {

        server.first = false;

        // Start Bot
        bot = new Discord.Client({ autorun: true, token: c.DISCORD_TOKEN });

        // Ready
        bot.on('ready', function(event) {
            server.online.ds = true;
            console.log(bot.username + ' - ' + bot.id + ' - ' + lang.connected);
        });

        // Reconnect
        bot.on('disconnect', function(erMsg, code) {
            server.online.ds = false;
            console.log(i18(lang.deconnectedDS, [code, erMsg]));
            if (server.shutdown == 0) {
                bot.connect();
            } else if (server.shutdown == 1) {
                process.exit(1);
            } else if (server.shutdown == 3) {
                bot = {};
                bot = new Discord.Client({ autorun: true, token: c.DISCORD_TOKEN });
                bot_generator();
            }
        });

        // Receive Message
        bot.on('message', function(user, userID, channelID, message, event) {
            if ((userID !== bot.id) && (!event.d.bot)) {

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
                        (bot.channels[channelID] == undefined) ||
                        (bot.channels[channelID].guild_id == undefined) ||
                        (bot.channels[channelID].guild_id != null)
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
                        receiptor.ds(server.send, user, userID, channelID, message, event);
                    }

                } else {
                    receiptor.ds(server.send, user, userID, channelID, message, event);
                }

            }
        });

        // Query
        server.forceQuery = mcquery(c.MINECRAFT_SERVER_RCON_IP, c.MINECRAFT_SERVER_QUERY_PORT, 60000, function(err, stat) {
            if (err) {
                server.query = null;
                console.error(err);
                server.timeout(function() {

                }, 500);
            }
            server.query = stat;
            server.timeout(function() {

            }, 500);

        });

    }
});