var w = 500, h = 450;
var jugador, fondo, bala;

var cursors, menu;

var datosEntrenamiento = [];
var nnNetwork, nnEntrenamiento;

var modoAuto = false;
var eCompleto = false;

var autoMode = false;
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
  var corre = jugador.animations.add('corre', [8, 9, 10, 11]);
  jugador.animations.play('corre', 10, true);

  bala = juego.add.sprite(0, 0, 'bala');
  juego.physics.enable(bala);
  bala.body.collideWorldBounds = true;
  bala.body.bounce.set(1);
  setRandomBalaVelocity();

  pausaL = juego.add.text(w - 100, 20, 'Pausa', { font: '20px Arial', fill: '#fff' });
  pausaL.inputEnabled = true;
  pausaL.events.onInputUp.add(pausa, self);
  juego.input.onDown.add(mPausa, self);

  // Movimiento
  cursors = juego.input.keyboard.createCursorKeys();

  nnNetwork = new synaptic.Architect.Perceptron(3, 10, 10, 2);
  nnEntrenamiento = new synaptic.Trainer(nnNetwork);
}

function redNeuronal() {
  if (datosEntrenamiento.length > 0) {
    nnEntrenamiento.train(datosEntrenamiento, {
      rate: 0.01,
      iterations: 20000,
      error: 0.01,
      shuffle: true,
      log: 1000,
      cost: synaptic.Trainer.cost.CROSS_ENTROPY
    });
  }
}

function pausa() {
  juego.paused = true; // Pausar el juego
  menu = juego.add.sprite(w / 2, h / 2, 'menu');
  menu.anchor.setTo(0.5, 0.5);
}

function mPausa(event) {
  if (juego.paused) {
    var menu_x1 = w / 2 - 270 / 2, menu_x2 = w / 2 + 270 / 2, menu_y1 = h / 2 - 180 / 2, menu_y2 = h / 2 + 180 / 2;

    var mouse_x = event.x, mouse_y = event.y;

    if (mouse_x > menu_x1 && mouse_x < menu_x2 && mouse_y > menu_y1 && mouse_y < menu_y2) {
      // Modo manual
      if (mouse_y < menu_y1 + 90) {
        eCompleto = false;
        datosEntrenamiento = [];
        modoAuto = false;
        autoMode = false;
      } else {
        if (!eCompleto) {
          console.log('Datos de entrenamiento son: ' + datosEntrenamiento.length + ' valores');
          redNeuronal();
          eCompleto = true;
        }
        modoAuto = true;
        autoMode = true;
      }
      menu.destroy();
      resetGame(); // Resetear el juego
      juego.paused = false;
    }
  }
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

function setRandomBalaVelocity() {
  var speed = 550;
  var angle = juego.rnd.angle();
  bala.body.velocity.set(Math.cos(angle) * speed, Math.sin(angle) * speed);
}

function update() {
  fondo.tilePosition.x -= 1;

  if (!autoMode) {
    // Resetear velocidad del jugador
    jugador.body.velocity.x = 0;
    jugador.body.velocity.y = 0;

    // Movimiento del jugador 
    if (cursors.left.isDown) {
      jugador.body.velocity.x = -300;
    } else if (cursors.right.isDown) {
      jugador.body.velocity.x = 300;
    }

    if (cursors.up.isDown) {
      jugador.body.velocity.y = -300;
    } else if (cursors.down.isDown) {
      jugador.body.velocity.y = 300;
    }
  }

  // Colisionar la bala con el jugador
  juego.physics.arcade.collide(bala, jugador, colisionH, null, this);

  // Calcular la distancia entre la bala y el jugador
  var dx = bala.x - jugador.x;
  var dy = bala.y - jugador.y;
  var distancia = Math.sqrt(dx * dx + dy * dy);

  if (autoMode) {
    var output = nnNetwork.activate([dx / w, dy / h, distancia / Math.sqrt(w * w + h * h)]);
    var moveX = output[0] * 2 - 1;
    var moveY = output[1] * 2 - 1;

    // Solo moverse si hay movimiento significativo
    if (Math.abs(moveX) > 0.1 || Math.abs(moveY) > 0.1) {
      jugador.body.velocity.x = moveX * 300;
      jugador.body.velocity.y = moveY * 300;
    } else {
      jugador.body.velocity.x = 0;
      jugador.body.velocity.y = 0;
    }
  } else if (bala.position.x > 0) {
    var statusMove = (jugador.body.velocity.x != 0 || jugador.body.velocity.y != 0) ? 1 : 0;

    if (statusMove) {
      datosEntrenamiento.push({
        'input': [dx / w, dy / h, distancia / Math.sqrt(w * w + h * h)],
        'output': [jugador.body.velocity.x / 300, jugador.body.velocity.y / 300]
      });
      console.log("Datos de entrenamiento añadidos:", datosEntrenamiento[datosEntrenamiento.length - 1]);
    }
  }
}

function colisionH() {
  autoMode = false; // Desactivar el modo automático tras la colisión
  pausa(); // Pausar el juego en caso de colisión
}

function render() {
  // Opcionalmente, renderizar el estado del juego o información adicional
}
