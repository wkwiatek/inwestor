var lastCompany;
var lastPriceTab = [], lastVolumeTab = [];
var lastPTab = [], lastVTab = [];

function drawChart(div, company, financeData) {
	$('#chart').html('');
	$('#dateRange').html('');
	//console.log(lastCompany + ' ' + company);
	//if (lastCompany != company) {
	(function finance_chart(container) {
		var priceTab = [], 
			volumeTab = [], 
			tab = [], 
			finance, 
			i = 0, 
			currentDate;

		financeData.sort(dateComparator);	
		
		financeData.forEach(function(one) {
			lastPTab.push(one.close);
			lastVTab.push(one.volume);
		});		
		financeData.forEach(function(one) {
			currentDate = parseDate(one.date.toString());
			priceTab.push([currentDate, one.close]);
			volumeTab.push([currentDate, one.volume]);
			i = currentDate.getTime();
		});
		
		var time = getTimePeriod(priceTab);

		lastPriceTab = priceTab;
		lastVolumeTab = volumeTab;
		
		var length = 100;
		var options = {
			container : container = document.getElementById(div),
			data : {
				price : priceTab,
				volume : volumeTab,
				summary : priceTab,
			},
			trackFormatter : function(o) {
				var index = o.index, 
					value;
				value = dateToYMD(parseDate(financeData[index].date.toString())) + ': ' + financeData[index].close + " PLN , Obroty: " + financeData[index].volume;
				return value;
			},
			xTickFormatter : function(index) {
				var date = parseYearsFromMillis(index);
				return date + '';
			},
			yTickFormatter : function(n) {
				return n + '';
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
					skipPreprocess : true
				},
				summary : {
					skipPreprocess : true,
					config : {
					 xaxis : {
					 // Set x ticks manually with defaults override:
						 //ticks : currentData.summaryTicks
						  max: i + 86400000*time		  								  
						 }
					 }
				}
			},
			selectionCallback : function (o) {
				var dateMin = o.data.x.min,
					dateMax = o.data.x.max, 
					valueMin,
					valueMax;
				valueMin = dateToYMD(new Date(parseInt(dateMin)));
				valueMax = dateToYMD(new Date(parseInt(dateMax)));
				$('#dateRange').html('Aktualnie zaznaczony przedział czasu: <b>' + valueMin + ' - ' + valueMax + '</b>');
			}
		};
		lastCompany = company;
		finance = new envision.templates.Finance(options);
	}
	)(document.getElementById(div));
}

