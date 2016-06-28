

const createFBO = require("@lfdoherty/gl-fbo")
const drawTriangle = require("@lfdoherty/fast-big-triangle")
const createShader = require('@lfdoherty/gl-shader')

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
		gl.bindFramebuffer(gl.FRAMEBUFFER, null)
		gl.useProgram(null)
	}
}

//export interface Pass {
//	(cb/*?: (uniforms) => void | 'do-not-fill-screen'*/);
//}
export class MultipassHandle extends BaseHandle {
	_passes;//: { [passName: string]/*: Pass */};
	get passes(): any/*{ [passName: string]: Pass }*/ {
		return this._passes;
	}
	constructor(gl, readBuffer, writeBuffer, passes: PassesType) {
		super(gl, readBuffer, writeBuffer);

		this._passes = {};
		Object.keys(passes).forEach(passName => {
			const passDef = passes[passName];

			const vertShader = passDef.vert || defaultVertexShader;
			const fragShader = passDef.frag || passDef;

			const shader = createShader(this.gl, vertShader, fragShader);
			const local = this;
			this._passes[passName] = function(cb) {
				local.writeBuffer.bind();
				shader.bind();
				const dim = local.readBuffer.shape
				shader.uniforms.backBufferTexture = local.readBuffer.color[0].bind(0);
				shader.uniforms.pixelDim = [1 / dim[0], 1 / dim[1]];
				shader.uniforms.resolution = dim;
				shader.uniforms.frameId = Math.random();
				
				if (cb) {
					const result = cb(shader.uniforms);
					if(result !== 'do-not-fill-screen'){
						//gl.disable(gl.DEPTH_TEST);
						drawTriangle(gl);
					}
				}else{
					//gl.disable(gl.DEPTH_TEST);
					drawTriangle(gl);
				}
				local._swap();
			}
		})
	}
	_swap() {
		const temp = this.readBuffer;
		this.readBuffer = this.writeBuffer;
		this.writeBuffer = temp;
	}
	run() {
		throw new Error('cannot "run" a multipass handle, you must run each pass separately, via the "passes" property.');
	}
}

export function create(
	gl: WebGLRenderingContext, 
	dim: number[], 
	shaderStrings: string | { vert: string, frag: string },
	options: FboOptions = {}): Handle {

	const vertShader = shaderStrings.vert || defaultVertexShader;
	const fragShader = shaderStrings.frag || shaderStrings;

	const readBuffer = createFBO(gl, dim, options);
	const writeBuffer = createFBO(gl, dim, options);

	const shader = createShader(gl, vertShader, fragShader);
	//TODO check that fragment shader defines the right input sampler2D

	const handle = new Handle(gl, readBuffer, writeBuffer, shader);
	return handle;
}

export type PassesType = any;//{ [passName: string]: string | { vert: string, frag: string } };

export function createMultipass(
	gl: WebGLRenderingContext,
	dim: number[],
	passes: PassesType,
	options: FboOptions = {}): MultipassHandle {

	const readBuffer = createFBO(gl, dim, options);
	const writeBuffer = createFBO(gl, dim, options);

	const handle = new MultipassHandle(gl, readBuffer, writeBuffer, passes);
	return handle;

}