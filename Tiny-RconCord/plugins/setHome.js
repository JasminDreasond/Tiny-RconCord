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

        // Home Slot Generator
        const slotGenerator = function(user, message, cmd, isglobal) {
            if (typeof message == "string") {

                // Set Home
                if ((!isglobal) && (message.startsWith(pg.c.minecraft.prefix + "set" + cmd))) {

                    db.set(user + "_" + cmd, message.replace(pg.c.minecraft.prefix + "set" + cmd + " ", ""));

                    pg.connCommand('tellraw @a ' + JSON.stringify(
                        [{ color: 'gray', text: pg.i18(pg.lang.home_saved, [pg.c.minecraft.prefix, cmd]) }]
                    ), errorSend);

                    return null;

                }

                // Home
                else if (message.startsWith(pg.c.minecraft.prefix + cmd)) {

                    if (!isglobal) {
                        var cords = db.get(user + "_" + cmd);
                    } else {
                        var cords = db.get(cmd);
                    }

                    // Send
                    if (cords) {

                        pg.connCommand("tp " + user + " " + cords, function(err, data) {
                            if (err) {

                                pg.log.error(err);
                                pg.connCommand('tellraw @a ' + JSON.stringify(
                                    [{ color: 'gray', text: JSON.stringify(err) }]
                                ), errorSend);

                            } else {

                                pg.connCommand('tellraw @a ' + JSON.stringify(
                                    [{ color: 'gray', text: data }]
                                ), errorSend);

                            }
                        });

                    }

                    // No Home
                    else {

                        pg.connCommand('tellraw @a ' + JSON.stringify(
                            [{ color: 'gray', text: pg.lang.error_home }]
                        ), errorSend);

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

                if ((c.extra_slots) && (c.extra_slots > 0)) {
                    for (var i = 0; i < c.extra_slots + 1; i++) {
                        message = slotGenerator(user, message, "home" + String(i));
                    }
                }

                message = slotGenerator(user, message, "home");

                if ((c.extra_slots) && (c.extra_slots > 0)) {
                    for (var i = 0; i < c.extra_slots + 1; i++) {
                        message = slotGenerator(user, message, "globalhome" + String(i), true);
                    }
                }

                message = slotGenerator(user, message, "globalhome", true);

                if (message) {
                    return [user, message];
                } else {
                    return null;
                }

            } else {
                return [user, message];
            }

        };

        // Discord Chat
        const setDiscordGlobal = function(message, channelID, home) {

            if (message.startsWith(pg.c.discord.prefix + "setglobal" + home)) {

                db.set("global" + home, message.replace(pg.c.discord.prefix + "setglobal" + home + " ", ""));
                pg.dsBot.sendMessage({ to: channelID, message: pg.i18(pg.lang.globalhome_saved, [pg.c.minecraft.prefix]) });
                return false;

            } else {
                return true;
            }

        }

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