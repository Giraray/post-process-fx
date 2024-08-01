import perlinCode from '../assets/shaders/perlinNoise.wgsl?raw';
import { imgTextureConfig } from '../createConfig';
import ShaderObject from './shaderObject'

interface Size {
    width: number,
    height: number,
}

/**
 * User-configurable options.
 * @param style {@link StyleOptions} with variable computing of the Perlin noise. Default is "natural"
 * @param gridSize Zoom level. Default is 2
 * @param intensity Noise multiplication. Default is 1
 */
interface PerlinConfig {
    style?: StyleOptions;
    gridSize?: number;
    intensity?: number;
    animate?: boolean;
}

type StyleOptions =
    | 'billowRidge'
    | 'natural'
    | 'normalized';

interface PerlinOptions {
    config?: PerlinConfig;
    seed: number;
    size: Size;
    canvasFormat: GPUTextureFormat;
    device: GPUDevice;
    context: GPUCanvasContext;
}

/**
 * Creates an object containing a `GPURenderPipeline` and a `GPUBindGroup` for 
 * a perlin noise texture.
 */
export class PerlinTexture implements PerlinOptions {
    time: number = 0;
    config?: PerlinConfig;
    size: Size;
    seed: number;
    context: GPUCanvasContext;
    readonly canvasFormat: GPUTextureFormat;
    readonly device: GPUDevice;

    pipeline: GPURenderPipeline;
    bindGroup: GPUBindGroup;

    shaders: Array<ShaderObject>;
    timeout: ReturnType<typeof setTimeout>;
    dataUrl: string;

    constructor(options: PerlinOptions) {
        this.size = options.size;
        this.canvasFormat = options.canvasFormat;
        this.device = options.device;
        this.seed = options.seed;
        this.config = options.config ? options.config : undefined;
        this.context = options.context;
        this.shaders = new Array<ShaderObject>;

        if(!this.config.animate)
            this.config.animate = false;
        if(!this.config.intensity)
            this.config.intensity = 1;
        if(!this.config.gridSize)
            this.config.gridSize = 2;

        // generate user config
        document.getElementById('textureOptions').innerHTML = imgTextureConfig;

        // EVENT LISTENERS
        const config = this.config;
        const self = this;
        const intensityElm = <HTMLInputElement>document.getElementById('intensity');
        const styleElm = <HTMLSelectElement>document.getElementById('style');
        const gridSizeElm = <HTMLInputElement>document.getElementById('gridSize');
        const animateElm = <HTMLInputElement>document.getElementById('animate');

        // intensity
        intensityElm.addEventListener('change', function(event) {
            let value = parseFloat((event.target as HTMLInputElement).value);
            if(isNaN(value))
                value = 0;
            config.intensity = value;

            clearTimeout(self.timeout);
            self.renderToCanvas();
        })

        // style
        styleElm.addEventListener('change', function(event) {
            let value = (event.target as HTMLInputElement).value;
            config.style = value as StyleOptions;

            clearTimeout(self.timeout);
            self.renderToCanvas();
        })

        // gridSize
        gridSizeElm.addEventListener('change', function(event) {
            let value = parseFloat((event.target as HTMLInputElement).value);
            if(isNaN(value))
                value = 0;
            config.gridSize = value;

            clearTimeout(self.timeout);
            self.renderToCanvas();
        })

        // animate
        animateElm.addEventListener('change', function(event) {
            let value = (event.target as HTMLInputElement).checked === true ? true : false;
            config.animate = value;

            clearTimeout(self.timeout);
            self.renderToCanvas();
        })
    }

    setTimer() {
        this.timeout = setTimeout(() => {
            this.time += 1;
            requestAnimationFrame(this.renderToCanvas.bind(this));
        }, 1000 / 30);
    }

