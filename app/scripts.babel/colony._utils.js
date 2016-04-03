/*!
 * COLONY UTILS
 */

(function(){

  let Colony = this.Colony;

  let Utils = {
    getRandomPoint: (scene, area) => {
      let { width, height } = scene;
      return [Math.round(Math.random() * width), Math.round(Math.random() * height)];
    }
  }

  Colony.Utils = Utils;

}.call(window));