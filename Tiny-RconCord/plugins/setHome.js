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

const setHome = {
    name: "Set Home",
    description: "Simple sethome for Minecraft Vanilla",
    author: "Jasmin Dreasond",
    page: "https://github.com/JasminDreasond/Tiny-RconCord",
    issues: "https://github.com/JasminDreasond/Tiny-RconCord/issues",
    version: "1.0",
    index: 0,
    start: function(pg) {

        // Database and Config
        const db = pg.JSONStore(pg.folder + "/db.json");
        const c = require(pg.folder + "/config.json");

        const errorSend = function(err2) {
            if (err2) {
                pg.log.error(err2);
                if (pg.c.discord.channelID.rcon) {
                    pg.dsBot.sendMessage({ to: pg.c.discord.channelID.rcon, message: pg.lang['[ERROR]'] + ' ' + JSON.stringify(err2) });
                }
            }
        };

        // Add items into the Help Command
        setHome.help = function(data) {

            if (data.userID == data.ownerID) {
                return [
                    { name: pg.c.discord.prefix + "setglobalhome", value: pg.lang.setglobalhome_help }
                ];
            } else {
                return [];
            }

        };

        // Effect
        const tpEffect = function(user, cords, callback = function() {}) {

            new pg.minecraft.sound({

                sound: 'minecraft',
                source: 'entity.enderman.teleport',
                targets: 'player',
                player: user,
                cords: cords

            }).exe(function() {

                new pg.minecraft.particle({

                    name: 'minecraft',
                    source: 'portal',
                    delta: '0.5 1.5 0.5',
                    count: 150,
                    cords: cords

                }).exe(callback);

            });

        };

        // Home Slot Generator
        const slotGenerator = function(user, message, cmd, isglobal) {
            if (typeof message == "string") {

                // Set Home
                if ((!isglobal) && (message.startsWith(pg.c.minecraft.prefix + "set" + cmd))) {

                    message = message
                        .replace(pg.c.minecraft.prefix + "set" + cmd + " ", "")
                        .replace(pg.c.minecraft.prefix + "set" + cmd, "");

                    if (message.replace(/ /g, '').length > 0) {

                        db.set(user + "_" + cmd, message);

                        new pg.minecraft.send(
                            [{ color: 'gray', text: pg.i18(pg.lang.home_saved, [pg.c.minecraft.prefix, cmd]) }],
                            user
                        ).exe(errorSend);

                    } else {

                        pg.minecraft.playerPosition(user).then(function(data) {

                            db.set(user + "_" + cmd, data[1]);

                            new pg.minecraft.send(
                                [{ color: 'gray', text: pg.i18(pg.lang.home_saved, [pg.c.minecraft.prefix, cmd]) }],
                                user
                            ).exe(errorSend);

                        });

                    }

                    return null;

                }

                // Home
                else if (message.startsWith(pg.c.minecraft.prefix + cmd)) {

                    // Get Data
                    if (!isglobal) { var cords = db.get(user + "_" + cmd); } else { var cords = db.get(cmd); }

                    // Send
                    if (cords) {

                        pg.minecraft.playerPosition(user).then(function(data) {
                            tpEffect(user, data[1], function() {
                                new pg.minecraft.command("teleport " + cords, user).exe(function(err, data) {
                                    if (err) {
                                        pg.log.error(err);
                                        new pg.minecraft.send([{ color: 'gray', text: JSON.stringify(err) }], user).exe(errorSend);
                                    } else {
                                        tpEffect(user, cords);
                                    }
                                });
                            });
                        });

                    }

                    // No Home
                    else {
                        new pg.minecraft.send([{ color: 'gray', text: pg.lang.error_home }], user).exe(errorSend);
                    }

                    return null;

                }

                // Nothing
                else {
                    return message;
                }

            }
        };

        // Minecraft Chat
        setHome.mc_chat = function(user, message) {

            if (c.enabled) {

                // Extra Slots
                if ((c.extra_slots) && (c.extra_slots > 0)) {
                    for (var i = 0; i < c.extra_slots + 1; i++) {
                        message = slotGenerator(user, message, "home" + String(i));
                    }
                }

                // Home
                message = slotGenerator(user, message, "home");

                // Extra Slots
                if ((c.extra_slots) && (c.extra_slots > 0)) {
                    for (var i = 0; i < c.extra_slots + 1; i++) {
                        message = slotGenerator(user, message, "globalhome" + String(i), true);
                    }
                }

                // Global Home
                message = slotGenerator(user, message, "globalhome", true);

                // Final Result
                if (message) {
                    return [user, message];
                } else {
                    return null;
                }

            } else {
                return [user, message];
            }

        };

        // Discord Command
        const setDiscordGlobal = function(message, channelID, home) {

            if (message.startsWith(pg.c.discord.prefix + "setglobal" + home)) {

                db.set("global" + home, message.replace(pg.c.discord.prefix + "setglobal" + home + " ", ""));
                pg.dsBot.sendMessage({ to: channelID, message: pg.i18(pg.lang.globalhome_saved, [pg.c.minecraft.prefix]) });
                return false;

            } else {
                return true;
            }

        }

        // Discord Chat
        setHome.ds_chat = function(data) {

            if ((data.channelID == pg.c.discord.channelID.bot) || (!data.guildID)) {

                let continuefor = true;
                if ((c.extra_slots) && (c.extra_slots > 0)) {
                    for (var i = 0; i < c.extra_slots + 1; i++) {
                        if (continuefor) {
                            continuefor = setDiscordGlobal(data.message, data.channelID, "home" + String(i));
                        }
                    }
                }

                if (continuefor) {
                    setDiscordGlobal(data.message, data.channelID, "home");
                }

            }

        };

    }
};

module.exports = setHome;