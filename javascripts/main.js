//Inits
$('p, table, .footnote').moltenLeading({
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

    //Enclose all table cells in spans
    $('td, th').wrapInner('<span />');

});

$(window).load(function() {

});


$(window).on("throttledresize", function( event ) {


	// $("#variable-size-table span").each(function(){


	// 	var contentWidth = $(this).width(); 
	// 	var columnWidth = $(this).parent().width();
	// 	if(columnWidth < contentWidth - 12){
	// 		$("#variable-size-table").addClass("reduce-1");
	// 	}

	// });

	//Transverse 


});