/*!
 * COLONY PARTICLE
 */

(function(){

  let Colony = this.Colony;

  class Particle {
    constructor(options, colony) {
      this.colony = colony;
      Object.assign(options, {
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
    }

    update() {
      this.position = [this.position[0], this.position[1] + 2];
      if(this.position[1] > this.colony.scene.height) this.position[1] = 0;
      this.symbol.translation.set(this.position[0], this.position[1]);
    }

    setPosition(pos) {
      this.position = pos;
    }

    remove() {
      this.colony.scene.remove(this.symbol)
    }

    contains(particle) {

    }

    
  }

  Colony.Particle = Particle;

}.call(window));