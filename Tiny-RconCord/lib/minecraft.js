const minecraft = {

    start: function(log, connCommand) {

        minecraft.execute = function(cmd, player = "@a") {
            this.cmd = 'execute as ' + player + ' run ' + cmd;
        };

        minecraft.execute.prototype.exe = function(callback) {
            connCommand(this.cmd, callback);
        };

        minecraft.send = function(cmd, player = "@a") {
            this.cmd = 'tellraw ' + player + ' ' + JSON.stringify(cmd);
        };

        minecraft.send.prototype.exe = function(callback) {
            connCommand(this.cmd, callback);
        };

        minecraft.sound = function(data) {

            if (
                (typeof data.sound == "string") &&
                (typeof data.source == "string") &&
                (typeof data.targets == "string") &&
                (typeof data.player == "string")
            ) {

                if (typeof data.cords != "string") { data.cords = '~ ~ ~'; }
                if (typeof data.volume != "string") { data.volume = ''; } else {
                    data.volume = ' ' + data.volume;
                }

                if (typeof data.pitch != "string") { data.pitch = ''; } else {
                    data.pitch = ' ' + data.pitch;
                }

                if (typeof data.minimumVolume != "string") { data.minimumVolume = ''; } else {
                    data.minimumVolume = ' ' + data.minimumVolume;
                }

                this.cmd = 'execute as ' + data.player + ' run playsound ' + data.sound + ':' + data.source + ' ' + data.targets + ' ' + data.player + ' ' + data.cords + data.volume + data.pitch + data.minimumVolume;

            } else {
                this.cmd = null;
            }

        };

        minecraft.sound.prototype.exe = function(callback) {
            connCommand(this.cmd, callback);
        };

        minecraft.playerPosition = async function(user) {
            return await new Promise(function(resolve, reject) {
                connCommand("data get entity " + user + " Pos", function(err, data) {
                    if (err) {
                        log.error(err);
                        reject();
                    } else {
                        var tinyresult = JSON.parse(data.replace(user + " has the following entity data: ", "")
                            .replace(/d\,/g, ',')
                            .replace(/d\]/g, ']')
                            .replace(/d\)/g, ')')
                        );
                        resolve(tinyresult);
                    }
                });
            });
        };

    }

};

module.exports = minecraft;