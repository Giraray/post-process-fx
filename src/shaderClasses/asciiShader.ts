import asciiDogCode from '../assets/shaders/ascii/asciiDoG.wgsl?raw';
import asciiSobelCode from '../assets/shaders/ascii/asciiSobel.wgsl?raw';
import {ShaderObject, ProgramInstructions, ShaderProgram} from './shaderObject';

export default class AsciiShader extends ShaderObject {
    canvasFormat: GPUTextureFormat; // YUUUUCK!!!!!!!!!!!!

    constructor(device: GPUDevice, canvasFormat: GPUTextureFormat) {
        super(device);
        this.canvasFormat = canvasFormat;
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
        // create resolutionBuffer

        // DoG
        const resBuffer = this.device.createBuffer({
            size:8,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        this.device.queue.writeBuffer(resBuffer, 0, new Float32Array([width, height]));

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

        const instructions: ProgramInstructions = {
            label: 'ASCII shader instructions',
            passes: [
                {
                    label: 'DoG',
                    passType: 'render',
                    pipeline: this.pipeline,
                    entries: entries,
                },
                // {
                //     label: 'sobel',
                //     passType: 'render',
                //     pipeline: sobelPipeline,
                //     entries: entries,
                // },
            ],
        }

        return instructions;
    }
}