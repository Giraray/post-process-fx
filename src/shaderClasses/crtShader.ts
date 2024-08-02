import ShaderObject from './shaderObject';
import shaderCode from '../assets/shaders/crt.wgsl?raw'

export default class CRTShader extends ShaderObject {
    constructor(device: GPUDevice, canvasFormat: GPUTextureFormat) {
        super(device);
        this.code = shaderCode;
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

    createBindings(time: number, {width, height}) {
        // create timeBuffer
        const timeBuffer = this.device.createBuffer({
            size: 8,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        this.device.queue.writeBuffer(timeBuffer, 0, new Float32Array([time]));

        // create resolutionBuffer
        const resBuffer = this.device.createBuffer({
            size:8,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        this.device.queue.writeBuffer(resBuffer, 0, new Float32Array([width, height]));

        const entries = [
            {binding: 0, resource: this.sampler},
            {binding: 1, resource: this.renderTarget.createView()},
            {binding: 2, resource: { buffer: resBuffer }},
            {binding: 3, resource: { buffer: timeBuffer }},
        ];

        return entries;
    }
}