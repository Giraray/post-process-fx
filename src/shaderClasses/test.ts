import computeCode from '../assets/shaders/testShader/compute.wgsl?raw';
import displayCompCode from '../assets/shaders/testShader/displayComp.wgsl?raw';
import { ShaderObject, ProgramInstructions } from './shaderObject';

export default class TestShader extends ShaderObject {

    constructor(device: GPUDevice, canvasFormat: GPUTextureFormat) {
        super(device, canvasFormat);
        this.canvasFormat = canvasFormat;
        this.code = '';
    }

    createInstructions(time: number, width: number, height: number): ProgramInstructions {

        const computeModule = this.device.createShaderModule({
            label: 'test compute',
            code: computeCode
        });

        const computePipeline = this.device.createComputePipeline({
            layout: 'auto',
            compute: {
                module: computeModule,
                entryPoint: 'main',
            },
        });

        // buffer
        const colorBuffer = this.device.createTexture({
            size: {width,height},
            format: 'rgba8unorm',
            usage: GPUTextureUsage.COPY_DST | 
            GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
        });

        const computeEntries = [
            {binding: 0, resource: colorBuffer.createView()},
            {binding: 1, resource: this.texture.createView()},
        ];

        const displayCompModule = this.device.createShaderModule({
            label: 'test display compute',
            code: displayCompCode,
        });

        const displayPipeline = this.device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: displayCompModule,
            },
            fragment: {
                module: displayCompModule,
                targets: [{format: this.canvasFormat}],
            }
        });

        const displayEntries = [
            {binding: 0, resource: this.sampler},
            {binding: 1, resource: colorBuffer.createView()},
        ];

        const instructions: ProgramInstructions = {
            label: 'test shader instructions',
            passes: [
                {
                    label: 'compute test',
                    passType: 'compute',
                    pipeline: computePipeline,
                    entries: computeEntries,
                    workgroupSize: 8,
                },
                {
                    label: 'display compute test',
                    passType: 'render',
                    pipeline: displayPipeline,
                    entries: displayEntries,
                },
            ],
        }

        return instructions;
    }
}