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
    name: "Teleport",
    description: "TP Commands for non-op users",
    author: "Jasmin Dreasond",
    page: "https://github.com/JasminDreasond/Tiny-RconCord",
    issues: "https://github.com/JasminDreasond/Tiny-RconCord/issues",
    version: "1.0",
    index: 0,
    start: function(pg) {

        // Config
        const c = require(pg.folder + "/config.json");

        // Add items into the Minecraft Help Command
        setHome.mine_help = function() {

            return [
                { name: pg.c.discord.prefix + "tp", value: pg.lang.sethome_help }
            ];

        };

        // Error
        const errorSend = function(err2) {
            if (err2) {
                pg.log.error(err2);
                if (pg.c.discord.channelID.rcon) {
                    pg.dsBot.sendMessage({ to: pg.c.discord.channelID.rcon, message: pg.lang['[ERROR]'] + ' ' + JSON.stringify(err2) });
                }
            }
        };

        // Effect
        const tpEffect = function(user, cords, world, callback = function() {}) {

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
                    cords: cords,
                    world: world

                }).exe(callback);

            });

        };

        // TP Script
        const teleportStart = function(world, cords, user, effectCords, effectWorld) {

            tpEffect(user, effectCords, effectWorld, function() {
                new pg.minecraft.teleport(cords, user, world).exe(function(err) {
                    if (err) {
                        pg.log.error(err);
                        new pg.minecraft.send([{ color: 'gray', text: JSON.stringify(err) }], user).exe(errorSend);
                    } else {
                        tpEffect(user, cords, world);
                    }
                });
            });

        };

        // Minecraft Chat
        setHome.mc_chat = function(user, message) {

            // Teleport Script
            if ((message) && (
                    (message.startsWith(pg.c.minecraft.prefix + 'tp')) || (message.startsWith(pg.c.minecraft.prefix + 'teleport'))
                )) {

                message = message.split(' ');

                pg.minecraft.playerPosition(user).then(function(efdata) {

                    // Single TP Cords
                    if (
                        (c.user_to_cords) &&
                        (!isNaN(Number(message[1]))) &&
                        (!isNaN(Number(message[2]))) &&
                        (!isNaN(Number(message[3])))
                    ) { teleportStart(efdata[0], message[1] + ' ' + message[2] + ' ' + message[3], user, efdata[2], efdata[0]); }

                    // User TP Cords
                    else if (
                        (c.everyone_to_cords) &&
                        (isNaN(Number(message[1]))) &&
                        (!isNaN(Number(message[2]))) &&
                        (!isNaN(Number(message[3]))) &&
                        (!isNaN(Number(message[4])))
                    ) { teleportStart(efdata[0], message[2] + ' ' + message[3] + ' ' + message[4], message[1], null, efdata[2], efdata[0]); }

                    // User TP User
                    else if (
                        (c.everyone_to_user) &&
                        (isNaN(Number(message[1]))) && (typeof message[2] == "string") && (isNaN(Number(message[2])))
                    ) {
                        pg.minecraft.playerPosition(user).then(function(data) {
                            teleportStart(data[0], data[2], user, efdata[2], efdata[0]);
                        });
                    }

                    // TP User
                    else if (
                        (c.user_to_user) &&
                        (isNaN(Number(message[1])))
                    ) {
                        pg.minecraft.playerPosition(message[1]).then(function(data) {
                            teleportStart(data[0], data[2], user, efdata[2], efdata[0]);
                        });
                    }

                    // Fail
                    else {

                        new pg.minecraft.send(
                            [{ color: 'gray', text: pg.i18(pg.lang.tp_incorrect_value, [pg.c.minecraft.prefix, cmd]) }],
                            user
                        ).exe(errorSend);

                    }

                });

                return null;

            } else {
                return [user, message];
            }

        };

    }
};

module.exports = setHome;