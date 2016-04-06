/*
 * Meals Object: a collection of Meals
 * (extends paper Base object)
 */

 var Meals = paper.Base.extend({

 	//attributes
 	collection: {},

 	max_id: 0,

 	symbol: undefined,

	/*
	 * Initialization
	 */

	initialize: function(options, stage, config) {

	 	var settings = {
			initial_number: config.food
		};
		_.extend(settings, options);

		this.stage = stage;
		this.config = config;

		this.generateMeals(settings.initial_number);

	},

	getMeals: function() {
		return this.collection;
	},

	createMeal: function(properties) {

		this.stage.switchToLayer('meals');

		if(_.isUndefined(properties)) properties = {};

		//get symbol
		if(_.isUndefined(this.symbol)) {
			this.symbol = this._getSymbol();
		}

		var meal = new Meal(properties, this.max_id, this.symbol, this.config);
		//add it to the collection
		this.collection[this.max_id] = meal;
		//increase the id
		this.max_id++;

		return meal;
	},

	generateMeals: function(number, area) {
		if(number < 1) return;
		var properties = {};
		for(var i=0; i<number; i++) {
			if(!_.isUndefined(area)) {
				properties.position = this._getRandomPoint(area);
			}
			var meal = this.createMeal(properties);
		}
	},

	run: function(objects) {

		var _this = this;
		_.each(this.collection, function(meal, i) {

			//remove from population if it's dead
			if(meal.exists === false) {
				_this.remove(i);
			}
		});

	},

	remove: function(index) {
		delete this.collection[index];
	},

	exists: function(meal) {
		if(_.isUndefined(meal)) return false;
		var e = _.has(this.collection, meal.index);
		return e;
	},

	_getRandomPoint: function(area) {
		//get maximum possible point
		var max_point;
		if(_.isUndefined(area)) {
			var stage_size = paper.view.size;
			max_point = new paper.Point(stage_size.getWidth(), stage_size.getHeight());
			//generate a random point between (0,0) and (max_width, max_height)
			return new paper.Point.random().multiply(max_point);
		} else {
			max_point = new paper.Point(area.width, area.height);
			min_point = new paper.Point(area.x, area.y);
			//generate a random point between (0,0) and (max_width, max_height)
			return new paper.Point.random().multiply(max_point).add(min_point);
		}
	},

	_getSymbol: function() {

		//drawing symbol
		var color = this.config.food_color || "#f6e6aa";
		var strokeColor = this.config.food_stroke || "#e9ddad";

		var rectangle = new paper.Rectangle(new paper.Point(-3, -3), new paper.Size(6, 6));
		var path = new paper.Path.Rectangle(rectangle);

		path.style = {
			strokeColor: strokeColor,
			fillColor: color,
			strokeWidth: 1,
			strokeCap: 'round'
		};

		path.rotate(45);

		// Create a symbol from the path:
		var symbol = new paper.Symbol(path);
		//remove path on stage
		path.remove();

		return symbol;
	}

 });
