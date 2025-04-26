// BlockyAnimal.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform float u_Size;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    gl_PointSize = u_Size;
  }`


// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let u_ModelMatrix;

const POINT = 'point';
const TRIANGLE = 'triangle';
const CIRCLE = 'circle';  // ✅ Add this line

let g_selectedType = POINT; // Default shape
let g_globalAngle=0;
let g_yellowAngle=0;
let g_magentaAngle=0;
let g_redAngle=0;
let g_redTranslationY = 0;
let g_blueAngle = 0;
let g_blueAnimation = false;
let g_mouseDown = false;
let g_lastX = 0;
let g_pokeMode = false;
let g_pokeStartTime = 0;



function setUpWebGL(){
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = canvas.getContext("webgl", {preserveDrawingBuffer: true})
    if (!gl) {
      console.log('Failed to get the rendering context for WebGL');
      return;
    }
    window.gl = gl;
    gl.enable(gl.DEPTH_TEST);

    
}

function drawCone(numSegments = 24) {
  const angleStep = (2 * Math.PI) / numSegments;

  const verts = [];

  // Tip of the cone
  const tip = [0.0, 0.3, 0.0]; // tip upward
  for (let i = 0; i < numSegments; i++) {
    const theta1 = i * angleStep;
    const theta2 = (i + 1) * angleStep;

    // base edge 1
    const x1 = Math.cos(theta1) * 0.2;
    const z1 = Math.sin(theta1) * 0.2;

    // base edge 2
    const x2 = Math.cos(theta2) * 0.2;
    const z2 = Math.sin(theta2) * 0.2;

    verts.push(...tip, x1, 0, z1, x2, 0, z2);
  }

  for (let i = 0; i < verts.length; i += 9) {
    drawTriangle3D(verts.slice(i, i + 9));
  }
}


function connectVariablesToGLSL(){
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }
  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_Size
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }

}

//Glovals related to UI elements
let g_selectedColor=[1.0,1.0,1.0,1.0];
let g_selectedSize=5;
let g_selectedSegments = 10; // default number of segments
let g_yellowAnimation=false;
let g_magentaAnimation = false;
let g_redAnimation = false;

function addActionsForHtmlUI(){

  //Button Events (shape type)
  //document.getElementById('green').onclick = function () {g_selectedColor = [0.0,1.0,0.0,1.0]; };
  // document.getElementById('red').onclick = function () {g_selectedColor = [1.0,0.0,0.0,1.0]; };
  // document.getElementById('clearButton').onclick = function () {g_shapesList=[]; renderAllShapes();};

  // document.getElementById('pointButton').onclick = function() {g_selectedType=POINT};
  // document.getElementById('triButton').onclick = function() {g_selectedType=TRIANGLE};
  // document.getElementById('circleButton').onclick = function() {g_selectedType=CIRCLE};

  // //Slider Events
  // document.getElementById('redSlide').addEventListener('mouseup', function() {g_selectedColor[0] = this.value/100; });
  // document.getElementById('greenSlide').addEventListener('mouseup', function() {g_selectedColor[1] = this.value/100; });
  // document.getElementById('blueSlide').addEventListener('mouseup', function() {g_selectedColor[2] = this.value/100; });
  document.getElementById('animationYellowOffButton').onclick = function () {g_yellowAnimation=false;};
  document.getElementById('animationYellowOnButton').onclick = function () {g_yellowAnimation=true; };

  document.getElementById('animationMagentaOffButton').onclick = function () {g_magentaAnimation=false;};
  document.getElementById('animationMagentaOnButton').onclick = function () {g_magentaAnimation=true; };

  
  document.getElementById('animationRedOffButton').onclick = function () {g_redAnimation=false;};
  document.getElementById('animationRedOnButton').onclick = function () {g_redAnimation=true; };

  document.getElementById('animationBlueOffButton').onclick = function () {g_blueAnimation=false;};
  document.getElementById('animationBlueOnButton').onclick = function () {g_blueAnimation=true; };



  document.getElementById('magentaSlide').addEventListener('mousemove', function() { g_magentaAngle = this.value; renderAllShapes(); });
  document.getElementById('yellowSlide').addEventListener('mousemove', function() { g_yellowAngle = this.value; renderAllShapes(); });
  document.getElementById('redSlide').addEventListener('mousemove', function() { g_redAngle = this.value; renderAllShapes(); });
  document.getElementById('blueSlide').addEventListener('mousemove', function() { g_blueAngle = this.value; renderAllShapes(); });
  document.getElementById('angleSlide').addEventListener('mousemove', function() { g_globalAngle = this.value; renderAllShapes(); });


  // //Size Slider Events
  // document.getElementById('sizeSlide').addEventListener('mouseup', function() {g_selectedSize = this.value; });
  // document.getElementById('segmentSlide').addEventListener('mouseup', function() {
  //   g_selectedSegments = parseInt(this.value);});

  
}


function main() {
  //set up canvas and gl variables
  setUpWebGL();
  //set up GLSL shader programs and connect GLSL variables
  connectVariablesToGLSL();

  //Set up actions for the HTML UI elements
  addActionsForHtmlUI();


  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = function(ev) {
    if (ev.shiftKey) {
      g_pokeMode = true;
      g_pokeStartTime = g_seconds;
    } else {
      g_mouseDown = true;
      g_lastX = ev.clientX;
    }
  };
  
  
  canvas.onmouseup = function(ev) {
    g_mouseDown = false;
  };
  
  canvas.onmousemove = function(ev) {
    if (g_mouseDown) {
      let dx = ev.clientX - g_lastX;
      g_globalAngle += dx * 0.5; // adjust sensitivity as needed
      g_lastX = ev.clientX;
      renderAllShapes();
    }
  };
  
  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  //gl.clear(gl.COLOR_BUFFER_BIT);
  //renderAllShapes();

  requestAnimationFrame(tick);
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0-g_startTime;

function tick() {

  g_seconds=performance.now()/1000.0-g_startTime;
  //console.log(g_seconds);
  updateAnimationAngles();

  renderAllShapes();

  requestAnimationFrame(tick);
}

var g_shapesList = [];

// var g_points = [];  // The array for the position of a mouse press
// var g_colors = [];  // The array to store the color of a point
// var g_sizes = [];

function click(ev) {
  //Extract the event click and return it in WebGL coordinates 
  let [x,y] = convertCoordinatesEventToGL(ev);

  //Create and store the new point
  let point;
  if (g_selectedType == POINT) {
    point = new Point();
  } else if (g_selectedType == TRIANGLE) {
    point = new Triangle();
  } else if (g_selectedType == CIRCLE) {
    point = new Circle();
    point.segments = g_selectedSegments; // ✅ Set number of segments
  } 
  point.position=[x,y];
  point.color=g_selectedColor.slice();
  point.size=g_selectedSize;
  g_shapesList.push(point);

  // // Store the coordinates to g_points array
  // g_points.push([x, y]);

  // // Store the coordinates to g_points array
  // g_colors.push(g_selectedColor.slice());

  // //Store the size to the g sizes array
  // g_sizes.push(g_selectedSize);

  // if (x >= 0.0 && y >= 0.0) {      // First quadrant
  //   g_colors.push([1.0, 0.0, 0.0, 1.0]);  // Red
  // } else if (x < 0.0 && y < 0.0) { // Third quadrant
  //   g_colors.push([0.0, 1.0, 0.0, 1.0]);  // Green
  // } else {                         // Others
  //   g_colors.push([1.0, 1.0, 1.0, 1.0]);  // White
  // }

  //Draw every shape that is supposed to be in the canvas
  renderAllShapes();
}

function convertCoordinatesEventToGL(ev){
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return ([x,y]);
}

function updateAnimationAngles() {
  if (g_yellowAnimation) {
    g_yellowAngle = 45 * Math.sin(g_seconds);
  }

  if (g_magentaAnimation) {
    g_magentaAngle = 45 * Math.sin(3 * g_seconds);
  }

  if (g_redAnimation) {
    g_redAngle = 20 * Math.sin(2 * g_seconds);

  }

  if (g_blueAnimation) {
    g_blueAngle = 20 * Math.sin(4 * g_seconds); // faster animation
  }

  if (g_pokeMode) {
    let timeSincePoke = g_seconds - g_pokeStartTime;
  
    if (timeSincePoke < 1.5) {
      g_redAngle = Math.sin(g_seconds * 40) * 30; // wild shaking
    } else {
      g_pokeMode = false; // end poke mode
    }
  }
  
  
  }

function renderAllShapes(){

  var starttime = performance.now();

  var globalRotMat=new Matrix4().rotate(g_globalAngle,0,1,0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
  // // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // let len = g_shapesList.length;
  // for (let i = 0; i < len; i++) {
  //   g_shapesList[i].render();
  // }

  // RED BASE
  var base = new Cube();
  base.color = [1.0, 0.0, 0.0, 1.0];
  base.matrix.setTranslate(0.0, -0.75, 0.0);  // new base Y
  base.matrix.rotate(g_redAngle, 0, 0, 1);
  var redMatrix = new Matrix4(base.matrix);
  base.matrix.scale(0.6, 0.3, 0.5);           // height = 0.3
  base.render();
  


  // YELLOW BODY
  var body = new Cube();
  body.color = [1.0, 1.0, 0.0, 1.0];
  let yellowLink = new Matrix4(redMatrix);
  yellowLink.translate(0.0, 0.3, 0);             // move up by RED height
  yellowLink.rotate(g_yellowAngle, 0, 0, 1);
  var yellowMatrix = new Matrix4(yellowLink);
  body.matrix = yellowLink;
  body.matrix.scale(0.3, 0.7, 0.5);            // height = 0.7
  body.render();





  var head = new Cube();
  head.color = [1.0, 0.0, 1.0, 1.0];
  head.matrix = new Matrix4(yellowMatrix);
  head.matrix.translate(0.1, 0.7, 0.0);  // On top of yellow
  head.matrix.rotate(g_magentaAngle, 0, 0, 1);
  head.matrix.scale(0.3, 0.3, 0.3);
  head.render();

  var hand = new Cube();
  hand.color = [0.2, 0.8, 1.0, 1.0]; // light blue
  let blueLink = new Matrix4(yellowMatrix);
  blueLink.translate(0.1, 0.7, 0.0);         // same as magenta
  blueLink.rotate(g_magentaAngle, 0, 0, 1);  // magenta rotation
  blueLink.translate(0.15, 0.2, 0.0);         // move further out
  blueLink.rotate(g_blueAngle, 0, 0, 1);     // blue rotation

  hand.matrix = new Matrix4(blueLink);
  hand.matrix.scale(0.15, 0.15, 0.15);
  hand.render();

  let tailMatrix = new Matrix4(redMatrix);
  tailMatrix.translate(0.1, -0.15, 0.0); // behind red base
  tailMatrix.scale(1.0, 1.0, 1.0); // adjust size if needed
  gl.uniformMatrix4fv(u_ModelMatrix, false, tailMatrix.elements);
  gl.uniform4f(u_FragColor, 0.8, 0.5, 0.1, 1.0); // brown-orange
  drawCone(); // 👈 renders your new cone!




  // === ADD FOOT 1 ===
var foot1 = new Cube();
foot1.color = [0.8, 0.5, 0.2, 1.0]; // brownish
foot1.matrix = new Matrix4(redMatrix);
foot1.matrix.translate(0.2, -0.3, 0.0); // small offset from red base
foot1.matrix.scale(0.2, 0.1, 0.3); // small foot
foot1.render();

// === ADD FOOT 2 ===
var foot2 = new Cube();
foot2.color = [0.8, 0.5, 0.2, 1.0]; // brownish
foot2.matrix = new Matrix4(redMatrix);
foot2.matrix.translate(-0.2, -0.3, 0.0); // mirrored offset
foot2.matrix.scale(0.2, 0.1, 0.3); // small foot
foot2.render();

// === ADD SECOND ARM ===
var secondArm = new Cube();
secondArm.color = [1.5, 0.0, 1.0, 1.0]; // magenta like first arm
secondArm.matrix = new Matrix4(yellowMatrix);
secondArm.matrix.translate(-0.1, 0.7, 0.0); // mirror to left side
secondArm.matrix.rotate(-g_magentaAngle, 0, 0, 1); // mirror rotation
secondArm.matrix.scale(0.3, 0.3, 0.3);
secondArm.render();

  //check the time at the end of the function and show on webpage
  var duration = performance.now() - starttime;
  sendTextToHTML("ms: " + Math.floor(duration) + "  fps: " + Math.floor(1000 / duration), "numdot");
  

}

//Set the text of a HTML element 
function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML ");
    return;
  }
  htmlElm.innerHTML = text;
}

function drawMyTrianglePicture() {
  // Set a basic color
  gl.uniform4f(u_FragColor, 0.9, 0.3, 0.3, 1.0);
  
  // Draw a simple triangle scene – you’ll replace this with your own
  drawTriangle([-0.5, -0.5, 0.0, 0.5, 0.5, -0.5]); // Big triangle
  drawTriangle([-0.2, -0.2, 0.2, -0.2, 0.0, 0.2]); // Small triangle

  // Add 20+ triangles for your full drawing!
}

function drawMyTrianglePicture() {
  gl.clear(gl.COLOR_BUFFER_BIT); // Clear background
  gl.uniform4f(u_FragColor, 0.9, 0.7, 0.3, 1.0); // Default yellow-ish color

  const d = 0.05; // triangle size helper

  // ========== HOUSE ==========
  gl.uniform4f(u_FragColor, 0.6, 0.3, 0.1, 1.0); // roof brown
  drawTriangle([0.0, 0.2, -0.2, 0.0, 0.2, 0.0]); // roof

  gl.uniform4f(u_FragColor, 0.9, 0.8, 0.6, 1.0); // house tan
  drawTriangle([-0.2, 0.0, -0.2, -0.3, 0.2, -0.3]);
  drawTriangle([0.2, -0.3, 0.2, 0.0, -0.2, 0.0]);

  gl.uniform4f(u_FragColor, 0.3, 0.1, 0.0, 1.0); // door
  drawTriangle([-0.05, -0.3, -0.05, -0.15, 0.05, -0.15]);
  drawTriangle([0.05, -0.15, 0.05, -0.3, -0.05, -0.3]);

  gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0); // windows
  drawTriangle([-0.15, -0.05, -0.1, 0.05, -0.05, -0.05]); // left
  drawTriangle([0.15, -0.05, 0.1, 0.05, 0.05, -0.05]); // right
  drawTriangle([0.0, -0.05, -0.02, 0.05, 0.02, 0.05]); // circle top window (faked with triangle)

  // ========== SUN ==========
  gl.uniform4f(u_FragColor, 1.0, 1.0, 0.0, 1.0);
  for (let i = 0; i < 360; i += 30) {
    let rad = i * Math.PI / 180;
    let rad2 = (i + 15) * Math.PI / 180;
    drawTriangle([
      0.6, 0.6,
      0.6 + 0.05 * Math.cos(rad), 0.6 + 0.05 * Math.sin(rad),
      0.6 + 0.05 * Math.cos(rad2), 0.6 + 0.05 * Math.sin(rad2)
    ]);
  }

  // ========== TREES ==========
  function drawTree(x, y, scale) {
    gl.uniform4f(u_FragColor, 0.0, 0.6, 0.0, 1.0); // green
    drawTriangle([
      x, y + d * scale,
      x - d * scale, y,
      x + d * scale, y
    ]);
    drawTriangle([
      x, y,
      x - d * scale * 1.2, y - d * scale * 1.2,
      x + d * scale * 1.2, y - d * scale * 1.2
    ]);
    gl.uniform4f(u_FragColor, 0.4, 0.2, 0.0, 1.0); // brown
    drawTriangle([
      x - 0.01 * scale, y - d * scale * 1.2,
      x + 0.01 * scale, y - d * scale * 1.2,
      x - 0.01 * scale, y - d * scale * 2
    ]);
    drawTriangle([
      x + 0.01 * scale, y - d * scale * 1.2,
      x + 0.01 * scale, y - d * scale * 2,
      x - 0.01 * scale, y - d * scale * 2
    ]);
  }

  drawTree(-0.6, -0.1, 1.2);
  drawTree(-0.4, -0.15, 0.8);
  drawTree(0.4, -0.1, 1.2);
  drawTree(0.6, -0.15, 0.6);
}
