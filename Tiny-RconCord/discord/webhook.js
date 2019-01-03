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

var request = require('request');

const webhook = {

    get: function(id, log, callback) {

        request('https://discordapp.com/api/webhooks/' + id.replace('https://discordapp.com/api/webhooks/', ''), function(error, response, body) {
            if (!error && response.statusCode == 200) {
                try {
                    callback(JSON.parse(body));
                } catch (e) {
                    log.error(e);
                }
            } else {
                log.error(error);
            }
        });

    },

    send: function(token, item, callback) {

        if (typeof callback != "function") { callback = function() {}; }

        request({
            method: 'post',
            body: item,
            json: true,
            url: 'https://discordapp.com/api/webhooks/' + token.id + "/" + token.token + token.part
        }, callback);

    }

};

module.exports = webhook;