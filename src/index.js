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

// let's do this. *breaks fingers*
function detachTexture() {
    if(texture.timeout) 
        clearInterval(texture.timeout);
}

function initTexture() {
    texture.addShader(crtFilter);
    texture.initConfig();
    texture.resizeCanvas();
    texture.renderToCanvas();
}

// load texture function
async function loadTexture(url) {
    const res = await fetch(url);
    const blob = await res.blob();
    const source = await createImageBitmap(blob, {colorSpaceConversion: 'none'});
    return source;
}
// default source
const source = await loadTexture(defaultImg);


let texture = new ImgTexture(device, canvasFormat, context, source);
const divWidth = document.getElementById('imgDisp').clientWidth;
const divHeight = document.getElementById('imgDisp').clientHeight;

// TEXTURE PRESETS
const defaultImgSelect = document.getElementById('defaultImg');
const perlinSelect = document.getElementById('perlinTexture');

defaultImgSelect.addEventListener('click', function() {
    detachTexture();
    texture = new ImgTexture(device, canvasFormat, context, source);
    initTexture();
})

perlinSelect.addEventListener('click', function() {
    detachTexture();
    texture = new PerlinTexture(device, canvasFormat, context, {
        size: {width: divWidth, height: divHeight,},
        seed: Math.random() * 100000,
        context,
        config: {
            style: 'natural',
            intensity: 1.0,
            gridSize: 3.0,
            animate: false,
        }
    });
    initTexture();
});

const crtFilter = new CRTShader(device, canvasFormat);

initTexture();


// SAVE IMAGE
const downloadBtn = document.getElementById('download');
downloadBtn.onclick = function() {
    downloadBtn.href = texture.dataUrl;
}