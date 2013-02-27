var db = require('../node/db');

exports.checkWIG = function (req, res){  
  db.queryOne("company", { "name" : { $regex : '^' + req.query.name + '$' , $options: 'i' }}, ["name"], function (err,result){
	if (result != undefined) res.send(result);
  	else res.send('error');
  });
}

exports.getCompanyName = function (req, res){  
  db.queryOne("company", { "name" : { $regex : '^' + req.query.name + '$' , $options: 'i' }}, ["name", "fullName"], function (err,result){
	if (result != undefined) res.send(result);
  	else res.send('error');
  });
}

exports.getValues = function (req, res){  
  db.queryOne("company", { "name" : { $regex : '^' + req.query.name + '$' , $options: 'i' }}, ["values.date", "values.low", "values.high", "values.open", "values.close", "values.volume"], function (err,result){
	if (result != undefined) res.send(result.values);
  	else res.send('error');
  });
}

exports.getCurrentValues = function (req, res){  
  	var today = new Date();
	today.setHours(0);
	today.setMinutes(0);
	today.setSeconds(0);
	var nextDay = new Date();
	nextDay.setDate(today.getDate()+1);
	nextDay.setHours(0);
	nextDay.setMinutes(0);
	nextDay.setSeconds(0);
	getPreviousDayStockValues(req, res, today, nextDay);
}

exports.getRssMessages = function (req,res){
	var page = req.query.page;
	db.queryOne("company", { "name" : req.query.name }, ["rss"], function (err,result){
		res.send(result.rss.sort(compareByDate).splice(page*6,6));
	});
}

exports.getRssLength = function (req,res){
	db.queryOne("company", { "name" : req.query.name }, ["rss"], function (err,result){
		res.send(result.rss.length.toString());
	});
}


// internal functions
function getPreviousDayStockValues (req, res, day, nextDay) {	
	var responseJson = {};
	responseJson.date = day;
	db.queryOne("currentStockValues", { "name" : { $regex : '^' + req.query.name + '$' , $options: 'i' }}, ["values"], function (err,result){
		if (result != undefined) {
			var todaysOnly = [],
				previousDay = new Date(day.getTime());;
			result.values.forEach(function (one){
				if(one.time > day && one.time < nextDay)
					todaysOnly.push(one);
			});;
			responseJson.values = todaysOnly;
			previousDay.setDate(day.getDate()-1);
			previousDay.setHours(0);
			previousDay.setMinutes(0);
			previousDay.setSeconds(0);
			
			todaysOnly.length > 1 ? res.send(responseJson) : getPreviousDayStockValues(req, res, previousDay, day);
		}
	  	else {
	  		res.send('error');
	  	}		  		
  	});
}	

function compareByDate (a, b) {
	var dateA = new Date(Date.parse(a.published[0])),
		dateB = new Date(Date.parse(b.published[0]));
	return dateB - dateA;
}

function compareByTime (a, b) {
	return a.time = b.time;
}