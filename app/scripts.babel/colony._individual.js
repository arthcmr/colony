/*!
 * COLONY MEAL
 */

(function(){

  let Colony = this.Colony;
  let utils = Colony.Utils;

  class Individual extends Colony.Particle {
    constructor(options, colony) {
      options = Object.assign({
        minSize: colony.config.ind_minSize,
        maxSize: colony.config.ind_maxSize,
        initEnergy: colony.config.ind_energy,
        sight: colony.config.ind_sight,
        flagellum: colony.config.ind_flagellum,
        strength: colony.config.ind_strength,
        force: colony.config.ind_force,
        maxAge: colony.config.ind_maxAge,
        memorySize: colony.config.ind_memorySize,
        fecundity: colony.config.ind_fecundity,
        mutation: colony.config.ind_mutation,
        color: colony.config.ind_color,
      }, options)
      super(options, colony);

      //compute other properties
      this.alive = true;
      this.speed =  1 + 10 * ((this.flagellum < 5) ? this.flagellum : 0);
      if(this.flagellum === 0) {
        this.speed = 0;
      }
      this.oldColor = Colony.Utils.shadeColor(this.color, 0.3);
      this.energy = this.initEnergy + ((Math.random() * 2 - 1) * this.initEnergy / 4); //small variation of approximately +/-12.5%
      this.age = 0;
      this.reproducing = false; //not reproducing now
      this.mate = null;
      this.energyReproduction = 0;
      this.currentSpeed = 0;
      this.memory = [];
      this.avoidCollision = true;
      this.lastAngle = 0;
      this.sightVisible = true;
      this.maxSpeed = this.speed + this.strength;
      this.maxForce = this.force + this.strength;
      this.hungry = 0;


      this.vector = [Math.random() * 2 - 1, Math.random() * 2 - 1]; //vector between -1 and 1
      this.acceleration = [0,0];

      //store distance to neighbors
      this.distances = {};

      //store distance to food
      this.distancesMeals = {}

      //tail
      this.tailPoints = [];
      for (let i = 0, l = this.strength * 10 + 10; i < l; i++) {
        this.tailPoints.push([]);
      }
    }
    
    draw() {
      let [x, y] = this.position;

      //sight
      this.symbol_sight = this.colony.scene.makeCircle(0, 0, this.sight);
      this.symbol_sight.noFill();
      this.symbol_sight.opacity = this.colony.config.ind_sightOpacity;
      this.symbol_sight.stroke = this.colony.config.ind_sightColor;
      this.symbol_sight.linewidth = 1;

      //body
      this.symbol_body = this.colony.scene.makeCircle(0, 0, this.maxSize);
      this.symbol_body.fill = this.color;
      this.symbol_body.opacity = this.colony.config.ind_opacity;
      this.symbol_body.scale = (this.minSize / this.maxSize) + (1 - (this.minSize / this.maxSize)) * this.energy;
      this.symbol_body.noStroke();

      this.symbol = this.colony.scene.makeGroup(this.symbol_sight, this.symbol_body);
      this.symbol.translation.set(x, y);
    }

    update() {
      this._updateEnergy();
      this._updateAge();
      this._updateSize();

      let population = this.colony.objects.population.collection;
      let meals = this.colony.objects.meals.collection;

      //true to force every calculation
      this.distances = this.calculateDistances(population);
      this.distancesMeals = this.calculateDistances(meals);

      //separation between individuals
      var separationSight = (this.sight) * (this.sight);
      var separationBody = (this.currRadius * 3) * (this.currRadius * 3);
      var separation = utils.pointMultiply(this.separate(population, separationBody), 2);

    }

    die() {
      this.alive = false;
    }

    separate(collection, desiredSeparation) {
      var steer = [0,0];
      var count = 0;
      // For every individual in the system, check if it's too close
      utils.forEach(this.distances, (d) => {
        var distance = d.value;
        var ind = d.key;
        var item = d.item;
        if (item !== this && distance < (this.sight + item.currRadius) && distance < desiredSeparation) {
          // Calculate vector pointing away from neighbor
          let delta = utils.pointSubtract(this.position, item.position);
          delta = utils.pointSetLength(delta, (1/distance));
          steer = utils.pointAdd(steer,delta);
          count++;
        }
      });
      // Average -- divide by how many
      if (count > 0) {
        steer = utils.pointDivide(steer, count);
      }
      if (steer[0] !== 0 || steer[1] !== 0) {
        // Implement Reynolds: Steering = Desired - Velocity
        steer = utils.pointSetLength(steer, this.maxSpeed);
        steer = utils.pointSubtract(steer, this.vector);
        steer = utils.pointSetLength(steer, Math.min(utils.pointLength(steer), this.maxForce));
      }
      return steer;
    }

    _updateEnergy() {
      //subtract energy
      let { energy_step, energy_full, energy_hungry, energy_starving, energy_dead } = this.colony.config;

      this.energy -= energy_step;

      if(this.energy < energy_dead) {
        this.die();
      }
      else if(this.energy < energy_starving) {
        this.hungry = 3;  //starving
      }
      else if(this.energy < energy_hungry) {
        this.hungry = 2;  //hungry
      }
      else if(this.energy > energy_full) {
        this.hungry = 0;  //full, cant eat
      }
      else {
        this.hungry = 1;
      }
    }

    _updateAge() {
      //increase age
      let { age_step, age_old } = this.colony.config;
      this.age += age_step;
      if(this.age/this.max_age > age_old) {
        this.color = this.oldColor;
        this.symbol_body.fill = this.color;
      }
      if(this.age > this.max_age) {
        this.die();
      }
    }

    _updateSize() {
      this.symbol_body.scale = (this.minSize / this.maxSize) + (1 - (this.minSize / this.maxSize)) * this.energy;
      this.currRadius = this.symbol_body.scale * this.maxSize;
    }

  }

  Colony.Individual = Individual;

}.call(window));