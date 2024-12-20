import {ShaderObject, ProgramInstructions} from './shaderObject';
import shaderCode from '../assets/shaders/crt.wgsl?raw'
import {NumberConfig, EnumConfig, BoolConfig, RangeConfig, ColorConfig} from './objectBase';

export default class CRTShader extends ShaderObject {
    moireOpacity: NumberConfig; // TODO

    constructor(device: GPUDevice, canvasFormat: GPUTextureFormat) {
        super(device, canvasFormat);
        this.code = shaderCode;
        this.time = 0;
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
            },
        });

        this.configArray = this.createConfig();
        this.config = super.sortConfigs(this.configArray);

        this.initTextureConfig(this.config, this);
    }

    createConfig(): (NumberConfig | BoolConfig)[] {
        const distort: BoolConfig = {
            type: 'bool',
            label: 'Distort UV',
            id: 'distort',
            title: 'Distorts the texture',

            default: true,
            value: true,

            event: this.handleBoolConfig,
        }

        const flicker: BoolConfig = {
            type: 'bool',
            label: 'Flicker',
            id: 'flicker',
            title: 'Subtle TV flickering',

            default: true,
            value: true,

            event: this.handleBoolConfig,
        }

        return [distort, flicker];
    }

    createInstructions(time: number, width: number, height: number) {
        const config = this.config;
        const distort = this.findIndex('distort');
        const flicker = this.findIndex('flicker');

        const usage = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;

        // time
        const timeBuffer = this.device.createBuffer({size: 8,usage});
        this.device.queue.writeBuffer(timeBuffer, 0, new Float32Array([time]));

        // resolution
        const resBuffer = this.device.createBuffer({size:8,usage});
        this.device.queue.writeBuffer(resBuffer, 0, new Float32Array([width, height]));

        // distortBool
        const doDistortBuffer = this.device.createBuffer({size:4,usage});
        this.device.queue.writeBuffer(doDistortBuffer, 0, new Float32Array([Number(config[distort].value)]));

        // flickerBool
        const doFlickerBuffer = this.device.createBuffer({size:4,usage});
        this.device.queue.writeBuffer(doFlickerBuffer, 0, new Float32Array([Number(config[flicker].value)]));

        const entries = [
            {binding: 0, resource: this.sampler},
            {binding: 1, resource: this.texture.createView()},
            {binding: 2, resource: { buffer: resBuffer }},
            {binding: 3, resource: { buffer: timeBuffer }},
            {binding: 4, resource: { buffer: doDistortBuffer }},
            {binding: 5, resource: { buffer: doFlickerBuffer }},
        ];

        const instructions: ProgramInstructions = {
            label: 'ASCII shader instructions',
            passes: [{
                label: 'DoG',
                passType: 'render',
                pipeline: this.pipeline,
                entries: entries,
            }],
        }

        return instructions;
    }
}