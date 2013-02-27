$(window).hashchange( function(){
	hashHandle1();
	hashHandle2();
});

$(function(){ //DOM Ready

	hashHandle1();
	initializeUser();
	formHandle();
	buttonsClickHandle();
	typeaheadHandle();
	hashHandle2();
	//$(window).hashchange();
});

function buttonsClickHandle () {
	$('#registerButton').click( function(){
		$('#modalRegister').modal();
	});	

	$('#changePassword').click( function(){
		$('#modalChangePassword').modal();
	});	

	$('.brand').click( function(){
		$('#mainTab a[href="#home"]').tab('show');
	});

    $('#goUp').click( function() { $("html, body").animate({ scrollTop: 0 }, "slow"); return false; } );	

	$.get('getMainMsg', function(data){		
		$('<button>', { class: 'btn btn-msg', type: 'button', 'data-toggle': 'modal', 'data-target': '#modalMsg', text: data.title[0] }).appendTo($('#showMsg'));
		$('#modalMsg .modal-header').append($('<h3>', { text: data.title[0] }));
		$('#modalMsg .modal-body').append($('<p>', { html: data.description[0].replace(/\r\n/g,'<br>') }));
	});

	$('#add').click(function(){
		var company = $('#search-input').val();
		if (company != undefined && company != '') {
			$.post('addUserCompany', { name: company }, function(data) {
				if (data != 'error') {
					if (!companyExists(data.name)){
						//insertCompanyCookie(data.name);
						addWidget(data.name, data.fullName);
						noty({text: 'Spółka dodana poprawnie!', layout: 'topCenter', type: 'success', timeout: '2000'});
					} else 
						noty({text: 'Spółka została już dodana!', layout: 'topCenter', type: 'error', timeout: '2000'});
				}
				else 
					noty({text: 'Wpisana nazwa nie została znaleziona w bazie danych!', layout: 'topCenter', type: 'error', timeout: '2000'});
			});
		} else {
			noty({text: 'Nie wpisano nazwy spółki!', layout: 'topCenter', type: 'warning', timeout: '2000'});
		}
	});
	
	$('#logout').click( function() {
		logout();
	});
}

function typeaheadHandle () {
	var mapped = {};	
	
	$('#search-input').typeahead({
		source: function (query, process) {
			return $.get('/typeahead', { query: query }, function (data) {
				var labels = [];
				$.each(data, function (i, item) {
					var query_label;
					if (item.fullName != null)
						query_label = item.name + ' - ' + item.fullName;
					else
						query_label = item.name;
					mapped[query_label] = item.name;
					labels.push(query_label);
				})
				return process(labels);
			});
		},
		updater: function (query_label) {
			return mapped[query_label];
		},
	});
	
	$('#compare-input').typeahead({
		source: function (query, process) {
			return $.get('/typeaheadWIG', { query: query }, function (data) {
				return process(data);
			});
		},
		items : 25
	});
}

function hashHandle1 () {
	var hash = window.location.hash;
	if (hash != null && hash != '#' && hash != ''){
		$('#mainTab a[href="#details"]').tab('show');
	} else {
		$('#mainTab a[href="#home"]').tab('show');
	}
	$('a[href="#home"]').on('shown', function () {
		window.location.hash = '#';
	}); 
}

function hashHandle2 () {
	var hash = window.location.hash;
	if (hash != null && hash != '#' && hash != ''){
		var company = hash.replace('#!', '');
		showCompany(company);
	}
}

function initializeUser(){
	if ($.cookie('loggedin')){
		$.get('getUserCompanyList', function (companyList) {
			if (companyList != 'false'){
				companyList.forEach( function (company){
					if(company.name)
						addWidget(company.name, company.fullName);
					else 
						addWidget(company);
				});
			}
		})
	} else {
		if($.cookie('widgetsinit')){	
			var initialData = JSON.parse($.cookie('widgetsinit'));
			if (initialData.companyList){
				initialData.companyList.forEach( function(company){
					addWidget(company.name, company.fullname);
				});
			}
		}
	}
}

