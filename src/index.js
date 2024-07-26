import imgPath from './assets/sukunaiPadKid.jpg';

import {PerlinTexture} from './shaderClasses/perlin.ts';
import {ImgTexture} from './shaderClasses/img.ts';

import erhifhe from './assets/shaders/chroma.wgsl?raw';

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

/////////////////////////
const bTexture = device.createTexture({
    label: 'imgTexture',
    format: 'rgba8unorm',
    size: [source.width, source.height],
    usage: 
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.RENDER_ATTACHMENT,
});
device.queue.copyExternalImageToTexture(
    {source: source, flipY: true},
    {texture: bTexture},
    {width: source.width, height: source.height},
);

const texA = device.createTexture({
    label: 'texA placeholder',
    format: canvasFormat,
    size: [source.width, source.height],
    usage: 
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.RENDER_ATTACHMENT |
        GPUTextureUsage.COPY_SRC
});

//////////////////////////

// testing!!

function renderTexture(texture) {
    const texEncoder = device.createCommandEncoder({
        label: 'texEncoder',
    });
    const pass = texEncoder.beginRenderPass({
        colorAttachments: [{
            view: texA.createView(),
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
}

let dataUrl;
function renderShader(texture) {
    const chBindGroup = device.createBindGroup({
        layout: chPipeline.getBindGroupLayout(0),
        entries: [
            {binding: 0, resource: sampler},
            {binding: 1, resource: texA.createView()},
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
            requestAnimationFrame(function() { render(texture) });
        }, 1000 / 20);
    }
}

function renderToCanvas(texture) {

    const texEncoder = device.createCommandEncoder({
        label: 'texEncoder',
    });
    const pass = texEncoder.beginRenderPass({
        colorAttachments: [{
            view: texA.createView(),
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
            {binding: 1, resource: texA.createView()},
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

// renderTexture(perlinTexture)
// renderShader(perlinTexture)
renderToCanvas(perlinTexture)

///////

// CREATE AND DRAW PASS
function render(texture, shader) {

    // TEXTURE PASS
    const texEncoder = device.createCommandEncoder({
        label: 'texture encoder',
    });
    const pass = texEncoder.beginRenderPass({
        colorAttachments: [{
            view: texA.createView(),
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

    // SHADER PASS
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
}
// render(perlinTexture);


// SAVE IMAGE
const downloadBtn = document.getElementById('download');
downloadBtn.onclick = function() {
    console.log(dataUrl)
    downloadBtn.href = dataUrl;
}