interface ConfigInputBase {
    type: ConfigType;
    label: string;
    id: string;
    title: string; // user hints
    disabled?: boolean;
    event: Function;
}

type ConfigType = 
    | 'number'
    | 'enum'
    | 'bool'
    | 'range'
    | 'string'
    | 'color';

// number
interface NumberConfig extends ConfigInputBase {
    default: Number;
    value: Number;
    min?: Number;
    max?: Number;
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

class ObjectBase {
    /**
     * An array of configuration instructions.
     */
    config: (NumberConfig | EnumConfig | BoolConfig | StringConfig | ColorConfig)[];

    /**
     * Replaces existing configuration options with newly generated ones. Typically to be called when creating 
     * a new texture or shader object.
     * @param config A ConfigObject containing the blueprint for the configurations to be generated.
     * @param origin The parent TextureObject or ShaderObject.
     */
    public initTextureConfig(config: (NumberConfig | EnumConfig | BoolConfig | ColorConfig | StringConfig)[], origin: ObjectBase) {
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

        if(item.title != undefined)
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
}

export {NumberConfig, EnumConfig, BoolConfig, RangeConfig, StringConfig, ColorConfig, ObjectBase}