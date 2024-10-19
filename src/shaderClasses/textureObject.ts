import { ShaderObject } from './shaderObject'
import {NumberConfig, EnumConfig, BoolConfig, RangeConfig, ObjectBase} from './objectBase';

export abstract class TextureObject extends ObjectBase {
    shader: ShaderObject | null;
    dataUrl: string;

    readonly device: GPUDevice;
    readonly canvasFormat: GPUTextureFormat;
    readonly context: GPUCanvasContext;

    constructor(device: GPUDevice, canvasFormat: GPUTextureFormat, context: GPUCanvasContext) {
        super();
        this.device = device;
        this.canvasFormat = canvasFormat;
        this.context = context;
    }

    /**
     * Sets or removes a texture's active shader.
     * @param shader Removes and deactivates current shaders if null
     */
    public setShader(shader: ShaderObject | null) {
        const shaderConfigs = document.getElementById('shaderOptions');

        // if texture already has a shader: deactive it
        if(this.shader != undefined) {
            clearInterval(this.shader.timeout);
        }

        // if current shader is reselected: negate it. Also clear out shader config HTML
        if(this.shader != undefined && shader != null && shader.constructor.name === this.shader.constructor.name) {
            shader = null;
            shaderConfigs.innerHTML = '';
        }

        this.shader = shader;
    }

    public abstract renderToCanvas(): void
}