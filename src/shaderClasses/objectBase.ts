interface ConfigInputBase {
    type: ConfigType;
    label: string;
    id: string;
    title: string; // user hints
    disabled?: boolean;
    event: Function;
    clearTimeout?: boolean; // if object is animated
}

type ConfigType = 
    | 'number'
    | 'enum'
    | 'bool'
    | 'range'
    | 'string'
    | 'color'
    | 'btn';

// number
interface NumberConfig extends ConfigInputBase {
    default: Number;
    value: Number;
    min?: Number;
    max?: Number;
    step?: Number;
}

// enums
interface EnumConfig extends ConfigInputBase {
    default: string;
    value: string;
    options: EnumInputOption[];
}

interface EnumInputOption {
    label: string;
    id: string;
}

// bool
interface BoolConfig extends ConfigInputBase {
    default: boolean;
    value: boolean;
}

// range
interface RangeConfig extends ConfigInputBase {
    default: Number;
    value: Number;
    min: Number;
    max: Number;
    configurable?: boolean; // whether or not min and max can be modified
}

// string
interface StringConfig extends ConfigInputBase {
    default: string;
    value: string;

    max?: Number;
}

// color
interface ColorConfig extends ConfigInputBase {
    default: string;
    value: string
}

// btn
interface BtnConfig extends ConfigInputBase {

}

interface Size {
    width: number;
    height: number;
}

/**
 * TODO: remove and replace with something less weird
 */
export interface RenderDescriptor {
    size: Size;
    canvasFormat: GPUTextureFormat,
    context?: GPUCanvasContext;
    finalRender?: boolean;
    renderTarget?: GPUTexture
    fps?: number;
}

export type ObjectType = |
    'shader' |
    'texture';

interface ShaderMetaData {
    imgUrl?: string;
    name?: string;
    description?: string;
}

abstract class ObjectBase {
    objectType: ObjectType;
    size: Size;
    config: Array<NumberConfig | EnumConfig | StringConfig | BoolConfig | ColorConfig | RangeConfig>;
    configArray: Array<ConfigInputBase>;
    timeout: ReturnType<typeof setTimeout>;
    metadata: ShaderMetaData; // TODO

    canvasFormat: GPUTextureFormat;
    context: GPUCanvasContext;
    readonly device: GPUDevice;

    constructor(device: GPUDevice, canvasFormat: GPUTextureFormat) {
        this.canvasFormat = canvasFormat;
        this.device = device;
    }

    updateMetadata() {
        let titleElm: any;
        if(this.objectType = 'shader') {
            titleElm = document.getElementById('shaderTitle');
        }
        else {
            titleElm = document.getElementById('textureTitle');
        }
        titleElm.innerHTML = this.metadata.name;
        titleElm.title = this.metadata.description;
    }

