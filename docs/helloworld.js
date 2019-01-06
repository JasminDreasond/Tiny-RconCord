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


        pg.log.info(pg.i18(pg.lang.example_text_1, [helloworld.name, pg.c.discord.lib]));
        pg.log.info(pg.i18(pg.lang.example_text_2, [pg.folder]));

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

        // Minecraft Chat
        helloworld.mc_chat = function(user, message) {

            // Return the message before it enter into Discord
            return [user, message];

        };

        // Minecraft Join
        helloworld.mc_join = function(userjoin) {

            // Return the join value for another plugins
            return userjoin;

        };

        // Minecraft Leave
        helloworld.mc_leave = function(userleave) {

            // Return the leave value for another plugins
            return userleave;

        };

        // Minecraft Advancement
        helloworld.mc_advancement = function(adv) {

            // Return the advancement value for another plugins
            return adv;

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
        setHome.help = function(data) {

            // Check if the userID is the app owner
            if (data.userID == data.ownerID) {

                // Yes? Insert the help
                return [
                    { name: "Test", value: "test again", inline: true },
                    { name: "Test 2", value: "test again 2", inline: true }
                ];

            }

            // Nope? Send a empty array
            else {
                return [];
            }

        };


    }
};

module.exports = helloworld;