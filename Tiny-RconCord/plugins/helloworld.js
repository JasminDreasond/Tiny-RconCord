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


        console.log("Hello World started using the Discord Lib: " + pg.dslib);

        // Use the Discord API only if the Discord Lib is the Discord.IO
        if (pg.dslib == "discord.io") {

            // Discord Chat
            helloworld.ds = function(bot, user, userID, channelID, message, event) {

                // Discord scripts...

            };

        }

        // Minecraft Chat
        helloworld.ms = function(user, message) {

            // Return the message before it enter into Discord
            return [user, message];

        };

        // Minecraft Chat
        helloworld.mslog = function(log) {

            // Return the message before it enter into Discord
            return [user, message];

        };


    }
};

module.exports = helloworld;