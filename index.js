// 1. Text strings =====================================================================================================
//    Modify these strings and messages to change the behavior of your Lambda function
//    Known issue: the go out intent does not work because of the weather API
const languageStrings = {
    'en': {
        'translation': {
            'WELCOME': "Welcome to Higgo on Horizon",
            'HELP': "Say alexa ask higgo to smurf to recognize the music and know more about the musician, say alexa ask higgo about the city to know more about the city, you can also try recommend a restaurant or dinner or breakfast or lunch to get more advice from your friend on horizon",
            'ABOUT': "Higgo on Horizon makes your living room smarter and more entertaining, just say the magical word and your friend will understand you",
//            'ABOUT_CITY': "Amsterdam is the Netherlands’ capital, known for its artistic heritage, elaborate canal system and narrow houses with gabled facades, legacies of the city’s 17th-century Golden Age. Its Museum District houses the Van Gogh Museum, works by Rembrandt and Vermeer at the Rijksmuseum, and modern art at the Stedelijk. Cycling is key to the city’s character, and there are numerous bike paths.",
            'STOP': "Okay, see you next time, my Master!"
        }
    }
    // , 'de-DE': { 'translation' : { 'TITLE'   : "Local Helfer etc." } }
};
const data = {
    "city": "Amsterdam",
    "state": "Noord Holland",
    "postcode": "1101 BE",
    "restaurants": [
        {
            "name": "Grand Café 3 and 20",
            "address": "ArenA Boulevard 242",
            "phone": "978-283-0474",
            "meals": "breakfast, lunch",
            "description": "A cozy and popular spot for breakfast.  Try the blueberry french toast!"
        },
        {
            "name": "Burger Bitch",
            "address": " ArenA Boulevard 79",
            "phone": "978-281-1851",
            "meals": "coffee, breakfast, lunch",
            "description": "A homestyle diner located just across the street from the harbor sea wall."
        },
        {
            "name": "Restaurant JinSo",
            "address": "ArenA Boulevard 155",
            "phone": "978-281-5310",
            "meals": "breakfast, lunch",
            "description": "A quaint eatery, popular for weekend brunch.  Try the carrot cake pancakes."
        }

    ],
    "attractions": [
        {
            "name": "Rijksmuseum",
            "description": "The Rijksmuseum is a Dutch national museum dedicated to arts and history in Amsterdam. The museum is located at the Museum Square in the borough Amsterdam South, close to the Van Gogh Museum, the Stedelijk Museum Amsterdam, and the Concertgebouw.",
            "distance": "0"
        },
        {
            "name": "Van Gogh Museum",
            "description": "he Van Gogh Museum is an art museum dedicated to the works of Vincent van Gogh and his contemporaries in Amsterdam in the Netherlands.",
            "distance": "2"
        },
        {
            "name": "Anne Frank House",
            "description": "The Anne Frank House is a writer's house and biographical museum dedicated to Jewish wartime diarist Anne Frank. The building is located on a canal called the Prinsengracht, close to the Westerkerk, in central Amsterdam in the Netherlands.",
            "distance": "4"
        }
    ]
}

const SKILL_NAME = "Higgo";

// Weather courtesy of the Yahoo Weather API.
// This free API recommends no more than 2000 calls per day

const myAPI = {
    host: 'query.yahooapis.com',
    port: 443,
    path: `/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text%3D%22${encodeURIComponent(data.city)}%2C%20${data.state}%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys`,
    method: 'GET'
};
// 2. Skill Code =======================================================================================================

const Alexa = require('alexa-sdk');
var http = require('http');
var Q = require('q');
var pushCmd = require('./pushCmd.js');

