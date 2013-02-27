var db = require('../node/db');
var nodemailer = require('nodemailer');
var randpass = require('randpass');
var crypto = require('crypto')
	, key = 'guitar hero'

var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "inwestor.online@gmail.com",
        pass: "wkwi1234"
    }
});
var senderEmailAddress = "Inwestor <inwestor.online@gmail.com>";

exports.login = function (req, res){
	var hash = crypto.createHmac('sha1', key).update(req.body.password).digest('hex');	
	db.queryOne("users", { "username" : req.body.login, "password": hash} , ["username", "companyList"], function (err,result){
		if (result != undefined) {
			res.cookie('loggedin', 'yes', { httpOnly: false});
			req.session.name = req.body.login;
			res.send(result);
		}
		else res.send('false');
	});
}

exports.logout = function (req, res) {
	res.clearCookie('loggedin', { httpOnly: false});
	delete req.session.name;
	res.send('ok');
}

exports.checkLoginAvailability = function (req, res){
  	db.queryOne("users", { "username" : req.query.login} , ["username"], function (err,result){
		if (result != undefined) res.send('false');
  		else res.send('true');
  	});
}

exports.changePassword = function (req, res) {
	var hash = crypto.createHmac('sha1', key).update(req.body.password).digest('hex');
	db.queryOne("users", { "username" : req.session.name, "password": hash} , ["username", "companyList"], function (err,result){
		if (result != undefined) {
			var newHash = crypto.createHmac('sha1', key).update(req.body.newpassword).digest('hex');
			db.update('users', { "username" : req.session.name }, { $set : { "password": newHash }}, function (err, result){
				res.send('true');
			});
		}
		else res.send('false');
	});
}

exports.restorePassword = function (req, res){
	db.queryOne("users", { "username" : req.body.login } , ["email"], function (err,result){
		if (result != undefined) {
			var newPass = randpass(),
				randpassHash = crypto.createHmac('sha1', key).update(newPass).digest('hex');	
			var mailOptions = {
			    from: senderEmailAddress, // sender address
			    to: result.email, // list of receivers
			    subject: 'Witamy! Wygenerowane zostało nowe hasło!', // Subject line
			    //text: "Hello world", // plaintext body
			    html: '<p>Wysłana została prośba o utworzenie nowego hasła.</p>' + 
			    '<p>Nowe dane do logowania:</p><p>Login: ' + req.body.login + '<br>Hasło: ' + newPass + '</p>' // html body
			}		
			smtpTransport.sendMail(mailOptions, function (error, response){
			    if(error){
			        console.log(error);
			    }else{
			   		db.update('users', { "username" : req.body.login }, { $set : { "password": randpassHash }}, function (err, result){
			   			res.send('true');
					});
			    }
			});
		}
  		else res.send('false');
  	});
}

exports.register = function (req, res){

	var hash = crypto.createHmac('sha1', key).update(req.body.password).digest('hex');
	db.insert("users", { "username": req.body.login, "password": hash, "email": req.body.email}, function (err,result){

		var mailOptions = {
		    from: senderEmailAddress, // sender address
		    to: req.body.email, // list of receivers
		    subject: 'Witamy! Rejestracja przebiegła pomyślnie!', // Subject line
		    //text: "Hello world", // plaintext body
		    html: '<p>Proces rejestracji został pomyślnie zakończony.</p>' + 
		    '<p>Zapraszamy na: <a href="http://inwestor-wkwiatek.dotcloud.com">http://inwestor-wkwiatek.dotcloud.com</a> </p>' // html body
		}
		smtpTransport.sendMail(mailOptions, function (error, response){
		    if(error){
		        console.log(error);
		    }else{
		        console.log("Message sent: " + response.message);
		    }
		});
	});
	req.session.name = req.body.login;
	res.send('true');
}

exports.getCompanyList = function (req, res) {
	db.queryOne("users", { "username" : req.session.name } , ["companyList"], function (err,result){
		if (result != undefined) res.send(result.companyList);
  		else res.send('false');
  	});
}

exports.addCompany = function (req, res){  
	var company = req.body.name,
		username = req.session.name;

	db.queryOne("company", { $or : [ 
		{ "fullName" : { $regex : '^' + company + '$' , $options: 'i' } } , 
		{ "name" : { $regex : '^' + company + '$' , $options: 'i' } } ]}, ["name", "fullName"], function (err,result){
			
		if (result != undefined) {
			if (username){			
				db.update("users", {"username": username}, { $addToSet : { "companyList" : { "name" : result.name, "fullName" : result.fullName } } }, { upsert: false }, function (err, result){
					if (err) {
						console.log("Insert error", err);
						return;
					}					
				});			
				res.send(result);	
			} 
			else {
				db.queryOne("company", { "name" : { $regex : '^' + company + '$' , $options: 'i' }}, ["name", "fullName"], function (err,result){
					if (result != undefined) {
						insertCompanyCookie(req, res, company, result.fullName);
						res.send(result);
					}
				});	
			}
		} 
		else 
			res.send('error');
	});
}

exports.removeCompany =  function (req, res) {
  	var company = req.body.name,
  		username = req.session.name;
  
	if (username){
		db.update("users", {"username": username}, { $pull : { "companyList" : { "name" : company } } }, { upsert: false }, function (err, result){
			if (err) {
				console.log("Insert error", err);
				return;
			}
		});
		res.send('ok');
	} else {
		removeCompanyCookie(req, res, company);
		res.send('ok');
	}
}

// internal functions 
function insertCompanyCookie (req, res, company, fullName) {
	//console.log(req.cookies);
	if (req.cookies.widgetsinit) {
		var widgets = JSON.parse(req.cookies.widgetsinit);
		widgets.companyList.push({ name: company, fullname: fullName });
		//console.log(widgets);
		res.cookie('widgetsinit', JSON.stringify(widgets), { maxAge: 2592000000 }); // 30 days
	} else {
		res.cookie('widgetsinit', JSON.stringify({ companyList: [{ name: company, fullname: fullName}]}), { maxAge: 2592000000 }); // 30 days
	}
}

function removeCompanyCookie (req, res, company) {
	if (req.cookies.widgetsinit) {
		var widgets = JSON.parse(req.cookies.widgetsinit);
			//idx = widgets.companyList.indexOf(company);

		for (var i =0; i < widgets.companyList.length; i++) {
			if(widgets.companyList[i].name === company) widgets.companyList.splice(i,1);
		}
		/*if (idx != -1)
			widgets.companyList.splice(idx, 1);*/
		//console.log(widgets);
		res.cookie('widgetsinit', JSON.stringify(widgets), { maxAge: 2592000000 }); // 30 days
	}
}