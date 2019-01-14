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

const tinymcquery = {

    start: function(log) {

        const Query = require('mcquery');

        //uses the optional settings
        //for a longer timeout;
        let query;

        function checkMcServer(callback, timer, first) {

            //connect every time to get a new challengeToken
            query.connect(function(err) {

                if (err) {
                    log.error(err);
                    return callback(null);
                } else {
                    query.full_stat(callback);
                }

            });

            if (first == true) {
                setInterval(function() {
                    checkMcServer(callback, timer, false);
                }, timer);
            }

        }

        function fullStatBack(err, stat) {}

        tinymcquery.send = function(HOST, PORT, timer, callback) {
            query = new Query(HOST, PORT, { timeout: timer });
            checkMcServer(callback, timer, true);
            return function() {
                checkMcServer(callback, timer, false);
            };
        }

    }

}

module.exports = tinymcquery;