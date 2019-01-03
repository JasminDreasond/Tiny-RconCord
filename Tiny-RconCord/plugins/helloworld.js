/* 

    Example Plugin

*/

const helloworld = {
    name: "Example Plugin",
    author: "Jasmin Dreasond",
    page: "https://github.com/JasminDreasond/Tiny-RconCord",
    issues: "https://github.com/JasminDreasond/Tiny-RconCord/issues",
    version: "1.0",
    start: function(pg) {


        pg.log.info("Hello World started using the Discord Lib: " + pg.c.discord.lib);
        pg.log.info("Plugin Folder: " + pg.folder);

        // pg.log.info( pg.getDS()); Wait the Discord API is ready before you use it...

        // Use the Discord API only if the Discord Lib is the Discord.IO
        if (pg.c.discord.lib == "discord.io") {

            // Discord Chat
            helloworld.ds = function(user, userID, channelID, message, event) {

                // Discord scripts...

            };

        }

        // Minecraft Chat
        helloworld.mc = function(user, message) {

            // Return the message before it enter into Discord
            return [user, message];

        };

        // Minecraft Log
        helloworld.mslog = function(log) {

            return log;

        };

        // Minecraft RCON
        helloworld.rcon = function(log) {

            return log;

        };

        // Add items into the Help Command
        helloworld.help = function() {

            return [
                { name: "Test", value: "test again", inline: true },
                { name: "Test 2", value: "test again 2", inline: true }
            ];

        };

        // Add items into the Help Command
        helloworld.ds_any = function(event) {

            // Debug Discord Events

        };


    }
};

module.exports = helloworld;