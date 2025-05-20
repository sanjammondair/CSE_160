function getScaledUVs(baseUVs, scale) {
  return baseUVs.map(v => v * scale);
}

class Cube {
  constructor() {
    this.type = 'cube';
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.textureNum = -1;
  }

  render() {
    const rgba = this.color;
  
    gl.uniform1i(u_whichTexture, this.textureNum);
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniform1f(u_texColorWeight, 1.0);

    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    // FRONT (Z-)
    drawTriangle3DUVNormal(
      [0,0,0, 1,1,0, 1,0,0], 
      [0,0, 1,1, 1,0], 
      [0,0,-1, 0,0,-1, 0,0,-1]);
    drawTriangle3DUVNormal(
      [0,0,0, 0,1,0, 1,1,0], 
      [0,0, 0,1, 1,1],
      [0,0,-1, 0,0,-1, 0,0,-1]);


    // BACK (Z+)
    //gl.uniform4f(u_FragColor, rgba[0]*0.9, rgba[1]*0.9, rgba[2]*0.9, rgba[3]);
    drawTriangle3DUVNormal(
      [1,0,1, 1,1,1, 0,0,1],
      [0,0, 1,1, 0,0],
      [0,0,1, 0,0,1, 0,0,1]);
    drawTriangle3DUVNormal(
      [0,0,1, 1,1,1, 0,1,1],
      [0,0, 1,1, 0,1],
      [0,0,1, 0,0,1, 0,0,1]);

    // TOP (Y+)
    //gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    drawTriangle3DUVNormal(
      [0,1,0, 0,1,1, 1,1,1],
      [0,0, 0,1, 1,1],
      [0,1,0, 0,1,0, 0,1,0]);
    drawTriangle3DUVNormal(
      [0,1,0, 1,1,1, 1,1,0],
      [0,0, 1,1, 1,0],
      [0,1,0, 0,1,0, 0,1,0]);

    // BOTTOM (Y-)
    //gl.uniform4f(u_FragColor, rgba[0]*0.75, rgba[1]*0.75, rgba[2]*0.75, rgba[3]);
    drawTriangle3DUVNormal(
      [0,0,0, 1,0,1, 0,0,1],
      [0,0, 1,1, 0,1],
      [0,-1,0, 0,-1,0, 0,-1,0]);
    drawTriangle3DUVNormal(
      [0,0,0, 1,0,0, 1,0,1],
      [0,0, 1,0, 1,1],
      [0,-1,0, 0,-1,0, 0,-1,0]);

    // RIGHT (X+)
    //gl.uniform4f(u_FragColor, rgba[0]*0.8, rgba[1]*0.8, rgba[2]*0.8, rgba[3]);
    drawTriangle3DUVNormal(
      [1,0,0, 1,1,0, 1,1,1],
      [0,0, 0,1, 1,1],
      [1,0,0, 1,0,0, 1,0,0]);
    drawTriangle3DUVNormal(
      [1,0,0, 1,1,1, 1,0,1],
      [0,0, 1,1, 1,0],
      [1,0,0, 1,0,0, 1,0,0]);

    // LEFT (X-)
    //gl.uniform4f(u_FragColor, rgba[0]*0.7, rgba[1]*0.7, rgba[2]*0.7, rgba[3]);
    drawTriangle3DUVNormal(
      [0,0,0, 0,1,1, 0,1,0],
      [0,0, 1,1, 0,1],
      [-1,0,0, -1,0,0, -1,0,0]);
    drawTriangle3DUVNormal(
      [0,0,0, 0,0,1, 0,1,1],
      [0,0, 1,0, 1,1],
      [-1,0,0, -1,0,0, -1,0,0]);
}


renderFast(vertexArray, uvArray, normalArray) {
  //new
  const transform = this.matrix;

  const cubeVerts = [
    // FRONT
    [0,0,0, 1,1,0, 1,0,0], [0,0,0, 0,1,0, 1,1,0],
    // BACK
    [1,0,1, 1,1,1, 0,0,1], [0,0,1, 1,1,1, 0,1,1],
    // TOP
    [0,1,0, 0,1,1, 1,1,1], [0,1,0, 1,1,1, 1,1,0],
    // BOTTOM
    [0,0,0, 1,0,1, 0,0,1], [0,0,0, 1,0,0, 1,0,1],
    // RIGHT
    [1,0,0, 1,1,0, 1,1,1], [1,0,0, 1,1,1, 1,0,1],
    // LEFT
    [0,0,0, 0,1,1, 0,1,0], [0,0,0, 0,0,1, 0,1,1]
  ];

  const cubeUVs = [
    [0,0, 1,1, 1,0], [0,0, 0,1, 1,1],
    [0,0, 1,1, 0,0], [0,0, 1,1, 0,1],
    [0,0, 0,1, 1,1], [0,0, 1,1, 1,0],
    [0,0, 1,1, 0,1], [0,0, 1,0, 1,1],
    [0,0, 0,1, 1,1], [0,0, 1,1, 1,0],
    [0,0, 1,1, 0,1], [0,0, 1,0, 1,1]
  ];

  const cubeNormals = [
    [0, 0, -1], [0, 0, -1],
    [0, 0,  1], [0, 0,  1],
    [0, 1,  0], [0, 1,  0],
    [0,-1,  0], [0,-1,  0],
    [1, 0,  0], [1, 0,  0],
    [-1,0,  0], [-1,0,  0]
  ];

  for (let i = 0; i < cubeVerts.length; i++) {
    const verts = cubeVerts[i];
    const uv = cubeUVs[i];
    const normal = cubeNormals[i];

    // Push transformed vertex positions
    for (let j = 0; j < verts.length; j += 3) {
      const v = new Vector4([verts[j], verts[j + 1], verts[j + 2], 1]);
      const tv = transform.multiplyVector4(v);
      vertexArray.push(tv.elements[0], tv.elements[1], tv.elements[2]);
    
      // ✅ Push same normal per vertex
      normalArray.push(...normal); // This pushes 3 floats per vertex
    }
    

    // Push UVs (should be 6 floats per triangle)
    uvArray.push(...uv);
  }
}


}