function drawCandleChart(div, company, financeData) {
	$('#' + div).html('');
	$('#dateRange').html('');
	(function candleChart (container) {

	    var graph,
	    	candleTab = [], 
			summaryTab = [], 
			xaxisTab = [],
			tab = [], 
			finance, 
			i = 0, 
			k = 0,
			currentDate;

	    financeData.sort(dateComparator);	
		financeData.forEach(function(one) {
			currentDate = parseDate(one.date.toString());
			i = currentDate.getTime();
			xaxisTab.push(i);
			candleTab.push([k, one.open, one.high, one.low, one.close]);
			summaryTab.push([k++, one.close]);			
		});

	  var options = {
	    container : container = document.getElementById(div),
	    data : {
	      detail : candleTab,
	      summary : summaryTab
	    },
	    // An initial selection
	    defaults : {
	        detail : {
	          height: 260,
	          skipPreprocess : true,
	          config : {
	            'lite-lines': {show: false },
	          	candles : { show : true, candleWidth : 0.6 },
	            yaxis : {
				  autoscale : true,
	     		  autoscaleMargin : 0.1,
		          showLabels : true,			          
		          noTicks: 4,
		          tickDecimals: 2,
		          tickFormatter: yTickFormatter
		        },
		        mouse : {
			      track: true,
			      trackY: false,
			      trackAll: true,
			      sensibility: 1,
			      trackDecimals: 4,
			      position: 'ne',
			      trackFormatter: mouseTrackFormatter
			    },
	          }
	        },
	        summary : {
	          skipPreprocess : true,
	          config : {	            
	            xaxis : {
		          showLabels : true,			          
		          noTicks: 5,
		          tickFormatter: xTickFormatter
		        },
		        yaxis : {
		          autoscale : true,
		          autoscaleMargin : 0.1,
		        },
	          }
	        }
	      },
	        selection : {
	      data : {
	        x : {
				min : k - 180, // day times sth
				max : k
			}
	      }
	    },
	    selectionCallback : function (o) {	
			var xMin = o.data.x.min,
				xMax = o.data.x.max, 
				valueMin,
				valueMax
				yAxis = {};
			valueMin = dateToYMD(new Date(xaxisTab[parseInt(xMin)]));
			valueMax = dateToYMD(new Date(xaxisTab[parseInt(xMax)]));
			
			yAxis.min = findMin(candleTab, parseInt(xMin), parseInt(xMax), 3);
			yAxis.max = findMax(candleTab, parseInt(xMin), parseInt(xMax), 2);
			o.data.y = yAxis;
			$('#dateRange').html('Aktualnie zaznaczony przedział czasu: <b>' + valueMin + ' - ' + valueMax + '</b>');
		}
	  };
	  	function xTickFormatter(index) {
			var date = parseYearsFromMillis(xaxisTab[index]);
			return date + '';
		}
		function yTickFormatter(n) {
			return n;
		}
		function mouseTrackFormatter(o) {
			var index = o.index, 
				value;
			value = dateToYMD(new Date(xaxisTab[index])) + ': '
			 + 'Otwarcie:' + candleTab[index][1] + ", Zamknięcie: " + candleTab[index][4]
			 + ', Min.:' + candleTab[index][3] + ", Maks.: " + candleTab[index][2];
			return value;
		}		

	  return new envision.templates.TimeSeries(options);
	}
	)(document.getElementById(div));
}

function drawSmallChart(div, company, data, date) {
	(function timeseries_demo (container) {
	var financeData = [],
		volumeData = [],
		lastChange,
		stockIcon;
	data.sort(timeComparator);	

	lastChange = data.slice(-1)[0].currentPrice - data.slice(-2)[0].currentPrice;

	if (lastChange > 0) stockIcon = '<i class="ic-stock-up"></i>  ';
	else if (lastChange == 0) stockIcon = '<i class="ic-stock-equal"></i>  ';
	else stockIcon = '<i class="ic-stock-down"></i>  ';

	$('#' + div).html('');	
	$('#chartDate_' + company).html('Data notowania: <b>' + dateToYMD(new Date(Date.parse(date))) + '</b>');
	$('#currentPrice_' + company).html('<h3>' + stockIcon + parseFloat(data.slice(-1)[0].currentPrice).toFixed(2) + '</h3>');

	var i;
	for ( i = 0; i < data.length; i++) {
		//console.log(data[i].time);
		financeData.push([Date.parse(data[i].time), data[i].currentPrice]);
		volumeData.push([Date.parse(data[i].time), data[i].currentVolume]);
	};
	/*data.forEach (function (one){
		financeData.push([Date.parse(one.time), one.price]);
	});*/
		
	var options = {
		container : container = document.getElementById(div),
		data : {
			detail : financeData,
			summary : financeData
		},
		defaults : {
			detail : {
				height : 120,
				skipPreprocess : true,
				config : {
					yaxis : {
					  // /autoscale : true,
		     		  autoscaleMargin : 0.1,
			          showLabels : true,			          
			          noTicks: 4,
			          tickDecimals: 2,
			          tickFormatter: yTickFormatter
			        },
			        mouse : {
				      track: true,
				      trackY: false,
				      trackAll: true,
				      sensibility: 1,
				      trackDecimals: 4,
				      position: 'ne',
				      trackFormatter: mouseTrackFormatter
				    },
				},				
			},
			summary : {
				height : 30,
				skipPreprocess : true,
				config : {
					xaxis : {
			          showLabels : true,			          
			          noTicks: 5,
			          tickFormatter: xTickFormatter
			        },
			        yaxis : {
			          autoscale : true,
			          autoscaleMargin : 0.3,
			        },
		    	}
			}
		},
		selection : {
			data : {
				x : {
					min : financeData[parseInt(i/2-1)][0],
					max : financeData[i-1][0]
				}
			}
		},
		selectionCallback : function (o) {
						
		var dateMin = o.data.x.min,
			dateMax = o.data.x.max, 
			valueMin,
			valueMax;

		valueMin = parseHourFromMillis(dateMin);
		valueMax = parseHourFromMillis(dateMax);
			$('#dateRangeSmall_' + company).html('Zaznaczony przedział czasu: <b>' + valueMin + ' - ' + valueMax + '</b>');
		}
	};

	function xTickFormatter(index) {

		var date = parseHourFromMillis(index);
		return date + '';
	}
	function yTickFormatter(n) {
		return n;
		//return roundNumber(n, 2) + '';
	}
	function mouseTrackFormatter(o) {
		var index = o.index, 
			value;

		value = parseHourFromMillis(financeData[index][0]) + ': ' + financeData[index][1] + " PLN , Obroty: " + volumeData[index][1];

		return value;
	}

	  return new envision.templates.TimeSeries(options);
	}
	)(document.getElementById(div));
}



