// images
import imgPath from './assets/sukunaiPadKid.jpg';
import defaultImg from './assets/eliasoutsidewhoa.jpg';
import circleImg from './assets/Red-Circle-PNG-Images-HD.png';

// textures
import TextureObject from './shaderClasses/textureObject.ts'
import {PerlinTexture} from './shaderClasses/perlin.ts';
import {ImgTexture} from './shaderClasses/img.ts';

// shaders
import CRTShader from './shaderClasses/crtShader.ts'
import AsciiShader from './shaderClasses/asciiShader.ts'
import TestShader from './shaderClasses/test.ts'

if(!navigator.gpu) {
    alert('WebGPU is currently only supported in Chromium based browsers.')
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

/**
 * The texture that is displayed onto the canvas through initTexture().
 */
let canvasTexture;

// needs to be used in order to break animation intervals
function detachTexture() {
    if(canvasTexture.timeout)
        clearInterval(canvasTexture.timeout);
    if(canvasTexture.shader != undefined && canvasTexture.shader.timeout)
        clearInterval(canvasTexture.shader.timeout);
}

function initTexture(newTexture) {
    // newTexture is of type TextureObject (exists from before)
    let keepShader = false;
    if(canvasTexture instanceof TextureObject) {
        detachTexture();

        if(canvasTexture.shader != undefined) {
            keepShader = canvasTexture.shader;
        }

        // both textures are of the same type
        if(newTexture.constructor.name == canvasTexture.constructor.name) {

            // if newTexture is the same as canvasTexture AND it does not have a source, do nothing
            if(!Object.hasOwn(newTexture, 'source')) {
                return;
            }
    
            // if newTexture has a source that is the same as canvasTexture.source, then do nothing
            if(newTexture.source == canvasTexture.source) {
                return;
            }
        }
    }

    // otherwise, update texture
    canvasTexture = newTexture;

    if(keepShader != false) {
        initShader(keepShader);
    }

    canvasTexture.resizeCanvas();
    canvasTexture.renderToCanvas();
}

function initShader(shader) {
    canvasTexture.setShader(shader);
    canvasTexture.renderToCanvas();
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
const defaultTexture = createImgTexture(source);

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
    const newTexture = new ImgTexture(device, canvasFormat, context, source);
    initTexture(newTexture);
})

// perlin texture
perlinSelect.addEventListener('click', function() {
    const newTexture = new PerlinTexture(device, canvasFormat, context, divSize);
    initTexture(newTexture);
});


//
// SHADERS
//
const crtSelect = document.getElementById('crtShader');
const asciiSelect = document.getElementById('asciiShader');

// crt shader
crtSelect.addEventListener('click', function() {
    const crtShader = new CRTShader(device, canvasFormat);
    const newShader = crtShader;
    initShader(newShader);
});

// ascii shader
asciiSelect.addEventListener('click', function() {
    const asciiShader = new AsciiShader(device, canvasFormat);
    const newShader = asciiShader;
    initShader(newShader);
})

// remove
const perlinTexture = new PerlinTexture(device, canvasFormat, context, divSize);
// remove

initTexture(perlinTexture);

// remove
const crtShader = new CRTShader(device, canvasFormat);
const asciiShader = new AsciiShader(device, canvasFormat);
initShader(asciiShader);
// remove

// SAVE IMAGE
const downloadBtn = document.getElementById('download');
downloadBtn.onclick = function() {
    downloadBtn.href = canvasTexture.dataUrl;
}

// INSERT
const insertBtn = document.getElementById('insertBtn');
insertBtn.oninput = processInput;

function processInput() {
    const file = insertBtn.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async function(e) {
        const res = await fetch(e.target.result);
        const blob = await res.blob();
        const source = await createImageBitmap(blob, {colorSpaceConversion: 'none'});

        const newTexture = createImgTexture(source);
        initTexture(newTexture);
    }
}