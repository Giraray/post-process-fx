import asciiDogCode from '../assets/shaders/ascii/asciiDoG.wgsl?raw';
import asciiSobelCode from '../assets/shaders/ascii/asciiSobel.wgsl?raw';
import asciiDownscaleCode from '../assets/shaders/ascii/asciiDownscale.wgsl?raw';
import asciiConvertCode from '../assets/shaders/ascii/asciiConvert.wgsl?raw';
import {ShaderObject, ProgramInstructions, ShaderProgram} from './shaderObject';

import {bitmapVer3Data, bitmapEdgeVer1Data} from '../assets/bitmaps/bitmaps';

export default class AsciiShader extends ShaderObject {
    constructor(device: GPUDevice, canvasFormat: GPUTextureFormat) {
        super(device, canvasFormat);
        this.code = asciiDogCode;
        this.shaderModule = device.createShaderModule({
            code: this.code,
        });
        this.pipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: this.shaderModule,
            },
            fragment: {
                module: this.shaderModule,
                targets: [{format: canvasFormat}],
            }
        });
    }

    createInstructions(time: number, width: number, height: number): ProgramInstructions {
        // buffer for compute
        const colorBuffer = this.device.createTexture({
            size: {width,height},
            format: 'rgba8unorm',
            usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC |
             GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
        });

        // resolution buffer
        const resBuffer = this.device.createBuffer({
            size:8,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        this.device.queue.writeBuffer(resBuffer, 0, new Float32Array([width, height]));

        // bitmaps
        const bitmapVer3 = this.device.createTexture({
            label: 'ASCII bitmap ver3',
            format: 'rgba8unorm',
            size: bitmapVer3Data.size,
            usage: 
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.RENDER_ATTACHMENT,
        });
        this.device.queue.writeTexture(
            {texture: bitmapVer3},
            bitmapVer3Data.data,
            {bytesPerRow: bitmapVer3Data.size.width * 4},
            {width: bitmapVer3Data.size.width, height: bitmapVer3Data.size.height},
        );

        const bitmapEdgeVer1 = this.device.createTexture({
            label: 'ASCII bitmap ver3',
            format: 'rgba8unorm',
            size: bitmapEdgeVer1Data.size,
            usage: 
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.RENDER_ATTACHMENT,
        });
        this.device.queue.writeTexture(
            {texture: bitmapEdgeVer1},
            bitmapEdgeVer1Data.data,
            {bytesPerRow: bitmapEdgeVer1Data.size.width * 4},
            {width: bitmapEdgeVer1Data.size.width, height: bitmapEdgeVer1Data.size.height},
        );

        // DoG
        const entries = [
            {binding: 0, resource: this.sampler},
            {binding: 1, resource: this.texture.createView()},
            {binding: 2, resource: { buffer: resBuffer }},
        ];

        // SOBEL
        const sobelShaderModule = this.device.createShaderModule({
            label: 'sobel filter',
            code: asciiSobelCode
        })

        const sobelPipeline = this.device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: sobelShaderModule,
            },
            fragment: {
                module: sobelShaderModule,
                targets: [{format: this.canvasFormat}],
            }
        });

        // DOWNSCALE
        const downscaleShaderModule = this.device.createShaderModule({
            label: 'downscale',
            code: asciiDownscaleCode,
        });

        const downscalePipeline = this.device.createComputePipeline({
            layout: 'auto',
            compute: {
                module: downscaleShaderModule,
                entryPoint: 'main',
            },
        });

        const downscaleEntries = [
            {binding: 0, resource: colorBuffer.createView()},
            {binding: 1, resource: this.texture.createView()},
        ];

        // FINALIZE
        const finalizeModule = this.device.createShaderModule({
            label: 'ascii finalize',
            code: asciiConvertCode,
        })

        const finalizePipeline = this.device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: finalizeModule,
            },
            fragment: {
                module: finalizeModule,
                targets: [{format: this.canvasFormat}],
            },
        });
        const finalizeEntries = [
            {binding: 0, resource: this.sampler},
            {binding: 1, resource: colorBuffer.createView()},
            {binding: 2, resource: bitmapVer3.createView()},
            {binding: 3, resource: bitmapEdgeVer1.createView()},
            {binding: 4, resource: this.texture.createView()},
            {binding: 5, resource: {buffer: resBuffer}},
        ];

        const instructions: ProgramInstructions = {
            label: 'ASCII shader instructions',
            passes: [
                {
                    label: 'DoG',
                    passType: 'render',
                    pipeline: this.pipeline,
                    entries: entries,
                },
                {
                    label: 'sobel',
                    passType: 'render',
                    pipeline: sobelPipeline,
                    entries: entries,
                },
                {
                    label: 'downscale',
                    passType: 'compute',
                    pipeline: downscalePipeline,
                    entries: downscaleEntries,
                    workgroupSize: 8,
                },
                {
                    label: 'ascii finalize',
                    passType: 'render',
                    pipeline: finalizePipeline,
                    entries: finalizeEntries,
                },
            ],
        }

        return instructions;
    }
}