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
      this.energy = this.initEnergy + ((Math.random() * 2 - 1) * this.initEnergy / 4); //small letiation of approximately +/-12.5%
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
      let separationSight = (this.sight) * (this.sight);
      let separationBody = (this.currRadius * 3) * (this.currRadius * 3);
      let separation = utils.pointMultiply(this.separate(population, separationBody), 2);

      //check if individual should reproduce or share information
      this.checkSharing(population, separationSight);

      //check if individual should eat
      this.checkEating(meals, separationSight);

      /*
       * behavior when individual is reproducing: overlap mate and cruise together
       */

      //  this.avoid(individuals, separation, new paper.Point(600,400));
      if(this.reproducing && typeof this.mate === 'number') {

        //if individual still exists
        if(population[this.mate]) {
          //can overlap
          this.goTo(separation, population[this.mate].position, true);
          this.endReproduction(population);
        }
        else {
          this.interruptReproduction();
          this.flock(population, separation);
        }
      }

      /*
       * behavior when individual is staving: pursue food if they remember or look desperately for food at random
       */

      else if(this.isVeryHungry()) {

        /* if theres no memory, look desperately for a new place to go */
        if(this.memory.length < 1) {
          if(typeof this.meal === 'undefined' || utils.pointDistance(this.position, this.meal) < separationSight) {
            this.meal = Colony.Utils.getRandomPoint(this.colony.scene);
            this.wandering = true;
          }
        }
        else {
          /* if there is some memory and no memory has been picked, pick the closest */
          /* if a point has been picked at random and individual is wandering, pick the memory point */
          if(typeof this.meal === 'undefined' || this.wandering === true) {
            this.meal = this.memory[0];
            this.wandering = false;
          }
        }
        /* pursue the target */
        this.goTo(separation, this.meal);
      }

      /*
       * behavior when individual is hungry, but not staving: pursue food if they remember where they were
       */

      else if(this.isHungry()) {

        /* if there is some memory, pick the first memory and go */
        if(this.memory.length > 0) {
          if(typeof this.meal === 'undefined') {
            this.meal = this.memory[0];
          }
          this.goTo(separation, this.meal);
        }
        /* if there is no memory, flock with other individuals */
        else {
          this.flock(population, separation);
        }
      }

      /*
       * behavior when individual is not hungry: flock
       */

      else if(!this.isFull() && this.memory.length > 0) {
        //if individual is not full and is able to see a meal, eat it
        let meal_point = this.memory[0];
        if(utils.pointDistance(this.position, meal_point) < separationSight) {
          if(typeof this.meal === 'undefined') {
            this.meal = meal_point;
          }
          this.goTo(separation, this.meal);
        }
        else {
          this.meal = undefined;
          this.flock(population, separation);
        }
      }

      else {
        this.flock(population, separation);
      }

      this.borders();
      this.move();
      // this.calculateTail();
      this.updateItems();

    }

    // We accumulate a new acceleration each time based on three rules
    flock(individuals, separation) {
      let alignment = this.align(individuals);
      let cohesion = this.cohesion(individuals);
      this.acceleration = utils.pointAdd(this.acceleration, separation);
      this.acceleration = utils.pointAdd(this.acceleration, alignment);
      this.acceleration = utils.pointAdd(this.acceleration, cohesion);
    }

    borders() {
      let vector = [0,0];
      let [x, y] = this.position;
      let radius = this.currRadius;
      let {width, height} = this.colony.scene;
      if(x < -radius) vector[0] = width + radius;
      if(y < -radius) vector[1] = height + radius;
      if(x > width + radius) vector[0] = -1 * width - radius;
      if(y > height + radius) vector[1] = -1 * height - radius;
      if(vector[0] !== 0 || vector[1] !== 0) {
        this.position = utils.pointAdd(this.position, vector);
        let points = this.tailPoints;
        for (let i = 0, l = points.length; i < l; i++) {
          points[i] = utils.pointAdd(points[i], vector);
        }
      }
    }

    move() {
      // Update velocity
      this.vector = utils.pointAdd(this.vector, this.acceleration);
      // Limit speed (vector#limit?)
      this.vector = utils.pointSetLength(this.vector, Math.min(this.maxSpeed, utils.pointLength(this.vector)))
      this.setPosition(utils.pointAdd(this.position, this.vector));
      // Reset acceleration to 0 each cycle
      this.acceleration = [0,0];
    }

    goTo(separation, target, overlap = false) {
      this.acceleration = utils.pointAdd(this.acceleration, this.steer(target, true));
      if(!overlap) {
        this.acceleration = utils.pointAdd(this.acceleration, separation);
      }
    }

    // Alignment
    // For every nearby individual in the system, calculate the average velocity
    align(individuals) {
      let neighborDist = 25;
      let steer = [0,0];
      let count = 0;

      utils.forEach(this.distances, (d) => {
        let distance = d.value;
        let ind = d.key;
        let individual = d.item;
        if (distance > 0 && distance < neighborDist) {
          steer = utils.pointAdd(steer, individual.vector);
          count++;
        }
      });
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

    // Cohesion
    // For the average location (i.e. center) of all nearby individuals,
    // calculate steering vector towards that location
    cohesion(individuals) {
      let neighborDist = 10000;
      let sum = [0,0];
      let count = 0;
      utils.forEach(this.distances, (d) => {
        let distance = d.value;
        let ind = d.key;
        let individual = d.item;
        if (distance > 0 && distance < neighborDist) {
          //make sure they are not attracted to the ones already reproducing
          //reproducing ones are not part of the flock
          if(!individual.reproducing) {
            sum = utils.pointAdd(sum, individual.position); // Add location
            count++;
          }
        }
      });
      if (count > 0) {
        sum = utils.pointDivide(sum,count);
        // Steer towards the location
        return this.steer(sum, false);
      }
      return sum;
    }

    // A method that calculates a steering vector towards a target
    // Takes a second argument, if true, it slows down as it approaches
    // the target
    steer(target, slowdown) {
      let steer, desired = utils.pointSubtract(target, this.position);
      let distance = utils.pointLength(desired);
      if (slowdown && distance < 100) {
        //somewhat arbitrary:
        desired = utils.pointSetLength(desired, this.maxSpeed * 0.1);
      } else if(slowdown) {
        desired = utils.pointSetLength(desired, this.maxSpeed * distance * 0.001);
      } else {
        desired = utils.pointSetLength(desired, this.maxSpeed);
      }
      steer = utils.pointSubtract(desired, this.vector);
      steer = utils.pointSetLength(steer, Math.min(this.maxForce, utils.pointLength(steer)));
      return steer;
    }

    updateItems() {
      this._setItemColor();
      // this._setItemFlagellum();
      this._setItemPosition();
    }

    die() {
      this.alive = false;
    }

    separate(collection, desiredSeparation) {
      let steer = [0,0];
      let count = 0;
      // For every individual in the system, check if it's too close
      utils.forEach(this.distances, (d) => {
        let distance = d.value;
        let ind = d.key;
        let item = d.item;
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

    mergeMemory(memory) {
      this.memory = [].concat(this.memory, memory);
      this.memory = this.memory.slice(0, this.memorySize);
    }

    insertMemory(point) {
      //dont insert if its already there
      let found = false;
      utils.forEach(this.memory, (i) => {
        if(i[0] === point[0] && i[1] === point[1]) {
          found = true;
          return false;
        }
      });
      if(found) return;
      //insert point in the beginning of array
      this.memory.unshift(point);
      //make sure only the correct amount is in memory
      this.memory = this.memory.slice(0, this.memory_size);
    }

    removeFromMemory(point) {
      let new_memory = [];
      utils.forEach(this.memory, (i) => {
        if(i[0] !== point[0] || i[1] !== point[1]) new_memory.push(i);
      });
      this.memory = new_memory;
    }

    checkSharing(population, desiredSeparation) {
      // For every individual in the system, check if it's too close
      utils.forEach(this.distances, (d) => {
        let distance = d.value;
        let ind = d.key;
        let individual = d.item;
        //if reference is to the same object
        if (this !== individual && distance < desiredSeparation) {
          //probability of reproducing
          if(!this.isHungry() && Math.random() < this.fecundity) {
            this.startReproduction(individual, ind);
          }
          //if this is hungry and individual is not
          else if(this.isHungry() && !individual.isHungry()) {
            this.mergeMemory(individual.memory);
          }
        }
      });
    }

    isVeryHungry() {
      return (this.hungry > 2);
    }

    isHungry() {
      return (this.hungry > 1);
    }

    isFull() {
      return (this.hungry === 0);
    }

    startReproduction(individual, index) {
      if(this.reproducing === true
        || individual.reproducing === true
        || this.isHungry()
        || individual.isHungry()) {
        return;
      }

      this.reproducing = true;
      this.mate = index;
      this.energyReproduction = this.energy;

      individual.reproducing = true;
      individual.mate = this.index;
      individual.energyReproduction = individual.energy;

      this.acceleration = utils.pointMultiply(individual.acceleration, -1);
    }

    endReproduction(population) {
      //cant end what hasnt even started
      if(this.reproducing === false || typeof this.mate !== 'number') {
        return;
      }

      let individual = population[this.mate];

      //check if enough energy is available
      let min_energy = Math.min(this.initEnergy, individual.initEnergy) / 10;
      let combined_energy = (this.energyReproduction - this.energy) +
         (individual.energyReproduction - individual.energy);
      if(combined_energy < min_energy) {
        //not enough time
        return;
      }

      //reproduce
      this.reproduce(individual, min_energy);

      //separate them
      individual.reproducing = false;
      this.reproducing = false;

      this.acceleration = utils.pointMultiply(individual.acceleration, -1);

      individual.mate = null;
      this.mate = null;
    }

    interruptReproduction() {
      this.reproducing = false;
      this.mate = null
    }

    reproduce(individual, min_energy) {
      let new_individual_properties = this.dnaMutation(this.dnaCrossover(individual));
      //set position to current position
      new_individual_properties.position = [].concat(this.position);
      //create individual
      let new_individual = this.colony.objects.population.createIndividual(new_individual_properties);
      new_individual.draw();
      //update positions and sizes
      new_individual.updateItems();
    }

    dnaCrossover(individual) {

      //all properties that must be crossed over
      let dna_properties = [
        'flagellum',
        'color',
        'maxSize',
        'minSize',
        'strength',
        'maxAge',
        'sight',
        'memorySize',
        'initEnergy',
        'fecundity',
        'force',
        ];

      let new_properties = {};
      utils.forEach(dna_properties, property => {
        //if both are defined, sort
        let value;
        if(typeof this[property] !== 'undefined' && typeof individual[property] !== 'undefined') {
          if(Math.random() < 0.5) {
            value = this[property];
          } else {
            value = individual[property];
          }
        }
        else {
          value = this[property] || individual[property];
        }
        //if its defined, add it
        if(typeof value !== undefined) {
          new_properties[property] = value;
        }
      });
      return new_properties;

    }

    dnaMutation(properties) {
      //mutate each property
      let new_properties = {}

      // let dna_properties = [
      //   'flagellum', 'flagellum', 'flagellum', 'flagellum', 'flagellum',
      //   'color', 'color', 'color', 'color', 'color', 'color',
      //   'maxSize', 'maxSize', 'maxSize', 'maxSize',
      //   'strength', 'strength',
      //   'maxAge', 'maxAge',
      //   'sight', 'sight',
      //   'memorySize',
      //   'initEnergy',
      //   'fecundity',
      //   'force',
      //   ];

      utils.forEach(properties, (value, property) => {
        let sort = Math.random();
        let new_value;
        //only change if mutation condition is satisfied
        if(sort < this.mutation) {
          //if its a color
          if(typeof value === 'string') {
            let hex = value.substring(1,7); //get color
            let number_hex = parseInt(hex, 16); //get corresponding int
            let x = number_hex * Math.round(Math.random() * 100000 + 1) / Math.round(Math.random() * 100000 + 1);
            new_value = ((x >= 0 ? x : -x) + 0.5) >> 0;
            new_value = new_value.toString(16); //get new hex
            new_value = '#' + (('000000' + new_value).slice(-6));
          }
          //if its a number
          else if(typeof value === 'number') {

            let int_properties = [
              'maxSize',
              'minSize',
              'sight',
              'flagellum',
              'memorySize'
            ];

            new_value = value * Math.round(Math.random() * 5 + 1) / Math.round(Math.random() * 5 + 1);

            //if property must be an int
            if(int_properties.indexOf(property) !== -1) {
              new_value = ((new_value >= 0 ? new_value : -new_value) + 0.5) >> 0;
            }

          }
          //if its a boolean
          else if(typeof value === 'boolean') {
            new_value = !value;
          }

        } else {
          new_value = value;
        }
        new_properties[property] = new_value;
      });

      return new_properties;
    }

    checkEating(meals, desiredSeparation) {
      let map_memory = this.memory.map((point) => {
        return {
          point,
          distance: utils.pointDistance(this.position, point)
        };
      }).sort((a, b) => (a.distance < b.distance) ? -1 : 1);

      this.memory = map_memory.map(p => p.point);

      // memory visible
      let memory_visible = map_memory.filter(p => p.distance < desiredSeparation);

      //remove visible points without a meal
      utils.forEach(memory_visible, (p) => {
        let search = this.distancesMeals.find(d => d.value === p.distance);
        if(typeof search === 'undefined') this.removeFromMemory(p.point);
      });

      //remove visible meal
      if(this.meal) {
        let distance = utils.pointDistance(this.position, this.meal);
        if(distance < desiredSeparation) {
          let search = this.distancesMeals.find(d => d.value === distance);
          if(typeof search === 'undefined') {
            if(this.memory.length > 0) {
              this.meal = this.memory[0];
            } else {
              this.meal = undefined;
            }
          }
        }
      }

      // For every individual meal in the system, check if it's too close
      utils.forEach(this.distancesMeals, (d) => {
        let distance = d.value;
        let ind = d.key;
        let meal = d.item;
        //if reference is to the same object
        if (distance < desiredSeparation) {
          this.insertMemory(meal.position);
          if(!this.isFull() && distance < this.currRadius) {
            this.eat(meal, ind);
          }
        }
      });

    }

    eat(meal, ind) {
      if(this.colony.objects.meals.get(ind) === meal) {
        let energy = meal.energy;
        let position = meal.position;
        this.colony.objects.meals.remove(ind);
        this.energy += energy;
        this.removeFromMemory(position);
        this.meal = undefined;
      } else {
        return;
      }
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

    _setItemColor() {
      let color;
      if(!this.colorDark) {
        color = this.color;
        this.colorDark = utils.shadeColor(this.color, -0.1);
        this.colorDarker = utils.shadeColor(this.color, -0.2);
      }
      switch(this.hungry) {
        case 3:
          color = this.colorDarker;
          break;
        case 2:
          color = this.colorDark;
          break;
        case 0:
        case 1:
        default:
          color = this.color;
          break;
      }

      this.symbol_body.fill = color;
    }

    _setItemPosition() {
      let [x,y] = this.position;
      this.symbol.translation.set(x,y);
    }

  }

  Colony.Individual = Individual;

}.call(window));