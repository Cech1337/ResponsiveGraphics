//Set throttle limit
$.event.special.throttledresize.threshold = 3;

//Inits
$('p, .footnote').moltenLeading({
	minline: 1.25,
	maxline: 1.5,
	minwidth: 220,
	maxwidth: 460
});

$('.caption').moltenLeading({
	minline: 1.1,
	maxline: 1.3,
	minwidth: 320,
	maxwidth: 600
});

$(document).ready(function() {
	var myvalues = [10,8,5,7,4,4,1,10,8,5,7,4,4,1,10,8,5,7,4,4,1];
    $('.dynamicsparkline').sparkline(myvalues);
});

$(window).load(function() {
	$('.responsiveTable').responsiveTable();
	// $('.responsiveTable').responsiveTable({
	// 	minPadding: 	15,
 //        maxPadding: 	35, 
 //        minFontSize: 	14, 
 //        fontRatio: 		1.21,
 //        maxNumRows: 	20  //Not being used ATM.
	// });
});