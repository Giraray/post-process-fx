import {ShaderObject, ProgramInstructions, ShaderProgram} from './shaderObject';
import celCode from '../assets/shaders/dog/dogCelShader.wgsl?raw';
import dogAA from '../assets/shaders/dog/dogAA.wgsl?raw';
import {NumberConfig, EnumConfig, BoolConfig, RangeConfig, ColorConfig, BtnConfig} from './objectBase';


export default class CelShader extends ShaderObject {
    seedArray: Array<number>;
    satSeed: number;

    constructor(device: GPUDevice, canvasFormat: GPUTextureFormat) {
        super(device, canvasFormat)
        this.static = true;
        this.seedArray = [Math.random(),Math.random(),Math.random(),Math.random()];
        this.satSeed = Math.random();

        this.configArray = this.createConfig();
        this.config = super.sortConfigs(this.configArray);
        this.initTextureConfig(this.config, this);

        this.metadata = {
            name: 'DoG Cel shader',
            imgUrl: '',
            description: 'Cel shading is the quantization of color values. This shader utilizes the Difference of Gaussians (DoG) operator to filter out noise and stylize the image before color quantization.',
        }
        this.updateMetadata();
    }

    // NumberConfig handler that also generates a palette seed. Used to isolate seed generation to adjustments to quantization
    handleQuantizeConfig(target: HTMLInputElement, origin: CelShader, item: NumberConfig) {
        for(let i = 0; i < 4; i++) {
            origin.seedArray[i] = Math.random();
        }
        origin.satSeed = Math.random();

        let value = parseFloat(target.value);
        if(isNaN(value))
            value = 0;
        item.value = value;

        origin.render({
            size: origin.size,
            canvasFormat: origin.canvasFormat,
            context: origin.context,
        });
    }

    handleFXAAConfig(target: HTMLInputElement, origin: CelShader, item: BoolConfig) {
        let value = target.checked;
        item.value = value;

        origin.render({
            size: origin.size,
            canvasFormat: origin.canvasFormat,
            context: origin.context,
        });
    }

    handleGenPaletteBtn(origin: CelShader) {

    }

    createConfig(): (NumberConfig | BoolConfig | EnumConfig | BtnConfig)[] {
        const blur: NumberConfig = {
            type: 'number',
            label: 'Blur',
            id: 'blur',
            title: 'Blurs the base image',

            default: 3.0,
            value: 3.0,
            step: 0.1,

            event: this.handleNumberConfig,
        }
        const dog: NumberConfig = {
            type: 'number',
            label: 'DoG',
            id: 'dog',
            title: 'The subtracted blur. idk how else to describe it man',

            default: 1,
            value: 1,
            step: 0.1,

            event: this.handleNumberConfig,
        }
        const tau: NumberConfig = {
            type: 'number',
            label: 'Sharpness',
            id: 'tau',
            title: '',

            default: 1.0,
            value: 1.0,
            step: 0.1,

            event: this.handleNumberConfig,
        }
        const quantize: NumberConfig = {
            type: 'number',
            label: 'Quantize',
            id: 'quantize',
            title: 'Color divisions - Generates a random palette',

            default: 4,
            value: 4,

            event: this.handleQuantizeConfig,
        }
        const aa: BoolConfig = {
            type: 'bool',
            label: 'Antialias',
            id: 'aa',
            title: 'Applies a box blur to smooth aliased edges',

            default: true,
            value: true,

            event: this.handleFXAAConfig,
        }
        const aaStrength: NumberConfig = {
            type: 'number',
            label: 'Antialias strength',
            id: 'aaStrength',
            title: 'Applies a box blur to smooth aliased edges',

            default: 1.0,
            value: 1.0,
            step: 0.1,
            min: 0,

            event: this.handleNumberConfig,
        }
        const harmony: EnumConfig = {
            type: 'enum',
            label: 'Harmony',
            id: 'harmony',
            title: 'Color harmony style',

            options: [
                {id: 'analogous', label: 'Analogous'},
                {id: 'equidistant', label: 'Equidistant'},
                {id: 'monochromatic', label: 'Monochromatic'},
                {id: 'complementary', label: 'Complementary'},
            ],

            default: 'analogous',
            value: 'analogous',

            event: this.handleEnumConfig,
        }
        const genPalette: BtnConfig = {
            type: 'btn',
            label: 'Generate palette',
            id: 'genPalette',
            title: '',
            event: this.handleQuantizeConfig
        }
        return [blur, dog, tau, quantize, aa, aaStrength, harmony, genPalette];
    }

