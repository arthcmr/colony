/*!
 * COLONY
 */

(function(){

  /** Class representing a colony */
  class Colony {
    constructor(scene, config) {
      Object.assign(this, { scene, config });
      this.objects = {
        // population: [],
        meals: new Colony.Meals({}, this)
      };

      this.draw();
      this.update();
      scene.update();
    }

    /*
     * draw function to render items
     */
    draw() {
      for(let group in this.objects) {
        this.objects[group].draw();
      }
    }

    /*
     * update function to move items
     */
    update() {
      for(let group in this.objects) {
        this.objects[group].update();
      }
    }

    /*
     * play function to be called every frame
     * @param options
     */
    play(options) {
      let {before, after} = options;
      this.scene.bind('update', () => {
        if(before) before();
        this.update();
        if(after) after();
      }).play();
    }
  }

  this.Colony = Colony;

 }.call(window));