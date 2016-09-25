(function () {
    "use strict";
    const rss = require("stabl-rss-to-json");
    const Parse = require("parse/node");
    const restify = require('restify');
    const _ = require("underscore");

    if (process.argv.length !== 6) {
        console.log("usage: node app.js <user> <pass> <app id> <server url>");
        process.exit(1);
    }

    Parse.initialize(process.argv[4]);
    Parse.serverURL = process.argv[5]

    function save(item) {
        return Parse.User.logIn(process.argv[2], process.argv[3]).then(user => {
            var PodcastItem = Parse.Object.extend("PodcastItem");
            var podcastItem = new PodcastItem();
            return podcastItem.save(item, {sessionToken : user.getSessionToken()});
        })
    }

    function fetch(id, params='&country=gb') {
        return new Promise((resolve, reject) => {
            rss.feedFromItunesCollectionId(id + params)
                .then(collection => {
                    resolve(collection);
                })
                .catch(reject);
        });
    }

    function merge(obj1, obj2) {
        for (var attrname in obj2) { 
            obj1[attrname] = obj2[attrname]; 
        }
        return obj1;
    }

    function construct(collection) {
        return new Promise((resolve, reject) => {
            rss.parseFeedUrl(collection.feedUrl)
                .then(feed => {
                    resolve(merge(collection, _.first(feed)));
                })
                .catch(msg => {
                    reject(msg);
                });
        });
    }

    function respond(req, res, next) {
        var collectionId = req.params.name;
        console.log('adding: ' + collectionId)
        fetch(collectionId)
        .then(collection => {
            return construct(collection);
        })
        .then(feed => {
            return save(feed);
        })
        .then(result => {
            console.log('added: ' + JSON.stringify(result));
            res.send({"result": "OK"});
        })
        .catch(msg => {
            console.log(msg);
            res.send(msg);
        });
        return next();
    }

    var server = restify.createServer();
    server.get('/add/:name', respond);

    server.listen(8080, function() {
        console.log('%s listening at %s', server.name, server.url);
    });
})();