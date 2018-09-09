import { Shader } from "./webgl/webgl-shader";
import { Context } from "./webgl/webgl-context";
import { CameraPerspective } from "./CameraPerspective";
import { Mat4, Vec3 } from "./webgl/webgl-math";

interface DirectLight {
    direction: Vec3;
    ambient: Vec3;
    diffuse: Vec3;
    specular: Vec3;
};

interface PointLight {
    position: Vec3;

    constant: number;
    linear: number;
    quadratic: number;

    ambient: Vec3;
    diffuse: Vec3;
    specular: Vec3;
};

interface SpotLight {
    position: Vec3;
    direction: Vec3;
    cutoff: number;
    outercutoff: number;

    constant: number;
    linear: number;
    quadratic: number;

    ambient: Vec3;
    diffuse: Vec3;
    specular: Vec3;
};

interface MeshInfo {
    world_model: Mat4;

    position: Vec3;
    shininess: number;

    diffuse: WebGLTexture;
    specular: WebGLTexture;

    VAO: WebGLVertexArrayObject;
    type?: number;
    indices: boolean;
    size: number;
}

class ShaderWithLight extends Shader {

    protected max_direct_light: number;
    protected max_point_light: number;
    protected max_spot_light: number;

    constructor(ctx: Context, max_direct_light: number = 5, max_point_light: number = 5, max_spot_light: number = 5) {
        super(ctx, `#version 300 es
        layout (location = 0) in vec3 vertex_position;
        layout (location = 1) in vec3 vertex_normal;
        layout (location = 2) in vec2 vertex_tex;

        out vec3 fragment_position;
        out vec3 fragment_normal;
        out vec2 fragment_tex;

        uniform mat4 world_normal;
        uniform mat4 world_model;
        uniform mat4 viewer_world;

        void main() {
            vec4 position = world_model * vec4(vertex_position, 1.0);
            gl_Position = viewer_world * position;
            fragment_tex = vertex_tex;
            fragment_position = position.xyz;
            fragment_normal = (world_normal * vec4(vertex_normal, 1)).xyz;
        }
        `, `#version 300 es
        precision mediump float;

        struct material_t {
            sampler2D diffuse;  // 0
            sampler2D specular; // 1
            float shininess;
        };

        struct direct_light_t {   
            vec3 direction;
            vec3 ambient;
            vec3 diffuse;
            vec3 specular;
        };
        struct point_light_t {
            vec3 position;

            float constant;
            float linear;
            float quadratic;
            
            vec3 ambient;
            vec3 diffuse;
            vec3 specular;
        };
        struct spot_light_t {
            vec3 position;
            vec3 direction;
            float cutoff;
            float outercutoff;
        
            float constant;
            float linear;
            float quadratic;
        
            vec3 ambient;
            vec3 diffuse;
            vec3 specular;
        };

        uniform material_t material;
        uniform vec3 viewer_position;

        uniform int direct_light_num;
        uniform int point_light_num;
        uniform int spot_light_num;

        uniform direct_light_t direct_light [${max_direct_light}];
        uniform point_light_t  point_light  [${max_point_light}];
        uniform spot_light_t   spot_light   [${max_spot_light}];

        in vec3 fragment_position;
        in vec3 fragment_normal;
        in vec2 fragment_tex;

        out vec4 color;

        vec3 calc_direct_light(direct_light_t light, vec3 normal, vec3 view_direct){
            vec3 light_dir = normalize(-light.direction);
            float diff = max(dot(normal, light_dir), 0.0);
            vec3 reflect_dir = reflect(-light_dir, normal);
            float spec = pow(max(dot(view_direct, reflect_dir), 0.0), material.shininess);
            vec3 ambient = light.ambient * vec3(texture(material.diffuse, fragment_tex));
            vec3 diffuse = light.diffuse * diff * vec3(texture(material.diffuse, fragment_tex));
            vec3 specular = light.specular * spec * vec3(texture(material.specular, fragment_tex));
            return (ambient + diffuse + specular);
        }

        vec3 calc_point_light(point_light_t light, vec3 normal, vec3 frag_pos, vec3 view_direct){
            vec3 light_dir = normalize(light.position - frag_pos);
            float diff = max(dot(normal, light_dir), 0.0);
            vec3 reflect_dir = reflect(-light_dir, normal);
            float spec = pow(max(dot(view_direct, reflect_dir), 0.0), material.shininess);
            float distance = length(light.position - frag_pos);
            float attenuation = 1.0 / (light.constant + light.linear * distance + light.quadratic * (distance * distance));
            vec3 ambient = light.ambient *  vec3(texture(material.diffuse, fragment_tex));
            vec3 diffuse = light.diffuse * diff *  vec3(texture(material.diffuse, fragment_tex));
            vec3 specular = light.specular * spec * vec3(texture(material.specular, fragment_tex));
            ambient *= attenuation;
            diffuse *= attenuation;
            specular *= attenuation;
            return (ambient + diffuse + specular);
        }

        vec3 calc_spot_light(spot_light_t light, vec3 normal, vec3 frag_pos, vec3 view_direct){
            vec3 light_dir = normalize(light.position - frag_pos);
            float diff = max(dot(normal, light_dir), 0.0);
            vec3 reflect_dir = reflect(-light_dir, normal);
            float spec = pow(max(dot(view_direct, reflect_dir), 0.0), material.shininess);
            float distance = length(light.position - frag_pos);
            float attenuation = 1.0 / (light.constant + light.linear * distance + light.quadratic * (distance * distance)); 
            float theta = dot(light_dir, normalize(-light.direction)); 
            float epsilon = light.cutoff - light.outercutoff;
            float intensity = clamp((theta - light.outercutoff) / epsilon, 0.0, 1.0);
            vec3 ambient = light.ambient *  vec3(texture(material.diffuse, fragment_tex));;
            vec3 diffuse = light.diffuse * diff *  vec3(texture(material.diffuse, fragment_tex));;
            vec3 specular = light.specular * spec * vec3(texture(material.specular, fragment_tex));
            ambient *= attenuation * intensity;
            diffuse *= attenuation * intensity;
            specular *= attenuation * intensity;
            return (ambient + diffuse + specular);
        }

        void main(){
            vec3 frag_normal = normalize(fragment_normal);
            vec3 view_direct = normalize(viewer_position - fragment_position);
            vec3 result = vec3(0, 0, 0);
            for(int i = 0;i < direct_light_num; i++) 
                result += calc_direct_light(direct_light[i], frag_normal, view_direct);
            for(int i = 0; i < point_light_num; i++)
                result += calc_point_light(point_light[i], frag_normal, fragment_position, view_direct);    
            for(int i = 0; i < spot_light_num; i++)
                result += calc_spot_light(spot_light[i], frag_normal, fragment_position, view_direct);
            color = vec4(result, 1.0);
        }
        `);
        this.max_direct_light = max_direct_light;
        this.max_point_light = max_point_light;
        this.max_spot_light = max_spot_light;
    }

