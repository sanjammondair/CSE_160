function cloneVector(v) {
    let c = new Vector3();
    c.elements[0] = v.elements[0];
    c.elements[1] = v.elements[1];
    c.elements[2] = v.elements[2];
    return c;
  }
  
class Camera {
    constructor() {
      this.fov = 60;
      this.eye = new Vector3([0, 0, 3]);
      this.at = new Vector3([0, 0, -100]);
      this.up = new Vector3([0, 1, 0]);
  
      this.viewMatrix = new Matrix4();
      this.projectionMatrix = new Matrix4();
  
      this.updateView();
      this.updateProjection();
    }
  
    updateView() {
      this.viewMatrix.setLookAt(
        this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
        this.at.elements[0], this.at.elements[1], this.at.elements[2],
        this.up.elements[0], this.up.elements[1], this.up.elements[2]
      );
    }
  
    updateProjection() {
      this.projectionMatrix.setPerspective(this.fov, canvas.width / canvas.height, 0.1, 100);
    }
  
    moveForward() {
        // Calculate forward direction vector = at - eye
        let fx = this.at.elements[0] - this.eye.elements[0];
        let fy = this.at.elements[1] - this.eye.elements[1];
        let fz = this.at.elements[2] - this.eye.elements[2];
      
        // Normalize the forward vector
        let len = Math.sqrt(fx * fx + fy * fy + fz * fz);
        fx /= len;
        fy /= len;
        fz /= len;
      
        // Scale forward vector by movement speed
        const speed = 0.2;
        fx *= speed;
        fy *= speed;
        fz *= speed;
      
        // Add scaled forward vector to both eye and at
        this.eye.elements[0] += fx;
        this.eye.elements[1] += fy;
        this.eye.elements[2] += fz;
      
        this.at.elements[0] += fx;
        this.at.elements[1] += fy;
        this.at.elements[2] += fz;
      
        this.updateView();
      }
      
      
      
  
      moveBackward() {
        let fx = this.eye.elements[0] - this.at.elements[0];
        let fy = this.eye.elements[1] - this.at.elements[1];
        let fz = this.eye.elements[2] - this.at.elements[2];
      
        let len = Math.sqrt(fx * fx + fy * fy + fz * fz);
        fx /= len;
        fy /= len;
        fz /= len;
      
        const speed = 0.2;
        fx *= speed;
        fy *= speed;
        fz *= speed;
      
        this.eye.elements[0] += fx;
        this.eye.elements[1] += fy;
        this.eye.elements[2] += fz;
      
        this.at.elements[0] += fx;
        this.at.elements[1] += fy;
        this.at.elements[2] += fz;
      
        this.updateView();
      }
      
      
  
      moveLeft() {
        let fx = this.at.elements[0] - this.eye.elements[0];
        let fy = this.at.elements[1] - this.eye.elements[1];
        let fz = this.at.elements[2] - this.eye.elements[2];
      
        // Cross product: up × forward
        let sx = this.up.elements[1] * fz - this.up.elements[2] * fy;
        let sy = this.up.elements[2] * fx - this.up.elements[0] * fz;
        let sz = this.up.elements[0] * fy - this.up.elements[1] * fx;
      
        let len = Math.sqrt(sx * sx + sy * sy + sz * sz);
        sx /= len;
        sy /= len;
        sz /= len;
      
        const speed = 0.2;
        sx *= speed;
        sy *= speed;
        sz *= speed;
      
        this.eye.elements[0] += sx;
        this.eye.elements[1] += sy;
        this.eye.elements[2] += sz;
      
        this.at.elements[0] += sx;
        this.at.elements[1] += sy;
        this.at.elements[2] += sz;
      
        this.updateView();
      }
      
      
  
