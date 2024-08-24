interface ConfigInputBase {
    label: string;
    id: string;
    title?: string; // user hints
    disabled?: boolean;
    event: Function;
}

type ConfigType = 
    | 'number'
    | 'enum'
    | 'bool'
    | 'range';

// number
interface NumberConfig extends ConfigInputBase {
    type: ConfigType;
    default: Number;
    value: Number;
    min?: Number;
    max?: Number;
}

// enums
interface EnumConfig extends ConfigInputBase {
    type: ConfigType;
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
    type: ConfigType;
    default: boolean;
    value: boolean;
}

// range
interface RangeConfig extends ConfigInputBase {
    type: ConfigType;
    default: Number;
    value: Number;
    min: Number;
    max: Number;
    configurable?: boolean; // whether or not min and max can be modified
}

class ObjectBase {
    public createConfigElm(config: [NumberConfig | EnumConfig | BoolConfig | RangeConfig]) {
        for(let i = 0; i < config.length; i++) {
            const item = config[i];

            console.log(item);
        }
    }
}

export {NumberConfig, EnumConfig, BoolConfig, RangeConfig, ObjectBase}