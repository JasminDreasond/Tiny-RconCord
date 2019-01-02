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


        console.log("Hello World started");

        // Discord Chat
        helloworld.ds = function(user, userID, channelID, message, event) {

            // Discord scripts...

        };

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