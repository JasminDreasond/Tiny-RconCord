const Query = require('mcquery');

//uses the optional settings
//for a longer timeout;
let query;

function checkMcServer(callback, timer, first) {

    //connect every time to get a new challengeToken
    query.connect(function(err) {

        if (err) {
            console.error(err);
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

module.exports = function(HOST, PORT, timer, callback) {
    query = new Query(HOST, PORT, { timeout: timer });
    checkMcServer(callback, timer, true);
    return function() {
        checkMcServer(callback, timer, false);
    };
};