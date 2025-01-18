A silly website to showcase silly shaders

todo (high priority stuff):
- Cel shader edge
- Cel shader palette customization
- Cel shader theoretical color harmonies
- changing img texture when previous image was original size will affect next preferredContainerSize, messing up resize functionality
- Luminance calculations should probably be smoothed out (feels janky with ASCII blocks sometimes)
- Improve the ASCII shader algorithm based on learnings from DoG filter implementation
- dataUrl only updates when texture is changed or adjusted

- implement user input support for ascii bitmaps (80% done, 15% bitmaps done)
- CRT configs (maybe some tonemapping options?)
- Learn SDF and raytracing to make extra cool 3D simulations as textures
- Halftone/comic book shader :))))
- gif/video support for ImgTexture?

bugs and low priority stuff:
- Insert image needs error handling.
- Add onWindowResize handler.
- re-evalute RenderDescriptor.
- CRT filter sometimes has weird artefacts on ImgTextures. Have no idea why
- config should not be initialized before a shader is applied. Currently it is created whenever a shader object is instantiatied

things that would be nice to have:
- Mouse-interactive fluid simulation texture
- whole ass UI overhaul
- ASCII size configuration


ASCII optimization ideas:
- asciiDownscale output texture can be 8x smaller; Could in theory reduce processing bandwidth costs from textureStore() in asciiDownscale, as well as from using the texture in memory in asciiConvert?
- asciiConvert would probably benefit from conditional sampling based on edge draws.
