//hashmap for sin functions (performance)
var MathSin = {};

/*
 * Individual Object: a living circle that moves around and does amazing things.
 * (extends paper Base object)
 */

var Individual = paper.Base.extend({

	/*
	 * Initialization
	 */

	initialize: function(options, index) {;
		/*
		 * Default attributes
		 */
	 	//innate
	 	if(_.isNumber(index)) {
	 		this.index = index;
	 		this.generateProperties();
	 		this.generateStateProperties();
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
		this.draw();

	},

	generateProperties: function() {

		this.max_radius = 25;		  						//initial size
		this.min_radius = 10;		  						//initial size
		this.sight = 40;		  							//initial sight radius
		this.color = '#0066cc'; 							//initial color of SIM
		this.strength = 0.25;		 		//initial strength
		this.number_flagellum = _.random(1,2);		  					//default speed

		this.force = 0.05;		  							//default speed

		this.max_age = 0.1;									//max_age

		this.antibodies = false;							//has antibodies?
		this.disease = false;								//has disease?
		this.memory_size = 3;								//size of memory
		this.intoxication = 0.8;							//probability of being intoxicated
		this.poison_lethality = 0.8;						//probability of dying from poison
		this.poison_lifespan = 0.1;							//reduced lifespan after getting poisoned
		this.fecundity = 0.1;								//fecundity probability
		this.mutation_probability = 0.01;					//mutation probability
		this.initial_energy = 0.5;							//amount of energy

	},

	generateStateProperties: function() {
		//state

		this.speed = 1 + 10 * ((this.number_flagellum < 5) ? this.number_flagellum : 0); //default speed
		if(this.number_flagellum === 0) {
			this.speed = 0;
		}

		this.alive = true;
		this.oldColor = this._shadeColor(this.color, 0.3);
		this.position = false;	//current position (false = random)
		var randomx = Math.random() * 2 - 1, //negative and positive vector between -1 and 1
			randomy = Math.random() * 2 - 1; 
		//negative and positive vector between -1 and 1	
		this.vector = new paper.Point(randomx, randomy);
		this.acceleration = new paper.Point();		//current acceleration
		this.hungry = 0;							//is hungry now?
		this.energy = this.initial_energy + ((Math.random() * 2 - 1) * this.initial_energy / 4); //small variation of approximately +/-12.5%
		this.age = 0;					//age
		this.poisoned = false;			//is poisoned now?
		this.reproducing = false;		//is reproducing now?
		this.mate = null;				//is reproducing now?
		this.energy_reproduction = 0;
		this.current_speed = 0; 		//current speed
		this.memory = [];				//position memory
		this.current_radius = 0;		//current size
		this.avoid_collision = true; 	//is currently avoiding collision?
		this.last_angle = 0;
		this.sightVisible = true;
		this.max_speed = this.speed + (this.strength);		//maximum speed
		this.max_force = this.force + (this.strength);		//maximum force

		//stores distances with other individuals
		this.distances = {};
		//stores distances with meals
		this.distancesMeals = {};
		//stores distances with other meals
		this.meals = {};
		this.count = 0;

		//stores points for tail
		this.points = [];
		for (var i = 0, l = this.strength * 10 + 10; i < l; i++) {
			this.points.push(new paper.Point());
		}
		//set random position if none is defined
		if(this.position === false) {
			this.setPosition();
		}
	},

	/*
	 * The following methods are related to the animation of the individual,
	 * including necessary calculations and collision detection
	 */ 

	run: function (objects) {

		this._stepEnergy();
		this._setSize();
		this._setAge();

		//stores important objects that this individual interacts with
		this.population = objects.population;
		var individuals = this.population.getIndividuals();

		this.meals = objects.meals;
		var meals = this.meals.getMeals();
		
		//true to force every calculation
		this.distances = this.calculateDistances(individuals);
		this.distancesMeals = this.calculateDistances(meals);

		//separation between individuals
		var separationSight = (this.current_radius + this.sight) * (this.current_radius + this.sight);
		var separationBody = (this.current_radius * 3) * (this.current_radius * 3);
		var separation = this.separate(individuals, separationBody).multiply(2);
		
		////check if individual should reproduce or share information
		this.checkSharing(individuals, separationSight);

		//check if individual should eat
		this.checkEating(meals, separationSight);

		/*
		 * behavior when individual is reproducing: overlap mate and cruise together
		 */

		//	this.avoid(individuals, separation, new paper.Point(600,400));
		if(this.reproducing && !_.isNull(this.mate)) {

			//if individual still exists
			if(this.population.exists(individuals[this.mate])) {
				//can overlap
				this.go_to(individuals, separation, individuals[this.mate].position, true);
				this.end_reproduction(individuals);
			}
			else {
				this.interrupt_reproduction();
				this.flock(individuals, separation);
			}
		}

		/*
		 * behavior when individual is staving: pursue food if they remember or look desperately for food at random
		 */

		else if(this.is_very_hungry()) {

			/* if theres no memory, look desperately for a new place to go */
			if(this.memory.length < 1) {
				if((_.isUndefined(this.meal)) || (this.position.getDistance(this.meal, true) < separationSight)) {
					this.meal = this._getRandomPoint();
					this.wandering = true;
				}
			}
			else {
				/* if there is some memory and no memory has been picked, pick the closest */
				/* if a point has been picked at random and individual is wandering, pick the memory point */
				if(_.isUndefined(this.meal) || this.wandering === true) {
					this.meal = this.memory[0];
					this.wandering = false;
				}
			}
			/* pursue the target */
			this.go_to(individuals, separation, this.meal);
		}

		/*
		 * behavior when individual is hungry, but not staving: pursue food if they remember where they were
		 */

		else if(this.is_hungry()) {

			/* if there is some memory, pick the first memory and go */
			if(this.memory.length > 0) {
				if(_.isUndefined(this.meal)) {
					this.meal = this.memory[0];
				}
				this.go_to(individuals, separation, this.meal);
			}
			/* if there is no memory, flock with other individuals */
			else {
				this.flock(individuals, separation);
			}
		}

		/*
		 * behavior when individual is not hungry: flock
		 */

		else if(!this.is_full() && this.memory.length > 0) {
			//if individual is not full and is able to see a meal, eat it
			var meal_point = this.memory[0];
			if(this.position.getDistance(meal_point, true) < separationSight) {
				if(_.isUndefined(this.meal)) {
					this.meal = meal_point;
				}
				this.go_to(individuals, separation, this.meal);
			}
			else {
				this.meal = undefined;
				this.flock(individuals, separation);
			}
		}

		else {
			this.flock(individuals, separation);
		}

		this.borders();
		this.update();
		this.calculateTail();
		this.updateItems();
	},

	// We accumulate a new acceleration each time based on three rules
	flock: function(individuals, separation) {
		var alignment = this.align(individuals);
		var cohesion = this.cohesion(individuals);
		this.acceleration = this.acceleration.add(separation);
		this.acceleration = this.acceleration.add(alignment);
		this.acceleration = this.acceleration.add(cohesion);
	},

	go_to: function(individuals, separation, target, overlap) {
		this.acceleration = this.arrive(target);
		//if overlap == true, then sepatation is not needed
		if(overlap !== true) {
			this.acceleration = this.acceleration.add(separation);
		}
	},

	avoid: function(individuals, separation, target) {

		this.acceleration = this.getOut(target);
		this.acceleration = this.acceleration.add(separation);
	},

	/*
	calculateDistances from every viewable object
	if force === true, calculate distance from every object in the collection
	TODO: avoid far objects
	*/
	calculateDistances: function(collection, force) {
		var distances = {};
		var _this = this;
		_.each(collection, function(item, ind) {
			var other = item;
			if(force === true || _this.intersects(other)) {
				distances[ind] = other.position.getDistance(_this.position, true);
			}
		});

		var ordered_distances = _.map(distances, function(v, k) {
			return {
				value: v,
				key: k
			}
		});

		ordered_distances = _.sortBy(ordered_distances, function(i) { return i.value });

		return _.clone(ordered_distances);
	},

	separate: function(individuals, desiredSeparation) {
		var steer = new paper.Point();
		var count = 0;
		// For every individual in the system, check if it's too close
		var _this = this;
		_.each(this.distances, function(x) {
			var distance = x.value;
			var ind = x.key;
			var individual = individuals[ind];

			//if reference is to the same object
			if (_this !== individual && distance < desiredSeparation) {
				// Calculate vector pointing away from neighbor
				var delta = _this.position.subtract(individuals[ind].position);
				delta.length = 1 / distance;
				steer = steer.add(delta);
				count++;
			}
		});
		// Average -- divide by how many
		if (count > 0)
			steer = steer.divide(count);
		if (!steer.isZero()) {
			// Implement Reynolds: Steering = Desired - Velocity
			steer.length = this.max_speed;
			steer = steer.subtract(this.vector);
			steer.length = Math.min(steer.length, this.max_force);
		}
		return steer;
	},

	checkSharing: function(individuals, desiredSeparation) {
		// For every individual in the system, check if it's too close
		var _this = this;
		_.each(this.distances, function(x) {
			var distance = x.value;
			var ind = x.key;
			var individual = individuals[ind];
			//if reference is to the same object
			if (_this !== individual && distance < desiredSeparation) {
				//probability of reproducing
				if(!_this.is_hungry() && Math.random() < _this.fecundity) {
					_this.start_reproduction(individuals, ind);
				}
				//if this is hungry and individual is not
				else if(_this.is_hungry() && !individual.is_hungry()) {
					_this.mergeMemory(individual.memory);
				}
			}
		});
	},

	// Alignment
	// For every nearby individual in the system, calculate the average velocity
	align: function(individuals) {
		var neighborDist = 25;
		var steer = new paper.Point();
		var count = 0;
		var _this = this;

		_.each(this.distances, function(x) {
			var distance = x.value;
			var ind = x.key;
			var individual = individuals[ind];
			if (distance > 0 && distance < neighborDist) {
				steer = steer.add(individual.vector);
				count++;
			}
		});
		if (count > 0) {
			steer = steer.divide(count);
		}
		if (!steer.isZero()) {
			// Implement Reynolds: Steering = Desired - Velocity
			steer.length = this.max_speed;
			steer = steer.subtract(this.vector);
			steer.length = Math.min(steer.length, this.max_force);
		}
		return steer;
	},

	// Cohesion
	// For the average location (i.e. center) of all nearby individuals,
	// calculate steering vector towards that location
	cohesion: function(individuals) {
		var neighborDist = 10000;
		var sum = new paper.Point(0, 0);
		var count = 0;
		var _this = this;
		_.each(this.distances, function(x) {
			var distance = x.value;
			var ind = x.key;
			var individual = individuals[ind];
			if (distance > 0 && distance < neighborDist) {

				//make sure they are not attracted to the ones already reproducing
				//reproducing ones are not part of the flock
				if(!individual.reproducing) {
					sum = sum.add(individual.position); // Add location
					count++;
				}

			}
		});
		if (count > 0) {
			sum = sum.divide(count);
			// Steer towards the location
			return this.steer(sum, false);
		}
		return sum;
	},

	// A method that calculates a steering vector towards a target
	// Takes a second argument, if true, it slows down as it approaches
	// the target
	steer: function(target, slowdown) {
		var steer,
			desired = target.subtract(this.position);
		var distance = desired.length;
		// Two options for desired vector magnitude
		// (1 -- based on distance, 2 -- max_speed)
		if (slowdown && distance < 100) {
			// This damping is somewhat arbitrary:
			desired.length = this.max_speed * 0.1;
		} else if(slowdown) {
			desired.length = this.max_speed * (distance * 0.001);
		} else {
			desired.length = this.max_speed;
		}
		steer = desired.subtract(this.vector);
		steer.length = Math.min(this.max_force, steer.length);
		return steer;
	},

	// A method that calculates a steering vector away from a target
	// Takes a second argument, if true, it slows down as it moves away from
	// the target
	steerAway: function(target, slowdown) {
		var steer,
			avoiding = target.subtract(this.position);
		var distance = avoiding.length;
		// Two options for desired vector magnitude
		// (1 -- based on distance, 2 -- max_speed)
		if (slowdown && distance > 100) {
			// This damping is somewhat arbitrary:
			avoiding.length = this.max_speed * 0.1;
		} else if(slowdown) {
			avoiding.length = this.max_speed * (distance * 0.001);
		} else {
			avoiding.length = this.max_speed;
		}
		avoiding = avoiding.multiply(-1);
		steer = avoiding.subtract(this.vector);
		steer.length = Math.min(this.max_force, steer.length);
		return steer;
	},

	borders: function() {
		var vector = new paper.Point();
		var position = this.position;
		var radius = this.current_radius;
		var size = paper.view.size;
		if (position.x < -radius) vector.x = size.width + radius;
		if (position.y < -radius) vector.y = size.height + radius;
		if (position.x > size.width + radius) vector.x = -size.width -radius;
		if (position.y > size.height + radius) vector.y = -size.height -radius;
		if (!vector.isZero()) {
			this.setPosition(this.position.add(vector));
			var points = this.points;
			for (var i = 0, l = points.length; i < l; i++) {
				points[i] = points[i].add(vector);
			}
		}
	},

	seek: function(target) {
		return this.acceleration.add(this.steer(target, false));
	},

	arrive: function(target) {
		return this.acceleration.add(this.steer(target, true));
	},

	getOut: function(target) {
		return this.acceleration.add(this.steerAway(target, true));
	},

	update: function() {
		// Update velocity
		this.vector = this.vector.add(this.acceleration);
		// Limit speed (vector#limit?)
		this.vector.length = Math.min(this.max_speed, this.vector.length);
		this.setPosition(this.position.add(this.vector));
		// Reset acceleration to 0 each cycle
		this.acceleration = new paper.Point();
	},

	//calculate tail animation
	calculateTail: function() {

		var points = this.points;
		var speed = this.vector.length;
		var pieceLength = 5 + speed * 0.3;
		var point = this.position.clone();
		points[0] = this.position.clone();
		var lastVector = this.vector.clone();
		for (var i = 1, l = points.length; i < l; i++) {
			this.count += speed * 15;
			var vector = point.subtract(points[i]);
			var rotated = lastVector.rotate(90);

			//sin function to calculate rotation
			var key = this.count + i * 3;
			rotated.length = this._getRotatedLengthFragellum(key);

			lastVector.length = -1 * pieceLength;
			point = point.add(lastVector);
			points[i] = point.add(rotated);
			lastVector = vector.clone();
		}
	},

	die: function() {
		this.alive = false;
		//become meals
		var area = this.sightRing.bounds;
		var area2 = this.body.bounds;
		var x = area2.width * area2.height / 100;
		var num_meals = ((x >= 0 ? x : -x) + 0.5) >> 0;
		this.meals.generateMeals(num_meals, area);
		this.clear();
	},

	start_reproduction: function(individuals, ind) {

		var individual = individuals[ind];

		if(this.reproducing === true
			|| individual.reproducing === true
			|| this.is_hungry()
			|| individual.is_hungry()) {
			return;
		}

		this.setReproduction(true);
		this.mate = ind;
		this.energy_reproduction = this.energy;

		individual.setReproduction(true);
		individual.mate = this.index;
		individual.energy_reproduction = individual.energy;

		this.acceleration = individual.acceleration.multiply(-1);
	},

	end_reproduction: function(individuals) {

		//cant end what hasnt even started
		if(this.reproducing === false || _.isNull(this.mate)) {
			return;
		}

		var individual = individuals[this.mate];

		//check if enough energy is available
		var min_energy = Math.min(this.initial_energy, individual.initial_energy) / 10;
		var combined_energy = (this.energy_reproduction - this.energy) +
			 (individual.energy_reproduction - individual.energy);
		if(combined_energy < min_energy) {
			//not enough time
			return;
		}

		//reproduce
		this.reproduce(individual, min_energy);

		//separate them
		individual.setReproduction(false);
		this.setReproduction(false);

		this.acceleration = individual.acceleration.multiply(-1);

		individual.mate = null;
		this.mate = null;

		//create new individual

	},

	interrupt_reproduction: function() {
		this.setReproduction(false);
		this.mate = null;
	},

	reproduce: function(individual, min_energy) {

		var new_individual_properties = this.crossover(individual);
		var new_individual_properties = this.mutation(new_individual_properties);
		//set position to current position
		new_individual_properties.position = this.position.clone();
		//create individual
		var new_individual = this.population.createIndividual(new_individual_properties);
		//update positions and sizes
		new_individual.updateItems();

	},

	crossover: function(individual) {

		//all properties that must be crossed over
		dna_properties = [
			'max_radius',
			'max_radius',
			'min_radius',
			'min_radius',
			'sight',
			'sight',
			'color',
			'color',
			'color',
			'color',
			'color',
			'color',
			'strength',
			'number_flagellum',
			'number_flagellum',
			'number_flagellum',
			'number_flagellum',
			'number_flagellum',
			'force',
			'max_age',
			'antibodies',
			'disease',
			'memory_size',
			'intoxication',
			'poison_lethality',
			'poison_lifespan',
			'fecundity',
			'initial_energy',
			];

		var new_properties = {};
		var _this = this;
		_.each(dna_properties, function(property) {
			//if both are defined, sort
			var value;
			if(!_.isUndefined(_this[property]) && !_.isUndefined(individual[property])) {
				if(Math.random() < 0.5) {
					value = _this[property];
				} else {
					value = individual[property];
				}
			}
			//try to get the only defined one
			if(_.isUndefined(_this[property]) || _.isUndefined(individual[property])) {
				value = _this[property] || individual[property];
			}
			//if its defined, add it
			if(!_.isUndefined(value)) {
				new_properties[property] = value;
			}
		});
		return new_properties;

	},

	mutation: function(properties) {
		//mutate each property
		var _this = this;
		var new_properties = {};

		_.each(properties, function(value, property) {

			var sort = Math.random();
			var new_value;
			//only change if mutation condition is satisfied
			if(sort < _this.mutation_probability) {
				//if its a color
				if(_.isString(value)) {
					var hex = value.substring(1,7); //get color
					var number_hex = parseInt(hex, 16); //get corresponding int
					var x = number_hex * _.random(1,100000) / _.random(1,100000);
					//replace Math.ceil()
					new_value = ((x >= 0 ? x : -x) + 0.5) >> 0;
					new_value = new_value.toString(16); //get new hex
					new_value = "#" + (("000000" + new_value).slice(-6));
				}
				//if its a number
				else if(_.isNumber(value)) {

					var int_properties = [
						'max_radius',
						'min_radius',
						'sight',
						'number_flagellum',
						'memory_size'
					];

					new_value = value * _.random(1,5) / _.random(1,5);

					//if property must be an int
					if(_.indexOf(int_properties, property) !== -1) {
						new_value = ((new_value >= 0 ? new_value : -new_value) + 0.5) >> 0;
					}

				}
				//if its a boolean
				else if(_.isBoolean(value)) {
					new_value = !value;
				}

			} else {
				new_value = value;
			}
			new_properties[property] = new_value;
		});

		return new_properties;
	},

	clear: function() {
		this.body.opacity = 0;
		this.sightRing.opacity = 0;
		this.points = [];
		this.calculateTail();
		this.updateItems();
	},

	draw: function() {

		//head
		// this.body = new paper.Path.Circle({
		// 				opacity: 0.7,
		// 				radius: this.current_radius,
		// 				fillColor: this.color
		// 			});

		this.sightRing = new paper.Path.Circle({
			radius: this.current_radius + this.sight,
			strokeColor: '#ccc',
			strokeWidth: 1,
			opacity: 0.3
		});

		if(this.sightVisible === false) {
			this.sightRing.opacity = 0;
		}

		//small tail
		var shortPath = new paper.Path({
			strokeColor: this.color,
			opacity: 0.2,
			strokeWidth: 10,
			strokeCap: 'round'
		});

		//long tail
		var path = new paper.Path({
			strokeColor: this.color,
			opacity: 0.3,
			strokeWidth: 2,
			strokeCap: 'round'
		});

		this.short_path = [];
		this.path = [];
		for(var i = 0; i<this.number_flagellum; i++) {
			this.short_path.push(shortPath.clone());
			this.path.push(path.clone());
		}

		this.body = new paper.Path.Circle({
			opacity: 0.7,
			radius: this.max_radius,
			fillColor: this.color
		});

	},

	checkEating: function(meals, desiredSeparation) {

		var _this = this;

		var map_memory = _.map(this.memory, function(point) {
			return {
				point: point,
				distance: _this.position.getDistance(point, true)
			}
		});
		//closest first
		map_memory = _.sortBy(map_memory, function(point) {
			return point.distance;
		});
		this.memory = _.map(map_memory, function(p) {
			return p.point;
		});

		// memory visible
		var memory_visible = _.filter(map_memory, function(p) {
			return (p.distance < desiredSeparation);
		});

		//remove visible points without a meal
		_.each(memory_visible, function(p) {
			var search = _.findWhere(_this.distancesMeals, { value: p.distance });
			if(_.isUndefined(search)) {
				_this.removeFromMemory(p.point);
			}
		});

		//remove visible meal
		if(this.meal) {
			var distance = _this.position.getDistance(this.meal, true);
			if(distance < desiredSeparation) {
				var search = _.findWhere(_this.distancesMeals, { value: distance });
				if(_.isUndefined(search)) {
					if(this.memory.length > 0) {
						this.meal = this.memory[0];
					} else {
						this.meal = undefined;
					}
				}
			}
		}

		// For every individual meal in the system, check if it's too close
		_.each(this.distancesMeals, function(x) {
			var distance = x.value;
			var ind = x.key;
			var meal = meals[ind];
			//if reference is to the same object
			if (distance < desiredSeparation) {

				_this.insertMemory(meal.position);

				if(!_this.is_full() && distance < _this.current_radius) {
					_this.eat(meal);
				}
			}
		});

	},

	eat: function(meal) {
		if(this.meals.exists(meal)) {
			var energy = meal.eat();
			var position = meal.position;
			this.setEnergy(this.energy + energy);
			this.removeFromMemory(position);
			this.meal = undefined;
		} else {
			return;
		}
	},

	/*
	 * inserts contents of another memory, prioritizing this individual's memory
	 */

	mergeMemory: function(memory) {
		this.memory = _.union(this.memory, memory);
		this.memory = this.memory.slice(0, this.memory_size);
	},

	insertMemory: function(point) {
		//dont insert if its already there
		if(this.memory.indexOf(point) !== -1) return;
		//insert point in the beginning of array
		this.memory.unshift(point);
		//make sure only the correct amount is in memory
		this.memory = this.memory.slice(0, this.memory_size);
	},

	removeFromMemory: function(point) {
		this.memory = _.without(this.memory, point);
	},

	//actually position elements
	updateItems: function() {
		this._setItemColor();
		this._setItemSize();
		this._setItemFlagellum();
		this._setItemPosition();
	},

	is_very_hungry: function() {
		return (this.hungry > 2);
	},

	is_hungry: function() {
		return (this.hungry > 1);
	},

	is_full: function() {
		return (this.hungry === 0);
	},

	_setItemColor: function() {
		var color;
		if(_.isUndefined(this.dark_color) || color !== this.color) {
			color = this.color;
			this.dark_color = this._shadeColor(this.color, -0.1);
			this.darker_color = this._shadeColor(this.color, -0.2);
		}
		switch(this.hungry) {
			case 3:
				color = this.darker_color;
				break;
			case 2:
				color = this.dark_color;
				break;
			case 0:
			case 1:
			default:
				color = this.color;
				break;
		}

		this.body.setFillColor(color);

	},

	_setItemSize: function() {
		this._setRadius(this.sightRing, this.current_radius + this.sight);
		this._setRadius(this.body, this.current_radius);
	},

	_setItemPosition: function() {
		this.sightRing.position = this.position;
		this.body.position = this.position;
	},

	_setItemFlagellum: function() {

		var half_flag = ((this.number_flagellum-1) / 2);
		var dist = 10;
		var _this = this;
		_.each(this.path, function(path, index) {
			path.segments = _this.points;
			//calculate rotation
			var rot = (index - half_flag) * dist;
			path.rotate(rot, _this.position);
		});

		_.each(this.short_path, function(spath, index) {
			spath.segments = _this.points.slice(0, 4);
			//calculate rotation
			var rot = (index - half_flag) * dist;
			spath.rotate(rot, _this.position);
		});
	},

	_getRotatedLengthFragellum: function(key) {
		//optimizations
		var key = key / 100;
		key = ((key >= 0 ? key : -key) + 0.5) >> 0; //Math.round(key);
		key = key * 100;
		if(key > 120000) key = key % 12000;

		if(typeof MathSin[key] !== "undefined") {
			var sin = MathSin[key];
			// console.log("cached! "+key);
		}
		else {
			var sin = Math.sin(key * 0.003);
			MathSin[key] = sin;
		}
		return sin;
	},


	setEnergy: function(new_energy) {
		this.energy = new_energy;
	},

	/*
	 * The following methods are of general purpose, mostly private
	 */

	_stepEnergy: function() {
		//subtract energy
		var energy_step = 0.0001 + 0.000025 * this.current_radius;
		this.setEnergy(this.energy - energy_step);

		if(this.energy < 0.01) {
			console.log(this.index + " died from hunger");
			this.die();
		}
		else if(this.energy < 0.2) {
			this.hungry = 3;	//starving
		}
		else if(this.energy < 0.5) {
			this.hungry = 2;	//hungry
		}
		else if(this.energy > 0.99) {
			this.hungry = 0;	//full, cant eat
		}
		else {
			this.hungry = 1;
		}
	},

	_setAge: function() {
		this.age += 0.0002;
		if(this.age/this.max_age > 0.9) {
			this.color = this.oldColor;
		}
		if(this.age > this.max_age) {
			console.log(this.index + " died from old age");
			this.die();
		}
	},

	_setSize: function() {
		this.current_radius = this.min_radius + (this.max_radius-this.min_radius) * (this.energy);
		if(this.current_radius < this.min_radius) this.current_radius = this.min_radius;
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

	_getRandomPoint: function() {
		//get maximum possible point
		var stage_size = paper.view.size;
		var max_point = new paper.Point(stage_size.getWidth(), stage_size.getHeight());
		//generate a random point between (0,0) and (max_width, max_height)
		var random_point = new paper.Point.random().multiply(max_point);
		return random_point;
	},

	_getRadius: function(path) {
		return path.bounds.width / 2 + path.strokeWidth / 2;
	},
	_setRadius: function(path, radius) {
		// figure out what the new radius should be without the stroke
		var newRadiusWithoutStroke = radius - path.strokeWidth / 2;
		// figure out what the current radius is without the stroke 
		var oldRadiusWithoutStroke = path.bounds.width / 2;
		path.scale(newRadiusWithoutStroke / oldRadiusWithoutStroke);
	},

	_shadeColor: function(color, percent) {   
	    var num = parseInt(color.slice(1),16),
	    	x = 255 * percent,
	    	amt = ((x >= 0 ? x : -x) + 0.5) >> 0,
	    	R = (num >> 16) + amt,
	    	G = (num >> 8 & 0x00FF) + amt,
	    	B = (num & 0x0000FF) + amt;
	    return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
	},

	setReproduction: function(value) {
		this.reproducing = value;
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
		return this.sightRing.bounds;
	}



 });
