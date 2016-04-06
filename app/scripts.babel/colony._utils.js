/*!
 * COLONY UTILS
 */

(function(){

  let Colony = this.Colony;

  let Utils = {
    getRandomPoint: (scene, area) => {
      let { width, height } = scene;
      return [Math.round(Math.random() * width), Math.round(Math.random() * height)];
    },
    shadeColor: function(color, percent) {   
      let num = parseInt(color.slice(1),16),
        x = 255 * percent,
        amt = ((x >= 0 ? x : -x) + 0.5) >> 0,
        R = (num >> 16) + amt,
        G = (num >> 8 & 0x00FF) + amt,
        B = (num & 0x0000FF) + amt;
      return '#' + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
    },
    forEach: function(obj, callback, ctx) {
      if(!obj) {
        return;
      }
      let i, size;
      if(Array.isArray(obj)) {
        size = obj.length;
        for(i = 0; i < size; i += 1) {
          if(callback.apply(ctx, [
              obj[i],
              i
            ]) === false) {
            break;
          }
        }
      } else {
        var keys = Object.keys(obj);
        size = keys.length;
        for(i = 0; i < size; i += 1) {
          if(callback.apply(ctx, [
              obj[keys[i]],
              keys[i]
            ]) === false) {
            break;
          }
        }
      }
    },
    pointAdd: function(p1, p2) {
      return [p1[0] + p2[0], p1[1] + p2[1]];
    },
    pointSubtract: function(p1, p2) {
      return [p1[0] - p2[0], p1[1] - p2[1]];
    },
    pointSubtract: function(p1, p2) {
      return [p1[0] - p2[0], p1[1] - p2[1]];
    },
    pointDistance: function(p1,p2) {
      return Math.sqrt((p1[0]-p2[0])*(p1[0]-p2[0]) + (p1[1]-p2[1])*(p1[1]-p2[1]));
    },
    pointLength: function(p) {
      return Math.sqrt(p[0]*p[0] + p[1]*p[1]);
    },
    pointMultiply: function(p, m) {
      return [p[0] * m, p[1] * m];
    },
    pointDivide: function(p, m) {
      return [p[0] / m, p[1] / m];
    },
    pointSetLength: function(p, length) {
      let vector = this.pointDivide(p, this.pointLength(p));
      return this.pointMultiply(vector, length);
    }
  }

  Colony.Utils = Utils;

}.call(window));