import imgPath from './assets/sukunaiPadKid.jpg';
import shaderCode from './assets/shaders/newShader.wgsl?raw';
import perlinCode from './assets/shaders/perlinNoise.wgsl?raw';

import {PerlinTexture} from './shaderClasses/perlin.ts'

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
    size: {width: 1085, height: 545,},
    canvasFormat,
    device,
    billowRidge: true,
    seed: Math.random()*10000,
})
perlinTexture.createTexture();


// let's do this. *breaks fingers*

// load texture function
async function loadTexture(url) {
    const res = await fetch(url);
    const blob = await res.blob();
    const source = await createImageBitmap(blob, {colorSpaceConversion: 'none'});

    const texture = device.createTexture({
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
        {texture: texture},
        {width: source.width, height: source.height},
    );
    return texture;
}
const texture = await loadTexture(imgPath);
console.log(texture.width, texture.height)

if(texture.width > texture.height) {
    canvas.style.width = texture.width;
}
else if(texture.width < texture.height) {
    canvas.style.height = texture.height;
}

// canvas.style.width = texture.width + 'px'
// canvas.style.height = texture.height + 'px'
canvas.width = texture.width
canvas.height = texture.height

// // TODO: abstract shader creation into a reusable function

// // shader module
// const shaderModule = device.createShaderModule({
//     label: 'shader module',
//     code: perlinCode,
// })

// const bindGroupLayout = device.createBindGroupLayout({
//     entries: [
//         {
//             binding: 0,
//             visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
//             buffer: {
//                 type: 'uniform',
//             },
//         },
//         {
//             binding: 1,
//             visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
//             buffer: {
//                 type: 'uniform',
//             },
//         }
//     ]
// })

// // render pipeline
// const pipeline = device.createRenderPipeline({
//     label: 'render pipeline',
//     layout: device.createPipelineLayout({bindGroupLayouts:[bindGroupLayout]}), // jesus christ
//     vertex: {
//         module: shaderModule,
//     },
//     fragment: {
//         module: shaderModule,
//         targets: [{format:canvasFormat}],
//     },
// });

// // sampler
// const sampler = device.createSampler({
//     magFilter: 'linear',
//     minFilter: 'linear',
// });

// // resolution buffer
// const resolutionArray = new Float32Array([texture.width, texture.height]);
// const resolutionBuffer = device.createBuffer({
//     label: 'resolution buffer',
//     size: resolutionArray.byteLength,
//     usage:
//         GPUBufferUsage.UNIFORM |
//         GPUBufferUsage.COPY_DST,
// });
// device.queue.writeBuffer(resolutionBuffer, 0, resolutionArray);

// // bindgroup
// const billowBuffer = device.createBuffer({
//     size: 4,
//     usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
// });
// device.queue.writeBuffer(billowBuffer, 0, new Int32Array([0+perlinTexture.billowRidge]));

// // resolution
// const resBuffer = device.createBuffer({
//     size:8,
//     usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
// });
// device.queue.writeBuffer(resBuffer, 0, new Float32Array([perlinTexture.size.width, perlinTexture.size.height]));

// const bindGroup = device.createBindGroup({
//     layout: bindGroupLayout,
//     entries: [
//         {binding: 0, resource: {buffer: billowBuffer}},
//         {binding: 1, resource: {buffer: resBuffer}},
//     ],
// });

// CREATE AND DRAW PASS
function render() {
    const encoder = device.createCommandEncoder({
        label: 'render encoder',
    });
    const pass = encoder.beginRenderPass({
        colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            clearValue: [0, 0, 0, 1],
            loadOp: 'clear',
            storeOp: 'store',
        }],
    });
    pass.setPipeline(perlinTexture.pipeline);
    pass.setBindGroup(0, perlinTexture.bindGroup);
    pass.draw(6);
    pass.end();

    device.queue.submit([encoder.finish()]);

    console.log(context.getCurrentTexture().createView())
}
render();