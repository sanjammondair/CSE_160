// World.js 
// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`


// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1; // brick
  uniform sampler2D u_Sampler2; // grass

  uniform int u_whichTexture;
  uniform float u_texColorWeight;
  void main() {

    if (u_whichTexture == -2) {       //use color
      gl_FragColor = u_FragColor;

    } else if (u_whichTexture == -1) {    //use UV debug color
      gl_FragColor = vec4(v_UV, 1.0, 1.0);

    } else if (u_whichTexture == 0) {   //use texture0
      vec4 texColor = texture2D(u_Sampler0, v_UV);
      gl_FragColor = mix(u_FragColor, texColor, u_texColorWeight);
    } else if (u_whichTexture == 1) {
      vec4 texColor = texture2D(u_Sampler1, v_UV);
      gl_FragColor = mix(u_FragColor, texColor, u_texColorWeight);
    } else if (u_whichTexture == 2) {
      vec4 texColor = texture2D(u_Sampler2, v_UV);
      gl_FragColor = mix(u_FragColor, texColor, u_texColorWeight);
    } else {                            //error, put redish
      gl_FragColor = vec4(1.0, 0.2, 0.2, 1.0);
    }

  }`

  
let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;
let u_Sampler0;
let u_texColorWeight;
let u_Sampler1, u_Sampler2;
let hiddenX = Math.floor(Math.random() * 32);
let hiddenZ = Math.floor(Math.random() * 32);
let found = false;
let selectorX = 15;
let selectorZ = 15;
let stackerStartTime = null;
let stackerEndTime = null;
let stackerActive = false;
let stackerHeightTarget = 10;



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
let camera;
let g_lastY = 0;
let selectedBlock = null; // stores [x, z] or null



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

  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }

  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }


  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) {
    console.log('Failed to get the storage location of u_Sampler0');
    return false;
  }
  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if (!u_Sampler1) {
    console.log('Failed to get the storage location of u_Sampler1');
    return false;
  }
  u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
  if (!u_Sampler2) {
    console.log('Failed to get the storage location of u_Sampler2');
    return false;
  }
  
  u_texColorWeight = gl.getUniformLocation(gl.program, 'u_texColorWeight');
  if (!u_texColorWeight) {
    console.log('Failed to get the storage location of u_texColorWeight');
    return;
  }


  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) {
    console.log('Failed to get the storage location of u_whichTexture');
    return false;
  }
  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
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
function initTextures() {
  loadTexture('sky.jpg', 0, 0);
  loadTexture('brick.jpg', 1, 1);
  loadTexture('grass.jpg', 2, 2);
}


let g_textureLoaded = [false, false, false];

function loadTexture(src, unit, samplerIndex) {
  const image = new Image();
  image.onload = () => {
    const texture = gl.createTexture();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Link texture unit to sampler uniform
    if (samplerIndex === 0) gl.uniform1i(u_Sampler0, unit);
    if (samplerIndex === 1) gl.uniform1i(u_Sampler1, unit);
    if (samplerIndex === 2) gl.uniform1i(u_Sampler2, unit);

    g_textureLoaded[samplerIndex] = true;
    console.log(`Loaded texture ${src}`);

    // ✅ Only start rendering once ALL textures are loaded
    if (g_textureLoaded.every(v => v)) {
      requestAnimationFrame(tick);
    }
  };
  image.src = src;
}



function sendImageToTEXTURE0 (image) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(u_Sampler0, 0); 

  //gl.clear(gl.COLOR_BUFFER_BIT);

  //gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
  console.log('finished loadTexture');
}

function main() {
  //set up canvas and gl variables
  setUpWebGL();
  //set up GLSL shader programs and connect GLSL variables
  connectVariablesToGLSL();

  //Set up actions for the HTML UI elements
  addActionsForHtmlUI();

  document.onkeydown = keydown;
  initTextures();
  camera = new Camera();

  canvas.addEventListener('click', click);

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = function(ev) {
    if (ev.shiftKey) {
      g_pokeMode = true;
      g_pokeStartTime = g_seconds;
    } else {
      g_mouseDown = true;
      g_lastX = ev.clientX;
      g_lastY = ev.clientY;

    }
  };
  
  
  canvas.onmouseup = function(ev) {
    g_mouseDown = false;
  };
  
  canvas.onmousemove = function(ev) {
    if (g_mouseDown) {
      let dx = ev.clientX - g_lastX;
      let dy = ev.clientY - g_lastY;
  
      camera.panHorizontal(dx * 0.5); // yaw
      camera.panVertical(dy * 0.5);   // pitch
  
      g_lastX = ev.clientX;
      g_lastY = ev.clientY;
  
      renderAllShapes();
    }
  };
  
  
  
  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  //gl.clear(gl.COLOR_BUFFER_BIT);
  //renderAllShapes();

  //requestAnimationFrame(tick);
  buildWallCubes();

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

function keydown(ev) {
  switch(ev.key) {
    case 'w':
      camera.moveForward();
      break;
    case 's':
      camera.moveBackward();
      break;
    case 'a':
      camera.moveLeft();
      break;
    case 'd':
      camera.moveRight();
      break;
    case 'q':
      camera.panLeft();
      break;
    case 'e':
      camera.panRight();
      break;
      case 'f':
        addBlockAtSelector(); break;
      case 'g':
        removeBlockAtSelector(); break;
        case 'r':
  if (selectedBlock) {
    const [x, z] = selectedBlock;
    g_map[x][z] = 0; // Reset the height
    updateWallMesh();
  }
  stackerActive = false;
  stackerStartTime = null;
  stackerEndTime = null;
  break;


  
    case 'ArrowUp':
      selectorZ = Math.max(0, selectorZ - 1); break;
    case 'ArrowDown':
      selectorZ = Math.min(31, selectorZ + 1); break;
    case 'ArrowLeft':
      selectorX = Math.max(0, selectorX - 1); break;
    case 'ArrowRight':
      selectorX = Math.min(31, selectorX + 1); break;
  

      let cx = Math.floor(camera.eye.elements[0]);
      let cz = Math.floor(camera.eye.elements[2]);
      if (!found && cx === hiddenX && cz === hiddenZ) {
        alert("You found the hidden block!");
        found = true;
      }
      
    
  }
  renderAllShapes();
}



function click(ev) {
  // Convert screen to clip space
  let x = (ev.clientX - canvas.getBoundingClientRect().left) / canvas.width * 2 - 1;
  let y = (canvas.height - (ev.clientY - canvas.getBoundingClientRect().top)) / canvas.height * 2 - 1;

  // Inverse project into world space
  let invVP = new Matrix4();
  invVP.set(camera.projectionMatrix);
  invVP.multiply(camera.viewMatrix);
  invVP = invVP.invert();

  let nearPoint = invVP.multiplyVector4(new Vector4([x, y, -1, 1]));
  let farPoint  = invVP.multiplyVector4(new Vector4([x, y, 1, 1]));
  for (let i = 0; i < 3; i++) {
    nearPoint.elements[i] /= nearPoint.elements[3];
    farPoint.elements[i]  /= farPoint.elements[3];
  }

  let rayDir = [
    farPoint.elements[0] - nearPoint.elements[0],
    farPoint.elements[1] - nearPoint.elements[1],
    farPoint.elements[2] - nearPoint.elements[2]
  ];

  // Normalize
  let len = Math.sqrt(rayDir[0] ** 2 + rayDir[1] ** 2 + rayDir[2] ** 2);
  rayDir = rayDir.map(v => v / len);

  let stepSize = 0.1;
  let maxDist = 100;

  for (let t = 0; t < maxDist; t += stepSize) {
    let pos = [
      nearPoint.elements[0] + rayDir[0] * t,
      nearPoint.elements[1] + rayDir[1] * t,
      nearPoint.elements[2] + rayDir[2] * t
    ];

    let xIdx = Math.floor(pos[0] + 16);
    let yIdx = Math.floor(pos[1] + 0.75);
    let zIdx = Math.floor(pos[2] + 16);

    if (
      xIdx >= 0 && xIdx < 32 &&
      zIdx >= 0 && zIdx < 32 &&
      yIdx >= 0 && yIdx < g_map[xIdx][zIdx]
    ) {
      selectorX = xIdx;
      selectorZ = zIdx;
      selectedBlock = [xIdx, zIdx];
      console.log("Selected block:", xIdx, zIdx);
      return;
    }
  }

  // If nothing hit
  selectedBlock = null;
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

var g_eye=[0,0,3];
var g_at=[0,0,-100];
var g_up=[0,1,0];
// var g_camera = new Camera();
let g_map = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,2,2,0,0,0,0,0,0,0,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,2,2,0,0,0,1],
  [1,0,2,0,0,0,0,0,0,0,0,3,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,1],
  [1,0,2,0,0,0,0,0,0,0,0,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,0,0,0,0,0,0,1],
  [1,0,0,0,3,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,3,0,0,0,0,0,0,1],
  [1,0,0,0,3,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,3,0,0,0,0,0,0,1],
  [1,0,0,0,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,1,0,2,2,2,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,1,0,2,0,2,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,1,0,2,2,2,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,1],
  [1,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,1],
  [1,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,1],
  [1,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,1],
  [1,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,1],
  [1,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,1],
  [1,0,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];


let g_wallVertices = [];
let g_wallUVs = [];

function buildWallCubes() {
  for (let x = 0; x < 32; x++) {
    for (let z = 0; z < 32; z++) {
      let h = g_map[x][z];
      for (let y = 0; y < h; y++) {
        let cube = new Cube();
        cube.color = [1.0, 1.0, 1.0, 1.0];
        cube.matrix.translate(x - 16, y - 0.75, z - 16);
        cube.renderFast(g_wallVertices, g_wallUVs);
      }
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
  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements); 
  //sky 
  var sky = new Cube ();
  sky.color = [1.0, 0.0, 0.0, 1.0];
  sky.textureNum=0;
  sky.matrix.scale(50,50,50);
  sky.matrix.translate(-.5,-.5,-0.5);
  sky.render();

  //floor
  // floor - expanded to fit the whole map (32x32)
var floor = new Cube();
floor.color = [0.3, 0.8, 0.3, 1.0]; 
floor.textureNum = 2; // grass texture
floor.matrix.translate(-16, -0.75, -16); // align with map origin
floor.matrix.scale(32, 0, 32);           // match world size
floor.render();


  gl.uniform1i(u_whichTexture, -2); // assuming you want texture0
  gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0); // or any base color
  gl.uniform1f(u_texColorWeight, 1.0); // to blend texture fully
  gl.uniformMatrix4fv(u_ModelMatrix, false, new Matrix4().elements);
  gl.uniform1i(u_whichTexture, 1); // brick texture

  drawTriangles3DUV(g_wallVertices, g_wallUVs);


  


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
  body.textureNum=-2;
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

if (!found) {
  const block = new Cube();
  block.color = [1.0, 0.0, 0.0, 1.0]; // bright red
  block.textureNum = -1;
  let y = g_map[hiddenX][hiddenZ];
  block.matrix.translate(hiddenX - 16, y, hiddenZ - 16);
  block.render();
}

  renderSelectorCursor();

  //check the time at the end of the function and show on webpage
  var duration = performance.now() - starttime;
  sendTextToHTML("ms: " + Math.floor(duration) + "  fps: " + Math.floor(1000 / duration), "numdot");
  

}

function renderSelectorCursor() {
  if (!selectedBlock) return;
  const [x, z] = selectedBlock;
  const marker = new Cube();
  marker.color = [1, 0, 0, 1];         // bright red
  marker.textureNum = -2;             // solid color
  let y = g_map[x][z];
  marker.matrix.translate(x - 16, y + 0.01, z - 16); // float above
  marker.matrix.scale(1.05, 1.05, 1.05);
  marker.render();
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
  renderMarker(); 
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

function getMapCoordsInFront() {
  // Use direction vector (at - eye)
  const fx = camera.at.elements[0] - camera.eye.elements[0];
  const fz = camera.at.elements[2] - camera.eye.elements[2];

  // Normalize
  const len = Math.sqrt(fx * fx + fz * fz);
  const dirX = fx / len;
  const dirZ = fz / len;

  // Take a step forward from camera position
  const step = 1.0;
  const targetX = Math.floor(camera.eye.elements[0] + dirX * step);
  const targetZ = Math.floor(camera.eye.elements[2] + dirZ * step);

  // Clamp to map bounds
  const x = Math.max(0, Math.min(31, targetX));
  const z = Math.max(0, Math.min(31, targetZ));

  return [x, z];
}


function addBlockInFront() {
  const [x, z] = getMapCoordsInFront();
  console.log('Adding block at:', x, z, 'Current height:', g_map[x][z]);

  if (g_map[x][z] < 20) { // limit to avoid massive spikes
    g_map[x][z] += 1;
    updateWallMesh();
  }
}

function removeBlockInFront() {
  const [x, z] = getMapCoordsInFront();
  if (g_map[x][z] > 0) {
    g_map[x][z]--;
    updateWallMesh();
  }
}

function updateWallMesh() {
  g_wallVertices = [];
  g_wallUVs = [];
  buildWallCubes();    // rebuild cube geometry
  renderAllShapes();   // force re-render
}


function addBlockAtSelector() {
  if (!selectedBlock) return;
  const [x, z] = selectedBlock;

  if (g_map[x][z] < 20) {
    if (!stackerActive) {
      stackerStartTime = performance.now();
      stackerActive = true;
    }

    g_map[x][z]++;
    updateWallMesh();

    // Check for win
    if (g_map[x][z] >= stackerHeightTarget) {
      stackerEndTime = performance.now();
      const seconds = ((stackerEndTime - stackerStartTime) / 1000).toFixed(2);
      alert(`🎉 You stacked to ${stackerHeightTarget} in ${seconds} seconds!`);
      stackerActive = false;
    }
  }
}


function removeBlockAtSelector() {
  if (!selectedBlock) return;
  const [x, z] = selectedBlock;
  if (g_map[x][z] > 0) {
    g_map[x][z]--;
    updateWallMesh();
  }
}



function renderMarker() {
  const [x, z] = getMapCoordsInFront();
  const marker = new Cube();
  marker.color = [1, 0, 0, 1];
  marker.textureNum = -1;
  const h = g_map[x][z];
  marker.matrix.translate(x - 16, h - 0.75, z - 16);
  marker.matrix.scale(1, 1, 1);
  marker.render();
}


