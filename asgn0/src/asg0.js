// DrawTriangle.js (c) 2012 matsuda
function main() {  
  // Retrieve <canvas> element
  var canvas = document.getElementById('cnv1');  
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return false; 
  } 

  // Get the rendering context for 2DCG
  var ctx = canvas.getContext('2d');

  // Draw a blue rectangle
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set color to blue
  ctx.fillRect(0, 0, canvas.width, canvas.height);        // Fill a rectangle with the color

  let v1 = new Vector3([2.25, 2.25, 0]);
  drawVector(v1, "red");
}

function drawVector(v,color){
  let canvas = document.getElementById('cnv1');
  let ctx = canvas.getContext("2d");

  let centerX = canvas.width/2;
  let centerY = canvas.height/2;
  
  ctx.beginPath ();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(centerX + v.elements[0] * 20, centerY - v.elements[1] * 20)
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}
function handleDrawEvent(){
  let canvas = document.getElementById('cnv1');
  let ctx = canvas.getContext("2d");

  //clear canvas (plain black background)
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.fillRect(0,0,canvas.width, canvas.height);

  let x1 = parseFloat(document.getElementById("x1").value);
  let y1 = parseFloat(document.getElementById("y1").value);
  let x2 = parseFloat(document.getElementById("x2").value);
  let y2 = parseFloat(document.getElementById("y2").value);

  let v1 = new Vector3([x1,y1,0]);
  let v2 = new Vector3([x2,y2,0]);
  drawVector(v1, "red");
  drawVector(v2, "blue");
}

function handleDrawOperationEvent() {
  let canvas = document.getElementById('cnv1');
  let ctx = canvas.getContext("2d");

  // Clear canvas
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Get inputs
  let x1 = parseFloat(document.getElementById("x1").value);
  let y1 = parseFloat(document.getElementById("y1").value);
  let x2 = parseFloat(document.getElementById("x2").value);
  let y2 = parseFloat(document.getElementById("y2").value);
  let scalar = parseFloat(document.getElementById("scalar").value);
  let operation = document.getElementById("operation").value;

  // Create and draw base vectors
  let v1 = new Vector3([x1, y1, 0]);
  let v2 = new Vector3([x2, y2, 0]);
  drawVector(v1, "red");
  drawVector(v2, "blue");

  if ((operation === "mul" || operation === "div") && isNaN(scalar)) {
    alert("Please enter a scalar value.");
    return;
  }

  // Perform and draw results
  if (operation === "add") {
    let v3 = new Vector3([x1, y1, 0]).add(new Vector3([x2, y2, 0]));
    drawVector(v3, "green");
  } else if (operation === "sub") {
    let v3 = new Vector3([x1, y1, 0]).sub(new Vector3([x2, y2, 0]));
    drawVector(v3, "green");
  } else if (operation === "mul") {
    let v3 = new Vector3([x1, y1, 0]).mul(scalar);
    let v4 = new Vector3([x2, y2, 0]).mul(scalar);
    drawVector(v3, "green");
    drawVector(v4, "green");
  } else if (operation === "div") {
    let v3 = new Vector3([x1, y1, 0]).div(scalar);
    let v4 = new Vector3([x2, y2, 0]).div(scalar);
    drawVector(v3, "green");
    drawVector(v4, "green");
  } else if (operation === "mag") {
      // Print the magnitude results to the console
      console.log("Magnitude v1:", v1.magnitude());
      console.log("Magnitude v2:", v2.magnitude());
  } else if (operation === "norm") {
    // Draw normalized vectors in green
    let v1_norm = new Vector3([x1, y1, 0]).normalize();
    let v2_norm = new Vector3([x2, y2, 0]).normalize();
    drawVector(v1_norm, "green");
    drawVector(v2_norm, "green");
  } else if (operation === "angle") {
    // Calculate the angle between v1 and v2
    let angle = angleBetween(v1, v2);
    console.log("Angle between v1 and v2 (degrees):", angle);
  } else if (operation === "area") {
    let area = areaTriangle(v1, v2);
    console.log("Area of the triangle:", area);
  }


  
}

function angleBetween(v1, v2) {
  // Calculate the dot product
  let dotProd = Vector3.dot(v1, v2);
  // Get the magnitudes
  let mag1 = v1.magnitude();
  let mag2 = v2.magnitude();
  
  // Avoid division by zero and clamp the value to [-1,1]
  let cosAlpha = dotProd / (mag1 * mag2);
  cosAlpha = Math.min(1, Math.max(-1, cosAlpha));
  
  // Calculate the angle in radians then convert to degrees
  let angleRadians = Math.acos(cosAlpha);
  let angleDegrees = angleRadians * 180 / Math.PI;
  return angleDegrees;
}

function areaTriangle(v1, v2) {
  // Compute the cross product of v1 and v2
  let crossProd = Vector3.cross(v1, v2);
  // Compute the magnitude of the cross product (area of parallelogram)
  let areaParallelogram = crossProd.magnitude();
  // The area of the triangle is half the area of the parallelogram
  return areaParallelogram / 2;
}
