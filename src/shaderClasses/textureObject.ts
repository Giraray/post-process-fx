import ShaderObject from './shaderObject'

export default class TextureObject {
    shader: ShaderObject | null;
    dataUrl: string;
    readonly device: GPUDevice;
    readonly canvasFormat: GPUTextureFormat;
    readonly context: GPUCanvasContext;

    constructor(device: GPUDevice, canvasFormat: GPUTextureFormat, context: GPUCanvasContext) {
        this.device = device;
        this.canvasFormat = canvasFormat;
        this.context = context;
    }

    /**
     * Sets or removes a texture's active shader.
     * @param shader Removes and deactivates current shaders if null
     */
    public setShader(shader: ShaderObject | null) {

        // if shader exists from before: deactive it
        if(this.shader != undefined) {
            clearInterval(this.shader.timeout);
        }

        // if current shader is selected again: negate it
        if(this.shader != undefined && shader != null && shader.constructor.name === this.shader.constructor.name) {
            shader = null;
        }

        this.shader = shader;
    }
}