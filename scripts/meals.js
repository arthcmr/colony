/*
 * Meals Object: a collection of Meals
 * (extends paper Base object)
 */

 var Meals = paper.Base.extend({

 	//attributes
 	collection: {},

 	max_id: 0,

	/*
	 * Initialization
	 */

	initialize: function(options, stage) {

	 	var settings = {
			initial_number: 0
		};
		_.extend(settings, options);

		this.stage = stage;

		this.generateMeals(settings.initial_number);

	},

	getMeals: function() {
		return this.collection;
	},

	createMeal: function(properties) {

		this.stage.switchToLayer('meals');

		if(_.isUndefined(properties)) properties = {};

		var meal = new Meal(properties, this.max_id);
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
	}

 });
