/*!
 * COLONY MEAL
 */

(function(){

  let Colony = this.Colony;

  class Meal extends Colony.Particle {
    constructor(options, colony) {
      options = Object.assign({
        energy: colony.config.food_energy,
        color: colony.config.food_color,
        stroke: colony.config.food_stroke,
        radius: 4,
      }, options)
      super(options, colony);
    }
    
    draw() {
      let [x, y] = this.position;
      this.symbol = this.colony.scene.makePolygon(x, y, this.radius, 4);
      this.symbol.fill = this.color;
      this.symbol.stroke = this.stroke;
      this.symbol.lineWidth = 1;
      this.symbol.rotation = Math.PI / 4;
    }
  }

  Colony.Meal = Meal;

}.call(window));