function addWidget(company, fullName) {

	if (fullName == undefined) fullName = company;
	/*$.ajax({
        url:    'getCompanyName' + '?name=' + company,
		async:   false,
        success: function(data) {
        	
			var fullName;
			
			if (data.fullName != undefined)
				fullName = data.fullName
			else 
				fullName = company;
			*/
	$('#search-input').val('');

	buildWidgetDiv(company, fullName, function(){
		function redrawCurrentValuesChart (){
			$.get('getCurrentStockValues', { "name" : company }, function (data){
				if (data != 'error'){											
					drawSmallChart('chart_' + company, company, data.values, data.date);					
				}
			});	
		}
		redrawCurrentValuesChart();
		setInterval(redrawCurrentValuesChart, 300000);
	});
	
	onCloseWidget(company, fullName);
			
			/*$('#info_' + company).click( function (){
				showCompany(company, fullName);				
			});*/
		
	/*	}
	});*/
	
}

function buildWidgetDiv (company, fullName, callback) {
	$('<div>', { id: company, class: 'span6 hide'}).append(
		$('<div>', { class : 'modal-static'}).append(
			$('<div>', { class: 'modal-header' }).append(
				$('<button>', { id: 'close_' + company, type: 'button', "data-dismiss": 'modal', "aria-hidden": 'true', class: 'close', text: '×'})
			).append(
				$('<h3>', { text: fullName})
			)
		).append(
			$('<div>', { class: 'modal-widget modal-body'}).append(
				$('<div>', { class: 'row-fluid'}).append(
					$('<div>', { class: 'span8'}).append(
						$('<div>', { id: 'dateRangeSmall_' + company, class: 'envision-visualization envision-timeseries'})
					).append(
						$('<div>', { id: 'chart_' + company, class: ' small-chart'})
					).append(
						$('<p>', { id: 'chartDate_' + company})
					)
				).append(
					$('<div>', { class: 'span4'}).append(
						$('<div>', { class: ''}).append(
							$('<legend>', { text: 'Aktualny kurs:'})
						).append(
							$('<p>', { id: 'currentPrice_' + company, class: ''})
						)
					)
				)
			)
		).append(
			$('<div>', { class: 'modal-footer'}).append(
				$('<a>', { id: 'info_' + company, class: 'btn btn-moreinfo', text: 'Więcej informacji »', href: '#!' + company})
			)
		)
	).appendTo($("#widgets-company"));

	setTimeout(function(){
		$('#' + company).show('slow');
		callback();
	}, 0);

}

function onCloseWidget(company, fullName){
	$('#close_' + company).click(function(){
		noty({
			text: 'Czy na pewno chcesz usunąć ' + fullName +  '?', 
			type: 'warning',
			buttons: [
				{addClass: 'btn btn-danger', text: 'Tak', onClick: function($noty) {				
						$.post('removeUserCompany', { name: company }, function(data) {								
							if (data != 'error') {
								$noty.close();	
								noty({text: 'Spółka usunięta!', type: 'success', layout: 'topCenter', timeout: '1000'});
								$('#' + company).hide(function () {									
									//deleteCompanyCookie(company);
									$('#' + company).remove();
								});
							}
						});
					}
				},
				{addClass: 'btn btn-primary', text: 'Nie', onClick: function($noty) {
						$noty.close();
					}
				}
			],
			layout: 'topCenter'
		});			
	});
}

function showCompany (company, fullName) {
	$('#chart').html('');
	$("html, body").animate({ scrollTop: 0 }, "slow");
	$('#secondaryTab a[href="#chart-own"]').tab('show');
	$('#mainTab a[href="#details"]').tab('show');
	$('#chart-compare').removeClass('load').html('');
	if (fullName != undefined)
		$('#companyName').text(fullName).attr('data-name', company);
	else {
		$.get('getCompanyName', { name: company }, function(data) {
			if (data != undefined){
				var fullName;				
				if (data.fullName != undefined)
					fullName = data.fullName
				else 
					fullName = company;				
				$('#companyName').text(fullName).attr('data-name', company);
			}
		});
	}

	$.getJSON('getStockValues', { name : company }, function(data) {
		drawChart('chart', company, data);
		$('#btn-line').click( function(){
			drawChart('chart', company, data);
		});
		$('#btn-candle').click( function(){
			drawCandleChart('chart', company, data);
		});
		$('#btn-line').button('toggle');
	});

	
	
	insertMessages(company);
	makeDisqus(company);

}

