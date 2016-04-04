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
        let ind = new Colony.Individual({}, this.colony);
        ind.index = this.add(ind);
      }
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