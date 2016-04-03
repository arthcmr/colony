//CONTROLS

let config = new Config(start);

//Page controls
function initControls () {
  let gui = new dat.GUI();

  let f0 = gui.addFolder('GENERAL');
  f0.add(config, 'population', 0, 100).step(1);
  f0.add(config, 'food', 0, 200).step(1);

  f0.open();

  let f1 = gui.addFolder('INDIVIDUAL FEATURES');
  f1.add(config, 'ind_size', 1, 100).step(1);
  f1.add(config, 'ind_sight', 1, 100).step(1);
  f1.addColor(config, 'ind_color');
  f1.add(config, 'ind_flagellum', 1, 7).step(1);

  gui.add(config, 'RESTART');
}

//Page stats
function initStats () {
  let curr_stats = document.getElementById('stats');

  if(curr_stats) {
    curr_stats.remove();
  }

  let stats = new Stats();
  stats.setMode(0); // 0: fps, 1: ms, 2: mb

  // align top-left
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';

  document.body.appendChild( stats.domElement );
  return stats;
}