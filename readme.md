A silly website to showcase silly shaders

todo (high priority stuff):
- Luminance calculations should probably be smoothed out (feels janky with ASCII blocks sometimes)
- normalize gaussian subtraction config (0-10, or smthn)

- implement user input support for ascii bitmaps (80% done, 15% bitmaps done)
- CRT configs (ascii is done)
- Learn SDF and raytracing to make extra cool 3D simulations as textures
- Halftone/comic book shader :))))
- gif/video support for ImgTexture?
- configs dont update download data

bugs and low priority stuff:
- Insert image needs error handling.
- Add onWindowResize handler.
- re-evalute RenderDescriptor.
- CRT filter sometimes has weird artefacts on ImgTextures. Have no idea why

things that would be nice to have:
- Mouse-interactive fluid simulation texture
- whole ass UI overhaul
- ASCII size configuration


ASCII optimization ideas:
- asciiDownscale output texture can be 8x smaller; Could in theory reduce processing bandwidth costs from textureStore() in asciiDownscale, as well as from using the texture in memory in asciiConvert?
- asciiConvert would probably benefit from conditional sampling based on edge draws.
