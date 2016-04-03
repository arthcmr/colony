//Page controls

let config = new Config((options) => {
  start();
});

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