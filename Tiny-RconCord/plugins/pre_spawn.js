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

const helloworld = {
    name: "World Spawn Filter",
    description: "Do not let the loading world flood your log",
    author: "Jasmin Dreasond",
    page: "https://github.com/JasminDreasond/Tiny-RconCord",
    issues: "https://github.com/JasminDreasond/Tiny-RconCord/issues",
    version: "1.0",
    index: 0,
    start: function(pg) {

        const c = require(pg.folder + "/config.json");

        // Minecraft Log
        helloworld.mc_log = function(data) {

            // Detect if the log is a Spawn Message
            var prespawn = data.match(new RegExp(c.regex));
            if ((typeof c.regex == "string") && (prespawn)) {

                // Finish the Log Get
                return null;

            } else {
                return data;
            }

        };

    }
};

module.exports = helloworld;