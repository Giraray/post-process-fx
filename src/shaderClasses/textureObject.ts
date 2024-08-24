import { ShaderObject } from './shaderObject'
import {NumberConfig, EnumConfig, BoolConfig, RangeConfig, ObjectBase} from './objectBase';

export default abstract class TextureObject {
    shader: ShaderObject | null;
    dataUrl: string;

    /**
     * An array of configuration instructions.
     */
    config: (NumberConfig | EnumConfig | BoolConfig)[];
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

    /**
     * Replaces existing configuration options with newly generated ones. Typically to be called when creating 
     * a new texture or shader object.
     * @param config A ConfigObject containing the blueprint for the configurations to be generated.
     * @param origin The parent TextureObject or ShaderObject.
     */
    public initTextureConfig(config: (NumberConfig | EnumConfig | BoolConfig)[], origin: TextureObject | ShaderObject) {
        const optionsDiv = <HTMLDivElement>document.getElementById('textureOptions');
        optionsDiv.innerHTML = '';

        for(let i = 0; i < config.length; i++) {
            const item = config[i];

            if(item.type === 'bool') {
                this.createBoolConfig(<BoolConfig>item, optionsDiv, origin);
            }

            else if(item.type === 'number') {
                this.createNumberConfig(<NumberConfig>item, optionsDiv, origin);
            }

            else if(item.type === 'enum') {
                this.createEnumConfig(<EnumConfig>item, optionsDiv, origin);
            }
        }
    }

    // lots of boilerplate in these so maybe smush them together at some point
    createNumberConfig(item: NumberConfig, optionsDiv: HTMLDivElement, origin: TextureObject | ShaderObject) {
        // config container
        const container = document.createElement('div');
        container.setAttribute('class', 'option-container option-container_input border444');

        // config label
        const span = document.createElement('span');
        span.setAttribute('class', 'input-desc');
        span.innerHTML = item.label + ':';

        // config input
        const input = document.createElement('input');
        input.type = 'number';
        input.classList.add('border000');
        input.id = item.id;

        if(item.default != undefined)
            input.value = item.default.toString();

        if(item.title != undefined)
            container.setAttribute('title', item.title);

        // put elements together and add them to the DOM
        container.appendChild(span);
        const insertedInput = container.appendChild(input);
        optionsDiv.appendChild(container);

        // eventListener
        insertedInput.addEventListener('change', (e) => {
            item.event(e.target, origin);
        });
    }

    createBoolConfig(item: BoolConfig, optionsDiv: HTMLDivElement, origin: TextureObject | ShaderObject) {
        // config container
        const container = document.createElement('div');
        container.setAttribute('class', 'option-container option-container_boolean border444');
        
        // config label
        const span = document.createElement('span');
        span.setAttribute('class', 'input-desc');
        span.innerHTML = item.label + ':';

        // config input
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.classList.add('checkbox', 'border444');
        input.id = item.id;
        
        if(item.default === true)
            input.setAttribute('checked', 'true');

        if(item.title != undefined)
            container.setAttribute('title', item.title);

        // put elements together and add them to the DOM
        container.appendChild(span);
        const insertedInput = container.appendChild(input);
        optionsDiv.appendChild(container);

        // eventListener
        insertedInput.addEventListener('click', (e) => {
            item.event(e.target, origin);
        });
    }

    createEnumConfig(item: EnumConfig, optionsDiv: HTMLDivElement, origin: TextureObject | ShaderObject) {
        // config container
        const container = document.createElement('div');
        container.setAttribute('class', 'option-container option-container_enum border444');
        
        // config label
        const span = document.createElement('span');
        span.setAttribute('class', 'input-desc');
        span.innerHTML = item.label + ':';

        // config input
        const input = document.createElement('select');
        input.classList.add('option-select', 'border000');
        input.id = item.id;

        // options
        for(let i = 0; i < item.options.length; i++) {
            const optionItem = item.options[i];
            
            const option = document.createElement('option');
            option.value = optionItem.id;
            option.innerHTML = optionItem.label;

            input.add(option);
        }

        if(item.title != undefined)
            container.setAttribute('title', item.title);

        // put elements together and add them to the DOM
        container.appendChild(span);
        const insertedInput = container.appendChild(input);
        optionsDiv.appendChild(container);

        // eventListener
        insertedInput.addEventListener('change', (e) => {
            item.event(e.target, origin);
        });
    }
}