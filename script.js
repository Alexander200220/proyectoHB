const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function hexToRgb(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

function rgbToHex(r, g, b) {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function interpolateColor(color1, color2, factor) {
  const [r1, g1, b1] = hexToRgb(color1);
  const [r2, g2, b2] = hexToRgb(color2);
  const r = Math.round(r1 + factor * (r2 - r1));
  const g = Math.round(g1 + factor * (g2 - g1));
  const b = Math.round(b1 + factor * (b2 - b1));
  return rgbToHex(r, g, b);
}

const stars = [];
const shootingStars = [];
const fallingElements = [];

const phrases = [
  "Feliz vuelta al sol",
  "Bienvenidos los 20",
  "Bella",
  "Que brille tu esencia hoy y siempre",
  "Tus lindos 20",
  "Que la pases bonito",
  "Te quiero",
];

const images = [
  "https://png.pngtree.com/png-vector/20220619/ourmid/pngtree-sparkling-star-vector-icon-glitter-star-shape-png-image_5228522.png",
];

const heartImages = [
  "1.png",
  "2.jpeg",
  "3.jpeg",
  // '4.png'
];

const textColorsCycle = [
  "#FFD700", // Oro
  "#FFA500", // Naranja
  "#ADFF2F", // Verde amarillento
  "#00FFFF", // Cian
  "#FF69B4", // Rosa fuerte
  "#FFFFFF", // Blanco
  "#9932CC", // Púrpura
];
let currentColorIndex = 0;
let nextColorIndex = 1;
let transitionProgress = 0;
const transitionSpeed = 0.005;

let cameraX = 0;
let cameraY = 0;
let zoomLevel = 1;
const focalLength = 300;

let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  stars.length = 0;
  for (let i = 0; i < 300; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random(),
      delta: Math.random() * 0.02 + 0.005,
    });
  }
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#0a0a23");
  gradient.addColorStop(1, "#0c0004ff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawStars() {
  stars.forEach((star) => {
    star.alpha += star.delta;
    if (star.alpha <= 0 || star.alpha >= 1) star.delta *= -1;
    ctx.save();
    ctx.globalAlpha = star.alpha;
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function createShootingStar() {
  const startX = Math.random() * canvas.width;
  const startY = (Math.random() * canvas.height) / 2;
  shootingStars.push({
    x: startX,
    y: startY,
    length: Math.random() * 300 + 100,
    speed: Math.random() * 10 + 6,
    angle: Math.PI / 4,
    opacity: 1,
  });
}

function drawShootingStars() {
  for (let i = shootingStars.length - 1; i >= 0; i--) {
    const s = shootingStars[i];

    const endX = s.x - Math.cos(s.angle) * s.length;
    const endY = s.y - Math.sin(s.angle) * s.length;

    const gradient = ctx.createLinearGradient(s.x, s.y, endX, endY);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${s.opacity})`);
    gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    s.x += Math.cos(s.angle) * s.speed;
    s.y += Math.sin(s.angle) * s.speed;
    s.opacity -= 0.01;

    if (s.opacity <= 0) {
      shootingStars.splice(i, 1);
    }
  }
}

function createFallingElement() {
  const rand = Math.random();
  let type;
  if (rand < 0.6) {
    type = "phrase";
  } else if (rand < 0.8) {
    type = "image";
  } else {
    type = "heart";
  }

  const minZ = focalLength * 1.5;
  const maxZ = focalLength * 5;
  const initialZ = minZ + Math.random() * (maxZ - minZ);

  const worldPlaneWidth = (canvas.width / focalLength) * maxZ;
  const worldPlaneHeight = (canvas.height / focalLength) * maxZ;

  const bufferFactor = 1.1; // 10% de buffer
  const spawnRangeX = worldPlaneWidth * bufferFactor;
  const spawnRangeY = worldPlaneHeight * bufferFactor;

  const initialX = (Math.random() + Math.random() - 1) * 0.5 * spawnRangeX;
  const initialY = (Math.random() + Math.random() - 1) * 0.5 * spawnRangeY;

  let content;
  let baseSize;

  if (type === "phrase") {
    content = phrases[Math.floor(Math.random() * phrases.length)];
    baseSize = 30;
  } else if (type === "heart") {
    content = new Image();
    content.src = heartImages[Math.floor(Math.random() * heartImages.length)];
    content.onload = () => {};
    content.onerror = () => {
      console.error("Failed to load heart image:", content.src);
      const index = fallingElements.findIndex((el) => el.content === content);
      if (index > -1) fallingElements.splice(index, 1);
    };
    baseSize = 50;
  } else {
    // type === 'image'
    content = new Image();
    content.src = images[Math.floor(Math.random() * images.length)];
    content.onload = () => {};
    content.onerror = () => {
      console.error("Failed to load image:", content.src);
      const index = fallingElements.findIndex((el) => el.content === content);
      if (index > -1) fallingElements.splice(index, 1);
    };
    baseSize = 50;
  }

  fallingElements.push({
    type: type,
    content: content,
    x: initialX,
    y: initialY,
    z: initialZ,
    baseSize: baseSize,
    speedZ: Math.random() * 5 + 2,
  });
}

function drawFallingElements() {
  const currentTextColor = interpolateColor(
    textColorsCycle[currentColorIndex],
    textColorsCycle[nextColorIndex],
    transitionProgress
  );

  for (let i = fallingElements.length - 1; i >= 0; i--) {
    const el = fallingElements[i];

    el.z -= el.speedZ * zoomLevel;

    if (el.z <= 0) {
      fallingElements.splice(i, 1);
      createFallingElement();
      continue;
    }

    const perspectiveScale = focalLength / el.z;

    const size = el.baseSize * perspectiveScale * zoomLevel;
    const opacity = Math.max(0, Math.min(1, perspectiveScale));

    const displayX = (el.x - cameraX) * perspectiveScale + canvas.width / 2;
    const displayY = (el.y - cameraY) * perspectiveScale + canvas.height / 2;

    ctx.save();

    ctx.globalAlpha = opacity;

    if (el.type === "phrase") {
      ctx.fillStyle = currentTextColor;
      ctx.font = `${size}px 'Indie Flower', cursive`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.shadowColor = currentTextColor;
      ctx.shadowBlur = 5 * perspectiveScale;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      ctx.fillText(el.content, displayX, displayY);

      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
    } else if (
      (el.type === "image" || el.type === "heart") &&
      el.content.complete &&
      el.content.naturalHeight !== 0
    ) {
      ctx.drawImage(
        el.content,
        displayX - size / 2,
        displayY - size / 2,
        size,
        size
      );
    }

    ctx.restore();

    if (
      (displayX + size / 2 < 0 ||
        displayX - size / 2 > canvas.width ||
        displayY + size / 2 < 0 ||
        displayY - size / 2 > canvas.height) &&
      el.z > focalLength
    ) {
      fallingElements.splice(i, 1);
      createFallingElement();
    }
  }
}

function animate() {
  requestAnimationFrame(animate);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();
  drawStars();
  drawShootingStars();
  drawFallingElements();

  transitionProgress += transitionSpeed;
  if (transitionProgress >= 1) {
    transitionProgress = 0;
    currentColorIndex = nextColorIndex;
    nextColorIndex = (nextColorIndex + 1) % textColorsCycle.length;
  }
}

canvas.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();

    const scaleAmount = 0.1;

    if (event.deltaY < 0) {
      zoomLevel += scaleAmount;
    } else {
      zoomLevel -= scaleAmount;
    }

    zoomLevel = Math.max(0.1, Math.min(zoomLevel, 5));
  },
  { passive: false }
);

canvas.addEventListener("mousedown", (e) => {
  isDragging = true;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  canvas.style.cursor = "grabbing";
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  const dx = e.clientX - lastMouseX;
  const dy = e.clientY - lastMouseY;

  cameraX -= dx / zoomLevel;
  cameraY -= dy / zoomLevel;

  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});

canvas.addEventListener("mouseup", () => {
  isDragging = false;
  canvas.style.cursor = "grab";
});

canvas.addEventListener("mouseleave", () => {
  isDragging = false;
  canvas.style.cursor = "default";
});

window.addEventListener("resize", resizeCanvas);

resizeCanvas();
animate();

setInterval(createShootingStar, 500);

const initialFallingElementsCount = 50;
for (let i = 0; i < initialFallingElementsCount; i++) {
  createFallingElement();
}

setInterval(createFallingElement, 100);

const sheetColorsCycle = [
  "#fceabb", // Dorado suave
  "#d4ecf8", // Azul cielo
  "#ffe9e9", // Rosa claro
  "#d5e8d4", // Verde pastel
  "#e0e0ff", // Lila
];
let currentSheetColorIndex = 0;
let nextSheetColorIndex = 1;
let sheetTransitionProgress = 0;
const sheetTransitionSpeed = 0.005; // Velocidad de la transición

function seguirCursorConEstelaLuegoIrAlBoton() {
  const punto = document.getElementById("punto-guiado-container");
  const colores = [
    "#ff4d4d",
    "#ffa64d",
    "#ffff66",
    "#66ff66",
    "#66ccff",
    "#cc66ff",
  ];

  let mouseX = 0;
  let mouseY = 0;
  let puntoX = 0;
  let puntoY = window.innerHeight;

  // Escuchar el movimiento del cursor
  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  const startTime = performance.now();
  const seguirDuracion = 10000; // 10 segundos

  function seguirFrame(now) {
    const elapsed = now - startTime;

    // Mover el punto hacia el cursor suavemente
    puntoX += (mouseX - puntoX) * 0.1;
    puntoY += (mouseY - puntoY) * 0.1;
    punto.style.left = `${puntoX}px`;
    punto.style.top = `${puntoY}px`;

    // Crear partícula en el camino
    const particle = document.createElement("div");
    particle.classList.add("particle");
    particle.style.left = `${puntoX + 6}px`;
    particle.style.top = `${puntoY + 6}px`;
    particle.style.backgroundColor =
      colores[Math.floor(Math.random() * colores.length)];
    particle.style.position = "fixed";
    particle.style.zIndex = "9998";
    particle.style.width = "6px";
    particle.style.height = "6px";
    particle.style.borderRadius = "50%";
    particle.style.opacity = "1";
    particle.style.transition = "opacity 2.5s linear, transform 2.5s ease";
    particle.style.transform = `translate(${Math.random() * 10 - 5}px, ${
      Math.random() * 10 - 5
    }px)`;
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 2500);

    if (elapsed < seguirDuracion) {
      requestAnimationFrame(seguirFrame);
    } else {
      irAlCentro();
    }
  }

  function irAlCentro() {
    const finalX = window.innerWidth / 2 - 10;
    const finalY = 120;

    function moverAlCentro() {
      const dx = finalX - puntoX;
      const dy = finalY - puntoY;
      const dist = Math.hypot(dx, dy);

      if (dist < 5) {
        punto.style.left = `${finalX}px`;
        punto.style.top = `${finalY}px`;

        const correa = document.getElementById("correa");
        correa.classList.add("mostrar-correa");
        punto.style.display = "none";
        return;
      }

      puntoX += dx * 0.05;
      puntoY += dy * 0.05;
      punto.style.left = `${puntoX}px`;
      punto.style.top = `${puntoY}px`;

      // Deja partícula mientras va al centro
      const particle = document.createElement("div");
      particle.classList.add("particle");
      particle.style.left = `${puntoX + 6}px`;
      particle.style.top = `${puntoY + 6}px`;
      particle.style.backgroundColor =
        colores[Math.floor(Math.random() * colores.length)];
      particle.style.position = "fixed";
      particle.style.zIndex = "9998";
      particle.style.width = "6px";
      particle.style.height = "6px";
      particle.style.borderRadius = "50%";
      particle.style.opacity = "1";
      particle.style.transition = "opacity 2.5s linear, transform 2.5s ease";
      particle.style.transform = `translate(${Math.random() * 10 - 5}px, ${
        Math.random() * 10 - 5
      }px)`;
      document.body.appendChild(particle);
      setTimeout(() => particle.remove(), 2500);

      requestAnimationFrame(moverAlCentro);
    }

    requestAnimationFrame(moverAlCentro);
  }

  requestAnimationFrame(seguirFrame);
}

setTimeout(() => {
  const contenedor = document.getElementById("escritura-container");
  contenedor.classList.remove("escritura-oculta");
  seguirCursorConEstelaLuegoIrAlBoton();
}, 2000);

// Mostrar solo la cinta después de 10 segundos
setTimeout(() => {
  const contenedor = document.getElementById("escritura-container");
  const correa = document.getElementById("correa");
  contenedor.classList.remove("escritura-oculta");
  correa.style.display = "block";
}, 14000);

// Inicialmente ocultamos la correa manualmente al cargar
document.addEventListener("DOMContentLoaded", () => {
  const correa = document.getElementById("correa");
  correa.style.display = "none";
});

// Función que se activa al hacer clic en la correa
function desplegarHoja() {
  if (textoYaEscrito) return; // evitar múltiples ejecuciones
  textoYaEscrito = true;

  const hoja = document.getElementById("hoja");
  hoja.classList.add("desplegar-hoja");

  setTimeout(() => {
    escribirTextoLineaPorLinea();
  }, 3000); // esperar animación de despliegue
}

let textoYaEscrito = false;

document.getElementById("correa").addEventListener("click", () => {
    if (textoYaEscrito) return;
    textoYaEscrito = true;

    const boton = document.getElementById("correa");
    const hoja = document.getElementById("hoja");
    const mensajeTemporal1 = document.getElementById("mensaje-temporal");
    const mensajeTemporal2 = document.getElementById("mensaje-temporal-2");

    // Oculta el botón inmediatamente
    boton.style.opacity = '0';
    boton.style.pointerEvents = 'none';

    // Muestra el primer mensaje temporal
    mensajeTemporal1.classList.add('visible');

    // Después de 5 segundos, oculta el primer mensaje y muestra el segundo
    setTimeout(() => {
        mensajeTemporal1.classList.remove('visible');

        // Un pequeño retraso para que el mensaje se desvanezca
        setTimeout(() => {
            mensajeTemporal2.classList.add('visible');
        }, 500);

        // Después de otros 5 segundos, oculta el segundo mensaje y comienza la animación de la hoja
        setTimeout(() => {
            mensajeTemporal2.classList.remove('visible');

            // Espera a que el segundo mensaje se desvanezca antes de la hoja
            setTimeout(() => {
                hoja.classList.remove('hoja-inicio');
                hoja.classList.add('visible');
                escribirTextoLineaPorLinea();
            }, 500);
        }, 5000); // El segundo mensaje se muestra durante 5 segundos (5000ms)

    }, 5000); // El primer mensaje se muestra durante 5 segundos (5000ms)
});

function escribirTextoLineaPorLinea() {
  const contenido = document.getElementById("contenido-hoja");
  const lineas = [
    "Espero no te molestes por lo anterior, quiero decirte lo siguiente:",
    "Para empezar por fin 20 añitos,",
    "Desearte lo mejor en este día especial, que la pases muy bonito con tu familia y amigos cercanos. Eres una mujer increíble de verdad, me gusta tu manera de ver las cosas, también como eres de linda en todos los aspectos, aunque hay que admitir que no eres muy linda cuando te enojas jajajaja, pero disfruto mucho pasar tiempo contigo.",
    "Tambien quiero que sepas que... aunque quizás ya lo he dicho pero igual te lo repito, cuando necesites cualquier cosa en todo aspecto quiero que tengas presente que yo estaré aquí para ti, no eres alguien que se deja vencer fácilmente, eres una mujercita constante y perseverante, que cuando te propones algo lo haces y te felicito por ello, te mando un fuerte abrazo y un beso en la frente, muchas bendiciones y éxitos en todo, yo sé que vas a lograr cosas grandes, confió en ti. Se te quiere Lesly <3",
    "HAPPY BIRTHDAY!!!",
    "Att: Alexander",
];

  contenido.innerHTML = "";
  let index = 0;

  function escribirSiguienteLinea() {
    if (index >= lineas.length) return;

    const linea = document.createElement("p");
    linea.textContent = "";
    contenido.appendChild(linea);

    let charIndex = 0;
    const chars = lineas[index].split("");

    function escribirCaracter() {
      if (charIndex < chars.length) {
        linea.textContent += chars[charIndex];
        charIndex++;
        setTimeout(escribirCaracter, 25);
      } else {
        index++;
        setTimeout(escribirSiguienteLinea, 400);
      }
    }

    escribirCaracter();
  }

  escribirSiguienteLinea();
}
