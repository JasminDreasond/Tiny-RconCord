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
    name: "Heart",
    description: "Whenever you type a heart, your character will emit heart particles <3",
    author: "Jasmin Dreasond",
    page: "https://github.com/JasminDreasond/Tiny-RconCord",
    issues: "https://github.com/JasminDreasond/Tiny-RconCord/issues",
    version: "1.0",
    index: 0,
    start: function(pg) {

        // Minecraft Chat
        setHome.mc_chat = function(user, message) {

            if (message.includes("<3")) {
                pg.minecraft.playerPosition(user).then(function(data) {
                    if (data[1]) {
                        new pg.minecraft.particle({

                            name: 'minecraft',
                            source: 'heart',
                            delta: '0.3 2 0.3',
                            count: 3,
                            cords: data[2],
                            world: data[0]

                        }).exe();
                    }
                });
            }

            return [user, message];

        };

    }
};

module.exports = setHome;