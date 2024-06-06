var juego = new Phaser.Game(500, 450, Phaser.CANVAS, '', {
    preload: preload,
    create: create,
    update: update
  });

  var personaje, esfera;
  var teclas = {};
  var redNeuronal, datosEntrenamiento = [];
  var entrenamientoCompleto = false;
  var modoAutomático = false;
  var textoModo, botonReiniciar;

  function preload() {
    juego.load.image('fondo', 'assets/game/fondo.jpg');
    juego.load.spritesheet('personaje', 'assets/sprites/altair.png', 32, 48);
    juego.load.image('esfera', 'assets/sprites/purple_ball.png');
    juego.load.image('boton', 'assets/sprites/altair2.png');
  }

  function create() {
    juego.add.tileSprite(0, 0, 500, 450, 'fondo');
    
    personaje = juego.add.sprite(juego.world.centerX, juego.world.centerY, 'personaje');
    juego.physics.arcade.enable(personaje);
    personaje.body.collideWorldBounds = true;
    
    esfera = juego.add.sprite(juego.world.randomX, juego.world.randomY, 'esfera');
    juego.physics.arcade.enable(esfera);
    esfera.body.collideWorldBounds = true;
    esfera.body.bounce.set(1);
    esfera.body.velocity.set(200, 200);
    
    teclas.W = juego.input.keyboard.addKey(Phaser.Keyboard.W);
    teclas.A = juego.input.keyboard.addKey(Phaser.Keyboard.A);
    teclas.S = juego.input.keyboard.addKey(Phaser.Keyboard.S);
    teclas.D = juego.input.keyboard.addKey(Phaser.Keyboard.D);
    juego.input.keyboard.addKeyCapture([Phaser.Keyboard.W, Phaser.Keyboard.A, Phaser.Keyboard.S, Phaser.Keyboard.D, Phaser.Keyboard.SPACEBAR]);
    
    textoModo = juego.add.text(16, 16, 'Modo: Manual', { fontSize: '16px', fill: '#ff69b4' });
    botonReiniciar = juego.add.button(juego.world.width - 100, 16, 'boton', reiniciarJuego, this, 2, 1, 0);
    
    redNeuronal = new synaptic.Architect.Perceptron(4, 10, 2);
  }

  function update() {
    if (!modoAutomático) {
      personaje.body.velocity.x = 0;
      personaje.body.velocity.y = 0;

      if (teclas.A.isDown) {
        personaje.body.velocity.x = -300;
      } else if (teclas.D.isDown) {
        personaje.body.velocity.x = 300;
      }
      
      if (teclas.W.isDown) {
        personaje.body.velocity.y = -300;
      } else if (teclas.S.isDown) {
        personaje.body.velocity.y = 300;
      }
    }

    if (juego.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
      modoAutomático = !modoAutomático;
      textoModo.text = 'Modo: ' + (modoAutomático ? 'Automático' : 'Manual');
      if (modoAutomático) {
        console.log('Modo automático activado');
        if (!entrenamientoCompleto) {
          entrenarRedNeuronal();
        }
      } else {
        console.log('Modo manual activado');
      }
    }

    if (modoAutomático && entrenamientoCompleto) {
      var salidaRed = redNeuronal.activate(obtenerEntradas());
      var velocidadX = (salidaRed[0] * 2 - 1) * 300;
      var velocidadY = (salidaRed[1] * 2 - 1) * 300;
      velocidadX = Phaser.Math.clamp(velocidadX, -300, 300);
      velocidadY = Phaser.Math.clamp(velocidadY, -300, 300);
      personaje.body.velocity.x = velocidadX;
      personaje.body.velocity.y = velocidadY;
    } else {
      registrarMovimiento();
    }
    
    juego.physics.arcade.collide(personaje, esfera, finJuego, null, this);
  }

  function obtenerEntradas() {
    return [
      personaje.x / juego.width,
      personaje.y / juego.height,
      esfera.x / juego.width,
      esfera.y / juego.height
    ];
  }

  function registrarMovimiento() {
    var entrada = obtenerEntradas();
    var salida = [0.5, 0.5];

    if (teclas.A.isDown) {
      salida[0] = 0;
    } else if (teclas.D.isDown) {
      salida[0] = 1;
    }
    
    if (teclas.W.isDown) {
      salida[1] = 0;
    } else if (teclas.S.isDown) {
      salida[1] = 1;
    }

    datosEntrenamiento.push({ input: entrada, output: salida });
  }

  function finJuego() {
    juego.paused = true;
    textoModo.text = 'Fin del juego - Modo: ' + (modoAutomático ? 'Automático' : 'Manual');
    setTimeout(reiniciarJuego, 3000); // Reiniciar el juego después de 3 segundos
  }

  function reiniciarJuego() {
    juego.paused = false;
    personaje.x = juego.world.centerX;
    personaje.y = juego.world.centerY;
    personaje.body.velocity.x = 0;
    personaje.body.velocity.y = 0;
    
    esfera.x = juego.world.randomX;
    esfera.y = juego.world.randomY;
    esfera.body.velocity.set(200, 200);
    
    datosEntrenamiento = [];
    entrenamientoCompleto = false;
    modoAutomático = false;
    textoModo.text = 'Modo: Manual';
    
    console.log('Juego reiniciado');
  }

  function entrenarRedNeuronal() {
    if (datosEntrenamiento.length > 0) {
      var entrenador = new synaptic.Trainer(redNeuronal);
      entrenador.train(datosEntrenamiento, {
        rate: 0.3,
        iterations: 10000,
        error: 0.005,
        shuffle: true,
        log: 1000,
        cost: synaptic.Trainer.cost.CROSS_ENTROPY
      });
      entrenamientoCompleto = true;
      console.log('Entrenamiento completo');
    } else {
      console.log('No hay datos de entrenamiento disponibles');
    }
  }