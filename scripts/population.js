/*
 * Population Object: a collection of individuals
 * (extends paper Base object)
 */

 var Population = paper.Base.extend({

 	//attributes
 	collection: [],

 	max_id: 0,

	/*
	 * Initialization
	 */

	initialize: function(options) {

	 	var settings = {
			initial_number: 10
		};
		_.extend(settings, options);

		for(var i=0; i<settings.initial_number; i++) {
			//create individual
			var individual = new Individual(this.max_id);
			//add it to the collection
			this.collection.push(individual);
			this.max_id++;
		}

	},

	getIndividuals: function() {
		return this.collection;
	},

	run: function(objects) {

		var _this = this;
		_.each(this.collection, function(individual, i) {
			individual.run(objects);

			//remove from population if it's dead
			if(individual.alive === false) {
				_this.kill(individual);
			}
		});

	},

	kill: function(individual) {
		this.collection = _.without(this.collection, individual);
	}

 });
