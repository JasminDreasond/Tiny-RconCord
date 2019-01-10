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

const webhook = {

    start: function(request, log) {

        webhook.get = function(id, callback) {
            return new Promise(function(res, err) {
                request('https://discordapp.com/api/webhooks/' + id.replace('https://discordapp.com/api/webhooks/', ''), function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        try {
                            res(JSON.parse(body));
                        } catch (e) {
                            err(e);
                        }
                    } else {
                        err(error);
                    }
                });
            });
        };

        webhook.send = function(token, item, callback) {

            if (typeof callback != "function") {

                return new Promise(function(res, err) {
                    request({
                        method: 'post',
                        body: item,
                        json: true,
                        url: 'https://discordapp.com/api/webhooks/' + token.id + "/" + token.token + token.part
                    }, function(error, response, body) {
                        if (!error && response.statusCode == 200) {
                            try {
                                res(JSON.parse(body));
                            } catch (e) {
                                err(e);
                            }
                        } else {
                            err(error);
                        }
                    });
                });

            } else {

                return request({
                    method: 'post',
                    body: item,
                    json: true,
                    url: 'https://discordapp.com/api/webhooks/' + token.id + "/" + token.token + token.part
                }, callback);

            }

        };

    }

};

module.exports = webhook;