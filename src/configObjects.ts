import { imgTextureConfig } from './createConfig';

export class ImgTextureUserConfig {
    private intensity: number;
    private style: String;
    private gridSize: number;
    private animate: boolean;

    constructor() {
        document.getElementById('textureOptions').innerHTML = imgTextureConfig;

        const intensityElm = <HTMLInputElement>document.getElementById('intensity');
        const styleElm = <HTMLSelectElement>document.getElementById('style');
        const gridSizeElm = <HTMLInputElement>document.getElementById('gridSize');
        const animateElm = <HTMLInputElement>document.getElementById('animate');

        this.intensity = parseInt(intensityElm.value);
        this.style = styleElm.value;
        this.gridSize = parseInt(gridSizeElm.value);
        this.animate = animateElm.value === 'on' ? true : false;

        // EVENT LISTENERS
        const self = this;

        // intensity
        intensityElm.addEventListener('change', function(event) {
            let value = parseInt((event.target as HTMLInputElement).value);
            if(isNaN(value))
                value = 0;
            self.intensity = value;

            console.log(self)
        })

        // style
        styleElm.addEventListener('change', function(event) {
            let value = (event.target as HTMLInputElement).value;
            self.style = value;

            console.log(self)
        })

        // gridSize
        gridSizeElm.addEventListener('change', function(event) {
            let value = parseInt((event.target as HTMLInputElement).value);
            if(isNaN(value))
                value = 0;
            self.gridSize = value;

            console.log(self)
        })



        // animate
        animateElm.addEventListener('change', function(event) {
            let value = (event.target as HTMLInputElement).checked === true ? true : false;
            console.log((event.target as HTMLInputElement).checked)
            self.animate = value;

            console.log(self)
        })
    }

    public setIntensity(value: number) {
        this.intensity = value;
        document.getElementById('intensity');
    }
}