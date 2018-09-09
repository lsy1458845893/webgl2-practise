import { Context } from "./webgl-context";
import { Vec2, Vec3, Vec4, Mat4 } from "./webgl-math";

export class Shader {

    protected ctx: Context;
    protected shader: WebGLProgram;

    private uniform_location: {
        [proto: string]: WebGLUniformLocation
    };

    constructor(_ctx: Context, v: string, f: string) {
        let ctx = _ctx.ctx;
        function webgl_compile_program(ctx: WebGL2RenderingContext, vs: string, fs: string): WebGLProgram {
            function compile_shader(src: string, type: number): WebGLShader {
                const shader = ctx.createShader(type);
                ctx.shaderSource(shader, src);
                ctx.compileShader(shader);
                if (!ctx.getShaderParameter(shader, ctx.COMPILE_STATUS)) {
                    var info = (ctx.getShaderInfoLog(shader) as string);
                    ctx.deleteShader(shader);
                    console.log(src);
                    throw new Error(info);
                }
                return shader as WebGLShader;
            }

            var program = ctx.createProgram();

            let v: WebGLShader = compile_shader(vs, ctx.VERTEX_SHADER);
            let f: WebGLShader = compile_shader(fs, ctx.FRAGMENT_SHADER);

            ctx.attachShader(program, v);
            ctx.attachShader(program, f);

            ctx.linkProgram(program);

            if (!ctx.getProgramParameter(program, ctx.LINK_STATUS)) {
                var info = ctx.getProgramInfoLog(program) as string;
                ctx.deleteShader(v);
                ctx.deleteShader(f);
                ctx.deleteProgram(program);
                throw new Error(info);
            }
            ctx.deleteShader(v);
            ctx.deleteShader(f);
            return program as WebGLProgram;
        }
        this.shader = webgl_compile_program(ctx, v, f);
        this.uniform_location = {};
        this.ctx = _ctx;
    }

    use(): void {
        this.ctx.ctx.useProgram(this.shader);
    }

    get_location(name): WebGLUniformLocation {
        let location = this.uniform_location[name] ||
            (this.uniform_location[name] = this.ctx.ctx.getUniformLocation(this.shader, name));
        console.assert(location ? true : false);
        return location;
    }

    set_uniform(name: string, val: number | Vec2 | Vec3 | Vec4 | Mat4 | WebGLTexture, index: number = 0): void {
        let ctx = this.ctx.ctx;
        let location = this.get_location(name);
        if (val instanceof Vec2) ctx.uniform2fv(location, val.buffer);
        else if (val instanceof Vec3) ctx.uniform3fv(location, val.buffer);
        else if (val instanceof Vec4) ctx.uniform4fv(location, val.buffer);
        else if (val instanceof Mat4) ctx.uniformMatrix4fv(location, false, val.buffer);
        else if (val instanceof WebGLTexture) {
            ctx.activeTexture(ctx.TEXTURE0 + index);
            ctx.bindTexture(ctx.TEXTURE_2D, val);
            ctx.uniform1i(location, index);
        } else ctx.uniform1f(location, val);
    }

    set_uniform_int(name: string, val: number) {
        let ctx = this.ctx.ctx;
        let location = this.get_location(name);
        ctx.uniform1i(location, val);
    }
}