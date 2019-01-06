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

        // TP Script
        const teleportStart = function(msg, cords, user) {

            pg.minecraft.playerPosition(user).then(function(data) {
                tpEffect(user, data[1], function() {
                    new pg.minecraft.command(msg, user).exe(function(err, data) {
                        if (err) {
                            pg.log.error(err);
                            new pg.minecraft.send([{ color: 'gray', text: JSON.stringify(err) }], user).exe(errorSend);
                        } else {
                            console.log(data);
                            tpEffect(user, cords);
                        }
                    });
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

                let finalmessage = 'teleport';

                for (var i = 1; i < message.length; i++) {
                    finalmessage += ' ' + message[i];
                }

                // Single TP Cords
                if (
                    (!isNaN(Number(message[1]))) &&
                    (!isNaN(Number(message[2]))) &&
                    (!isNaN(Number(message[3])))
                ) { teleportStart(finalmessage, message[1] + ' ' + message[2] + ' ' + message[3], user); }

                // User TP Cords
                else if (
                    (isNaN(Number(message[1]))) &&
                    (!isNaN(Number(message[2]))) &&
                    (!isNaN(Number(message[3]))) &&
                    (!isNaN(Number(message[4])))
                ) { teleportStart(finalmessage, message[2] + ' ' + message[3] + ' ' + message[4], message[1]); }

                // User TP User
                else if (
                    (isNaN(Number(message[1]))) && (typeof message[2] == "string") && (isNaN(Number(message[2])))
                ) {
                    pg.minecraft.playerPosition(user).then(function(data) {
                        teleportStart(finalmessage, data[1], user);
                    });
                }

                // TP User
                else if (
                    (isNaN(Number(message[1])))
                ) {
                    pg.minecraft.playerPosition(message[1]).then(function(data) {
                        teleportStart(finalmessage, data[1], user);
                    });
                }

                // Fail
                else {

                    new pg.minecraft.send(
                        [{ color: 'gray', text: pg.i18(pg.lang.tp_incorrect_value, [pg.c.minecraft.prefix, cmd]) }],
                        user
                    ).exe(errorSend);

                }

                return null;

            } else {
                return [user, message];
            }

        };

    }
};

module.exports = setHome;