/*
 * Stage Object
 * (extends paper Base object)
 */

var Stage = paper.Base.extend({

	/*
	stores stage
	*/
	stage: {},

	layers: {},

	current_stage: null,

	current_layer: null,

	/*
	 * Initialization of multiple stages
	 */

	initialize: function(layers) {

		if(layers.length < 1) return;

		//make sure the first comes on top
		layers = layers.reverse();
		var first_layer_id = layers[0];

		var _this = this;


		var stage = "<canvas id='canvas' class='stage' resize></canvas>";
			$("#canvas_wrapper").append(stage);
			var element = $('#canvas');
			var canvas = element[0];
			_this.stage = new paper.PaperScope();
			_this.stage.setup(canvas);

		_.each(layers, function(layer_id) {
			_this.layers[layer_id] = new paper.Layer();
		});

		_this.switchToLayer(first_layer_id);

	},

	switchToLayer: function(layer_name) {
		if(_.has(this.layers, layer_name) && this.current_layer !== layer_name) {
			this.layers[layer_name].activate();
			this.current_layer = layer_name;
		}
	},

	getCurrentLayer: function() {
		return this.current_layer;
	},

	/*
	 *	Retrieve canvas width and height
	 */

	getDimensions: function() {
		return paper.view.size;
	}


});