function clearAllWidgets (callback) {
	$("#widgets-company").fadeOut( function() {
		$("#widgets-company").html('');
		$("#widgets-company").show();
		callback();
	});
}

function companyExists (name){
	var k;
	
	if($('#' + name).length == 0)
	  	k = false;
	else 
		k = true;
	return k;
}

function insertMessages(company) {
	$.get("getRssLength", { "name": company }, function (max){
		//console.log(max);
		if (max != null && max != 0){
			pagination(company, max, 6);
		} else {
			$('<div>', { class: 'alert alert-info', text: 'Niestety na razie nie posiadamy informacji dotyczących danej spółki'}).appendTo($('.rss-messages'))
		}
	});
}

function pagination (company, max, rows){
	//$('#pagination').pagination('hide');
	//console.log('init page ' + company);
	var options = {
        pageRows: rows
        , onChange: function(page) {
        	reloadPage($('#companyName').attr('data-name'), page-1, max, rows);
        }
        , next: '&rsaquo;'//'Następna'
        , prev: '&lsaquo;'//'Poprzednia'
        , first: '&laquo;'//'Pierwsza'
        , last: '&raquo;'//'Ostatnia'
        , length: 10
        , initLoad: false
        , totalMessage: 'Razem stron: $pages / wiadomości: $records', //if not then doesn't display at all

	}
	$('#pagination').pagination(options);
	$('#pagination').pagination('show', max, 1);
	reloadPage(company, 0, max, rows);
}

function reloadPage (company, page, max, rows) {
	$("html, body").animate({ scrollTop: 0 }, "slow");
	$('.rss-messages').fadeOut( function() {
		$('.rss-container').addClass('load');
		$('.rss-messages').html('');

		$.get("getRss", { "name": company, "page": page }, function (data){
			if (data != null){
				if (data.length !== 0){			
					buildMessageDiv(data);
				} 
			} 		
		});
	});
}

function buildMessageDiv (data) {
	var tab = [],
		maximum = data.length;

	tab.push('<div class="row-fluid">');
	
	for (var i=0; i < maximum; i++){
		if (i%3 == 0) tab.push('</div><div class="row-fluid">');
		var msg = data[i],
			date = new Date(Date.parse(msg.published[0])),
			author = (msg.author[0].name[0] != '(author unknown)') ? msg.author[0].name[0] : '(autor nieznany)';
		tab.push('<div class="span4 message-border" data-box="' + dateToHumanTime(date) + '"><after></after>')
		tab.push('<a target="_blank" href="' + msg.link[0].$.href + '">' + msg.title[0]._ + '</a><hr>');
		tab.push('<blockquote><p>' + msg.content[0]._ + '</p><small>' + author + '</small></blockquote>');
		tab.push('</div>');
	}
	tab.push('</div>');

	$('.rss-container').removeClass('load');
	$('.rss-messages').html(tab.join('')).fadeIn();
}

