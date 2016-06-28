
const glRtt = require('@lfdoherty/gl-rtt')
const rttDoubleBuffered = require('./rtt_double_buffered')

var createTexture = require("@lfdoherty/gl-texture2d")
var shell = require("gl-now")()
var glslify = require("glslify")

var displayTexture = require('@lfdoherty/gl-texture2d-display')
var copyFboToTexture = require('@lfdoherty/gl-fbo-texture2d-copy')

let count = 0

let initHandle: glRtt.Handle;
let rttHandle: rttDoubleBuffered.Handle;
let originalTexture;
shell.on("gl-init", function() {
	let gl = shell.gl

	let dim = [shell.width, shell.height];

	rttHandle = rttDoubleBuffered.create(gl, dim, glslify('./demo.frag'), { float: true});
	initHandle = glRtt.create(gl, dim, glslify('./demo_fill.frag'), { float: true});
	initHandle.run(undefined, rttHandle.readBuffer);
	originalTexture = copyFboToTexture(rttHandle.readBuffer);
})
shell.on("tick", function() {
	rttHandle.run(uniforms => {
		uniforms.original_texture = originalTexture.bind(1);
	});
})
shell.on("gl-render", function(t) {
	displayTexture(rttHandle.readBuffer.color[0]);
})
shell.on('gl-resize', (width, height) => {
	if (!initHandle) return;

	let gl = shell.gl

	let newDim = [width, height];
	initHandle.shape = newDim
	rttHandle.shape = newDim
	initHandle.run(undefined, rttHandle.readBuffer);//just reset the state when we resize
	originalTexture = copyFboToTexture(rttHandle.readBuffer);
})

shell.on("gl-error", function(e) {
	console.log(e);
	throw new Error("WebGL not supported?")
})