import { Context } from "./script/webgl/webgl-context";
import { ShaderWithLight, MeshInfo } from "./script/ShaderWithLight";
import { Mat4, Vec3, Vec4 } from "./script/webgl/webgl-math";
import { CameraPerspective } from "./script/CameraPerspective";

// console.log(Mat4.I().dot(new Vec4([0,0,0,1])));

let body = document.getElementsByTagName('body')[0] as HTMLBodyElement;
console.assert(body instanceof HTMLBodyElement);
let cav = document.getElementById('cav') as HTMLCanvasElement;
console.assert(cav instanceof HTMLCanvasElement);
let ctx = cav.getContext('webgl2') as WebGL2RenderingContext;
console.assert(ctx instanceof WebGL2RenderingContext);
let context = new Context(ctx);
context.VIEWPORT = [0, 0, cav.width = body.clientWidth, cav.height = body.clientHeight];
let shader = new ShaderWithLight(context);
context.DEPTH_TEST = true;

let cube_vertices = [
    -0.5, -0.5, -0.5, 0.0, 0.0, -1.0, 0.0, 0.0,
    0.5, -0.5, -0.5, 0.0, 0.0, -1.0, 1.0, 0.0,
    0.5, 0.5, -0.5, 0.0, 0.0, -1.0, 1.0, 1.0,
    0.5, 0.5, -0.5, 0.0, 0.0, -1.0, 1.0, 1.0,
    -0.5, 0.5, -0.5, 0.0, 0.0, -1.0, 0.0, 1.0,
    -0.5, -0.5, -0.5, 0.0, 0.0, -1.0, 0.0, 0.0,

    -0.5, -0.5, 0.5, 0.0, 0.0, 1.0, 0.0, 0.0,
    0.5, -0.5, 0.5, 0.0, 0.0, 1.0, 1.0, 0.0,
    0.5, 0.5, 0.5, 0.0, 0.0, 1.0, 1.0, 1.0,
    0.5, 0.5, 0.5, 0.0, 0.0, 1.0, 1.0, 1.0,
    -0.5, 0.5, 0.5, 0.0, 0.0, 1.0, 0.0, 1.0,
    -0.5, -0.5, 0.5, 0.0, 0.0, 1.0, 0.0, 0.0,

    -0.5, 0.5, 0.5, -1.0, 0.0, 0.0, 1.0, 0.0,
    -0.5, 0.5, -0.5, -1.0, 0.0, 0.0, 1.0, 1.0,
    -0.5, -0.5, -0.5, -1.0, 0.0, 0.0, 0.0, 1.0,
    -0.5, -0.5, -0.5, -1.0, 0.0, 0.0, 0.0, 1.0,
    -0.5, -0.5, 0.5, -1.0, 0.0, 0.0, 0.0, 0.0,
    -0.5, 0.5, 0.5, -1.0, 0.0, 0.0, 1.0, 0.0,

    0.5, 0.5, 0.5, 1.0, 0.0, 0.0, 1.0, 0.0,
    0.5, 0.5, -0.5, 1.0, 0.0, 0.0, 1.0, 1.0,
    0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 0.0, 1.0,
    0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 0.0, 1.0,
    0.5, -0.5, 0.5, 1.0, 0.0, 0.0, 0.0, 0.0,
    0.5, 0.5, 0.5, 1.0, 0.0, 0.0, 1.0, 0.0,

    -0.5, -0.5, -0.5, 0.0, -1.0, 0.0, 0.0, 1.0,
    0.5, -0.5, -0.5, 0.0, -1.0, 0.0, 1.0, 1.0,
    0.5, -0.5, 0.5, 0.0, -1.0, 0.0, 1.0, 0.0,
    0.5, -0.5, 0.5, 0.0, -1.0, 0.0, 1.0, 0.0,
    -0.5, -0.5, 0.5, 0.0, -1.0, 0.0, 0.0, 0.0,
    -0.5, -0.5, -0.5, 0.0, -1.0, 0.0, 0.0, 1.0,

    -0.5, 0.5, -0.5, 0.0, 1.0, 0.0, 0.0, 1.0,
    0.5, 0.5, -0.5, 0.0, 1.0, 0.0, 1.0, 1.0,
    0.5, 0.5, 0.5, 0.0, 1.0, 0.0, 1.0, 0.0,
    0.5, 0.5, 0.5, 0.0, 1.0, 0.0, 1.0, 0.0,
    -0.5, 0.5, 0.5, 0.0, 1.0, 0.0, 0.0, 0.0,
    -0.5, 0.5, -0.5, 0.0, 1.0, 0.0, 0.0, 1.0,
];


let cude_vao = ctx.createVertexArray();
ctx.bindVertexArray(cude_vao);

let cube_vbo = ctx.createBuffer();
ctx.bindBuffer(ctx.ARRAY_BUFFER, cube_vbo);
ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(cube_vertices), ctx.STATIC_DRAW);

ctx.vertexAttribPointer(0, 3, ctx.FLOAT, false, 8 * 4, 0);
ctx.enableVertexAttribArray(0);
ctx.vertexAttribPointer(1, 3, ctx.FLOAT, false, 8 * 4, 3 * 4);
ctx.enableVertexAttribArray(1);
ctx.vertexAttribPointer(2, 2, ctx.FLOAT, false, 8 * 4, 6 * 4);
ctx.enableVertexAttribArray(2);

