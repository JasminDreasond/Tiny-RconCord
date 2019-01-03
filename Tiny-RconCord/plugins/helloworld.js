/* 

    Example Plugin

*/

const helloworld = {
    name: "Example Plugin",
    description: "Test Plugin",
    author: "Jasmin Dreasond",
    page: "https://github.com/JasminDreasond/Tiny-RconCord",
    issues: "https://github.com/JasminDreasond/Tiny-RconCord/issues",
    version: "1.0",
    index: 0,
    start: function(pg) {


        pg.log.info("Hello World started using the Discord Lib: " + pg.c.discord.lib);
        pg.log.info("Plugin Folder: " + pg.folder);

        // pg.log.info( pg.getDS()); Wait the Discord API is ready before you use it...

        // Use the Discord API only if the Discord Lib is the Discord.IO
        if (pg.c.discord.lib == "discord.io") {

            // Discord Special Chat
            // The special chat accept async functions
            helloworld.ds_special_chat = function(data, event) {

                // is not a special channelID? Send a false to continue the chat script
                return false;

            };

            // Discord Chat
            helloworld.ds_chat = function(data, event) {

                // Discord scripts...

            };

            // Control your DS Values here
            helloworld.ds_any = function(event) {

                // Discord Values

            };

        }

        // Minecraft Chat (You need the chat.js installed)
        helloworld.mc_chat = function(user, message) {

            // Return the message before it enter into Discord
            return [user, message];

        };

        // Minecraft Log
        helloworld.mc_log = function(data) {

            return data;

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


    }
};

module.exports = helloworld;