exports.handler = function (event, context, callback) {
    var alexa = Alexa.handler(event, context);

    // alexa.appId = 'amzn1.echo-sdk-ams.app.1234';
    ///alexa.dynamoDBTableName = 'YourTableName'; // creates new table for session.attributes
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

const handlers = {
    'LaunchRequest': function () {
        var say = this.t('WELCOME') + ' ' + this.t('HELP');
        this.response.speak(say).listen(say);
        this.emit(':responseReady');
    },

    'AboutIntent': function () {
        var say = this.t('WELCOME') + ' ' + this.t('ABOUT');
        this.response.speak(say);
        this.emit(':responseReady');
    },

    'CoffeeIntent': function () {
        var restaurant = randomArrayElement(getRestaurantsByMeal('coffee'));
        this.attributes['restaurant'] = restaurant.name;

        var say = 'For a great coffee shop, I recommend, ' + restaurant.name + '. Would you like to hear more?';
        this.response.speak(say).listen(say);
        this.emit(':responseReady');
    },

    'BreakfastIntent': function () {
        var restaurant = randomArrayElement(getRestaurantsByMeal('breakfast'));
        this.attributes['restaurant'] = restaurant.name;

        var say = 'For breakfast, try this, ' + restaurant.name + '. Would you like to hear more?';
        this.response.speak(say).listen(say);
        this.emit(':responseReady');
    },

    'LunchIntent': function () {
        var restaurant = randomArrayElement(getRestaurantsByMeal('lunch'));
        this.attributes['restaurant'] = restaurant.name;

        var say = 'Lunch time! Here is a good spot. ' + restaurant.name + '. Would you like to hear more?';
        this.response.speak(say).listen(say);
        this.emit(':responseReady');
    },

    'DinnerIntent': function () {
        var restaurant = randomArrayElement(getRestaurantsByMeal('dinner'));
        this.attributes['restaurant'] = restaurant.name;

        var say = 'Enjoy dinner at, ' + restaurant.name + '. Would you like to hear more?';
        this.response.speak(say).listen(say);
        this.emit(':responseReady');
    },

    'BandIntent': function () {
        //-d bandNames="arch%20enemy,tagada%20jones,metallica" -d from="2017-10-01" -d to="2017-12-31" -d location="52.370216052,4.8951680" -d radius="100km"
        console.log(this.event);
        console.log(this.event.request);
        const city_name = this.event.request.intent.slots.citylist.value;
        // known issue: sometimes alexa does not process the value property, the value becomes undefined
        if (city_name === undefined) {
            this.response.speak("Something went wrong, try again, my Master");
            this.emit(':responseReady');
        }
        var search_object = {
            bandNames: "",
            from: "2017-01-01",
            to: "2017-12-31",
            location: "",
            //location: "52.370216052,4.8951680",
            radius: "100km"
        };

        var loadBody = function (res) {
            var deferred = Q.defer();
            var data = '';
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.on('end', function () {
                deferred.resolve(data);
            });
            return deferred.promise;
        };

        var httpGet = function (opts) {
            var deferred = Q.defer();
            http.get(opts, deferred.resolve).on('error', deferred.reject);

            return deferred.promise;
        };

        var whatsclose_api_endpoint = 'http://api.whatsclose.io:3000/api/concerts';
        var self = this;

        var gps_coordinates = "";


        var geocoder = require('./geocode.js');
        geocoder.resolve(city_name, 1, 3).then(function(data) {
            gps_coordinates = "" + data.lat + "," + data.lng;
            search_object.location = gps_coordinates;
        }).then(function() {

            var search_query = require('querystring').stringify(search_object);
            var full_whatsclose_api_endpoint = whatsclose_api_endpoint + '?' + search_query;

            return httpGet(full_whatsclose_api_endpoint).then(function (res) {
                return loadBody(res);
            }).then(function (dates_string) {
                var dates = JSON.parse(dates_string);
                var number_concerts = dates.length;

                var say = '';
                if (number_concerts == 0) {
                    say = 'Where do you live dude? Nothing around you.';
                    self.response.speak(say).listen(say);
                } else {
                    say = 'There are ' + number_concerts + ' hell fucking events around ' + city_name;
                }

                self.response.speak(say);
                console.log(dates);
                pushCmd.send(dates_string);
                self.emit(':responseReady');
            }).catch(function (error) {
                var say = 'Something went wrong .... I am so sorry master to not be able to complete your request.';
                self.response.speak(say).listen(say);
                self.emit(':responseReady');
            });
        });
    },

    'AMAZON.YesIntent': function () {
        var restaurantName = this.attributes['restaurant'];
        var restaurantDetails = getRestaurantByName(restaurantName);

        var say = restaurantDetails.name +
            ' is located at ' + restaurantDetails.address +
            ', the phone number is ' + restaurantDetails.phone +
            ', and the description is, ' + restaurantDetails.description +
            '  I have sent these details to the Alexa App on your phone.  Enjoy your meal! <say-as interpret-as="interjection">bon appetit</say-as>';

        var card = restaurantDetails.name + '\n' + restaurantDetails.address + '\n' +
            data.city + ', ' + data.state + ' ' + data.postcode +
            '\nphone: ' + restaurantDetails.phone + '\n';

        this.response.cardRenderer(SKILL_NAME, card);
        this.response.speak(say);
        this.emit(':responseReady');

    },

    'AttractionIntent': function () {
        var distance = 200;
        if (this.event.request.intent.slots.distance.value) {
            distance = this.event.request.intent.slots.distance.value;
        }

        var attraction = randomArrayElement(getAttractionsByDistance(distance));

        var say = 'Try ' +
            attraction.name + ', which is ' +
            (attraction.distance == "0" ? 'right downtown. ' : attraction.distance + ' miles away. Have fun! ') +
            attraction.description;

        this.response.speak(say);
        this.emit(':responseReady');
    },

    'SmurfIntent': function() {
        console.log("smurf started");
        var _loadBody = function (res) {
            var deferred = Q.defer();
            var data = '';
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.on('end', function () {
                deferred.resolve(data);
            });
            return deferred.promise;
        };

        var _httpGet = function (opts) {
            console.log("options are:" + opts);
            var deferred = Q.defer();
            http.get(opts, deferred.resolve).on('error', deferred.reject);

            return deferred.promise;
        };

        var music_identification_api_endpoint = 'http://api.whatsclose.io:8080/api/nest/identification';

        var search_object = {
            stream_url: "https://stream-ire-bravo.dropcam.com/nexus_aac/018e9b0cea844b5c9cc8ced5d324814b/index.m3u8"
        };

        var self = this;

        var search_query = require('querystring').stringify(search_object);
        var full_music_identification_api_endpoint = music_identification_api_endpoint + '?' + search_query;
        console.log("ready to send request");
        _httpGet(full_music_identification_api_endpoint).then(function (res) {
            return _loadBody(res);
        }).then(function (data) {
            var say = '';
            
            var data_as_json = JSON.parse(data);
            console.log("ready to log data");
            console.dir(data);
            if ((data_as_json.bandName === undefined ) || (data_as_json.bandName === "" ))
                say = "Master, I miserably failed";
            else
                say = "Master, your sound is " + data_as_json.bandName;

            self.response.speak(say);
            self.emit(':responseReady');

        }).catch(function(error) {
            var say = 'Something went wrong when trying to contact music recognition service.';

            self.response.speak(say);
            self.emit(':responseReady');
        });

    },
    'TeamNameIntent': function () {
        this.emit(':tell', 'Hello This is Ajax!');
    },

    'GoOutIntent': function () {

        getWeather((localTime, currentTemp, currentCondition) => {
            // time format 10:34 PM
            // currentTemp 72
            // currentCondition, e.g.  Sunny, Breezy, Thunderstorms, Showers, Rain, Partly Cloudy, Mostly Cloudy, Mostly Sunny

            // sample API URL for Irvine, CA
            // https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text%3D%22irvine%2C%20ca%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys

            var say = 'It is ' + localTime +
                ' and the weather in ' + data.city +
                ' is ' +
                currentTemp + ' and ' + currentCondition;
            this.response.speak(say);
            this.emit(':responseReady');

            // TODO
            // Decide, based on current time and weather conditions,
            // whether to go out to a local beach or park;
            // or recommend a movie theatre; or recommend staying home


        });
    },

    'AMAZON.NoIntent': function () {
        this.emit('AMAZON.StopIntent');
    },
    'AMAZON.HelpIntent': function () {
        this.response.speak(this.t('HELP')).listen(this.t('HELP'));
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent': function () {
        this.response.speak(this.t('STOP'));
        this.emit(':responseReady');
    },
    'AMAZON.StopIntent': function () {
        this.emit('SessionEndedRequest');
    },
    'SessionEndedRequest': function () {
        this.response.speak(this.t('STOP'));
        this.emit(':responseReady');
    }

};

//    END of Intent Handlers {} ========================================================================================
// 3. Helper Function  =================================================================================================

function getRestaurantsByMeal(mealtype) {

    var list = [];
    for (var i = 0; i < data.restaurants.length; i++) {

        if (data.restaurants[i].meals.search(mealtype) > -1) {
            list.push(data.restaurants[i]);
        }
    }
    return list;
}

function getRestaurantByName(restaurantName) {

    var restaurant = {};
    for (var i = 0; i < data.restaurants.length; i++) {

        if (data.restaurants[i].name == restaurantName) {
            restaurant = data.restaurants[i];
        }
    }
    return restaurant;
}

function getAttractionsByDistance(maxDistance) {

    var list = [];

    for (var i = 0; i < data.attractions.length; i++) {

        if (parseInt(data.attractions[i].distance) <= maxDistance) {
            list.push(data.attractions[i]);
        }
    }
    return list;
}

function getWeather(callback) {
    var https = require('https');


    var req = https.request(myAPI, res => {
        res.setEncoding('utf8');
        var returnData = "";

        res.on('data', chunk => {
            returnData = returnData + chunk;
        });
        res.on('end', () => {
            var channelObj = JSON.parse(returnData).query.results.channel;

            var localTime = channelObj.lastBuildDate.toString();
            localTime = localTime.substring(17, 25).trim();

            var currentTemp = channelObj.item.condition.temp;

            var currentCondition = channelObj.item.condition.text;

            callback(localTime, currentTemp, currentCondition);

        });

    });
    req.end();
}

function randomArrayElement(array) {
    var i = 0;
    i = Math.floor(Math.random() * array.length);
    return (array[i]);
}