let load_tex = (id: string, val: Uint8Array): WebGLTexture => {
    let tex = ctx.createTexture();
    ctx.bindTexture(ctx.TEXTURE_2D, tex);
    ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGB, 1, 1, 0, ctx.RGB, ctx.UNSIGNED_BYTE, val);
    let image = document.getElementById(id) as HTMLImageElement;
    console.assert(image ? true : false);
    let load_end = () => {
        console.log(id, 'load finished')
        ctx.bindTexture(ctx.TEXTURE_2D, tex);
        ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGB, ctx.RGB, ctx.UNSIGNED_BYTE, image);
        ctx.generateMipmap(ctx.TEXTURE_2D);
    };
    if (image.complete) load_end();
    else image.onload = load_end;
    return tex;
};


let cube_diffuse_tex = load_tex('diffuse', new Uint8Array([0, 0, 0]));
let cube_specular_tex = load_tex('specular', new Uint8Array([0, 0, 0]));

let create_cube = (scale: number, position: Vec3, rotation: Vec3, shininess: number): MeshInfo => {
    let world_model = Mat4
        .translation(position.x, position.y, position.z)
        .rotation_x(rotation.x)
        .rotation_y(rotation.y)
        .rotation_z(rotation.z)
        .scale(scale, scale, scale);
    return {
        world_model,
        position,
        shininess,
        diffuse: cube_diffuse_tex,
        specular: cube_specular_tex,
        VAO: cude_vao,
        indices: false,
        size: cube_vertices.length / 8
    };
};

let cubes: MeshInfo[] = [
    create_cube(1, new Vec3([2, 0, 0]), new Vec3(), 32),
    create_cube(1, new Vec3([-2, 0, 0]), new Vec3(), 32),
    create_cube(1, new Vec3([0, 0, -2]), new Vec3(), 32),
];

shader.use();

let camera = new CameraPerspective();
camera.position.z = 5;

context.CLEAR_COLOR = [0, 0, 0, 1];
ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT);

let draw = t => { };
requestAnimationFrame(draw = t => {
    let dt = t - user_state.display_times;
    user_state.display_times = t;

    context.VIEWPORT = [0, 0, cav.width = body.clientWidth, cav.height = body.clientHeight];

    let v = new Vec4([0, 0, 0, 1]);

    v.z -= user_state.keys.w ? 1 : 0;
    v.z += user_state.keys.s ? 1 : 0;
    v.x -= user_state.keys.a ? 1 : 0;
    v.x += user_state.keys.d ? 1 : 0;

    v = Mat4
        .rotation_z(camera.rotation.z)
        .rotation_x(camera.rotation.x)
        .rotation_y(camera.rotation.y)
        .inverse()
        .dot(v) as Vec4;

    camera.position.x += v.x * v.t * 0.1;
    camera.position.y += v.y * v.t * 0.1;
    camera.position.z += v.z * v.t * 0.1;

    ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT);

    shader.render(
        [
            // {
            //     direction: new Vec3([-1, -1, -1]),
            //     ambient: new Vec3([0.4, 0.4, 0.4]),
            //     diffuse: new Vec3([0.8, 0.8, 0.8]),
            //     specular: new Vec3([1, 1, 1]),
            // }
        ], [
            {
                position: new Vec3([0, 3, 0]),
                ambient: new Vec3([0.1, 0.1, 0.1]),
                diffuse: new Vec3([1.8, 1.8, 1.8]),
                specular: new Vec3([2.5, 2.5, 2.5]),
                constant: 1,
                linear: 0.09,
                quadratic: 0.032
            }
        ], [
            {
                position: camera.position,
                direction: camera.direct(),

                cutoff: Math.cos(12.5 * Math.PI / 180),
                outercutoff: Math.cos(17.5 * Math.PI / 180),

                constant: 1,
                linear: 0.09,
                quadratic: 0.032,

                ambient: new Vec3([0.1, 0.1, 0.1]),
                diffuse: new Vec3([1.3, 1.3, 1.3]),
                specular: new Vec3([2.5, 2.5, 2.5]),
            }
        ], cubes, camera, cav.width / cav.height);
    requestAnimationFrame(draw);
});

let user_state = {
    pointer_locked: false,
    display_times: 0,
    keys: { w: false, a: false, s: false, d: false },
};

cav.onclick = () => {
    if (!document.fullscreenElement) cav.webkitRequestFullScreen();
    if (!document.pointerLockElement) cav.requestPointerLock();
}

document.onkeydown = (e) => { user_state.keys[e.key] = true; };

document.onkeyup = (e) => { user_state.keys[e.key] = false; };

document.onpointerlockchange = () => {
    user_state.pointer_locked = (((document as any).pointerLockElement)) ? true : false;
}

document.onmousemove = e => {
    if (user_state.pointer_locked) {
        camera.rotation.y -= e.movementX / 1000;
        camera.rotation.x += e.movementY / 1000;
    }
}



// // <vec>_<buf>_<tex> 
// // C:color V:vertex N:normal E:element I:instance
// enum MeshDataType {
//     C_VN_,
//     C_VNE_,
//     _VN_C,
//     _VNE_C,
// };

// interface MeshData {
//     type: MeshDataType;
//     destory(): void;
// }






