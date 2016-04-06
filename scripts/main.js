$(function() {

  //CONTROLS
  var config = new Config(start);
  var colony;

  function start() {
    if(colony) colony.clear();
    $('#canvas_wrapper').remove();
    $('body').prepend('<div id="canvas_wrapper"></div>');
    setTimeout(function() {
      $('.dg').remove();
      colony = new Colony({}, config);
    }, 1000);
  }

  initControls(config);

});