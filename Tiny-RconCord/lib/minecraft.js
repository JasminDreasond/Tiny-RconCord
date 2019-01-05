const minecraft = {

    start: function(log, connCommand) {

        minecraft.fixMessage = function(text) {

            return text
                .replace(/[ÀÁÂÃÄÅ]/g, "A")
                .replace(/[àáâãäå]/g, "a")
                .replace(/[ÈÉÊË]/g, "E")
                .replace(/[èéêë]/g, "e")
                .replace(/[ÒÓÔÖÕ]/g, "O")
                .replace(/[òóôöõ]/g, "o")
                .replace(/[ÙÚûü]/g, "U")
                .replace(/[ùúûü]/g, "u")
                .replace(/[ÌÍÎÏ]/g, "I")
                .replace(/[ìíîï]/g, "i")
                .replace(/[Ç]/g, "C")
                .replace(/[ç]/g, "c");

        };

        // Execute
        minecraft.execute = function(cmd) {
            this.cmd = 'execute ' + cmd;
        };

        minecraft.execute.prototype.exe = function(callback) {
            connCommand(this.cmd, callback);
        };

        // Command
        minecraft.command = function(cmd, player = "@a") {
            this.cmd = 'execute as ' + player + ' run ' + cmd;
        };

        minecraft.command.prototype.exe = function(callback) {
            connCommand(this.cmd, callback);
        };

        // Send Message
        minecraft.send = function(cmd, player = "@a") {
            this.cmd = 'tellraw ' + player + ' ' + minecraft.fixMessage(JSON.stringify(cmd));
        };

        minecraft.send.prototype.exe = function(callback) {
            connCommand(this.cmd, callback);
        };

        // Play Sound
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

        // Team
        minecraft.team = function(cmd, player = "@a") {
            this.cmd = 'team ';
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

        minecraft.team.prototype.modify = function(id) {
            return this.cmd + 'modify ' + id;
        };

        minecraft.team.prototype.remove = function(id) {
            return this.cmd + 'remove ' + id;
        };

        minecraft.team.prototype.exe = function(callback) {
            connCommand(this.cmd, callback);
        };

        // Get User Position
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