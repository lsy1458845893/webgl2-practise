export class Context {

    ctx: WebGL2RenderingContext;

    protected state: {
        CULL_FACE: boolean;
        DEPTH_TEST: boolean;
        CLEAR_COLOR: [number, number, number, number];
        VIEWPORT: [number, number, number, number];
    }

    constructor(ctx: WebGL2RenderingContext) {
        this.ctx = ctx;
        this.state = {
            CULL_FACE: false,
            DEPTH_TEST: false,
            CLEAR_COLOR: [0, 0, 0, 0],
            VIEWPORT: [0, 0, 0, 0]
        };
    }

    get CULL_FACE(): boolean { return this.state.CULL_FACE; }
    set CULL_FACE(v: boolean) {
        if (this.state.CULL_FACE != v) {
            if (v) this.ctx.enable(this.ctx.CULL_FACE);
            else this.ctx.disable(this.ctx.CULL_FACE);
            this.state.CULL_FACE = v;
        }
    }

    get DEPTH_TEST(): boolean { return this.state.DEPTH_TEST; }
    set DEPTH_TEST(v: boolean) {
        if (this.state.DEPTH_TEST != v) {
            if (v) this.ctx.enable(this.ctx.DEPTH_TEST);
            else this.ctx.disable(this.ctx.DEPTH_TEST);
            this.state.DEPTH_TEST = v;
        }
    }


    get CLEAR_COLOR(): [number, number, number, number] { return this.state.CLEAR_COLOR; }
    set CLEAR_COLOR(v: [number, number, number, number]) {
        let s = this.state.CLEAR_COLOR;
        if (s[0] != v[0] || s[1] != v[1] || s[2] != v[2] || s[3] != v[3]) {
            this.ctx.clearColor(v[0], v[1], v[2], v[3]);
            this.state.CLEAR_COLOR = v;
        }
    }

    get VIEWPORT(): [number, number, number, number] { return this.state.VIEWPORT; }
    set VIEWPORT(v: [number, number, number, number]) {
        let s = this.state.VIEWPORT;
        if (s[0] != v[0] || s[1] != v[1] || s[2] != v[2] || s[3] != v[3]) {
            this.ctx.viewport(v[0], v[1], v[2], v[3]);
            this.state.VIEWPORT = v;
        }
    }
}