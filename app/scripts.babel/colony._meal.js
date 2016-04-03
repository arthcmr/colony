/*!
 * COLONY MEAL
 */

(function(){

  let Colony = this.Colony;

  class Meal extends Colony.Particle {
    constructor(options, colony) {
      Object.assign(options, {
        energy: 0.1
      }, options)
      super(options, colony);
    }
    
  }

  Colony.Meal = Meal;

}.call(window));