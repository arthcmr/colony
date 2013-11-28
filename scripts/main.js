$(function() {

	var stage_el = $('#stage');
	var global_width = stage_el.width();
	var global_height = stage_el.height();

	var stage = new Raphael(stage_el[0], global_width, global_height);  

  var circle = stage.circle(global_width/2 -10, global_height/2 -10, 20);

  circle.click(function() {
  	console.log("something");
  });

});