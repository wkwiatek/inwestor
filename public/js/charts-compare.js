$('#compare').click( function (){
	var title = $('#compare-input').val();
	$.get('checkWIG', { name: title }, function(data) {
		if (data != 'error') 
			drawCompareChart(data.name);
		else 
			noty({text: 'Wprowadzony indeks nie został znaleziony w bazie danych!', layout: 'topCenter', type: 'error', timeout: '2000'}); 
	});	
});
	
function drawCompareChart(company) {
	(function finance_chart(container) {
		
		//console.log('last comp: ' + lastCompany + ' new comp: ' + company);
		
		$('#chart-compare').html('');
		$('#chart-compare').addClass('load');
		$.getJSON('getStockValues', {
			name : company
		}, function(financeData) {
			var priceTab = [], volumeTab = [], tab = [], pTab = [], vTab = [], finance, i = 0, currentDate;
			//var pTab = [], vTab = [];
			financeData.sort(dateComparator);
			
			
			financeData.forEach(function(one) {
				pTab.push(one.close);
				vTab.push(one.volume);
			});
			
			var medianRatio = median(lastPTab)/median(pTab);
			
			/*console.log(median(pTab));
			console.log(median(vTab));*/
			//console.log(medianRatio);
			financeData.forEach(function(one) {
				currentDate = parseDate(one.date.toString());
				priceTab.push([currentDate, one.close * medianRatio]);
				volumeTab.push([currentDate, one.volume * medianRatio]);
				i = currentDate.getTime();
			});
			
			var length = 100;
			// user defined length
			
			var newPriceTab = [ { data: lastPriceTab, label: $('#companyName').attr('data-name') } , { data: priceTab, label: company }];
			var newVolumeTab = [lastVolumeTab, volumeTab];
			var newSummaryTab = [lastPriceTab, priceTab];
			
			var options = {
				container : container = document.getElementById("chart-compare"),
				data : {
					price : newPriceTab,
					volume : newVolumeTab,
					summary : newSummaryTab,
				},
				trackFormatter : function(o) {
					var index = o.index, value;
					return '';
				},
				xTickFormatter : function(index) {					
					var date = parseYearsFromMillis(index);
					return date + '';
				},
				yTickFormatter : function(n) {
					return '';
				},
				// An initial selection
				selection : {
					data : {
						x : {
							min : i - 86400000*180, // day times sth
							max : i
						}
					}
				},
				defaults : {
					volume : {
						skipPreprocess : true
					},
					price : {
						skipPreprocess : true,
						config : {
							mouse : {
								track: false
							},
							legend :{
								position: 'nw'
							}
						}
					},
					summary : {
						skipPreprocess : true,
						/*config : {
						 xaxis : {
						 // Set x ticks manually with defaults override:
						 ticks : currentData.summaryTicks
						 }
						 }*/
					}
				}
			};

			
			finance = new envision.templates.Finance(options);
		});

	}
	)(document.getElementById("chart-compare"));

}