function parseDate(str) {
	var y = str.substr(0, 4), m = str.substr(4, 2) - 1, d = str.substr(6, 2);
	var D = new Date(y, m, d);
	//console.log(D);
	return (D.getFullYear() == y && D.getMonth() == m && D.getDate() == d) ? D : 'invalid date';
}

function parseDateDays(str) {
	var y = str.substr(0, 4), m = str.substr(4, 2) - 1, d = str.substr(6, 2);
	var D = new Date(y, m, d);
	//console.log((D.getTime()/(86400 * 1000)).toFixed(0))
	return (D.getTime()/(86400 * 1000)).toFixed(0) ? D : 'invalid date';
}

function parseYearsFromMillis(millis) {
	var D = new Date(parseInt(millis));
	//console.log(D.getFullYear());
	return D.getFullYear();
}

function parseHourFromMillis(millis) {
	var D = new Date(parseInt(millis));
	return D.getHours() + ':' + ( D.getMinutes() <= 9 ? '0' + D.getMinutes() : D.getMinutes()  );
}

function dateToYMD(date) {
	var d = date.getDate();
	var m = date.getMonth() + 1;
	var y = date.getFullYear();
	//return '' + y + '.' + (m <= 9 ? '0' + m : m) + '.' + (d <= 9 ? '0' + d : d);
	return '' + (d <= 9 ? '0' + d : d) + '.' + (m <= 9 ? '0' + m : m) + '.' + y;
}

function dateComparator(a, b) {
	return parseInt(a.date) - parseInt(b.date);
}

function timeComparator(a, b) {
	//console.log(Date.parse(a.time) - Date.parse(b.time));
	return Date.parse(a.time) - Date.parse(b.time);
}

function median(values) {

   	//values.sort( function(a,b) {return a - b;} );

    var half = Math.floor(values.length/2);

    if(values.length % 2)
        return values[half];
    else
        return (values[half-1] + values[half]) / 2.0;
}

function getTimePeriod(priceTab){
	var firstYear = priceTab[0][0].getFullYear();
	var lastYear = priceTab[priceTab.length-1][0].getFullYear();
	return lastYear - firstYear;
}

function roundNumber(num, dec) {
	var result = Math.round(num*Math.pow(10,dec))/Math.pow(10,dec);
	return result;
}

function findMax (tab, from, to, index) {
	var max = 0;
	for (var i=from; i<=to; i++){
		if (parseFloat(tab[i][index]) > max)
			max = tab[i][index];
	}
	return max;
}

function findMin (tab, from, to, index) {
	var min = 9999999;
	for (var i=from; i<=to; i++){
		if (parseFloat(tab[i][index]) < min)
			min = tab[i][index];
	}
	return min;
}