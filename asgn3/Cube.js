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

    // FRONT
    drawTriangle3DUV([0,0,0, 1,1,0, 1,0,0], [0,0, 1,1, 1,0]);
    drawTriangle3DUV([0,0,0, 0,1,0, 1,1,0], [0,0, 0,1, 1,1]);

    // BACK
    gl.uniform4f(u_FragColor, rgba[0]*0.9, rgba[1]*0.9, rgba[2]*0.9, rgba[3]);
    drawTriangle3DUV([1,0,1, 1,1,1, 0,0,1], [0,0, 1,1, 0,0]);
    drawTriangle3DUV([0,0,1, 1,1,1, 0,1,1], [0,0, 1,1, 0,1]);

    // TOP
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    drawTriangle3DUV([0,1,0, 0,1,1, 1,1,1], [0,0, 0,1, 1,1]);
    drawTriangle3DUV([0,1,0, 1,1,1, 1,1,0], [0,0, 1,1, 1,0]);

    // BOTTOM
    gl.uniform4f(u_FragColor, rgba[0]*0.75, rgba[1]*0.75, rgba[2]*0.75, rgba[3]);
    drawTriangle3DUV([0,0,0, 1,0,1, 0,0,1], [0,0, 1,1, 0,1]);
    drawTriangle3DUV([0,0,0, 1,0,0, 1,0,1], [0,0, 1,0, 1,1]);

    // RIGHT
    gl.uniform4f(u_FragColor, rgba[0]*0.8, rgba[1]*0.8, rgba[2]*0.8, rgba[3]);
    drawTriangle3DUV([1,0,0, 1,1,0, 1,1,1], [0,0, 0,1, 1,1]);
    drawTriangle3DUV([1,0,0, 1,1,1, 1,0,1], [0,0, 1,1, 1,0]);

    // LEFT
    gl.uniform4f(u_FragColor, rgba[0]*0.7, rgba[1]*0.7, rgba[2]*0.7, rgba[3]);
    drawTriangle3DUV([0,0,0, 0,1,1, 0,1,0], [0,0, 1,1, 0,1]);
    drawTriangle3DUV([0,0,0, 0,0,1, 0,1,1], [0,0, 1,0, 1,1]);
  }

  renderFast(vertexArray, uvArray) {
    const transform = this.matrix;
    const verts = [];
    const uvs = [];

    // Define a unit cube centered at (0,0,0), but we’ll just scale/translate
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
      // Each triangle gets 3 UVs
      [0,0, 1,1, 1,0], [0,0, 0,1, 1,1],
      [0,0, 1,1, 0,0], [0,0, 1,1, 0,1],
      [0,0, 0,1, 1,1], [0,0, 1,1, 1,0],
      [0,0, 1,1, 0,1], [0,0, 1,0, 1,1],
      [0,0, 0,1, 1,1], [0,0, 1,1, 1,0],
      [0,0, 1,1, 0,1], [0,0, 1,0, 1,1]
    ];

    // Transform and flatten
    for (let i = 0; i < cubeVerts.length; i++) {
      for (let j = 0; j < 9; j += 3) {
        let vec = new Vector4([cubeVerts[i][j], cubeVerts[i][j+1], cubeVerts[i][j+2], 1]);
        vec = transform.multiplyVector4(vec);
        verts.push(vec.elements[0], vec.elements[1], vec.elements[2]);
      }
      uvs.push(...cubeUVs[i]);
    }

    vertexArray.push(...verts);
    uvArray.push(...uvs);
  }
}

