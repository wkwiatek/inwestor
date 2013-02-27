var xml2js = require('xml2js');
// var jsdom = require("jsdom");
var http = require('http');
var db = require('../node/db');
var cheerio = require('cheerio');
// global variables 
var companyList = [],
	WIGList = [],
	mainMsg;

exports.getBZWBK = function () {
	get('dmbzwbk.pl', '/_items/rss/6.xml', function (string){
		var parser = new xml2js.Parser();
		parser.parseString(string, function (err, result) {
			exports.mainMsg = result.rss.channel[0].item[0];
			db.update("bzwbkComments", { "msg" : result.rss.channel[0].item[0] }, { "$set" :  { "msg" : result.rss.channel[0].item[0] } }, { upsert : true }, function (err, updated) {
				if (err) {
					console.log("Insert error", err);
					return;
				}
			});
		});
	});
}

exports.getRssData = function () {
	db.query("company", { "fullName" : { "$exists" : true }}, ["fullName", "rssLink"], function (err, result) {
	  	result.forEach(function (one){
			googleAlertsRequest(one);
	  	});
	});
}

exports.getCompanyList = function (){
	db.query("company", { "name" : { "$exists" : true }}, ["name", "fullName"], function (err, result) {
		var table = [];
		result.forEach(function (one){
			if (one.fullName != undefined)
				table.push({ 'name' : one.name, 'fullName' : one.fullName });
			/*else 
				table.push({ 'name' : one.name, 'fullName' : null });*/
		});
		exports.companyList = table;
	});
}

exports.getWIGList = function (){
	db.query("company", { "name" : { $regex : '^WIG' , $options: 'i' } }, ["name"], function (err, result) {
		var table = [];
		result.forEach(function (one){
		  	table.push(one.name);
		});
		exports.WIGList = table;
	});
}

exports.getSessionStockData = function () {
	get('bossa.pl', '/pub/ciagle/omega/cgl/ndohlcv.txt', function (str){
		var matchRandom = /[a-b]/.test(str);
		if (matchRandom == false){
			
			var parsed = str.split(/,|\r\n/);
			
			for (var i=0; i<parsed.length; i+=7){
				db.update ("company", {"name": parsed[i]}, { $addToSet : { "values" : { 
						"date" : parseInt(parsed[i+1]),
						"open" : parseFloat(parsed[i+2]),
						"high" : parseFloat(parsed[i+3]),
						"low" : parseFloat(parsed[i+4]),
						"close" : parseFloat(parsed[i+5]),
						"volume" : parseFloat(parsed[i+6]) } } }, { upsert : true } , function (err, result) {
					if (err) {
						console.log("Insert error", err);
						return;
					}
				});	
			}
		}
	});
}

exports.getCurrentStockData = function () {
	get('www.money.pl', '/gielda/gpw/akcje/', function (html){
		$ = cheerio.load(html);
		$(".tabela tbody").each( function () {
			$(this).children().each( function () {
				var json = {},
					company;
				$(this).children().each( function (i) {						
					if (i==0) {
						company = $(this).text().toString().replace(/^\s*|\s*$/g,'');
					}
					else if (i==6) {
						json.currentPrice = parseFloat($(this).text().toString().replace(/^\s*|\s*$/g,'').replace(',','.'));
					}
					else if (i==8) {
						var hhmm = $(this).text().toString().replace(/^\s*|\s*$/g,'').split(':');
						var now = new Date();
						var currentDataTime = new Date();
						currentDataTime.setUTCHours(hhmm[0]-1);
						currentDataTime.setMinutes(hhmm[1]);
						currentDataTime.setSeconds(0);
						currentDataTime.setMilliseconds(0);

						if (now > currentDataTime)
							json.time = currentDataTime;
					}
					else if (i==9) {
						json.currentVolume = parseFloat($(this).text().toString().replace(/^\s*|\s*$/g,'').replace(',','.'));
					}
				});		

				db.update ("currentStockValues", {"name": company}, { $addToSet : { "values" : json } }, { upsert: true },  function (err, result) {
					if (err) {
						console.log("Insert error", err);
						return;
					}
				});
			});
		});
	});
	/*jsdom.env({
		html: "http://www.money.pl/gielda/gpw/akcje/",
		scripts: ["http://code.jquery.com/jquery.js"],
		done: function (errors, window) {
			var $ = window.$;
			$(".tabela tbody").each( function () {
				$(this).children().each( function () {
					var json = {},
						company;
					$(this).children().each( function (i) {						
						if (i==0) {
							company = $(this).text().toString().replace(/^\s*|\s*$/g,'');
						}
						else if (i==6) {
							json.currentPrice = parseFloat($(this).text().toString().replace(/^\s*|\s*$/g,'').replace(',','.'));
						}
						else if (i==8) {
							var hhmm = $(this).text().toString().replace(/^\s*|\s*$/g,'').split(':');
							var now = new Date();
							var currentDataTime = new Date();
							currentDataTime.setUTCHours(hhmm[0]-1);
							currentDataTime.setMinutes(hhmm[1]);
							currentDataTime.setSeconds(0);
							currentDataTime.setMilliseconds(0);

							if (now > currentDataTime)
								json.time = currentDataTime;
						}
						else if (i==9) {
							json.currentVolume = parseFloat($(this).text().toString().replace(/^\s*|\s*$/g,'').replace(',','.'));
						}
					});		

					// TODO:
					db.update ("currentStockValues", {"name": company}, { $addToSet : { "values" : json } }, { upsert: true },  function (err, result) {
						if (err) {
							console.log("Insert error", err);
							return;
						}
					});				
				});
			});			
		}
	});*/
}



// internal functions
function get(host, path, functionCallback){

	var options = {
	  	host: host,
	  	path: path
	};

	callback = function(response) {
	  var str = '';

	  response.on('data', function (chunk) {
	    	str += chunk;
	  });

	  response.on('end', function () {
		functionCallback(str);
	  });
	}

	http.request(options, callback).end();
}

function googleAlertsRequest(company) {
	var parser = new xml2js.Parser();
	
	get('www.google.com', getPath(company.rssLink)[5], function (str){
		parser.parseString(str, function (err, result) {

			db.update("company", {"rssLink": company.rssLink , "fullName" : company.fullName }, { $set : { "feed" : result.feed.entry } }, function (err, updated) {
				//console.log(company.fullName + ' ' + result.feed.entry);
				if (err) {
					console.log("Insert error", err);
					return;
				}
			});
			
			result.feed.entry.forEach( function (one){
				//console.log(JSON.stringify(one.author[0].name[0]));
				if (one.author[0].name[0] != "Alerty Google"){
					db.update("company", {"rssLink": company.rssLink , "fullName" : company.fullName }, { $addToSet : { "rss" : one } }, function (err, updated) {
						//console.log(company.fullName + ' ' + result.feed.entry);
						if (err) {
							console.log("Insert error", err);
							return;
						}
					});
				}
			});
		});
	});
}

function getPath(url) {
    return /^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/.exec(url);
}
