
const glRtt = require('@lfdoherty/gl-rtt')
const rttDoubleBuffered = require('./rtt_double_buffered')

//const createTexture = require("@lfdoherty/gl-texture2d")
const shell = require("gl-now")()
const glslify = require("glslify")
const f2 = require('@lfdoherty/float2')

const displayTexture = require('@lfdoherty/gl-texture2d-display')
const copyFboToTexture = require('@lfdoherty/gl-fbo-texture2d-copy')

//let count = 0

let initHandle: glRtt.Handle;
let rttHandle: rttDoubleBuffered.Handle;
let originalTexture;
shell.on("gl-init", function() {
	const gl = shell.gl

	const dim = f2.vec(shell.width, shell.height);

	rttHandle = rttDoubleBuffered.make(gl, dim, glslify('./demo.frag'), { float: true});
	initHandle = glRtt.create(gl, dim, glslify('./demo_fill.frag'), { float: true});
	initHandle.run(undefined, rttHandle.readBuffer);
	originalTexture = copyFboToTexture(rttHandle.readBuffer);
})
shell.on("tick", function() {
	rttHandle.run(uniforms => {
		uniforms.originalTexture = originalTexture.bind(1);
	});
})
shell.on("gl-render", () => {
	displayTexture(rttHandle.readBuffer.color[0]);
})
shell.on('gl-resize', (width, height) => {
	if (!initHandle) return;

	//const gl = shell.gl

	const newDim = [width, height];
	initHandle.shape = newDim
	rttHandle.shape = newDim
	initHandle.run(undefined, rttHandle.readBuffer);//just reset the state when we resize
	originalTexture = copyFboToTexture(rttHandle.readBuffer);
})

shell.on("gl-error", function(e) {
	console.log(e);
	throw new Error("WebGL not supported?")
})