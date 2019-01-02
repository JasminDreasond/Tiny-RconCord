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


        console.log("Hello World started using the Discord Lib: " + pg.c.DISCORD_LIB);
        console.log("Plugin Folder: " + pg.folder);

        // console.log(pg.getDS()); Wait the Discord API is ready before you use it...

        // Use the Discord API only if the Discord Lib is the Discord.IO
        if (pg.c.DISCORD_LIB == "discord.io") {

            // Discord Chat
            helloworld.ds = function(user, userID, channelID, message, event) {

                // Discord scripts...

            };

        }

        // Minecraft Chat
        helloworld.ms = function(user, message) {

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


    }
};

module.exports = helloworld;