function formHandle () {
	$('#complexity').html('0%');
	$("#password").complexify({strengthScaleFactor: 0.5}, function (valid, complexity) {
		if (!valid) {
			$('#progress').css({'width':complexity + '%'}).removeClass('progressbarValid').addClass('progressbarInvalid');
		} else {
			$('#progress').css({'width':complexity + '%'}).removeClass('progressbarInvalid').addClass('progressbarValid');
		}
		$('#complexity').html(Math.round(complexity) + '%');
	});

	$('#complexityNew').html('0%');
	$("#newpassword").complexify({strengthScaleFactor: 0.5}, function (valid, complexity) {
		if (!valid) {
			$('#progressNew').css({'width':complexity + '%'}).removeClass('progressbarValid').addClass('progressbarInvalid');
		} else {
			$('#progressNew').css({'width':complexity + '%'}).removeClass('progressbarInvalid').addClass('progressbarValid');
		}
		$('#complexityNew').html(Math.round(complexity) + '%');
	});

	$.validator.addMethod("loginCheck", function(username) {
		var isSuccess = false;
   		$.ajax({ url: "checkLogin",
            data: "login=" + username,
            async: false,
            success: function(result) { 
            	isSuccess = (result === "true") ? true : false }
          	});
   		return isSuccess;
   	},"");


	var loginValidation = $('#loginForm').validate({
		rules:{
			login: {required:true},
			password:{required:true}
		},
		messages:{
			login:{
				required: "Podaj login"},
			password:{
 				required:"Podaj hasło"}
 		},
		errorClass: "help-inline",
		errorElement: "span",
		highlight:function(element, errorClass, validClass) {
			$(element).parents('.control-group').removeClass('success');
 			$(element).parents('.control-group').addClass('error');
 		},
		unhighlight: function(element, errorClass, validClass)
 		{
 			$(element).parents('.control-group').removeClass('error');
 			$(element).parents('.control-group').addClass('success');
 		},
 		submitHandler: function(form) { 			
 			$.post('login', $("#loginForm").serialize(), function(result){;
 				if (result != 'false') { 				
 					noty({text: 'Zalogowano pomyślnie!', layout: 'topCenter', type: 'success', timeout: '2000'});	
 					//showAlert('#loginAlert', 'success', 'Zalogowano pomyślnie!'); 		
 					clearAllWidgets(function(){
						insertLoggedUserWidgets(result.companyList); 							
					});			
 					setTimeout(function() {  
 						showUsername(result.username);
 					}, 0);
 					loginValidation.resetForm();
 					$(".control-group").removeClass("error").removeClass("success");  					
 					
 				} else {
 					noty({text: 'Błędny login lub hasło!', layout: 'topCenter', type: 'error', timeout: '2000'});
 					//showAlert('#loginAlert', 'error', 'Błędny login lub hasło!');
 				}
 			});
		}
 	});

	$("#registerForm").validate({
		rules:{
			login: {required:true, minlength: 4, loginCheck: true},
			email:{required:true,email: true},
			password:{required:true,minlength: 6},
			password2:{required:true, equalTo: '#password'}
		},
		messages:{
			login:{
				required: "Podaj login",
				minlength:"Login musi mieć co najmniej 4 znaki",
				loginCheck: "Wybrany login jest już używany"},
			email:{
 				required:"Wpisz adres e-mail",
 				email:"Wpisz poprawny adres e-mail"},
			password:{
 				required:"Podaj hasło",
 				minlength:"Hasło musi mieć co najmniej 6 znaków"},
			password2:{
 				required:"Potwierdź hasło",
 				equalTo:"Podane hasła muszą się zgadzać"},
 		},
		errorClass: "help-inline",
		errorElement: "span",
		highlight:function(element, errorClass, validClass) {
			$(element).parents('.control-group').removeClass('success');
 			$(element).parents('.control-group').addClass('error');
 		},
		unhighlight: function(element, errorClass, validClass)
 		{
 			$(element).parents('.control-group').removeClass('error');
 			$(element).parents('.control-group').addClass('success');
 		},
 		submitHandler: function(form) {
 			//console.log($("#registerForm").serialize())
 			$.post('registerUser', $("#registerForm").serialize(), function(result){
 				//console.log(result);
 				if (result != 'true') { 					
 					showAlert('#registerAlert', 'error', 'Wystąpił błąd po stronie serwera. Rejestracja nie była możliwa!');
 				} else {
 					showAlert('#registerAlert', 'success', 'Rejestracja przebiegła pomyślnie!');
 					showUsername($('#login').val());
 					$('#registerForm')[0].reset(); 					
 					$(".control-group").removeClass("error").removeClass("success");
 				}
 			});
			//console.log('submit');
		}
 	});
	
	$("#restorePasswordForm").validate({
		rules:{
			login: {required:true}
		},
		messages:{
			login:{
				required: "Podaj login"}
 		},
		errorClass: "help-inline",
		errorElement: "span",
		highlight:function(element, errorClass, validClass) {
			$(element).parents('.control-group').removeClass('success');
 			$(element).parents('.control-group').addClass('error');
 		},
		unhighlight: function(element, errorClass, validClass)
 		{
 			$(element).parents('.control-group').removeClass('error');
 			$(element).parents('.control-group').addClass('success');
 		},
 		submitHandler: function(form) {
 			var n = noty({text: 'Generowane jest nowe hasło. Proszę czekać...', layout: 'topCenter', type: 'information'});
 			$.post('restorePassword', $("#restorePasswordForm").serialize(), function(result){
 				//console.log(result);
 				n.close();
 				if (result != 'true') {
 					noty({text: 'Nie znaleziono podanego użytkownika!', layout: 'topCenter', type: 'error', timeout: '2000'}); 					 				
 				} else {
 					noty({text: 'Wysłano nowe hasło na podany adres email!', layout: 'topCenter', type: 'success', timeout: '2000'}); 					
 					$('#restorePasswordForm')[0].reset();
 					$(".control-group").removeClass("error").removeClass("success");
 				}
 			});
		}
 	});

	$("#changePasswordForm").validate({
		rules:{
			password:{required:true},
			newpassword:{required:true,minlength: 6},
			newpassword2:{required:true, equalTo: '#newpassword'}
		},
		messages:{
			password:{
 				required:"Podaj hasło"},
			newpassword:{
 				required:"Podaj nowe hasło",
 				minlength:"Hasło musi mieć co najmniej 6 znaków"},
			newpassword2:{
 				required:"Potwierdź hasło",
 				equalTo:"Podane hasła muszą się zgadzać"},
 		},
		errorClass: "help-inline",
		errorElement: "span",
		highlight:function(element, errorClass, validClass) {
			$(element).parents('.control-group').removeClass('success');
 			$(element).parents('.control-group').addClass('error');
 		},
		unhighlight: function(element, errorClass, validClass)
 		{
 			$(element).parents('.control-group').removeClass('error');
 			$(element).parents('.control-group').addClass('success');
 		},
 		submitHandler: function(form) {
 			$.post('changePassword', $("#changePasswordForm").serialize(), function(result){ 				
 				if (result != 'true') { 					
 					showAlert('#changePasswordAlert', 'error', 'Wprowadzone aktualne hasło jest błędne!');
 				} else {
 					showAlert('#changePasswordAlert', 'success', 'Hasło zmienione poprawnie!'); 	
 					$('#changePasswordForm')[0].reset();				 					
 					$(".control-group").removeClass("error").removeClass("success");
 				}
 			});
		}
 	});
}

