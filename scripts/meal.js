/*
 * Meal Object: a single meal
 * (extends paper Base object)
 */

var Meal = paper.Base.extend({

	/*
	 * Initialization
	 */

	initialize: function(options, index, symbol) {;
		/*
		 * Default attributes
		 */
	 	//innate
	 	if(_.isNumber(index)) {
	 		this.index = index;
	 		this.setProperties();
	 	}
	 	else if(!_.isUndefined(index)) {
	 		throw "Index is not a number!";
	 		return;
	 	}

	 	var _this = this;
		//if other parameters are provided, apply properties
		if(!_.isUndefined(options)) {
			_.each(options, function(value, key) {
				_this[key] = value;
			});
		}

		//draw individual
		this.draw(symbol);

	},

	setProperties: function() {
		this.position = false;
		this.energy = 0.1;
		this.exists = true;

		//set random position if none is defined
		if(this.position === false) {
			this.setPosition();
		}
	},

	draw: function(symbol) {

		this.instance = symbol.place();
		this.instance.position = this.position;

	},

	setPosition: function (position) {

		var new_position;
		//if the position is not provided, generate one
		if(_.isUndefined(position)) {
			new_position = this._getRandomPoint();
		}
		//if the position is provided, just clone it
		else {
			new_position = position.clone();
		}
		this.position = new_position;
	},

	get_energy: function () {
		if(this.exists === false) {
			return 0;
		}	
		else {
			return this.energy;
		}
	},

	eat: function() {
		var en = this.get_energy();
		this.exists = false;
		this.clear();
		this.energy = 0;
		return en;
	},

	clear: function() {
		this.instance.remove();
	},

	_getRandomPoint: function() {
		//get maximum possible point
		var stage_size = paper.view.size;
		var max_point = new paper.Point(stage_size.getWidth(), stage_size.getHeight());
		//generate a random point between (0,0) and (max_width, max_height)
		return new paper.Point.random().multiply(max_point);
	},

	intersects: function(element) {
		var bounding_box1 = this.bounds();
		var bounding_box2 = element.bounds();
		return bounding_box1.intersects(bounding_box2);
	},

	contains: function(element) {
		var bounding_box1 = this.bounds();
		var bounding_box2 = element.bounds();
		return bounding_box1.contains(bounding_box2);
	},

	bounds:  function() {
		return this.instance.bounds;
	}

});