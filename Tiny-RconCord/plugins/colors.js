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
    name: "Set Home",
    description: "Simple sethome for Minecraft Vanilla",
    author: "Jasmin Dreasond",
    page: "https://github.com/JasminDreasond/Tiny-RconCord",
    issues: "https://github.com/JasminDreasond/Tiny-RconCord/issues",
    version: "1.0",
    index: 0,
    start: function(pg) {

        // Add items into the Minecraft Help Command
        colors.mine_help = function() {

            return [
                { name: pg.c.discord.prefix + "colors list", value: pg.lang.colors_list_help },
                { name: pg.c.discord.prefix + "colors set", value: pg.lang.colors_set_help }
            ];

        };

        // Minecraft Chat
        colors.mc_chat = function(user, message) {

            return [user, message];

        };

    }
};

module.exports = colors;