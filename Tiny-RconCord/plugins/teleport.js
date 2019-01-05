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

                            db.set(user + "_" + cmd, String(data[0]) + " " + String(data[1]) + " " + String(data[2]));

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

                        new pg.minecraft.command("teleport " + cords, user).exe(function(err, data) {
                            if (err) {
                                pg.log.error(err);
                                new pg.minecraft.send([{ color: 'gray', text: JSON.stringify(err) }], user).exe(errorSend);
                            }
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

            // TEST
            if ((message) && (message.startsWith(pg.c.minecraft.prefix + 'test'))) {

                const tinytest = pg.minecraft.playerPosition(user).then(function(data) {

                    const tinytest = new pg.minecraft.sound({

                        sound: 'minecraft',
                        source: 'entity.creeper.primed',
                        targets: 'player',
                        player: user,
                        cords: String(data[0]) + " " + String(data[1]) + " " + String(data[2])

                    });

                    console.log(tinytest);

                    tinytest.exe(errorSend);

                });

                console.log(tinytest);
                message = null;

            }

            // Final Result
            if (message) {
                return [user, message];
            } else {
                return null;
            }

        };

    }
};

module.exports = setHome;