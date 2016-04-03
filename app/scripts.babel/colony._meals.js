/*!
 * COLONY MEALS
 */

(function(){

  let Colony = this.Colony;

  class Meals extends Colony.Collection {
    constructor(options, colony) {

      Object.assign(options, {
        meals: colony.config.food
      }, options);

      super(options, colony);
      
      this.generateMeals(this.meals);
    }

    generateMeals(number, area) {
      if(number < 1) return;
      let props = {};
      for(let i=0; i<number; i++) {
        if(typeof area !== 'undefined') {
          props.position = this._getRandomPoint(this.colony.scene, area);
        }
        let meal = new Colony.Meal(props, this.colony);
        meal.index = this.add(meal);
      }
    }
  }

  Colony.Meals = Meals;

}.call(window));