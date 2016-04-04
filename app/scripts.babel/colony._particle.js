/*!
 * COLONY PARTICLE
 */

(function(){

  let Colony = this.Colony;
  let utils = Colony.Utils;

  class Particle {
    constructor(options, colony) {
      this.colony = colony;
      options = Object.assign({
        position: Colony.Utils.getRandomPoint(this.colony.scene),
        radius: 1,
        color: '#000',
      }, options);

      Object.assign(this, options);
      this.isParticle = true;
    }

    draw() {
      let [x, y] = this.position;
      this.symbol = this.colony.scene.makeCircle(x, y, this.radius);
      this.symbol.fill = this.color;
      this.symbol.stroke = this.stroke;
      this.symbol.lineWidth = 1;
    }

    update() {

    }

    setPosition(pos) {
      this.position = pos;
    }

    remove() {
      this.colony.scene.remove(this.symbol)
    }

    distance(particle) {
      let [x1, y1] = this.position;
      let [x2, y2] = particle.position;
      return Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1))
    }

    calculateDistances(collection) {
      let distances = [];
      utils.forEach(collection, (item, i) => {
        distances.push({
          value: this.distance(item),
          item: item,
          key: i
        });
      });

      return distances.sort((a,b) => (a.value < b.value) ? -1 : 1);
    }
    
  }

  Colony.Particle = Particle;

}.call(window));