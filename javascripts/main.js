//Set throttle limit
//$.event.special.throttledresize.threshold = 1;

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
	$('.scalable').responsiveTable({
		minPadding: 	10,
        maxPadding: 	30, 
        minFontSize: 	10, 
        fontRatio: 		1.21
	});
});