function dateToHumanTime(date) {
	var d = date.getDate();
	var m = date.getMonth() + 1;
	var y = date.getFullYear();
	var h = date.getHours();
	var min = date.getMinutes();
	var s = date.getSeconds();
	return '' + (d <= 9 ? '0' + d : d) + '-' + (m <= 9 ? '0' + m : m) + '-' + y + ' ' + (h <= 9 ? '0' + h : h) + ':' + (min <= 9 ? '0' + min : min) /*+ ':' + (s <= 9 ? '0' +s : s)*/;
}

function compareByDate (a, b) {
	var dateA = new Date(Date.parse(a.published[0])),
		dateB = new Date(Date.parse(b.published[0]));
	return dateB - dateA;
}

function showAlert(placeholder, type, text){
	$(placeholder).html('').hide();
	$('<div>', { class: 'alert alert-' + type}).append(
		$('<button>', { class: 'close', 'data-dismiss': 'alert'})).append(
			$('<strong>', { text: text})).appendTo($(placeholder));
	setTimeout( function() { $(placeholder).slideDown(); }, 0);
	setTimeout( function() { $(placeholder).slideUp(); }, 3000);
}

function showUsername (username) {
	$('#sayHello').text('Witaj, ' + username);
	$('#registerPlaceholder').fadeOut(function() {
		$('#loginPlaceholder').fadeIn(function() {
			$('#usernameLogin').val('');
			$('#passwordLogin').val('');
		});
	});
}

function logout () {
	$.post('logout', function(data){
		if(data){
			noty({text: 'Wylogowano pomyślnie!', layout: 'topCenter', type: 'success', timeout: '2000'});
			removeLoggedUserWidgets();
			$('#loginPlaceholder').fadeOut('slow', function() {
				$('#registerPlaceholder').fadeIn('slow');
			});
		}
	});
}

function insertLoggedUserWidgets (companyList) {
	if (companyList){
		companyList.forEach( function (company){
			if (company.name) 
				addWidget(company.name, company.fullName);
			else 
				addWidget(company);
		});
	}	
}

function removeLoggedUserWidgets () {
	clearAllWidgets( function(){
		if($.cookie('widgetsinit')){	
			var initialData = JSON.parse($.cookie('widgetsinit'));
			if (initialData.companyList){
				initialData.companyList.forEach( function(company){
					if (company.name)
						addWidget(company.name, company.fullname);
					else 
						addWidget(company);
				});
			}
		}
	});
}