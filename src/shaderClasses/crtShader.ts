import ShaderObject from './shaderObject';
import shaderCode from '../assets/shaders/crt.wgsl?raw'

export default class CRTShader extends ShaderObject {
    readonly device: GPUDevice;

    constructor(device: GPUDevice, canvasFormat: GPUTextureFormat) {
        super();
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
}