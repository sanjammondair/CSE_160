// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
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
const POINT = 'point';
const TRIANGLE = 'triangle';
const CIRCLE = 'circle';  // ✅ Add this line

let g_selectedType = POINT; // Default shape


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

    
}

function connectVariablesToGLSL(){
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
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


function addActionsForHtmlUI(){

  //Button Events (shape type)
  document.getElementById('green').onclick = function () {g_selectedColor = [0.0,1.0,0.0,1.0]; };
  document.getElementById('red').onclick = function () {g_selectedColor = [1.0,0.0,0.0,1.0]; };
  document.getElementById('clearButton').onclick = function () {g_shapesList=[]; renderAllShapes();};

  document.getElementById('pointButton').onclick = function() {g_selectedType=POINT};
  document.getElementById('triButton').onclick = function() {g_selectedType=TRIANGLE};
  document.getElementById('circleButton').onclick = function() {g_selectedType=CIRCLE};

  //Slider Events
  document.getElementById('redSlide').addEventListener('mouseup', function() {g_selectedColor[0] = this.value/100; });
  document.getElementById('greenSlide').addEventListener('mouseup', function() {g_selectedColor[1] = this.value/100; });
  document.getElementById('blueSlide').addEventListener('mouseup', function() {g_selectedColor[2] = this.value/100; });

  //Size Slider Events
  document.getElementById('sizeSlide').addEventListener('mouseup', function() {g_selectedSize = this.value; });
  document.getElementById('segmentSlide').addEventListener('mouseup', function() {
    g_selectedSegments = parseInt(this.value);
  });

  document.getElementById('drawPictureButton').onclick = function () {
    drawMyTrianglePicture();
  };  
  
  
}


function main() {
  //set up canvas and gl variables
  setUpWebGL();
  //set up GLSL shader programs and connect GLSL variables
  connectVariablesToGLSL();

  //Set up actions for the HTML UI elements
  addActionsForHtmlUI();


  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) {if(ev.buttons == 1) { click(ev) } };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
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

function renderAllShapes(){

  var starttime = performance.now();
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  let len = g_shapesList.length;
  for (let i = 0; i < len; i++) {
    g_shapesList[i].render();
  }

  var duration = performance.now() - starttime;
  sendTextToHTML("numdot: " + len + " ms: " + Math.floor(duration) + " fps: " + Math.floor(1000/duration)/10, "numdot" );

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
