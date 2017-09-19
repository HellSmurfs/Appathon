var request = require('request');

var cmdUrl = "http://52.59.237.209/iot13/commands";

var logResult = function (data, error, response, body) {
    console.log('data:', data)
    console.log('error:', error);
    console.log('statusCode:', response && response.statusCode);
    console.log('body:', body);
};

var sendCmd = function (data) {
    var post_data = {
        name: "higgo",
        meta: {
            messages: [data]
        }
    };

    var open_data = {
        name: "app",
        meta: {
            appId: "com.irdeto.app.Higgo"
        }
    };

    request.post({
        url: cmdUrl,
        body: open_data,
        json: true
    },
        function (error, response, body) {
            logResult(open_data, error, response, body);
        }
    );

    setTimeout(function () {
        request.post({
            url: cmdUrl,
            body: open_data,
            json: true
        },
            function (error, response, body) {
                logResult(open_data, error, response, body);
            }
        );
    }, 9000)

    setTimeout(function () {
        request.post({
            url: cmdUrl,
            body: post_data,
            json: true
        },
            function (error, response, body) {
                logResult(open_data, error, response, body);
            }
        );
    }, 10000)
};

module.exports = {
    send: sendCmd
};