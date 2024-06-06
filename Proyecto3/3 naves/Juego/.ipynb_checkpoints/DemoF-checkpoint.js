var w = 700;
var h = 400;
var jugador;
var fondo;

var bala, balaD = false, nave;
var bala2, balaD2 = false, nave2;
var bala3, balaD3 = false, nave3;

var salto;
var der;
var izq;
var menu;

var velocidadBala;
var despBala;
var velocidadBala2;
var despBala2;
var velocidadBala3;
var despBalaHorizontal3;
var despBalaVertical3;
var despBala3;
var estatusAire;
var estatuSuelo;
var estatusDerecha;
var estatusIzquierda;

var nnNetwork, nnEntrenamiento, nnSalida, datosEntrenamiento = [];
var modoAuto = false, eCompleto = false;

var juego = new Phaser.Game(w, h, Phaser.CANVAS, '', {
    preload: preload,
    create: create,
    update: update,
    render: render
});

function preload() {
    console.log("Cargando assets...");
    juego.load.image('fondo', 'assets/game/fondo.jpg');
    juego.load.spritesheet('mono', 'assets/sprites/altair.png', 32, 48);
    juego.load.image('nave', 'assets/game/ufo.png');
    juego.load.image('bala', 'assets/sprites/purple_ball.png');
    juego.load.image('menu', 'assets/game/menu.png');
}

function create() {
    console.log("Iniciando juego...");
    juego.physics.startSystem(Phaser.Physics.ARCADE);
    juego.physics.arcade.gravity.y = 800;
    juego.time.desiredFps = 30;

    fondo = juego.add.tileSprite(0, 0, w, h, 'fondo');
    nave = juego.add.sprite(w - 100, h - 70, 'nave');
    bala = juego.add.sprite(w - 100, h, 'bala');
    nave2 = juego.add.sprite(0, 0, 'nave');
    bala2 = juego.add.sprite(50, 50, 'bala');
    nave3 = juego.add.sprite(600, 50, 'nave');
    bala3 = juego.add.sprite(600, 50, 'bala');
    jugador = juego.add.sprite(10, h, 'mono');

    juego.physics.enable(jugador);
    jugador.body.collideWorldBounds = true;
    var corre = jugador.animations.add('corre', [8, 9, 10, 11]);
    jugador.animations.play('corre', 10, true);

    juego.physics.enable(bala);
    bala.body.collideWorldBounds = true;
    juego.physics.enable(nave);
    nave.body.collideWorldBounds = true;
    juego.physics.enable(bala2);
    bala2.body.collideWorldBounds = true;
    juego.physics.enable(bala3);
    bala3.body.collideWorldBounds = true;

    pausaL = juego.add.text(w - 100, 20, 'Pausa', { font: '20px Arial', fill: '#fff' });
    pausaL.inputEnabled = true;
    pausaL.events.onInputUp.add(pausa, self);
    juego.input.onDown.add(mPausa, self);

    salto = juego.input.keyboard.addKey(Phaser.Keyboard.UP);
    der = juego.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
    izq = juego.input.keyboard.addKey(Phaser.Keyboard.LEFT);

    nnNetwork = new synaptic.Architect.Perceptron(6, 10, 10, 10, 5, 4);
    nnEntrenamiento = new synaptic.Trainer(nnNetwork);
}

function enRedNeural() {
    console.log("Entrenando red neuronal con", datosEntrenamiento.length, "datos...");
    if (datosEntrenamiento.length > 0) {
        nnEntrenamiento.train(datosEntrenamiento, { rate: 0.0003, iterations: 10000, shuffle: true });
        console.log("Entrenamiento completado.");
    } else {
        console.log("No hay datos suficientes para entrenar.");
    }
}

function datosDeEntrenamiento(param_entrada) {
    nnSalida = nnNetwork.activate(param_entrada);
    console.log("Datos de entrenamiento activados:", nnSalida);

    return nnSalida[2] >= nnSalida[3];
}

function EntrenamientoSalto(param_entrada) {
    nnSalida = nnNetwork.activate(param_entrada);
    console.log("Datos de salto activados:", nnSalida);

    return nnSalida[0] >= nnSalida[1];
}

function pausa() {
    console.log("Juego pausado.");
    juego.paused = true;
    menu = juego.add.sprite(w / 2, h / 2, 'menu');
    menu.anchor.setTo(0.5, 0.5);
}

function mPausa(event) {
    if (juego.paused) {
        var menu_x1 = w / 2 - 270 / 2, menu_x2 = w / 2 + 270 / 2,
            menu_y1 = h / 2 - 180 / 2, menu_y2 = h / 2 + 180 / 2;

        var mouse_x = event.x,
            mouse_y = event.y;

        if (mouse_x > menu_x1 && mouse_x < menu_x2 && mouse_y > menu_y1 && mouse_y < menu_y2) {
            if (mouse_x >= menu_x1 && mouse_x <= menu_x2 && mouse_y >= menu_y1 && mouse_y <= menu_y1 + 90) {
                eCompleto = false;
                datosEntrenamiento = [];
                modoAuto = false;
            } else if (mouse_x >= menu_x1 && mouse_x <= menu_x2 && mouse_y >= menu_y1 + 90 && mouse_y <= menu_y2) {
                if (!eCompleto) {
                    enRedNeural();
                    eCompleto = true;
                }
                modoAuto = true;
            }

            resetVariables();
            resetVariables2();
            resetVariables3();
            resetPlayer();
            juego.paused = false;
            menu.destroy();
        }
    }
}

