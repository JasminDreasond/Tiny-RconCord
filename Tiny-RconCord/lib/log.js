const colors = require('colors');
const titles = {};
let moment;

const systemcons = {

    startApp: function(moments, data) {
        moment = moments;
        for (var items in data) {
            titles[items] = "[" + data[items].toUpperCase() + "]";
        }
    },

    dateGen: function() {
        const clock = moment();
        return colors.gray("[" + clock.format("MM/DD/YYYY") + "] [" + clock.format("HH:mm:ss") + "]");
    },

    info: function() {
        for (var i = 0; i < 4; i++) {
            if (typeof arguments[i] == "undefined") { arguments[i] = ''; }
        }
        console.log(colors.cyan(titles.info), systemcons.dateGen(), arguments[0], arguments[1], arguments[2], arguments[3]);
    },

    warn: function() {
        for (var i = 0; i < 4; i++) {
            if (typeof arguments[i] == "undefined") { arguments[i] = ''; }
        }
        console.warn(colors.yellow(titles.warn), systemcons.dateGen(), arguments[0], arguments[1], arguments[2], arguments[3]);
    },

    error: function() {
        for (var i = 0; i < 4; i++) {
            if (typeof arguments[i] == "undefined") { arguments[i] = ''; }
        }
        console.error(colors.red(titles.error), systemcons.dateGen(), arguments[0], arguments[1], arguments[2], arguments[3]);
    },

    debug: function() {
        for (var i = 0; i < 4; i++) {
            if (typeof arguments[i] == "undefined") { arguments[i] = ''; }
        }
        console.log(colors.magenta(titles.debug), systemcons.dateGen(), arguments[0], arguments[1], arguments[2], arguments[3]);
    },

    minecraft: function() {
        for (var i = 0; i < 4; i++) {
            if (typeof arguments[i] == "undefined") { arguments[i] = ''; }
        }
        console.log(colors.green(titles.minecraft), colors.gray("[" + moment().format("MM/DD/YYYY") + "]"), arguments[0], arguments[1], arguments[2], arguments[3]);
    }

};

module.exports = systemcons;