/*
 * Individual Object: a living circle that moves around and does amazing things.
 * (extends paper Base object)
 */

var Individual = paper.Base.extend({

	/*
	 * Initialization
	 */

	initialize: function(index, options) {;
		/*
		 * Default attributes
		 */

	 	//innate

	 	this.index = index;

	 	this.alive = true;

		this.max_radius = 50;		  						//initial size
		this.min_radius = 10;		  						//initial size
		this.sight = 40;		  							//initial sight radius
		this.sightVisible = true;
		this.color = '#0066cc'; 							//initial color of SIM
		this.oldColor = this._shadeColor(this.color, -0.3);
		this.strength = 0.25;		 		//initial strength
		this.number_flagellum = _.random(1,3);		  					//default speed

		this.speed = 1 + 10 * ((this.number_flagellum < 5) ? this.number_flagellum : 0); //default speed
		if(this.number_flagellum === 0) {
			this.speed = 0;
		}

		this.force = 0.05;		  							//default speed

		this.max_speed = this.speed + (this.strength);		//maximum speed
		this.max_force = this.force + (this.strength);		//maximum force

		this.max_age = 1 * Math.random();									//max_age

		this.antibodies = false;							//has antibodies?
		this.disease = false;								//has disease?
		this.lifespan = 100;								//how long does it live? (in # of movements)
		this.memory_size = 3;								//size of memory
		this.intoxication = 0.8;							//probability of being intoxicated
		this.poison_lethality = 0.8;						//probability of dying from poison
		this.poison_lifespan = 0.1;							//reduced lifespan after getting poisoned
		this.cost_per_movement = 3;							//energy cost per movement

		//state

		this.position = false;										//current position (false = random)
		var randomx = Math.random() * 2 - 1,						//negative and positive vector between -1 and 1
			randomy = Math.random() * 2 - 1; 
		this.vector = new paper.Point(randomx, randomy); 			//negative and positive vector between -1 and 1	
		this.acceleration = new paper.Point();						//current acceleration
		this.hungry = 0;											//is hungry now?
		this.energy = 0.05;											//amount of energy
		this.age = 0;												//age
		this.poisoned = false;										//is poisoned now?
		this.reproducing = false;									//is reproducing now?
		this.current_speed = 0; 									//current speed
		this.memory = [];											//position memory
		this.current_radius = 0;									//current size
		this.avoid_collision = true; 								//is currently avoiding collision?
		this.last_angle = 0;

		//stores distances with other individuals
		this.distances = [];
		this.count = 0;

		//stores points for tail
		this.points = [];
		for (var i = 0, l = this.strength * 10 + 10; i < l; i++) {
			this.points.push(new paper.Point());
		}

		//if other parameters are provided, apply properties
		if(!_.isUndefined(options)) {
			_.each(options, function(value, key) {
				this[key] = value;
			});
		}

		//set random position if none is defined
		if(this.position === false) {
			this._setPosition();
		}

		//draw individual
		this.draw();

	},

	/*
	 * The following methods are related to the animation of the individual,
	 * including necessary calculations and collision detection
	 */ 

	run: function (objects) {

		this._setEnergy();
		this._setSize();
		this._setAge();

		var individuals = objects.population.getIndividuals();
		
		this.calculateDistances(individuals);
		var separation = this.separate(individuals).multiply(2);

		if(this.energy > .10)
		this.avoid(individuals, separation, new paper.Point(600,400));
		else
		this.flock(individuals, separation);
		

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

	go_to: function(individuals, separation, target) {

		this.acceleration = this.arrive(target);
		this.acceleration = this.acceleration.add(separation);
	},

	avoid: function(individuals, separation, target) {

		this.acceleration = this.getOut(target);
		this.acceleration = this.acceleration.add(separation);
	},

	calculateDistances: function(individuals) {
		for (var i = 0, l = individuals.length; i < l; i++) {
			var other = individuals[i];
			this.distances[i] = other.position.getDistance(this.position, true);
		}
	},

	separate: function(individuals) {
		var desiredSeparation = (this.current_radius + this.sight) * (this.current_radius + this.sight);
		var steer = new paper.Point();
		var count = 0;
		// For every individual in the system, check if it's too close
		for (var i = 0, l = individuals.length; i < l; i++) {
			var distance = this.distances[i];
			if (distance > 0 && distance < desiredSeparation) {
				// Calculate vector pointing away from neighbor
				var delta = this.position.subtract(individuals[i].position);
				delta.length = 1 / distance;
				steer = steer.add(delta);
				count++;
			}
		}
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

	// Alignment
	// For every nearby individual in the system, calculate the average velocity
	align: function(individuals) {
		var neighborDist = 25;
		var steer = new paper.Point();
		var count = 0;
		for (var i = 0, l = individuals.length; i < l; i++) {
			var distance = this.distances[i];
			if (distance > 0 && distance < neighborDist) {
				steer = steer.add(individuals[i].vector);
				count++;
			}
		}

		if (count > 0) {
			steer = steer.divide(count);
		}
		if (!steer.isZero()) {
			// Implement Reynolds: Steering = Desired - Velocity
			steer.length = this.maxSpeed;
			steer = steer.subtract(this.vector);
			steer.length = Math.min(steer.length, this.maxForce);
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
		for (var i = 0, l = individuals.length; i < l; i++) {
			var distance = this.distances[i];
			if (distance > 0 && distance < neighborDist) {
				sum = sum.add(individuals[i].position); // Add location
				count++;
			}
		}
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
		// (1 -- based on distance, 2 -- maxSpeed)
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
		// (1 -- based on distance, 2 -- maxSpeed)
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
			this.position = this.position.add(vector);
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
		this.position = this.position.add(this.vector);
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
			rotated.length = Math.sin((this.count + i * 3) * 0.003);
			lastVector.length = -1 * pieceLength;
			point = point.add(lastVector);
			points[i] = point.add(rotated);
			lastVector = vector.clone();
		}
	},

	die: function() {
		console.log('die '+this.index);
		this.alive = false;
		this.clear();
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
			radius: this.max_radius + this.sight,
			strokeColor: '#ccc',
			strokeWidth: 1,
			opacity: 0.3
		});

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

	//actually position elements
	updateItems: function() {
		this._setItemColor();
		this._setItemSize();
		this._setItemFlagellum();
		this._setItemPosition();
	},

	_setItemColor: function() {
		var color;
		if(_.isUndefined(this.dark_color) || color !== this.color) {
			color = this.color;
			this.dark_color = this._shadeColor(this.color, 0.1);
			this.darker_color = this._shadeColor(this.color, 0.2);
		}
		switch(this.hungry) {
			case 2:
				color = this.darker_color;
				break;
			case 1:
				color = this.dark_color;
				break;
			case 0:
			default:
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


	/*
	 * The following methods are of general purpose, mostly private
	 */

	_setEnergy: function() {
		//subtract energy
		this.energy -= 0.00005;

		if(this.energy < 0.01) {
			//this.die();
		}
		else if(this.energy < 0.08) {
			this.hungry = 2;
		}
		else if(this.energy < 0.15) {
			this.hungry = 1;
		}
		else {
			this.hungry = 0;
		}
	},

	_setAge: function() {
		this.age += 0.0001;
		if(this.age/this.max_age > 0.9) {
			this.color = this.oldColor;
		}
		if(this.age > this.max_age) {
			this.die();
		}
	},

	_setSize: function() {
		this.current_radius = this.min_radius + (this.max_radius-this.min_radius) * (this.energy);
		if(this.current_radius < this.min_radius) this.current_radius = this.min_radius;
	},

	_setPosition: function (position) {
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
		return new paper.Point.random().multiply(max_point);
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
	    var num = parseInt(color.slice(1),16), amt = Math.round(255 * percent), R = (num >> 16) + amt, G = (num >> 8 & 0x00FF) + amt, B = (num & 0x0000FF) + amt;
	    return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
	},



 });