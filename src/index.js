// images
import imgPath from './assets/sukunaiPadKid.jpg';
import defaultImg from './assets/eliasoutsidewhoa.jpg';

// textures
import {PerlinTexture} from './shaderClasses/perlin.ts';
import {ImgTexture} from './shaderClasses/img.ts';

// shaders
import CRTShader from './shaderClasses/crtShader.ts'

import erhifhe from './assets/shaders/crt.wgsl?raw';

if(!navigator.gpu) {
    throw new Error('WebGPU not supported on this browser');
}
const adapter = await navigator.gpu.requestAdapter();
if(!adapter) {
    throw new Error('No appropriate GPUAdapter found');
}

const device = await adapter.requestDevice();
const canvas = document.querySelector('canvas');
const context = canvas.getContext('webgpu');

const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
context.configure({
    device: device,
    format: canvasFormat,
});

// REMOVE!!!!!
const chShader = device.createShaderModule({
    code: erhifhe,
});
const chPipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
        module: chShader,
    },
    fragment: {
        module: chShader,
        targets: [{format:canvasFormat}],
    },
});
const sampler = device.createSampler();
// REMOVE!!!!!!

const w = document.getElementById('imgDisp').clientWidth;
const h = document.getElementById('imgDisp').clientHeight;

const perlinTexture = new PerlinTexture(device, canvasFormat, context, {
    size: {width: w, height: h,},
    seed: Math.random() * 100000,
    context,
    config: {
        style: 'natural',
        intensity: 1.0,
        gridSize: 3.0,
        animate: false,
    }
});

// let's do this. *breaks fingers*

// load texture function
async function loadTexture(url) {
    const res = await fetch(url);
    const blob = await res.blob();
    const source = await createImageBitmap(blob, {colorSpaceConversion: 'none'});
    return source;
}
const source = await loadTexture(defaultImg);
const sourceAR = source.width / source.height;

const imgTexture = new ImgTexture({
    size: {width: source.width, height: source.height},
    canvasFormat,
    device,
    source,
});


perlinTexture.resizeCanvas(canvas);

const crtFilter = new CRTShader(device, canvasFormat);
perlinTexture.addShader(crtFilter);

perlinTexture.renderToCanvas();


// SAVE IMAGE
const downloadBtn = document.getElementById('download');
downloadBtn.onclick = function() {
    downloadBtn.href = perlinTexture.dataUrl;
}