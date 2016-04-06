/*!
 * INITIAL CONFIG
 */

var Config = function Config(cb) {
  var _this = this;

  //GENERAL
  this.population = 0;
  this.food = 0;

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

  this.START = function () {
    return cb ? cb(_this) : null;
  };
};

//Page controls
function initControls(config) {
  var gui = new dat.GUI();

  var f0 = gui.addFolder('GENERAL');
  f0.add(config, 'population', 0, 100).step(1);
  f0.add(config, 'food', 0, 1000).step(1);

  f0.open();

  var f1 = gui.addFolder('INDIVIDUAL FEATURES');
  f1.add(config, 'ind_minSize', 1, 100).step(1);
  f1.add(config, 'ind_maxSize', 1, 100).step(1);
  f1.add(config, 'ind_energy', 0, 1).step(0.01);
  f1.add(config, 'ind_sight', 1, 200).step(1);
  f1.add(config, 'ind_flagellum', 1, 7).step(1);
  f1.add(config, 'ind_strength', 0, 1).step(0.01);
  f1.add(config, 'ind_force', 0, 0.1).step(0.01);
  f1.add(config, 'ind_maxAge', 0, 1).step(0.01);
  f1.add(config, 'ind_memorySize', 0, 10).step(1);
  f1.add(config, 'ind_fecundity', 0, 1).step(0.01);
  f1.add(config, 'ind_mutation', 0, 1).step(0.01);
  f1.addColor(config, 'ind_color');

  f1.open();

  var f2 = gui.addFolder('FOOD');
  f2.add(config, 'food_energy', 0.01, 1).step(0.01);
  // f2.add(config, 'food_clusters', 0, 4).step(1);

  f2.open();

  gui.add(config, 'START');
}