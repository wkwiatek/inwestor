/*
 * Module dependencies.
 */
var sys = require('sys');
var fs = require('fs');
var url = require('url');
var express = require('express');
var AdmZip = require('adm-zip');

var crypto = require('crypto')
	, key = 'guitar hero'

var db = require('./node/db');
var user = require('./routes/user');
var stock = require('./routes/stock');
var daemon = require('./node/daemon');

var app = module.exports = express();


// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'keyboard guitar cat' }));
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  app.use(app.router);  
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

app.listen(8080);
console.log("Express server listening on port %d in %s mode", 8080, app.settings.env);


/*
 * Routes
 */

// Main page
app.get('/', function (req, res){
	var name = req.session.name;
  	cookieExpirationDateExtend(req, res);
  	res.render('index', {
    	title: 'Inwestor',
		  locals: {
			  login: name
		  },
  	});
});

// Main routes
app.get('/getMainMsg', function (req, res){ res.send(daemon.mainMsg); });
app.get('/typeahead', function (req, res){ res.send(daemon.companyList); });
app.get('/typeaheadWIG', function (req, res){ res.send(daemon.WIGList); });

// User
app.post('/login', user.login);
app.post('/logout', user.logout);
app.get('/checkLogin', user.checkLoginAvailability);
app.post('/changePassword', user.changePassword);
app.post('/restorePassword', user.restorePassword);
app.post('/registerUser', user.register);
app.get('/getUserCompanyList', user.getCompanyList);
app.post('/addUserCompany', user.addCompany);
app.post('/removeUserCompany', user.removeCompany);

// Stock
app.get('/checkWIG', stock.checkWIG);
app.get('/getCompanyName', stock.getCompanyName);
app.get('/getStockValues', stock.getValues);
app.get('/getCurrentStockValues', stock.getCurrentValues);
app.get('/getRss', stock.getRssMessages);
app.get('/getRssLength', stock.getRssLength);

// initialize
daemon.getBZWBK();

// fetching external data
setInterval(daemon.getBZWBK, 3600000); // 1 hour
setInterval(daemon.getRssData, 10800000); // 3 hours
setInterval(daemon.getCompanyList, 60000); // 1 minute
setInterval(daemon.getWIGList, 60000); // 1 minute
setInterval(daemon.getSessionStockData, 21600000); // 6 hours
//setInterval(daemon.getCurrentStockData, parseInt(1800000*Math.random())); // 30 minutes

(function loop() {
    var rand = Math.round(Math.random() * 600000) + 600000; // random between 10 and 20 minutes
    setTimeout(function() {
            daemon.getCurrentStockData();
            loop();  
  }, rand);
}());


// internal function
function cookieExpirationDateExtend (req, res) {
	if (req.cookies.widgetsinit) {
		res.cookie('widgetsinit', req.cookies.widgetsinit, { maxAge: 2592000000 }); // 30 days
	}
}