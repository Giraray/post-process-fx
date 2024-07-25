import imgPath from './assets/sukunaiPadKid.jpg';

import {PerlinTexture} from './shaderClasses/perlin.ts'
import {ImgTexture} from './shaderClasses/img.ts'

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




const perlinTexture = new PerlinTexture({
    size: {width: 500, height: 500,},
    canvasFormat,
    device,
    seed: Math.random() * 100000,
    config: {
        style: 'natural',
        intensity: 1.0,
        gridSize: 3.0,
        animate: true,
    }
})

// let's do this. *breaks fingers*

// load texture function
async function loadTexture(url) {
    const res = await fetch(url);
    const blob = await res.blob();
    const source = await createImageBitmap(blob, {colorSpaceConversion: 'none'});

    return source;
}

const source = await loadTexture(imgPath);
const texObject = new ImgTexture({
    size: {width: source.width, height: source.height},
    canvasFormat,
    device,
    source,
});
perlinTexture.resizeCanvas(canvas);


let dataUrl;
// CREATE AND DRAW PASS
function render(texture) {

    texture.createTexture();

    // LOAD TEXTURE
    const texEncoder = device.createCommandEncoder({
        label: 'texture encoder',
    });
    const pass = texEncoder.beginRenderPass({
        colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            clearValue: [0, 0, 0, 1],
            loadOp: 'clear',
            storeOp: 'store',
        }],
    });

    pass.setPipeline(texture.pipeline);
    pass.setBindGroup(0, texture.bindGroup);
    pass.draw(6);
    pass.end();

    device.queue.submit([texEncoder.finish()]);

    dataUrl = canvas.toDataURL('image/png'); // store data for save


    if(Object.hasOwn(texture, 'config') && texture.config.animate == true) {
        setTimeout(() => {
            texture.updateTime(1);
            requestAnimationFrame(function() { render(texture) });
        }, 1000 / 20);
    }
}
render(perlinTexture);


// SAVE IMAGE
const downloadBtn = document.getElementById('download');
downloadBtn.onclick = function() {
    console.log(dataUrl)
    downloadBtn.href = dataUrl;
}