      moveRight() {
        let fx = this.at.elements[0] - this.eye.elements[0];
        let fy = this.at.elements[1] - this.eye.elements[1];
        let fz = this.at.elements[2] - this.eye.elements[2];
      
        // Cross product: forward × up
        let sx = fy * this.up.elements[2] - fz * this.up.elements[1];
        let sy = fz * this.up.elements[0] - fx * this.up.elements[2];
        let sz = fx * this.up.elements[1] - fy * this.up.elements[0];
      
        let len = Math.sqrt(sx * sx + sy * sy + sz * sz);
        sx /= len;
        sy /= len;
        sz /= len;
      
        const speed = 0.2;
        sx *= speed;
        sy *= speed;
        sz *= speed;
      
        this.eye.elements[0] += sx;
        this.eye.elements[1] += sy;
        this.eye.elements[2] += sz;
      
        this.at.elements[0] += sx;
        this.at.elements[1] += sy;
        this.at.elements[2] += sz;
      
        this.updateView();
      }
      
      
    panLeft() {
      this.rotateAroundUp(5);
    }
  
    panRight() {
      this.rotateAroundUp(-5);
    }
  
    rotateAroundUp(angle) {
        let fx = this.at.elements[0] - this.eye.elements[0];
        let fy = this.at.elements[1] - this.eye.elements[1];
        let fz = this.at.elements[2] - this.eye.elements[2];
      
        let f = new Vector3([fx, fy, fz]);
        let rotMatrix = new Matrix4().setRotate(angle, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        let f_prime = rotMatrix.multiplyVector3(f);
      
        this.at.elements[0] = this.eye.elements[0] + f_prime.elements[0];
        this.at.elements[1] = this.eye.elements[1] + f_prime.elements[1];
        this.at.elements[2] = this.eye.elements[2] + f_prime.elements[2];
      
        this.updateView();
      }

      panHorizontal(angleDelta) {
        // Assume angleDelta is in degrees
        let rad = angleDelta * Math.PI / 180.0;
      
        // Calculate the direction vector (at - eye)
        let dx = this.at.elements[0] - this.eye.elements[0];
        let dz = this.at.elements[2] - this.eye.elements[2];

        let newDx = dx * Math.cos(rad) - dz * Math.sin(rad);
        let newDz = dx * Math.sin(rad) + dz * Math.cos(rad);

        this.at.elements[0] = this.eye.elements[0] + newDx;
        this.at.elements[2] = this.eye.elements[2] + newDz;

      
        this.viewMatrix.setLookAt(
            this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
            this.at.elements[0], this.at.elements[1], this.at.elements[2],
            this.up.elements[0], this.up.elements[1], this.up.elements[2]
          );
          
                    
      }
      panVertical(angleDelta) {
        let rad = angleDelta * Math.PI / 180.0;
      
        let dx = this.at.elements[0] - this.eye.elements[0];
        let dy = this.at.elements[1] - this.eye.elements[1];
        let dz = this.at.elements[2] - this.eye.elements[2];
        let dir = new Vector3([dx, dy, dz]);
      
        // Compute right vector manually (cross product of dir × up)
        let right = new Vector3([
          dir.elements[1] * this.up.elements[2] - dir.elements[2] * this.up.elements[1],
          dir.elements[2] * this.up.elements[0] - dir.elements[0] * this.up.elements[2],
          dir.elements[0] * this.up.elements[1] - dir.elements[1] * this.up.elements[0]
        ]);
      
        // Normalize right vector
        let len = Math.sqrt(
          right.elements[0] ** 2 + right.elements[1] ** 2 + right.elements[2] ** 2
        );
        right.elements[0] /= len;
        right.elements[1] /= len;
        right.elements[2] /= len;
      
        let rotMat = new Matrix4().setRotate(angleDelta, right.elements[0], right.elements[1], right.elements[2]);
        let newDir = rotMat.multiplyVector3(dir);
      
        this.at.elements[0] = this.eye.elements[0] + newDir.elements[0];
        this.at.elements[1] = this.eye.elements[1] + newDir.elements[1];
        this.at.elements[2] = this.eye.elements[2] + newDir.elements[2];
      
        this.updateView();
      }
      
      
      
      
      
  }