function resetVariables() {
    console.log("Reseteando variables de bala.");
    bala.body.velocity.x = 0;
    bala.position.x = w - 100;
    balaD = false;
}

function resetVariables2() {
    console.log("Reseteando variables de bala2.");
    bala2.body.velocity.y = -270;
    bala2.position.y = h - 400;
    balaD2 = false;
}

function resetVariables3() {
    console.log("Reseteando variables de bala3.");
    bala3.body.velocity.y = -270;
    bala3.body.velocity.x = 0;
    bala3.position.x = w - 100;
    bala3.position.y = h - 500;
    balaD3 = false;
}

function resetPlayer() {
    console.log("Reseteando posición del jugador.");
    jugador.position.x = 50;
}

function saltar() {
    console.log("Jugador salta.");
    jugador.body.velocity.y = -270;
}

function correr() {
    console.log("Jugador corre.");
    jugador.body.velocity.x = 150;
    jugador.body.position.x = 100;
}

function correrIzq() {
    console.log("Jugador corre hacia atrás.");
    jugador.body.velocity.x = -150;
}

function Detenerse() {
    console.log("Jugador se detiene.");
    jugador.body.velocity.x = 0;
}

function update() {
    fondo.tilePosition.x -= 1;

    juego.physics.arcade.collide(nave, jugador, colisionH, null, this);
    juego.physics.arcade.collide(bala, jugador, colisionH, null, this);
    juego.physics.arcade.collide(bala2, jugador, colisionH, null, this);
    juego.physics.arcade.collide(bala3, jugador, colisionH, null, this);

    estatuSuelo = 1;
    estatusAire = 0;
    estatusDerecha = 0;
    estatusIzquierda = 1;

    if (!jugador.body.onFloor() || jugador.body.velocity.y !== 0) {
        estatuSuelo = 0;
        estatusAire = 1;
    }

    if (jugador.body.velocity.x >= 140) {
        estatusDerecha = 1;
        estatusIzquierda = 0;
    }

    despBala = Math.floor(jugador.position.x - bala.position.x);
    despBala2 = Math.floor(jugador.position.y - bala2.position.y);
    despBala3 = Math.floor(jugador.position.x - bala3.position.x);
    despBalaHorizontal3 = Math.floor(jugador.position.x - bala3.position.x);
    despBalaVertical3 = Math.floor(jugador.position.y - bala3.position.y);

    if (!modoAuto && salto.isDown && jugador.body.onFloor()) {
        saltar();
    }
    if (!modoAuto && der.isDown && jugador.body.onFloor()) {
        correr();
    }
    if (!modoAuto && izq.isDown && jugador.body.onFloor()) {
        correrIzq();
    }
    if (!modoAuto && !der.isDown && !izq.isDown && jugador.body.onFloor()) {
        Detenerse();
    }

    if (modoAuto && bala.position.x > 0 && jugador.body.onFloor()) {
        if (EntrenamientoSalto([despBala, velocidadBala, despBala2, velocidadBala2, despBala3, velocidadBala3])) {
            saltar();
        }
        if (datosDeEntrenamiento([despBala, velocidadBala, despBala2, velocidadBala2, despBala3, velocidadBala3])) {
            correrIzq();
        } else if (jugador.body.onFloor() && jugador.position.x >= 250) {
            Detenerse();
            correrIzq();
        }
    }

    if (!balaD) {
        disparo();
    }
    if (!balaD2) {
        disparo2();
    }
    if (!balaD3) {
        disparo3();
    }

    if (bala.position.x <= 0) {
        resetVariables();
    }
    if (bala2.position.y >= 355) {
        resetVariables2();
    }
    if (bala3.position.x <= 0 || bala3.position.y >= 355) {
        resetVariables3();
    }

    if (!modoAuto && bala.position.x > 0) {
        datosEntrenamiento.push({
            'input': [despBala, velocidadBala, despBala2, velocidadBala2, despBala3, velocidadBala3],
            'output': [estatusAire, estatuSuelo, estatusDerecha, estatusIzquierda]
        });
        console.log("Datos de entrenamiento añadidos:", datosEntrenamiento[datosEntrenamiento.length - 1]);
    }
}

function disparo() {
    velocidadBala = -1 * velocidadRandom(200, 700);
    bala.body.velocity.y = 0;
    bala.body.velocity.x = velocidadBala;
    balaD = true;
    console.log("Disparo de bala.");
}

function disparo2() {
    velocidadBala2 = -1 * velocidadRandom(300, 800);
    bala2.body.velocity.y = 0;
    balaD2 = true;
    console.log("Disparo de bala2.");
}

function disparo3() {
    velocidadBala3 = -1 * velocidadRandom(200, 500);
    bala3.body.velocity.y = 0;
    bala3.body.velocity.x = 1.60 * velocidadBala3;
    balaD3 = true;
    console.log("Disparo de bala3.");
}

function colisionH() {
    console.log("Colisión detectada.");
    pausa();
}

function velocidadRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function render() {
    // Puedes agregar renderizaciones personalizadas aquí si es necesario.
}