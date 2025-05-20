function getScaledUVs(baseUVs, scale) {
    return baseUVs.map(v => v * scale);
  }
  
  class Sphere {
    constructor() {
      this.type = 'sphere';
      this.color = [1.0, 1.0, 1.0, 1.0];
      this.matrix = new Matrix4();
      this.textureNum = -1;
    }
  
    render() {
      const rgba = this.color;
    
      if (typeof g_normalOn !== 'undefined' && g_normalOn) {
        gl.uniform1i(u_whichTexture, -3);
      } else {
        gl.uniform1i(u_whichTexture, this.textureNum);
      }
      
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      gl.uniform1f(u_texColorWeight, 1.0);
  
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

      var d=Math.PI/10;
      var dd=Math.PI/10;
  
      if (!this.cachedVerts) {
        this.cachedVerts = [];
        this.cachedUVs = [];
        this.cachedNormals = [];
      
        for (var t = 0; t < Math.PI; t += d) {
          for (var r = 0; r < 2 * Math.PI; r += d) {
            let p1 = [Math.sin(t)*Math.cos(r), Math.sin(t)*Math.sin(r), Math.cos(t)];
            let p2 = [Math.sin(t+dd)*Math.cos(r), Math.sin(t+dd)*Math.sin(r), Math.cos(t+dd)];
            let p3 = [Math.sin(t)*Math.cos(r+dd), Math.sin(t)*Math.sin(r+dd), Math.cos(t)];
            let p4 = [Math.sin(t+dd)*Math.cos(r+dd), Math.sin(t+dd)*Math.sin(r+dd), Math.cos(t+dd)];
      
            let pushTri = (a, b, c) => {
              this.cachedVerts.push(...a, ...b, ...c);
              this.cachedUVs.push(0, 0, 0, 0, 0, 0);
              this.cachedNormals.push(...a, ...b, ...c); // crude normals = positions
            };
      
            pushTri(p1, p2, p4);
            pushTri(p1, p4, p3);
          }
        }
      }
      
      drawTriangles3DUVNormalBatch(this.cachedVerts, this.cachedUVs, this.cachedNormals);
      
      
  }
}