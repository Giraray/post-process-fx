import ShaderObject from './shaderObject'

export default class TextureObject {
    shaders: Array<ShaderObject>;
    dataUrl: string;
    readonly device: GPUDevice;
    readonly canvasFormat: GPUTextureFormat;
    readonly context: GPUCanvasContext;

    constructor(device: GPUDevice, canvasFormat: GPUTextureFormat, context: GPUCanvasContext) {
        this.shaders = new Array<ShaderObject>;
        this.device = device;
        this.canvasFormat = canvasFormat;
        this.context = context;
    }

    /**
     * Replaces the `shaders` array with a new array consisting of every item from the array that does not match 
     * the specified shader.
     * @param shader The ShaderObject to be removed
     */
    public removeShader(shader: ShaderObject) {
        const newArray = new Array<ShaderObject>;
        for(let i = 0; i < this.shaders.length; i++) {
            if(this.shaders[i] !== shader) {
                newArray.push(this.shaders[i]);
            }
        }
        this.shaders = newArray;
    }

    /**
     * Adds a `ShaderObject` to the `shaders` array.
     * @param shader The ShaderObject to be added
     */
    public addShader(shader: ShaderObject) {
        this.shaders.push(shader);
    }
}