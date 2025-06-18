// images
import imgPath from './assets/mrcleanblehhhhhh.png';
import defaultImg from './assets/thumbnails/eliasTN.png';
import circleImg from './assets/Red-Circle-PNG-Images-HD.png';

// textures
import {TextureObject} from './shaderClasses/textureObject.ts'
import {PerlinTexture} from './shaderClasses/perlin.ts';
import {ImgTexture} from './shaderClasses/img.ts';

// shaders
import CRTShader from './shaderClasses/crtShader.ts'
import AsciiShader from './shaderClasses/asciiShader.ts'
import TestShader from './shaderClasses/test.ts'
import CelShader from './shaderClasses/celShader.ts'
import DoGFilter from './shaderClasses/dogFilter.ts'

if(!navigator.gpu) {
    alert('WebGPU is currently only supported in Chromium based browsers.')
    throw new Error('WebGPU not supported on this browser');
}
async function getAdapter() {
    try {
        return await navigator.gpu.requestAdapter();
    }
    catch(e) {
        alert(e)
        throw new Error(e)
    }
}
const adapter = await getAdapter();

//// vvv  old getAdapter() - just in case the above code breaks at some point
// const adapter = await navigator.gpu.requestAdapter();
// if(!adapter) {
//     alert(`No appropriate GPUAdapter found. 
//         WebGPU may be disabled in your browser feature settings, or it may not be supported. Graphics/hardware acceleration might also not be turned on in your browser settings.\n
//         May require enabling chrome://flags/#enable-unsafe-webgpu
//         `)
//     throw new Error('No appropriate GPUAdapter found');
// }

async function getDevice() {
    try {
        return await adapter.requestDevice();
    }
    catch(e) {
        alert(e + "\n\nIf you are on linux, try enabling Vulkan support for your browser in the browser flags.");
        throw new Error(e);
    }
}
const device = await getDevice();

const canvas = document.querySelector('canvas');
const context = canvas.getContext('webgpu');

const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
context.configure({
    device: device,
    format: canvasFormat,
});

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
    canvasTexture.render();
}

function initShader(shader) {
    canvasTexture.setShader(shader);
    canvasTexture.render();
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
    const customSize = {width: 800, height: 800*Math.sqrt(2)}
    const newTexture = new PerlinTexture(device, canvasFormat, context, customSize);
    initTexture(newTexture);
});


//
// SHADERS
//
const crtSelect = document.getElementById('crtShader');
const asciiSelect = document.getElementById('asciiShader');
const celSelect = document.getElementById('celShader');
const dogSelect = document.getElementById('dogFilter');

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

// cel shader
celSelect.addEventListener('click', function() {
    const celShader = new CelShader(device, canvasFormat);
    const newShader = celShader;
    initShader(newShader);
})

// DoG filter
dogSelect.addEventListener('click', function() {
    const dogSelect = new DoGFilter(device, canvasFormat);
    const newShader = dogSelect;
    initShader(newShader);
})

initTexture(createImgTexture(source));

// add default shaders for testing here vvvvvvv
const celShader = new CelShader(device, canvasFormat);
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

    reader.onerror = () => resolve(reader.result);
    reader.onload = async function(e) {

        try {
            const res = await fetch(e.target.result);
            if(!res.ok)
                throw new Error('Response status: ' + res.status);
            const blob = await res.blob();
            const source = await createImageBitmap(blob, {colorSpaceConversion: 'none'});
    
            const newTexture = createImgTexture(source);
            initTexture(newTexture);
        }
        catch(error) { // todo: figure out wtf these errors are
            alert('File cannot be over 10 MB.. for some reason. \n\n Uploaded file was ' + Math.round(file.size/10000)/100 + ' MB');
            console.error('Error: ' + error.message);
        }

    }
}