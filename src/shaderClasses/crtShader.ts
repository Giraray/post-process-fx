import {ShaderObject, ProgramInstructions} from './shaderObject';
import shaderCode from '../assets/shaders/crt.wgsl?raw'
import {NumberConfig, EnumConfig, BoolConfig, RangeConfig, ColorConfig} from './objectBase';

export default class CRTShader extends ShaderObject {
    // config
    distort: BoolConfig;
    flicker: BoolConfig;
    moireOpacity: NumberConfig;

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
    }

    handleBool(target: HTMLInputElement, origin: CRTShader, item: BoolConfig) {
        let value = target.checked === true ? true : false;
        item.value = value;

        origin.render({
            size: origin.size,
            canvasFormat: origin.canvasFormat,
            context: origin.context,
        });
    }

    createConfig(): (NumberConfig | BoolConfig)[] {
        const distort: BoolConfig = {
            type: 'bool',
            label: 'Distort UV',
            id: 'distortUV',
            title: 'Distorts the texture',

            default: true,
            value: true,

            event: this.handleBool,
        }

        return [distort];
    }

    createInstructions(time: number, width: number, height: number) {
        const timeBuffer = this.device.createBuffer({
            size: 8,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        this.device.queue.writeBuffer(timeBuffer, 0, new Float32Array([time]));

        const resBuffer = this.device.createBuffer({
            size:8,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        this.device.queue.writeBuffer(resBuffer, 0, new Float32Array([width, height]));

        const doDistortBuffer = this.device.createBuffer({
            size:4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        this.device.queue.writeBuffer(doDistortBuffer, 0, new Float32Array([1]));

        const entries = [
            {binding: 0, resource: this.sampler},
            {binding: 1, resource: this.texture.createView()},
            {binding: 2, resource: { buffer: resBuffer }},
            {binding: 3, resource: { buffer: timeBuffer }},
            {binding: 4, resource: { buffer: doDistortBuffer }},
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