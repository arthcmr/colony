/*
 * Colony Object
 * (extends paper Base object)
 */

var Colony = paper.Base.extend({

	//attributes
	stage: null,

	//theres only one throughout the entire application
	objects: {
		population: null,
		walls: null,
		fire_spots: null,
		meals: null,
		diseases: null,
		antibodies: null,
		poisons: null
	},

	/*
	 * Initialization
	 */

	initialize: function(options) {

		console.log("============== INITIALIZING ==============");

		var settings = {
			stages: ["population", "meals"]
		};
		_.extend(settings, options);

		//set up stage
		this.stage = new Stage(settings.stages);

		//create meals collection
		this.objects.meals = new Meals({}, this.stage);

		//create population
		this.objects.population = new Population({}, this.stage);

		console.log("================ RUNNING ================");

		//set up animation functions
		var _this = this;

		paper.view.onFrame = function (event) {
			_this._run();
		}
		paper.view.onResize = function(event) {
			_this._resize();
		}

	},


	/*
	 * Run-time methods (animation & resizing)
	 */

	_run: function() {

		var execution_order = ['population', 'meals'];

		//execute each layer, following the order
		var _this = this;
		_.each(execution_order, function(layer) {
			// switch to corresponding stage and run
			//_this.stage.switchToStage(layer);
			_this.objects[layer].run(_this.objects);
		})

	},

	_resize: function() {
		//this will be triggered whenever the window is resized
	}


});