    createInstructions(time: number, width: number, height: number): ProgramInstructions {
        const device = this.device;

        const blur = this.findIndex('blur');
        const dog = this.findIndex('dog');
        const tau = this.findIndex('tau');
        const quantize = this.findIndex('quantize');
        const aa = this.findIndex('aa');
        const aaStrength = this.findIndex('aaStrength');

        // main shader
        const celModule = device.createShaderModule({
            code: celCode,
        });
        const celPipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: celModule,
            },
            fragment: {
                module: celModule,
                targets: [{format: this.canvasFormat}],
            },
        });


        // AA
        const aaModule = device.createShaderModule({
            code: dogAA,
        });
        const aaPipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: aaModule,
            },
            fragment: {
                module: aaModule,
                targets: [{format: this.canvasFormat}],
            },
        });

        // buffers
        const usage = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;

        const blurBuffer = this.numberBuffer(4, this.config[blur]);
        const dogBuffer = this.numberBuffer(4, this.config[dog]);
        const tauBuffer = this.numberBuffer(4, this.config[tau]);
        const quantizeBuffer = this.numberBuffer(4, this.config[quantize]);
        const aaStrengthBuffer = this.numberBuffer(4, this.config[aaStrength]);

        // resolution buffer
        const resBuffer = this.device.createBuffer({size:8, usage: usage});
        this.device.queue.writeBuffer(resBuffer, 0, new Float32Array([width, height]));

        // seedBuffer
        const satBuffer = this.device.createBuffer({size: 4, usage});
        this.device.queue.writeBuffer(satBuffer, 0, new Float32Array(this.satSeed));
        
        const seedBuffer = this.device.createBuffer({size: 16, usage});
        this.device.queue.writeBuffer(seedBuffer, 0, new Float32Array(this.seedArray));

        let harmonyEnum: number;
        switch(this.config[this.findIndex('harmony')].value) {
            case 'analogous':
                harmonyEnum = 0;
                break;
            case 'equidistant':
                harmonyEnum = 1;
                break;
            case 'monochromatic':
                harmonyEnum = 2;
                break;
            case 'complementary':
                harmonyEnum = 3;
                break;
            default:
                harmonyEnum = 0;
                console.log('Error selecting harmony: Setting to default (analogous)')
                break;
        }

        const harmonyBuffer = this.device.createBuffer({size: 4, usage});
        this.device.queue.writeBuffer(harmonyBuffer, 0, new Float32Array([harmonyEnum]));

        const celEntries = [
            {binding: 0, resource: this.sampler},
            {binding: 1, resource: this.texture.createView()},
            {binding: 2, resource: { buffer: resBuffer }},
            {binding: 3, resource: { buffer: blurBuffer }},
            {binding: 4, resource: { buffer: dogBuffer }},
            {binding: 5, resource: { buffer: tauBuffer }},
            {binding: 6, resource: { buffer: quantizeBuffer }},
            {binding: 7, resource: { buffer: seedBuffer }},
            {binding: 8, resource: { buffer: harmonyBuffer }},
        ];

        const cannyEntries = [
            {binding: 0, resource: this.sampler},
            {binding: 1, resource: this.texture.createView()},
            {binding: 2, resource: { buffer: resBuffer }},
            {binding: 3, resource: { buffer: aaStrengthBuffer }},
        ]

        const instructions: ProgramInstructions = {
            label: 'Cel shader instructions',
            passes: [
                {
                    label: 'Cel shader',
                    passType: 'render',
                    pipeline: celPipeline,
                    entries: celEntries,
                },
            ],
        }

        const aaPass: ShaderProgram = {
            label: 'Antialias w boxblur',
            passType: 'render',
            pipeline: aaPipeline,
            entries: cannyEntries,
        }

        if(this.config[aa].value == true) {
            instructions.passes.push(aaPass);
        }

        return instructions;
    }
}