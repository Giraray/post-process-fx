export const imgTextureConfig: string = `
    <!-- number input -->
    <div class="option-container option-container_input border444" title="Multiplier; Increases contrast">
        <span class="input-desc">Intensity:</span>
        <input type="number" class="border000" value="1" id="intensity">
    </div>

    <!-- range input --> <!-- joke -->
    <div class="option-container option-container_range border444" title="Mutliplier for the UV; Zooms out the texture">
        <span class="input-desc">Grid size:</span>
        <input type="number" class="range-value border000" value="3" id="gridSize" step="0.1">
    </div>

    <!-- enum input -->
    <div class="option-container option-container_enum border444" title="How the noise is displayed">
        <span class="input-desc">Style:</span>
        <select class="option-select border000" id="style">
            <option value="natural">Natural</option>
            <option value="billowRidge">Billow ridge</option>
            <option value="normalized">Normalized</option>
        </select>
    </div>

    <!-- boolean input -->
    <div class="option-container option-container_boolean border444" title="Mutliplier for the UV; Zooms out the texture">
        <span class="input-desc" title="Whether or not the texture should be animated">Animate:</span>
        <input type="checkbox" class="checkbox border000" id="animate">
    </div>
`