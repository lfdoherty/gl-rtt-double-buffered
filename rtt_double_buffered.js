

const makeFBO = require("@lfdoherty/gl-fbo")
const drawTriangle = require("@lfdoherty/fast-big-triangle")
const makeShader = require('@lfdoherty/gl-shader')
const f2 = require('@lfdoherty/float2')

const defaultVertexShader = `
attribute vec2 position;
varying vec2 uv;
void main() {
	gl_Position = vec4(position,0.0,1.0);
	uv = 0.5 * (position+1.0);
}`

export interface FboOptions {
	preferFloat?: boolean;
	float?: boolean;
	color?: number;
	depth?: boolean;
	stencil?: boolean;
}

export class BaseHandle {
	constructor(gl, readBuffer, writeBuffer){
		this.gl = gl;
		this.readBuffer = readBuffer;
		this.writeBuffer = writeBuffer

	}
	get texture() {
		return this.readBuffer.color[0];
	}
	get shape() {
		return [].concat(this.readBuffer.shape);//TODO properly wrap with individual element setters
	}
	set shape(s: number[]){
		this.readBuffer.shape = s;
		this.writeBuffer.shape = s;
	}
}

export class Handle extends BaseHandle {
	constructor(gl, readBuffer, writeBuffer, shader) {
		super(gl, readBuffer, writeBuffer);
		this.shader = shader
	}
	_swap() {
		const temp = this.readBuffer;
		this.readBuffer = this.writeBuffer;
		this.writeBuffer = temp;
	}
	getFbo() {
		return this.readBuffer;
	}
	clear() {
		this.writeBuffer.bind();
		const gl = this.gl;
		const dim = this.readBuffer.shape
		gl.viewport(0, 0, dim[0], dim[1])
		gl.clearColor(0, 0, 0, 0)
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		this._swap();
	}
	run(cb/*?: (uniforms)=>void|'do-not-fill-screen'*/) {


		this.writeBuffer.bind();
		this.shader.bind();
		const dim = this.readBuffer.shape
		
		this.shader.uniforms.backBufferTexture = this.readBuffer.color[0].bind(0);
		this.shader.uniforms.pixelDim = [1 / dim[0], 1 / dim[1]];
		this.shader.uniforms.resolution = dim;
		this.shader.uniforms.frameId = Math.random();
		
		const gl = this.gl

		if(cb){
			const doNotFillScreen = cb(this.shader.uniforms);
			if (doNotFillScreen !== 'do-not-fill-screen'){
				//gl.disable(gl.DEPTH_TEST);
				drawTriangle(gl);
			}
		}else{
			//gl.disable(gl.DEPTH_TEST);
			drawTriangle(gl);
		}

		this._swap();
		gl.bindFramebuffer(gl.FRAMEBUFFER, null)//TODO find a way to safely skip expensive safeguards like this
		gl.useProgram(null)
	}
}

//export interface Pass {
//	(cb/*?: (uniforms) => void | 'do-not-fill-screen'*/);
//}

export function make(
	gl: WebGLRenderingContext, 
	dim: f2.Duck, 
	shaderStrings: string | { vert: string, frag: string },
	options: FboOptions = {}): Handle {

	const vertShader = shaderStrings.vert || defaultVertexShader;
	const fragShader = shaderStrings.frag || shaderStrings;

	const readBuffer = makeFBO(gl, f2.as(dim).toArray(), options);
	const writeBuffer = makeFBO(gl, f2.as(dim).toArray(), options);

	const shader = makeShader(gl, vertShader, fragShader);
	//TODO check that fragment shader defines the right input sampler2D

	const handle = new Handle(gl, readBuffer, writeBuffer, shader);
	return handle;
}

export type PassesType = any;//{ [passName: string]: string | { vert: string, frag: string } };
