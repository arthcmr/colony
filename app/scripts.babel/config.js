/*!
 * INITIAL CONFIG
 */

let Config = function(cb) {

  //GENERAL
  this.population = 5;
  this.food = 200;

  //INDIVIDUAL
  this.ind_minSize = 10;
  this.ind_maxSize = 25;
  this.ind_energy = 0.5;
  this.ind_sight = 50;
  this.ind_sightColor = '#cccccc';
  this.ind_sightOpacity = 0.3;
  this.ind_opacity = 0.7;
  this.ind_color = '#0066cc';
  this.ind_flagellum = 2;
  this.ind_strength = 0.25;
  this.ind_force = 0.05; //default speed
  this.ind_maxAge = 0.1;
  this.ind_memorySize = 3;
  this.ind_fecundity = 0.1;
  this.ind_mutation = 0.01;

  //ENERGY STEP
  this.energy_step = 0.0001;
  this.energy_full = 0.99;
  this.energy_hungry = 0.5;
  this.energy_starving = 0.2;
  this.energy_dead = 0.001;

  //AGE
  this.age_step = 0.0002;
  this.age_old = 0.9;


  //FOOD
  this.food_energy = 0.1;
  this.food_color = '#f6e6aa';
  this.food_stroke = '#e9ddad';
  this.food_clusters = 0;

  this.RESTART = () => cb ? cb(this) : null;
};