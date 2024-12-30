import {ShaderObject, ProgramInstructions} from './shaderObject';
import celCode from '../assets/shaders/dog/dogCelShader.wgsl?raw';
import {NumberConfig, EnumConfig, BoolConfig, RangeConfig, ColorConfig} from './objectBase';


export default class CelShader extends ShaderObject {
    seedArray: Array<number>;

    constructor(device: GPUDevice, canvasFormat: GPUTextureFormat) {
        super(device, canvasFormat)
        this.static = true;
        this.seedArray = [Math.random(),Math.random(),Math.random(),Math.random()];

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

        let value = parseFloat(target.value);
        if(isNaN(value))
            value = 0;
        item.value = value;

        console.log(origin.seedArray);

        origin.render({
            size: origin.size,
            canvasFormat: origin.canvasFormat,
            context: origin.context,
        });
    }

    createConfig(): (NumberConfig | BoolConfig | EnumConfig)[] {
        const blur: NumberConfig = {
            type: 'number',
            label: 'Blur',
            id: 'blur',
            title: 'Blurs the base image',

            default: 1.0,
            value: 1.0,
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
        return [blur, dog, tau, quantize];
    }

    createInstructions(time: number, width: number, height: number): ProgramInstructions {
        const device = this.device;

        const blur = this.findIndex('blur');
        const dog = this.findIndex('dog');
        const tau = this.findIndex('tau');
        const quantize = this.findIndex('quantize');

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

        // buffers
        const usage = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;

        const blurBuffer = this.numberBuffer(4, this.config[blur]);
        const dogBuffer = this.numberBuffer(4, this.config[dog]);
        const tauBuffer = this.numberBuffer(4, this.config[tau]);
        const quantizeBuffer = this.numberBuffer(4, this.config[quantize]);

        // resolution buffer
        const resBuffer = this.device.createBuffer({size:8, usage: usage});
        this.device.queue.writeBuffer(resBuffer, 0, new Float32Array([width, height]));

        // seedBuffer
        const seedBuffer = this.device.createBuffer({size: 16, usage});
        this.device.queue.writeBuffer(seedBuffer, 0, new Float32Array(this.seedArray));

        const celEntries = [
            {binding: 0, resource: this.sampler},
            {binding: 1, resource: this.texture.createView()},
            {binding: 2, resource: { buffer: resBuffer }},
            {binding: 3, resource: { buffer: blurBuffer }},
            {binding: 4, resource: { buffer: dogBuffer }},
            {binding: 5, resource: { buffer: tauBuffer }},
            {binding: 6, resource: { buffer: quantizeBuffer }},
            {binding: 7, resource: { buffer: seedBuffer }},
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
        return instructions;
    }
}