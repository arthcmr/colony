// MAIN FILE

// Make an instance of two and place it on the page.
let stage = document.getElementById('colony');
let params = {
  fullscreen: true,
  type: Two.Types.webgl
};

let scene = new Two(params).appendTo(stage);

initControls();

function start() {

  let stats = initStats();

  scene.clear();
  let colony = new Colony(scene, config);
  colony.play({
    before: stats.begin,
    after: stats.end
  });

}

start();