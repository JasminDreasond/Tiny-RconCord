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

const colors = {
    name: "Color Selector",
    description: "Simple color name for Minecraft Vanilla",
    author: "Jasmin Dreasond",
    page: "https://github.com/JasminDreasond/Tiny-RconCord",
    issues: "https://github.com/JasminDreasond/Tiny-RconCord/issues",
    version: "1.0",
    index: 0,
    start: function(pg) {

        // Minecraft Colors
        const color_list = [
            'black',
            'dark_blue',
            'dark_green',
            'dark_aqua',
            'dark_red',
            'dark_purple',
            'gold',
            'dark_gray',
            'gray',
            'blue',
            'green',
            'aqua',
            'red',
            'light_purple',
            'yellow',
            'white'
        ];

        // ERROR SEND
        const errorSend = function(err2) {
            if (err2) {
                pg.log.error(err2);
                if (pg.c.discord.channelID.rcon) {
                    pg.dsBot.sendMessage({ to: pg.c.discord.channelID.rcon, message: pg.lang['[ERROR]'] + ' ' + JSON.stringify(err2) });
                }
            }
        };

        // Title Creator
        function toTitleCase(str) {
            return str.replace(
                /\w\S*/g,
                function(txt) {
                    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                }
            );
        }

        // Prepare Groups
        const tiny_colors = {

            checker: function(err2) {

                if (err2) { pg.log.error(err2); }

                tiny_colors.i++;

                if (tiny_colors.i < tiny_colors.total) {

                    tiny_colors.fire();

                } else {

                    tiny_colors.type++;
                    tiny_colors.i = 0;
                    tiny_colors.fire();

                }

            },

            type: 0,
            i: 0,
            total: color_list.length,
            fire: function() {

                if (tiny_colors.type == 0) {

                    new pg.minecraft.team()
                        .add(color_list[tiny_colors.i], toTitleCase(color_list[tiny_colors.i].replace(/\_/g, ' ')))
                        .exe(tiny_colors.checker);

                } else if (tiny_colors.type == 1) {

                    var newteam = new pg.minecraft.team();
                    newteam.modify(color_list[tiny_colors.i], 'color', color_list[tiny_colors.i]);

                    if (config) {
                        for (var items in config) {
                            newteam.modify(color_list[tiny_colors.i], items, config[items])
                        }
                    }

                    newteam.exe(tiny_colors.checker);

                }

            }
        };

        tiny_colors.fire();

        // Add items into the Minecraft Help Command
        colors.mine_help = function() {

            return [
                { name: pg.c.discord.prefix + "colors list", value: pg.lang.colors_list_help },
                { name: pg.c.discord.prefix + "colors set", value: pg.lang.colors_set_help }
            ];

        };

        // Minecraft Chat
        colors.mc_chat = function(user, message) {

            if (message.startsWith(pg.c.minecraft.prefix + "colors")) {

                message = message.split(' ');

                if (typeof message[1] == "string") {

                    if (message[1].startsWith("set")) {

                        if (color_list.indexOf(message[2]) > -1) {

                            new pg.minecraft.team()
                                .join(message[2], user)
                                .exe(function(err) {
                                    if (!err) {
                                        new pg.minecraft.send([{ color: 'gray', text: pg.i18(pg.lang.set_color, [message[2]]) }], user).exe(errorSend);
                                    } else {
                                        new pg.minecraft.send([{ color: 'gray', text: pg.lang.set_color_error }], user).exe(errorSend);
                                        pg.log.error(err);
                                        if (pg.c.discord.channelID.rcon) {
                                            pg.dsBot.sendMessage({ to: pg.c.discord.channelID.rcon, message: pg.lang['[ERROR]'] + ' ' + JSON.stringify(err) });
                                        }
                                    }
                                });

                        } else {
                            new pg.minecraft.send([{ color: 'gray', text: pg.lang.incorrect_set_color }], user).exe(errorSend);
                        }


                    } else if (message[1].startsWith("list")) {

                        const listSend = [];

                        listSend.push({ color: 'gray', text: pg.lang.colors_list });
                        listSend.push({ color: 'gray', text: '\n\n' });

                        for (var i = 0; i < color_list.length; i++) {

                            listSend.push({
                                color: color_list[i],
                                text: color_list[i]
                            });

                            if (i < color_list.length - 1) {
                                listSend.push({ color: 'white', text: ' | ' });
                            }

                        }

                        new pg.minecraft.send(listSend, user).exe(errorSend);

                    } else {
                        return [user, message];
                    }

                } else {
                    return [user, message];
                }

            } else {
                return [user, message];
            }

        };

    }
};

module.exports = colors;