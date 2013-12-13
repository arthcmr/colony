/*
 * Population Object: a collection of individuals
 * (extends paper Base object)
 */

 var Population = paper.Base.extend({

 	//attributes
 	collection: {},

 	max_id: 0,

	/*
	 * Initialization
	 */

	initialize: function(options, stage) {

	 	var settings = {
			initial_number: 10
		};
		_.extend(settings, options);

		this.stage = stage;

		for(var i=0; i<settings.initial_number; i++) {
			var ind = this.createIndividual();
		}
	},

	getIndividuals: function() {
		return this.collection;
	},

	createIndividual: function(properties) {

		this.stage.switchToLayer('population');

		if(_.isUndefined(properties)) properties = {};

		var individual = new Individual(properties, this.max_id);
		//add it to the collection
		this.collection[this.max_id] = individual;
		//increase the id
		this.max_id++;

		return individual;
	},

	run: function(objects) {

		var _this = this;
		_.each(this.collection, function(individual, i) {
			individual.run(objects);

			//console.log("Position "+i+": "+individual.position);

			//remove from population if it's dead
			if(individual.alive === false) {
				_this.kill(i);
			}
		});

	},

	kill: function(index) {
		delete this.collection[index];
	},

	exists: function(individual) {

		if(_.isUndefined(individual)) return false;
		var e = _.has(this.collection, individual.index);
		return e;
	}

 });