    // create texture
    createTexture() {
        const device = this.device;
        const canvasFormat = this.canvasFormat

        const shaderModule = device.createShaderModule({
            label: 'perlin texture shader',
            code: perlinCode
        });

        // PIPELINE
        const bindGroupLayout = device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
                    buffer: {
                        type: 'uniform',
                    },
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
                    buffer: {
                        type: 'uniform',
                    },
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
                    buffer: {
                        type: 'uniform',
                    },
                },
                {
                    binding: 3,
                    visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
                    buffer: {
                        type: 'uniform',
                    },
                },
                {
                    binding: 4,
                    visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
                    buffer: {
                        type: 'uniform',
                    },
                },
                {
                    binding: 5,
                    visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
                    buffer: {
                        type: 'uniform',
                    },
                },
            ]
        });

        this.pipeline = device.createRenderPipeline({
            label: 'perlin texture pipeline',
            layout: device.createPipelineLayout({bindGroupLayouts:[bindGroupLayout]}),
            vertex: {
                module: shaderModule,
            },
            fragment: {
                module: shaderModule,
                targets: [{format:canvasFormat}],
            },
        });

        // BINDINGS

        // style options
        let styleValue: number;
        switch (this.config.style) {
            case 'billowRidge':
                styleValue = 1;
                break;
            case 'normalized':
                styleValue = 2;
                break;
            case 'natural':
            default:
                styleValue = 3;
                break;
        }

        // style
        const styleBuffer = device.createBuffer({
            size: 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        device.queue.writeBuffer(styleBuffer, 0, new Int32Array([styleValue]));

        // resolution
        const resBuffer = device.createBuffer({
            size:8,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        device.queue.writeBuffer(resBuffer, 0, new Float32Array([this.size.width, this.size.height]));

        // seed
        const seedBuffer = device.createBuffer({
            size: 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        device.queue.writeBuffer(seedBuffer, 0, new Float32Array([this.seed]));

        // gridSize
        const gridBuffer = device.createBuffer({
            size: 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        device.queue.writeBuffer(gridBuffer, 0, new Float32Array([this.config.gridSize]));

        // intensity
        const intensityBuffer = device.createBuffer({
            size: 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        device.queue.writeBuffer(intensityBuffer, 0, new Float32Array([this.config.intensity]));

        // time
        const timeBuffer = device.createBuffer({
            size: 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        device.queue.writeBuffer(timeBuffer, 0, new Float32Array([this.time]));

        this.bindGroup = device.createBindGroup({
            label: 'perlin bindgroup',
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {buffer: styleBuffer},
                },
                {
                    binding: 1,
                    resource: {buffer: resBuffer}
                },
                {
                    binding: 2,
                    resource: {buffer: seedBuffer}
                },
                {
                    binding: 3,
                    resource: {buffer: gridBuffer}
                },
                {
                    binding: 4,
                    resource: {buffer: intensityBuffer}
                },
                {
                    binding: 5,
                    resource: {buffer: timeBuffer}
                },
            ],
        });
    }

    public resizeCanvas(canvas: HTMLCanvasElement) {
        canvas.width = this.size.width;
        canvas.height = this.size.height;

        canvas.style.width = this.size.width + 'px';
        canvas.style.height = this.size.height + 'px';
    }

    public updateTime(delta: number) {
        this.time += delta;
    }

    /**
     * Adds a `ShaderObject` to the `shaders` array.
     * @param shader The ShaderObject to be added
     */
    public addShader(shader: ShaderObject) {
        this.shaders.push(shader);
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

    public renderToCanvas() {

        // render texture
        this.createTexture();
        const renderTargetA = this.device.createTexture({
            label: 'texA placeholder',
            format: this.canvasFormat,
            size: [this.size.width, this.size.height],
            usage: 
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.RENDER_ATTACHMENT |
                GPUTextureUsage.COPY_SRC
        });

        const textureEncoder = this.device.createCommandEncoder({
            label: 'texEncoder',
        });
        const pass = textureEncoder.beginRenderPass({
            colorAttachments: [{
                view: renderTargetA.createView(),
                clearValue: [0, 0, 0, 1],
                loadOp: 'clear',
                storeOp: 'store',
            }],
        });
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.bindGroup);
        pass.draw(6);
        pass.end();

        this.device.queue.submit([textureEncoder.finish()]);


        // RENDER SHADER
        const theShader = this.shaders[0];
    
        const shaderEncoder = this.device.createCommandEncoder({
            label: 'shader encoder',
        });

        // resolution buffer
        const resBuffer = this.device.createBuffer({
            size:8,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        this.device.queue.writeBuffer(resBuffer, 0, new Float32Array([this.size.width, this.size.height]));

        const bindGroup = this.device.createBindGroup({
            layout: theShader.pipeline.getBindGroupLayout(0),
            entries: [
                {binding: 0, resource: this.device.createSampler()},
                {binding: 1, resource: renderTargetA.createView()},
                {binding: 2, resource: { buffer: resBuffer }}
            ],
        });

        const shaderPass = shaderEncoder.beginRenderPass({
            colorAttachments: [{
                view: this.context.getCurrentTexture().createView(),
                clearValue: [0,0,0,1],
                loadOp: 'clear',
                storeOp: 'store',
            }],
        });
        
        shaderPass.setPipeline(theShader.pipeline);
        shaderPass.setBindGroup(0, bindGroup);
        shaderPass.draw(6);
        shaderPass.end();
        
        this.device.queue.submit([shaderEncoder.finish()]);

        this.dataUrl = (<HTMLCanvasElement>this.context.canvas).toDataURL('image/png');

        if(this.config.animate === true) {
            this.setTimer();
        }
    }
}