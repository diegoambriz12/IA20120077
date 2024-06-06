var w = 500, h = 450;

var jugador, fondo, bala;

var cursors, menu;

var nnNetwork, nnEntrenamiento, nnOutput, datosEntrenamiento = [];

var autoMode = false, trainingComplete = false;

var autoModeButton;

var juego = new Phaser.Game(w, h, Phaser.CANVAS, '', { preload: preload, create: create, update: update, render: render });

function preload() {
  juego.load.image('fondo', 'assets/game/fondo.jpg');
  juego.load.spritesheet('mono', 'assets/sprites/altair.png', 32, 48);
  juego.load.image('menu', 'assets/game/menu.png');
  juego.load.image('bala', 'assets/sprites/purple_ball.png');
}

function create() {
  juego.physics.startSystem(Phaser.Physics.ARCADE);
  juego.physics.arcade.gravity.y = 0;
  juego.time.desiredFps = 30;

  fondo = juego.add.tileSprite(0, 0, w, h, 'fondo');
  jugador = juego.add.sprite(w / 2, h / 2, 'mono');
  juego.physics.enable(jugador);
  jugador.body.collideWorldBounds = true;
  jugador.animations.add('corre', [8, 9, 10, 11]);
  jugador.animations.play('corre', 10, true);

  bala = juego.add.sprite(0, 0, 'bala');
  juego.physics.enable(bala);
  bala.body.collideWorldBounds = true;
  bala.body.bounce.set(1);
  setRandomBalaVelocity();

  pausaL = juego.add.text(w - 100, 20, 'Pausa', { font: '20px Arial', fill: '#fff', });
  pausaL.inputEnabled = true;
  pausaL.events.onInputUp.add(pausa, self);
  juego.input.onDown.add(mPausa, self);

  cursors = juego.input.keyboard.createCursorKeys();

  nnNetwork = new synaptic.Architect.Perceptron(5, 10, 4);

  nnEntrenamiento = new synaptic.Trainer(nnNetwork);

  autoModeButton = juego.add.text(w / 2, h / 2 + 100, 'Enter Auto Mode', { font: '32px Arial', fill: '#fff', });

  autoModeButton.anchor.setTo(0.5);
  autoModeButton.inputEnabled = true;
  autoModeButton.visible = false;
  autoModeButton.events.onInputUp.add(enterAutoMode, self);
}

function setRandomBalaVelocity() {
  var velocidad = 400; 

  var angle = juego.rnd.angle();
  bala.body.velocity.set(Math.cos(angle) * velocidad, Math.sin(angle) * velocidad);
}

function update() {
  fondo.tilePosition.x -= 1;
  juego.physics.arcade.collide(bala, null, velocidadBala, null, this);

  var distanciaX = bala.x - jugador.x;
  var distanciaY = bala.y - jugador.y;
  var distancia = Math.sqrt(distanciaX * distanciaX + distanciaY * distanciaY);

  if (!autoMode) {
    jugador.body.velocity.x = 0;
    jugador.body.velocity.y = 0;

    var moveLeft = cursors.left.isDown ? 1 : 0;
    var moveRight = cursors.right.isDown ? 1 : 0;
    var moveUp = cursors.up.isDown ? 1 : 0;
    var moveDown = cursors.down.isDown ? 1 : 0;

    if (moveLeft) jugador.body.velocity.x = -300; 
    if (moveRight) jugador.body.velocity.x = 300; 
    if (moveUp) jugador.body.velocity.y = -300; 
    if (moveDown) jugador.body.velocity.y = 300; 

    if (!trainingComplete) {
      datosEntrenamiento.push({
        'input': [distanciaX, distanciaY, distancia, jugador.x, jugador.y],
        'output': [moveLeft, moveRight, moveUp, moveDown]
    });
      console.log("Datos de entrenamiento añadidos:", datosEntrenamiento[datosEntrenamiento.length - 1]);
    }
  } else {
    var input = [distanciaX, distanciaY, distancia, jugador.x, jugador.y];
    nnOutput = nnNetwork.activate(input);

    var moveLeft = nnOutput[0] > 0.5 ? 1 : 0;
    var moveRight = nnOutput[1] > 0.5 ? 1 : 0;
    var moveUp = nnOutput[2] > 0.5 ? 1 : 0;
    var moveDown = nnOutput[3] > 0.5 ? 1 : 0;

    jugador.body.velocity.x = (moveRight - moveLeft) * 300; 
    jugador.body.velocity.y = (moveDown - moveUp) * 300; 
  }



  juego.physics.arcade.collide(bala, jugador, colisionH, null, this);
}

function velocidadBala(bala) {
  var angle = juego.rnd.angle();
  var speed = bala.body.velocity.getMagnitude();
  bala.body.velocity.set(Math.cos(angle) * speed, Math.sin(angle) * speed);
}

function enRedNeural() {
  console.log("Entrenando red neuronal con", datosEntrenamiento.length, "datos...");
  if (datosEntrenamiento.length > 1) {
      nnEntrenamiento.train(datosEntrenamiento, { rate: 0.0003, iterations: 10000, shuffle: true });
      console.log("Entrenamiento completado.");
  } else {
      console.log("No hay datos suficientes para entrenar.");
  }
}

function colisionH() {
  if (!trainingComplete) {
    enRedNeural();
    trainingComplete = true;
  }
  pausa();
}

function resetGame() {
  jugador.x = w / 2;
  jugador.y = h / 2;
  jugador.body.velocity.x = 0;
  jugador.body.velocity.y = 0;

  bala.x = 0;
  bala.y = 0;
  setRandomBalaVelocity();
}

function pausa() {
  juego.paused = true;
  menu = juego.add.sprite(w / 2, h / 2, 'menu');
  menu.anchor.setTo(0.5, 0.5);
}

function mPausa(event) {
  if (juego.paused) {
    var menu_x1 = w / 2 - 270 / 2, menu_x2 = w / 2 + 270 / 2;
    var menu_y1 = h / 2 - 180 / 2, menu_y2 = h / 2 + 180 / 2;
    var mouse_x = event.x,  mouse_y = event.y;

    if (mouse_x > menu_x1 && mouse_x < menu_x2 && mouse_y > menu_y1 && mouse_y < menu_y2) {
      if (mouse_x >= menu_x1 && mouse_x <= menu_x2 && mouse_y >= menu_y1 &&mouse_y <= menu_y1 + 90) {
        autoMode = false;
        datosEntrenamiento = [];
        autoModeButton.visible = false;
        resetGame();
      } else if (mouse_x >= menu_x1 && mouse_x <= menu_x2 && mouse_y >= menu_y1 + 90 && mouse_y <= menu_y2) {
        enRedNeural();
        autoMode = true;
        resetGame();
      }
      menu.destroy();
      juego.paused = false;
    }
  }
}

function enterAutoMode() {
  autoMode = true;
  autoModeButton.visible = false;
  resetGame();
  juego.paused = false;
}

function render() {}