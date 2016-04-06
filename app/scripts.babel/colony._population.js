/*!
 * COLONY MEALS
 */

(function(){

  let Colony = this.Colony;

  class Population extends Colony.Collection {
    constructor(options, colony) {

      options = Object.assign({
        population: colony.config.population
      }, options);

      super(options, colony);
      
      for(let i=0; i<this.population; i++) {
        this.createIndividual({});
      }
    }

    createIndividual(properties) {
      let ind = new Colony.Individual(properties, this.colony);
      ind.index = this.add(ind);
      return ind;
    }

    update() {
      this.each((individual, k) => {
        if(individual.alive === false) {
          this.remove(k);
        } else {
          individual.update();
        }
      })
    }
  }

  Colony.Population = Population;

}.call(window));