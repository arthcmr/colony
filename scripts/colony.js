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
		foods: null,
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
			stage_id: "stage"
		};
		_.extend(settings, options);

		//set up stage
		this.stage = new Stage(settings.stage_id);

		//create population
		this.objects.population = new Population();

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

		this.objects.population.run(this.objects);

	},

	_resize: function() {
		//this will be triggered whenever the window is resized
	}


});