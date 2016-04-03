/*!
 * INITIAL CONFIG
 */

let Config = function(cb) {
  this.population = 5;
  this.food = 100;
  this.ind_size = 5;
  this.ind_sight = 5;
  this.ind_color = '#199fd7';
  this.ind_flagellum = 2;
  this.RESTART = () => cb ? cb(this) : null;
};