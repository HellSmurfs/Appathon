var Q = require('q');
var geocoder = require('geocoder');

var searchGeometry = function (location) {
    var geocoderPromisify = Q.nbind(geocoder.geocode, geocoder);

    return geocoderPromisify(location).then (function (data) {
        var deferred = Q.defer ();

        try {
	          if (data.status === 'OK') {
                deferred.resolve(data.results[0].geometry.location);
	          }
            else if (data.status === 'ZERO_RESULTS') {
                deferred.resolve(data);
            }
	          else {
                console.log(data.status);
                console.log('ERROR received. ' + data.status + ' Retry in progress');
                deferred.reject(Error (location));
	          }
        }
        catch(e) {
            console.log ('exception %s', e);
        }

        return deferred.promise;
    });
};

var searchGeometryWithRetry = function(location, retry, max_retries) {
    var self = this;
    retry || (retry = 0);


    return searchGeometry(location).fail(function (err) {
        if (retry >= max_retries)
            throw err;

        // wait some time and try again
        return Q.delay(5000).then(function () {
            console.log("SearchGeometry Retry " + retry + "/" + max_retries);
            return searchGeometryWithRetry(location, ++retry, max_retries);
        });
    });
};


module.exports = {
    resolve: searchGeometryWithRetry
};