    /**
     * Replaces existing configuration options with newly generated ones. Typically to be called when creating 
     * a new texture or shader object.
     * @param config A ConfigObject containing the blueprint for the configurations to be generated.
     * @param origin The parent TextureObject or ShaderObject.
     */
    public initTextureConfig(config: Array<ConfigInputBase>, origin: ObjectBase) {
        const objectType = Object.getPrototypeOf(Object.getPrototypeOf(origin)).constructor.name; // "TextureObject" or "Shader Object"
        let optionsDiv: HTMLDivElement;
        if(objectType === 'TextureObject')
            optionsDiv = <HTMLDivElement>document.getElementById('textureOptions');
        else if(objectType === 'ShaderObject')
            optionsDiv = <HTMLDivElement>document.getElementById('shaderOptions');

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

            else if(item.type === 'string') {
                this.createStringConfig(<StringConfig>item, optionsDiv, origin);
            }

            else if(item.type === 'color') {
                this.createColorConfig(<ColorConfig>item, optionsDiv, origin);
            }
            
            else if(item.type === 'btn') {
                this.createBtnConfig(<BtnConfig>item, optionsDiv, origin)
            }
        }
    }

    // lots of boilerplate in these so maybe smush them together at some point
    createNumberConfig(item: NumberConfig, optionsDiv: HTMLDivElement, origin: ObjectBase) {
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

        if(item.max != undefined) 
            input.max = item.max.toString();
        
        if(item.min != undefined)
            input.min = item.min.toString();

        if(item.default != undefined)
            input.value = item.default.toString();

        if(item.title != undefined)
            container.setAttribute('title', item.title);

        if(item.step != undefined) {
            input.step = '0.1';
        }

        // put elements together and add them to the DOM
        container.appendChild(span);
        const insertedInput = container.appendChild(input);
        optionsDiv.appendChild(container);

        // eventListener
        insertedInput.addEventListener('change', (e) => {
            item.event(e.target, origin, item);
        });
    }

    createBoolConfig(item: BoolConfig, optionsDiv: HTMLDivElement, origin: ObjectBase) {
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

        container.setAttribute('title', item.title);

        // put elements together and add them to the DOM
        container.appendChild(span);
        const insertedInput = container.appendChild(input);
        optionsDiv.appendChild(container);

        // eventListener
        insertedInput.addEventListener('click', (e) => {
            item.event(e.target, origin, item);
        });
    }

    createBtnConfig(item: BtnConfig, optionsDiv: HTMLDivElement, origin: ObjectBase) {
        // config container
        const container = document.createElement('div');
        container.setAttribute('class', 'option-container_no-grid border444');

        // config btn
        const btn = document.createElement('div');
        btn.classList.add('btn-config');
        btn.id = item.id;
        
        // config label
        const span = document.createElement('span');
        span.classList.add('btn-config_span');
        span.innerHTML = item.label;

        container.setAttribute('title', item.title);

        // put elements together and add them to the DOM
        btn.appendChild(span);
        const insertedInput = container.appendChild(btn);
        optionsDiv.appendChild(container);

        // eventListener
        insertedInput.addEventListener('click', (e) => {
            item.event(e.target, origin, item);
        });
    }

    createEnumConfig(item: EnumConfig, optionsDiv: HTMLDivElement, origin: ObjectBase) {
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
            item.event(e.target, origin, item);
        });
    }

    createStringConfig(item: StringConfig, optionsDiv: HTMLDivElement, origin: ObjectBase) {
        // config container
        const container = document.createElement('div');
        container.setAttribute('class', 'option-container option-container_input border444');

        // config label
        const span = document.createElement('span');
        span.setAttribute('class', 'input-desc');
        span.innerHTML = item.label + ':';

        // config input
        const input = document.createElement('input');
        input.type = 'text';
        input.classList.add('border000');
        input.id = item.id;
        input.disabled = item.disabled;

        if(item.max != undefined) 
            input.maxLength = <number>item.max;

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
            item.event(e.target, origin, item);
        });
    }

    createColorConfig(item: ColorConfig, optionsDiv: HTMLDivElement, origin: ObjectBase) {
        // config container
        const container = document.createElement('div');
        container.setAttribute('class', 'option-container option-container_color border444');

        // config label
        const span = document.createElement('span');
        span.setAttribute('class', 'input-desc');
        span.innerHTML = item.label + ':';

        // config input
        const input = document.createElement('input');
        input.type = 'color';
        input.classList.add('border000');
        input.id = item.id;
        input.value = item.value;
        input.disabled = item.disabled;

        if(item.default != undefined)
            input.value = item.default;

        if(item.title != undefined)
            container.setAttribute('title', item.title);

        // put elements together and add them to the DOM
        container.appendChild(span);
        const insertedInput = container.appendChild(input);
        optionsDiv.appendChild(container);

        // eventListener
        insertedInput.addEventListener('change', (e) => {
            item.event(e.target, origin, item);
        });
    }

    hexToRgb(hex: string): Number[] {
        var r = parseInt(hex.slice(1, 3), 16),
            g = parseInt(hex.slice(3, 5), 16),
            b = parseInt(hex.slice(5, 7), 16);
        
        r = Math.floor(r/255 * 100000) / 100000;
        g = Math.floor(g/255 * 100000) / 100000;
        b = Math.floor(b/255 * 100000) / 100000;
    
        return [r, g, b];
    }

    /**
     * Places configs generated in a createConfig() into the object's config property.
     * Makes it a bit easier to adjust config index positions compared to my previous solution.
     * @param configs Array containing `config` objects
     */
    sortConfigs(configs: Array<ConfigInputBase>): Array<NumberConfig | EnumConfig | StringConfig | BoolConfig | ColorConfig | RangeConfig> {
        let returnArray = [];

        for(let i = 0; i < configs.length; i++) {
            Object.keys(configs).forEach(key => {
                if (configs[key].id === configs[i].id) {

                    returnArray[i] = configs[key];

                    if(i < configs.length - 1) {
                        configs.unshift();
                    }

                }
            });
        }
        return returnArray;
    }

    findIndex(id: string): number {
        let index = -1;
        Object.keys(this.configArray).forEach(key => {
            if (this.configArray[key].id === id) {
                index = parseInt(key);
            }
        });
        return index;
    }

    boolBuffer(size: number, input: NumberConfig | EnumConfig | StringConfig | BoolConfig | ColorConfig | RangeConfig): GPUBuffer {
        const usage = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;
        const buffer = this.device.createBuffer({size, usage: usage});
        this.device.queue.writeBuffer(buffer, 0, new Float32Array([Number(input.value)]));
        return buffer;
    }

    numberBuffer(size: number, input: NumberConfig | EnumConfig | StringConfig | BoolConfig | ColorConfig | RangeConfig): GPUBuffer {
        const usage = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;
        const buffer = this.device.createBuffer({size, usage: usage});
        this.device.queue.writeBuffer(buffer, 0, new Float32Array([<number>input.value]));
        return buffer;
    }

    public abstract render(RenderDescriptor: RenderDescriptor): void

    // config events. TextureObject needs its own, even though the functions are indentical
    handleNumberConfig(target: HTMLInputElement, origin: ObjectBase, item: NumberConfig) {
        let value = parseFloat(target.value);
        if(isNaN(value))
            value = 0;
        item.value = value;

        // if(origin.objectType == 'texture') {
        //     clearTimeout(origin.timeout);
        // }

        console.log(item)

        origin.render({
            size: origin.size,
            canvasFormat: origin.canvasFormat,
            context: origin.context,
        });
    }

    // these are literally all the same. Keeping just in case i make changes
    handleStringConfig(target: HTMLInputElement, origin: ObjectBase, item: StringConfig) {
        let value = target.value;
        item.value = value;

        origin.render({
            size: origin.size,
            canvasFormat: origin.canvasFormat,
            context: origin.context,
        });
    }

    handleColorConfig(target: HTMLInputElement, origin: ObjectBase, item: ColorConfig) {
        let value = target.value;
        item.value = value;

        clearTimeout(origin.timeout);
        origin.render({
            size: origin.size,
            canvasFormat: origin.canvasFormat,
            context: origin.context,
        });
    }

    handleBoolConfig(target: HTMLInputElement, origin: ObjectBase, item: BoolConfig) {
        let value = target.checked === true ? true : false;
        item.value = value;

        origin.render({
            size: origin.size,
            canvasFormat: origin.canvasFormat,
            context: origin.context,
        });
    }

    handleEnumConfig(target: HTMLInputElement, origin: ObjectBase, item: EnumConfig) {
        let value = target.value;
        item.value = value;

        origin.render({
            size: origin.size,
            canvasFormat: origin.canvasFormat,
            context: origin.context,
        });
    }
}

export {ConfigInputBase, NumberConfig, EnumConfig, BoolConfig, RangeConfig, StringConfig, ColorConfig, BtnConfig, ObjectBase}