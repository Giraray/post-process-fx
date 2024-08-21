import { ShaderObject } from './shaderObject'
import {NumberConfig, EnumConfig, BoolConfig, RangeConfig, ObjectBase} from './objectBase';

export default abstract class TextureObject {
    shader: ShaderObject | null;
    dataUrl: string;
    config: [NumberConfig | EnumConfig | BoolConfig | RangeConfig];
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

    public abstract renderToCanvas(): void

    public initTextureConfig(config: [NumberConfig | EnumConfig | BoolConfig | RangeConfig]) {
        const optionsDiv = <HTMLDivElement>document.getElementById('textureOptions');
        for(let i = 0; i < config.length; i++) {
            const item = config[i];

            if(item.type === 'bool') {
                this.createBoolConfig(<BoolConfig>item, optionsDiv);
            }
        }
    }

    createBoolConfig(item: BoolConfig, optionsDiv: HTMLDivElement) {
        const container = document.createElement('div');
        container.setAttribute('class', 'option-container option-container_boolean border444');
        
        const span = document.createElement('span');
        span.setAttribute('class', 'input-desc');
        span.innerHTML = item.label;

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.classList.add('checkbox', 'border444');
        input.id = item.id;
        
        if(item.default === true)
            input.setAttribute('checked', 'true');

        if(item.title != undefined)
            container.setAttribute('title', item.title);

        container.appendChild(span);
        container.appendChild(input); // this is so incredibly fucking convoluted..........

        optionsDiv.insertAdjacentHTML('beforeend', container.outerHTML);

        const newInput = document.getElementById(item.id.toString());
        console.log(newInput)
        newInput.addEventListener('click', function() {
            console.log('asdasdasd')
        })
    }
}