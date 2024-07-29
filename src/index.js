import imgPath from './assets/sukunaiPadKid.jpg';
import defaultImg from './assets/eliasoutsidewhoa.jpg';

import {PerlinTexture} from './shaderClasses/perlin.ts';
import {ImgTexture} from './shaderClasses/img.ts';

import erhifhe from './assets/shaders/chroma.wgsl?raw';

import { ImgTextureUserConfig } from './configObjects.ts';

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

const perlinTexture = new PerlinTexture({
    size: {width: w, height: h,},
    canvasFormat,
    device,
    seed: Math.random() * 100000,
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
// perlinTexture.resizeCanvas(canvas);

// testing!!
let dataUrl;
function renderToCanvas(texture, shader) {

    const rtA = device.createTexture({
        label: 'texA placeholder',
        format: canvasFormat,
        size: [source.width, source.height],
        usage: 
            GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.RENDER_ATTACHMENT |
            GPUTextureUsage.COPY_SRC
    });

    texture.resizeCanvas(canvas);
    const texEncoder = device.createCommandEncoder({
        label: 'texEncoder',
    });
    const pass = texEncoder.beginRenderPass({
        colorAttachments: [{
            view: rtA.createView(),
            clearValue: [0, 0, 0, 1],
            loadOp: 'clear',
            storeOp: 'store',
        }],
    });
    texture.createTexture();
    pass.setPipeline(texture.pipeline);
    pass.setBindGroup(0, texture.bindGroup);
    pass.draw(6);
    pass.end();

    device.queue.submit([texEncoder.finish()]);


    // render shaders
    const chBindGroup = device.createBindGroup({
        layout: chPipeline.getBindGroupLayout(0),
        entries: [
            {binding: 0, resource: sampler},
            {binding: 1, resource: rtA.createView()},
        ],
    });

    const shaderEncoder = device.createCommandEncoder({
        label: 'shader encoder',
    });

    const shaderPass = shaderEncoder.beginRenderPass({
        colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            clearValue: [0,0,0,1],
            loadOp: 'clear',
            storeOp: 'store',
        }],
    });
    
    shaderPass.setPipeline(chPipeline);
    shaderPass.setBindGroup(0, chBindGroup);
    shaderPass.draw(6);
    shaderPass.end();
    
    device.queue.submit([shaderEncoder.finish()]);

    dataUrl = canvas.toDataURL('image/png'); // store data for save

    if(Object.hasOwn(texture, 'config') && texture.config.animate == true) {
        setTimeout(() => {
            texture.updateTime(1);
            requestAnimationFrame(function() { renderToCanvas(texture) });
        }, 1000 / 20);
    }
}

renderToCanvas(perlinTexture);


// SAVE IMAGE
const downloadBtn = document.getElementById('download');
downloadBtn.onclick = function() {
    console.log(dataUrl)
    downloadBtn.href = dataUrl;
}

function selectTexture() {
    const textureOptionsDiv = document.getElementById('textureOptions');
    // const imgTextureConfig = new ImgTextureUserConfig(textureOptionsDiv);
}

selectTexture();