/*!
 * COLONY COLLECTION
 */

(function(){

  let Colony = this.Colony;

  class Collection {
    constructor(options, colony) {
      Object.assign(this, options);
      this.colony = colony;
      this.collection = {};
      this.keys = [];
      this.max_id = 0;
    }

    draw() {
      this.each((item, key) => {
        item.draw();
      });
    }

    update() {
      this.each((item, key) => {
        item.update();
      });
    }

    add(item) {
      let index = this.max_id;
      this.collection[index] = item;
      this.keys = Object.keys(this.collection);
      this.max_id++;
      return index;
    }

    get(index) {
      if(typeof index === 'undefined') return this.collection;
      return this.collection[index];
    }

    remove(index) {
      this.collection[index].remove();
      delete this.collection[index];
      this.keys = Object.keys(this.collection);
    }

    exists(index) {
      return this.keys.includes(index);
    }

    each(cb) {
      if(typeof cb !== 'function') return;
      for (let i = 0; i < this.keys.length; i++) {
        let key = this.keys[i];
        let item = this.collection[key];
        cb(item, key);
      };
    }
  }

  Colony.Collection = Collection;

}.call(window));