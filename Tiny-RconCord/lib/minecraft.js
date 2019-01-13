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

const minecraft = {

    start: function(log, connCommand, hexC, plugins) {



        // Execute
        minecraft.execute = function(cmd) {
            this.cmd = 'execute ' + cmd;
        };

        minecraft.execute.prototype.exe = async function(callback) {
            return await connCommand(this.cmd, callback);
        };

        // Teleport
        minecraft.teleport = function(cords = "0 0 0", player = "@a", world = ['minecraft', 'overworld']) {
            this.cmd = 'execute in ' + world[0] + ':' + world[1] + ' run tp ' + player + ' ' + cords;
        };

        minecraft.teleport.prototype.exe = async function(callback) {
            return await connCommand(this.cmd, callback);
        };

        // Command
        minecraft.command = function(cmd, player = "@a") {
            this.cmd = 'execute as ' + player + ' run ' + cmd;
        };

        minecraft.command.prototype.exe = async function(callback) {
            return await connCommand(this.cmd, callback);
        };

        // Fix JSON Message
        minecraft.fixMessageJSON = function(cmd) {

            for (var items in cmd) {
                cmd[items].text = hexC.controlled(cmd[items].text, true);
            }

            return JSON.stringify(cmd).replace(/\\\\u/g, '\\u');

        };

        // Send Message
        minecraft.send = function(cmd, player = "@a") {
            this.cmd = 'tellraw ' + player + ' ' + minecraft.fixMessageJSON(cmd);
        };

        minecraft.send.prototype.exe = async function(callback) {
            return await connCommand(this.cmd, callback);
        };

        // Play Sound
        minecraft.sound = function(data) {

            if (
                (typeof data.sound == "string") &&
                (typeof data.source == "string") &&
                (typeof data.targets == "string") &&
                (typeof data.player == "string")
            ) {

                if ((!data.world) || (typeof data.world[0] != "string") || (typeof data.world[1] != "string")) { data.world = ['minecraft', 'overworld']; }
                if (typeof data.cords != "string") { data.cords = '~ ~ ~'; }
                if (typeof data.object != "string") { data.object = '@a'; }
                if (typeof data.volume != "string") { data.volume = ''; } else {
                    data.volume = ' ' + data.volume;
                }

                if (typeof data.pitch != "string") { data.pitch = ''; } else {
                    data.pitch = ' ' + data.pitch;
                }

                if (typeof data.minimumVolume != "string") { data.minimumVolume = ''; } else {
                    data.minimumVolume = ' ' + data.minimumVolume;
                }

                this.cmd = 'execute in ' + data.world[0] + ':' + data.world[1] + ' as ' + data.player + ' run playsound ' + data.sound + ':' + data.source + ' ' + data.targets + ' ' + data.object + ' ' + data.cords + data.volume + data.pitch + data.minimumVolume;

            } else {
                this.cmd = null;
            }

        };

        minecraft.sound.prototype.exe = async function(callback) {
            return await connCommand(this.cmd, callback);
        };

        // Play Sound
        minecraft.particle = function(data) {

            if (
                (typeof data.name == "string") &&
                (typeof data.source == "string")
            ) {

                if ((!data.world) || (typeof data.world[0] != "string") || (typeof data.world[1] != "string")) { data.world = ['minecraft', 'overworld']; }
                if (typeof data.cords != "string") { data.cords = '~ ~ ~'; }
                if (typeof data.delta != "string") { data.delta = '0 0 0'; }
                if ((typeof data.speed != "string") && (typeof data.speed != "number")) { data.speed = '0'; }
                if ((typeof data.count != "string") && (typeof data.count != "number")) { data.count = '1000'; }
                if (typeof data.type != "string") { data.type = 'normal'; }
                if (typeof data.player != "string") { data.player = '@a'; }

                this.cmd = 'execute in ' + data.world[0] + ':' + data.world[1] + ' as ' + data.player + ' run particle ' + data.name + ':' + data.source + ' ' + data.cords + ' ' + data.delta + ' ' + data.speed + ' ' + data.count + ' ' + data.type + ' ' + data.player;

            } else {
                this.cmd = null;
            }

        };

        minecraft.particle.prototype.exe = async function(callback) {
            return await connCommand(this.cmd, callback);
        };

        // Team
        minecraft.team = function(player = "@a") {
            this.cmd = 'team ' + player + ' ';
        };

        minecraft.team.prototype.add = function(id, name) {
            return this.cmd + 'add ' + id + ' "' + name + '"';
        };

        minecraft.team.prototype.empty = function(id) {
            return this.cmd + 'empty ' + id;
        };

        minecraft.team.prototype.join = function(id, user = '@a') {
            return this.cmd + 'join ' + id + ' ' + user;
        };

        minecraft.team.prototype.leave = function(user) {
            return this.cmd + 'leave ' + user;
        };

        minecraft.team.prototype.list = function(team) {
            if (typeof team == "string") { team = ' ' + team; }
            return this.cmd + 'list' + team;
        };

        minecraft.team.prototype.modify = function(type, id) {
            return this.cmd + 'modify ' + type + ' ' + id;
        };

        minecraft.team.prototype.remove = function(id) {
            return this.cmd + 'remove ' + id;
        };

        minecraft.team.prototype.exe = async function(callback) {
            return await connCommand(this.cmd, callback);
        };

        // Kill User
        minecraft.kill = async function(user = '@a') {
            return await new Promise(function(resolve, reject) {
                connCommand("kill " + user, function(err, data) {
                    if (err) {
                        log.error(err);
                        reject(err);
                    } else { resolve(data); }
                });
            });
        };

        // Recipe User
        minecraft.recipe = async function(type, item = '*', user = '@a') {
            return await new Promise(function(resolve, reject) {
                connCommand("recipe " + type + " " + user + " " + item, function(err, data) {
                    if (err) {
                        log.error(err);
                        reject(err);
                    } else { resolve(data); }
                });
            });
        };

        // Get Data
        minecraft.getData = async function(type, user, item, nojson) {

            if (typeof item == "string") {
                item = " " + item;
            } else {
                item = "";
            }

            return await new Promise(function(resolve, reject) {
                connCommand("data get " + type + " " + user + item, function(err, data) {
                    if (err) {
                        log.error(err);
                        reject(err);
                    } else {

                        try {
                            if (!nojson) {
                                resolve(JSON.parse(data.replace(user + " has the following entity data: ", "")));
                            } else {
                                resolve(data.replace(user + " has the following entity data: ", ""));
                            }
                        } catch (e) {
                            log.error(err);
                            reject(err);
                        }

                    }
                });
            });

        };

        // Get User Position
        minecraft.playerPosition = async function(user) {
            return await new Promise(function(resolve, reject) {
                minecraft.getData('entity', user, 'Pos', true).then(function(pos) {
                    minecraft.getData('entity', user, 'Dimension', true).then(function(dimension) {

                        var tinyresult = JSON.parse(
                            pos.replace(/d\,/g, ',')
                            .replace(/d\]/g, ']')
                            .replace(/d\)/g, ')')
                        );

                        dimension = Number(dimension);

                        if (dimension == 1) {
                            var dms = ['minecraft', 'the_end'];
                        } else if (dimension == -1) {
                            var dms = ['minecraft', 'the_nether'];
                        } else {
                            if (dimension != 0) {
                                log.error(lang.wrong_dimension_id);
                            }
                            var dms = ['minecraft', 'overworld'];
                        }

                        resolve([dms, tinyresult, tinyresult[0] + ' ' + tinyresult[1] + ' ' + tinyresult[2]]);

                    }).catch(function(err) { reject(err); });
                }).catch(function(err) { reject(err); });
            });
        };

    }

};

module.exports = minecraft;