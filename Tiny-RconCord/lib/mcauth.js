/*
    __  ____                            ______ 
   /  |/  (_)___  ___  ______________ _/ __/ /_
  / /|_/ / / __ \/ _ \/ ___/ ___/ __ `/ /_/ __/
 / /  / / / / / /  __/ /__/ /  / /_/ / __/ /_  
/_/  /_/_/_/ /_/\___/\___/_/   \__,_/_/  \__/  
                 ___         __  __            
                /   | __  __/ /_/ /_           
               / /| |/ / / / __/ __ \          
              / ___ / /_/ / /_/ / / /          
             /_/  |_\__,_/\__/_/ /_/           
Provides different ways to verify information with 
Minecraft's account database
By medsouz
Created for Miney
*/
var request = require('request');

function hasPaid(username, func) {
    request('http://minecraft.net/haspaid.jsp?user=' + username, function(error, response, body) {
        var isGood;
        if (!error && response.statusCode == 200) {
            isGood = (body == "true");
        } else {
            isGood = false;
        }
        func(isGood);
    })
}

function checkSessionId(username, sessionid, func) {
    request('http://session.minecraft.net/game/joinserver.jsp?user=' + username + '&sessionId=' + sessionid + '&serverId=MCAuthDotJS', function(error, response, body) {
        var isGood;
        if (!error && response.statusCode == 200) {
            isGood = (body == "OK");
        } else {
            isGood = false;
        }
        func(isGood);
    })
}

function getMojangProfile(username, func) {
    var options = {
        uri: 'https://api.mojang.com/profiles/page/1',
        method: 'POST',
        json: {
            agent: 'minecraft'
        }
    }
    options.json.name = username;
    request(options, function(error, response, body) {
        func(body);
    });
}

function getPlayerInformation(uuid, func) {
    request('https://sessionserver.mojang.com/session/minecraft/profile/' + uuid, function(error, response, body) {
        func(body);
    });
}

function isNameValid(username, func) {
    func(username.match('[A-Za-z0-9_]{2,16}') == username)
}

exports.hasPaid = hasPaid;
exports.checkSessionId = checkSessionId;
exports.getMojangProfile = getMojangProfile;
exports.getPlayerInformation = getPlayerInformation;
exports.isNameValid = isNameValid;