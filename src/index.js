// images
import imgPath from './assets/sukunaiPadKid.jpg';
import defaultImg from './assets/eliasoutsidewhoa.jpg';

// textures
import {PerlinTexture} from './shaderClasses/perlin.ts';
import {ImgTexture} from './shaderClasses/img.ts';

// shaders
import CRTShader from './shaderClasses/crtShader.ts'
import AsciiShader from './shaderClasses/asciiShader.ts'

if(!navigator.gpu) {
    alert('WebGPU is not supported in this browser')
    throw new Error('WebGPU not supported on this browser');
}
const adapter = await navigator.gpu.requestAdapter();
if(!adapter) {
    alert(`No appropriate GPUAdapter found. There are either no GPUs available for the browser, or the browser settings has graphics acceleration turned off.`)
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
    texture.setShader(shader);
    texture.initConfig();
    texture.resizeCanvas();
    texture.renderToCanvas();
}

function createImgTexture(source) {
    return new ImgTexture(device, canvasFormat, context, source);
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

// default texture
let texture = createImgTexture(source);

const divSize = {
    width: document.getElementById('imgDisp').clientWidth,
    height: document.getElementById('imgDisp').clientHeight
}

//
// TEXTURE PRESETS
//
const defaultImgSelect = document.getElementById('defaultImg');
const perlinSelect = document.getElementById('perlinTexture');

// elias texture
defaultImgSelect.addEventListener('click', function() {
    detachTexture();
    texture = new ImgTexture(device, canvasFormat, context, source);
    initTexture();
})

// perlin texture
perlinSelect.addEventListener('click', function() {
    detachTexture();
    texture = new PerlinTexture(device, canvasFormat, context, {
        size: divSize,
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


//
// SHADERS
//
const crtSelect = document.getElementById('crtShader');
const asciiSelect = document.getElementById('asciiShader');

let shader;

// crt shader
crtSelect.addEventListener('click', function() {
    const crtShader = new CRTShader(device, canvasFormat);
    shader = crtShader;
    initTexture();
});

// ascii shader
asciiSelect.addEventListener('click', function() {
    const asciiShader = new AsciiShader(device, canvasFormat);
    shader = asciiShader;
    initTexture();
})

// remove
const asciiShader = new AsciiShader(device, canvasFormat);
shader = asciiShader;
// remove
initTexture();


// SAVE IMAGE
const downloadBtn = document.getElementById('download');
downloadBtn.onclick = function() {
    downloadBtn.href = texture.dataUrl;
}

// INSERT
const insertBtn = document.getElementById('insertBtn');
insertBtn.onchange = processInput;

function processInput() {
    const file = insertBtn.files[0];
    console.log(file)
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async function(e) {
        const res = await fetch(e.target.result);
        const blob = await res.blob();
        const source = await createImageBitmap(blob, {colorSpaceConversion: 'none'});

        texture = createImgTexture(source);
        initTexture();
    }
}