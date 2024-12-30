import {ShaderObject, ProgramInstructions} from './shaderObject';
import shaderCode from '../assets/shaders/dog/dogShader.wgsl?raw';
import sobelCode from '../assets/shaders/dog/dogSobel.wgsl?raw';
import dogCode from '../assets/shaders/dog/dogdog.wgsl?raw';
import {NumberConfig, EnumConfig, BoolConfig, RangeConfig, ColorConfig} from './objectBase';


export default class DoGShader extends ShaderObject {
    constructor(device: GPUDevice, canvasFormat: GPUTextureFormat) {
        super(device, canvasFormat)
        this.static = true;

        this.configArray = this.createConfig();
        this.config = super.sortConfigs(this.configArray);
        this.initTextureConfig(this.config, this);

        this.metadata = {
            name: 'In progress! (DoG filter)',
            imgUrl: '',
            description: 'The difference of Gaussians (DoG) is an edge-enhancing band-pass filter. The DoG operator subtracts a blur of the image from another less blurred version, enhancing edges and filtering out noise. The result can then be easily stylized to achieve different aesthetics.',
        }
        this.updateMetadata();
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
        const style: EnumConfig = {
            type: 'enum',
            label: 'Style',
            id: 'style',
            title: 'Color gradient representation',
            
            default: 'quantized',
            value: 'quantized',

            options: [
                {label: 'Quantized', id: 'quantized'},
                {label: 'Hyperbolic', id: 'hyperbolic'},
            ],

            event: this.handleEnumConfig,
        }
        const thresh: NumberConfig = {
            type: 'number',
            label: 'Thresh',
            id: 'thresh',
            title: '',

            default: 4,
            value: 4,
            step: 0.1,

            event: this.handleNumberConfig,
        }
        const scaler: NumberConfig = {
            type: 'number',
            label: 'Scaler',
            id: 'scaler',
            title: '',

            step: 0.1,
            default: 2,
            value: 2,

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
            title: '',

            default: 4,
            value: 4,

            event: this.handleNumberConfig,
        }
        return [blur, dog, tau, style, thresh, scaler, quantize];
    }

    createInstructions(time: number, width: number, height: number): ProgramInstructions {
        const device = this.device;

        const blur = this.findIndex('blur');
        const dog = this.findIndex('dog');
        const thresh = this.findIndex('thresh');
        const scaler = this.findIndex('scaler');
        const tau = this.findIndex('tau');
        const quantize = this.findIndex('quantize');
        const style = this.findIndex('style');

        const sobelModule = device.createShaderModule({
            code: sobelCode,
        });
        const sobelPipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: sobelModule,
            },
            fragment: {
                module: sobelModule,
                targets: [{format: this.canvasFormat}],
            },
        });

        const dogModule = device.createShaderModule({
            code: dogCode,
        });
        const dogPipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: dogModule,
            },
            fragment: {
                module: dogModule,
                targets: [{format: this.canvasFormat}],
            },
        });

        // buffers
        const usage = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;

        const blurBuffer = this.numberBuffer(4, this.config[blur]);
        const dogBuffer = this.numberBuffer(4, this.config[dog]);
        const threshBuffer = this.numberBuffer(4, this.config[thresh]);
        const scalerBuffer = this.numberBuffer(4, this.config[scaler]);
        const tauBuffer = this.numberBuffer(4, this.config[tau]);
        const quantizeBuffer = this.numberBuffer(4, this.config[quantize]);

        let styleEnum: number;
        switch(this.config[style].value) {
            case 'quantized':
                styleEnum = 0;
                break;
            case 'hyperbolic':
                styleEnum = 1;
                break;
        }
        const styleBuffer = device.createBuffer({size: 4,usage: usage});
        device.queue.writeBuffer(styleBuffer, 0, new Float32Array([styleEnum]));

        // resolution buffer
        const resBuffer = this.device.createBuffer({size:8, usage: usage});
        this.device.queue.writeBuffer(resBuffer, 0, new Float32Array([width, height]));

        const sobelEntries = [
            {binding: 0, resource: this.sampler},
            {binding: 1, resource: this.texture.createView()},
            {binding: 2, resource: { buffer: resBuffer }},
        ]

        const dogEntries = [
            {binding: 0, resource: this.sampler},
            {binding: 1, resource: this.texture.createView()},
            {binding: 2, resource: { buffer: resBuffer }},
            {binding: 3, resource: { buffer: blurBuffer }},
            {binding: 4, resource: { buffer: dogBuffer }},
            {binding: 5, resource: { buffer: threshBuffer }},
            {binding: 6, resource: { buffer: scalerBuffer }},
            {binding: 7, resource: { buffer: tauBuffer }},
            {binding: 8, resource: { buffer: quantizeBuffer }},
            {binding: 9, resource: { buffer: styleBuffer }},
        ]

        const instructions: ProgramInstructions = {
            label: 'DoG shader instructions',
            passes: [
                {
                    label: 'sobel',
                    passType: 'render',
                    pipeline: sobelPipeline,
                    entries: dogEntries,
                },
                // {
                //     label: 'DoG',
                //     passType: 'render',
                //     pipeline: dogPipeline,
                //     entries: dogEntries,
                // },
            ],
        }
        return instructions;
    }
}