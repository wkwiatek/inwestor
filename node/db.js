var mongoose = require("mongoose");  
var config = require("./config"); 

var loginCredentials = config.username + ":" + config.password;
var dbUrl = config.databaseUrl;
var dbName = config.databaseName;


// Opens connection to MongoDB database, authenticates, logs successful connection.

mongoose.connection.on("open", function() {
	console.log("Connected to MongoDB successfully!");
});
mongoose.connect("mongodb://" + loginCredentials + "@" + dbUrl + "/" + dbName);	 
console.log("mongodb://" + loginCredentials + "@" + dbUrl + "/" + dbName); 

//
// Queries a MongoDB collection to retrieve data based on
// properties supplied by json parameter.
//
exports.query = function (collectionIdent, json, fields, callback) {
	mongoose.connection.db.collection(collectionIdent, function (err, collection) {
		collection.find(json, fields).toArray(callback);
	});
}

exports.queryOne = function (collectionIdent, json, fields, callback) {
	mongoose.connection.db.collection(collectionIdent, function (err, collection) {
		collection.findOne(json, fields, callback);
	});
}

//
// Inserts into a MongoDB collection and returns inserted data
//
exports.insert = function (collectionIdent, json, callback) {
	mongoose.connection.db.collection(collectionIdent, function (err, collection) {
		collection.insert(json, callback);
	});
}

//
// Update a MongoDB collection and returns inserted data
//
exports.update = function (collectionIdent, json, flags, addons, callback) {
	mongoose.connection.db.collection(collectionIdent, function (err, collection) {
		collection.update(json, flags, addons);
	});
}

//
// Remove MongoDB documents
//
exports.remove = function (collectionIdent, json, callback) {
	mongoose.connection.db.collection(collectionIdent, function (err, collection) {
		collection.remove(json);
	});
}
