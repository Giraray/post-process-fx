/**
 * Legacy. Should be deleted when range input is implemented
 */
export const perlinTextureConfig: string = `
    <!-- number input -->
    <div class="option-container option-container_input border444" title="Increases contrast">
        <span class="input-desc">Intensity:</span>
        <input type="number" class="border000" value="1" id="intensity">
    </div>

    <!-- range input --> <!-- joke -->
    <div class="option-container option-container_range border444" title="Zooms out the texture">
        <span class="input-desc">Grid size:</span>
        <input type="number" class="range-value border000" value="3" id="gridSize" step="0.1">
    </div>

    <!-- enum input -->
    <div class="option-container option-container_enum border444" title="Noise style">
        <span class="input-desc">Style:</span>
        <select class="option-select border000" id="style">
            <option value="natural">Natural</option>
            <option value="fractal">Fractal</option>
            <option value="normalized">Normalized</option>
            <option value="billowRidge">Billow ridge</option>
        </select>
    </div>

    <!-- fractal -->
    <div class="option-container option-container_input border444" title="Fractal of product - No effect if Style is not Fractal">
        <span class="input-desc">Fractals:</span>
        <input type="number" class="border000" value="5" id="fractals">
    </div>

    <!-- boolean input -->
    <div class="option-container option-container_boolean border444" title="Animates the texture">
        <span class="input-desc">Animate:</span>
        <input type="checkbox" class="checkbox border000" id="animate">
    </div>

    <!-- number input -->
    <div class="option-container option-container_input border444" title="Simulation speed - No effect if Animate is turned off">
        <span class="input-desc">Sim. speed:</span>
        <input type="number" class="border000" value="1" id="speed">
    </div>
`

export const imgTextureConfig: string = `
    <!-- boolean input -->
    <div class="option-container option-container_boolean border444" title="Resizes the image to fit the container">
        <span class="input-desc">Resize:</span>
        <input type="checkbox" class="checkbox border000" id="resize" checked>
    </div>
`