    render(
        direct_light: DirectLight[],
        point_light: PointLight[],
        spot_light: SpotLight[],
        mesh: MeshInfo[],
        camera: CameraPerspective,
        aspect: number = (this.ctx.VIEWPORT[2] - this.ctx.VIEWPORT[0]) / (this.ctx.VIEWPORT[3] - this.ctx.VIEWPORT[1]),
        rad: number = Math.PI / 3,
        near: number = 0.1,
        far: number = 100
    ) {
        console.assert(direct_light.length <= this.max_direct_light);
        console.assert(point_light.length <= this.max_point_light);
        console.assert(spot_light.length <= this.max_spot_light);

        let ctx = this.ctx.ctx;

        super.set_uniform_int(`direct_light_num`, direct_light.length);
        for (let i in direct_light) {
            super.set_uniform(`direct_light[${i}].direction`, direct_light[i].direction);
            super.set_uniform(`direct_light[${i}].ambient`, direct_light[i].ambient);
            super.set_uniform(`direct_light[${i}].diffuse`, direct_light[i].diffuse);
            super.set_uniform(`direct_light[${i}].specular`, direct_light[i].specular);
        }

        super.set_uniform_int(`point_light_num`, point_light.length);
        for (let i in point_light) {
            super.set_uniform(`point_light[${i}].position`, point_light[i].position);

            super.set_uniform(`point_light[${i}].constant`, point_light[i].constant);
            super.set_uniform(`point_light[${i}].linear`, point_light[i].linear);
            super.set_uniform(`point_light[${i}].quadratic`, point_light[i].quadratic);

            super.set_uniform(`point_light[${i}].ambient`, point_light[i].ambient);
            super.set_uniform(`point_light[${i}].diffuse`, point_light[i].diffuse);
            super.set_uniform(`point_light[${i}].specular`, point_light[i].specular);
        }

        super.set_uniform_int(`spot_light_num`, spot_light.length);
        for (let i in spot_light) {
            super.set_uniform(`spot_light[${i}].position`, spot_light[i].position);
            super.set_uniform(`spot_light[${i}].direction`, spot_light[i].direction);
            super.set_uniform(`spot_light[${i}].cutoff`, spot_light[i].cutoff);
            super.set_uniform(`spot_light[${i}].outercutoff`, spot_light[i].outercutoff);

            super.set_uniform(`spot_light[${i}].constant`, spot_light[i].constant);
            super.set_uniform(`spot_light[${i}].linear`, spot_light[i].linear);
            super.set_uniform(`spot_light[${i}].quadratic`, spot_light[i].quadratic);

            super.set_uniform(`spot_light[${i}].ambient`, spot_light[i].ambient);
            super.set_uniform(`spot_light[${i}].diffuse`, spot_light[i].diffuse);
            super.set_uniform(`spot_light[${i}].specular`, spot_light[i].specular);
        }

        super.set_uniform(`viewer_position`, camera.position);
        super.set_uniform(`viewer_world`, camera.matrix(rad, aspect, near, far));

        for (let i in mesh) {
            ctx.bindVertexArray(mesh[i].VAO);
            super.set_uniform(`world_normal`, mesh[i].world_model.inverse().transpose());
            super.set_uniform(`world_model`, mesh[i].world_model);
            super.set_uniform(`material.diffuse`, mesh[i].diffuse, 0);
            super.set_uniform(`material.specular`, mesh[i].specular, 1);
            super.set_uniform(`material.shininess`, mesh[i].shininess);
            if (mesh[i].indices) ctx.drawElements(ctx.TRIANGLES, mesh[i].size, mesh[i].type, 0);
            else ctx.drawArrays(ctx.TRIANGLES, 0, mesh[i].size);
        }
    }
}


export { ShaderWithLight, MeshInfo, PointLight };