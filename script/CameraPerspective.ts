import { Vec3, Mat4, Vec4 } from "./webgl/webgl-math";

export class CameraPerspective {
    position: Vec3;
    rotation: Vec3;
    constructor() {
        this.position = new Vec3();
        this.rotation = new Vec3();
    }

    matrix(rad: number, aspect: number, near: number, far: number): Mat4 {
        return Mat4
            .perspective(rad, aspect, near, far)
            .rotation_z(this.rotation.z)
            .rotation_x(this.rotation.x)
            .rotation_y(this.rotation.y)
            .translation(-this.position.x,-this.position.y,-this.position.z);
    }

    direct(): Vec3 {
        let v4 = new Vec4([0, 0, -1, 1]);
        let v3 = new Vec3(Mat4
            .rotation_z(this.rotation.z)
            .rotation_x(this.rotation.x)
            .rotation_y(this.rotation.y)
            .inverse().dot(v4).buffer
        );
        v3.x *= v4.t;
        v3.y *= v4.t;
        v3.z *= v4.t;
        return v3;
    }
}