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

const colors = require('colors');
const titles = {};
let moment;

let lastMessage = {
    cache: "",
    count: 0,
    warning: false
};

const log = require('simple-node-logger').createRollingFileLogger({
    logDirectory: __dirname + '/../logs',
    fileNamePattern: 'node-<DATE>.log'
});

const systemcons = {

    template: function(args, color, type, msg, st) {

        var message = "";

        for (var i = 0; i < args.length; i++) {
            if (i > 0) {
                message += " " + args[i];
            } else {
                message += args[i];
            }
        }

        if (lastMessage.cache != message) {

            lastMessage.count = 0;
            lastMessage.warning = false;
            lastMessage.cache = message;

            if (!st) {
                console.log(colors[color](titles[msg]), systemcons.dateGen(), message);
                if (type == msg) {
                    log[type](systemcons.dateGen(false) + " " + message);
                } else {
                    log[type](titles[msg] + systemcons.dateGen(false) + " " + message);
                }
            } else {
                console.log(colors[color](titles[msg]), colors.gray("[" + moment().format("MM/DD/YYYY") + "]"), message);
                log[type](titles[msg] + " [" + moment().format("MM/DD/YYYY") + "] " + message);
            }

        } else {

            if ((lastMessage.warning == false) && (lastMessage.count > 10)) {

                lastMessage.count++;
                lastMessage.warning = true;

                if (!st) {
                    console.log(colors[color](titles[msg]), systemcons.dateGen(), message, colors.red(many_messages.toUpperCase()));
                    if (type == msg) {
                        log[type](systemcons.dateGen(false) + " " + message + " " + titles.many_messages.toUpperCase());
                    } else {
                        log[type](titles[msg] + systemcons.dateGen(false) + " " + message + " " + titles.many_messages.toUpperCase());
                    }
                } else {
                    console.log(colors[color](titles[msg]), colors.gray("[" + moment().format("MM/DD/YYYY") + "]"), message, colors.red(many_messages.toUpperCase()));
                    log[type](titles[msg] + " [" + moment().format("MM/DD/YYYY") + "] " + message + many_messages.toUpperCase());
                }

            }

        }

    },

    startApp: function(moments, data) {
        moment = moments;
        for (var items in data) {
            titles[items] = "[" + data[items].toUpperCase() + "]";
        }
    },

    dateGen: function(nocolor) {
        const clock = moment();
        if (nocolor != false) {
            return colors.gray("[" + clock.format("MM/DD/YYYY") + "] [" + clock.format("HH:mm:ss") + "]");
        } else {
            return "[" + clock.format("MM/DD/YYYY") + "]";
        }
    },

    info: function() { systemcons.template(arguments, "cyan", "info", "info"); },
    warn: function() { systemcons.template(arguments, "yellow", "warn", "warn"); },
    error: function() { systemcons.template(arguments, "red", "error", "error"); },
    debug: function() { systemcons.template(arguments, "magenta", "info", "debug"); },
    chat: function() { systemcons.template(arguments, "green", "info", "chat"); },
    command: function() { systemcons.template(arguments, "green", "info", "command"); },
    discord: function() { systemcons.template(arguments, "blue", "info", "discord"); },
    minecraft: function() { systemcons.template(arguments, "green", "info", "minecraft", true); }

};

module.exports = systemcons;