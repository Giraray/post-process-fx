A silly website to showcase silly shaders

todo (high priority stuff):
- Finish ASCII and CRT configs (implement range- and colorConfig objects)
- Learn SDF and raytracing to make extra cool 3D simulations as textures
- Halftone/comic book shader :))))
- gif/video support for ImgTexture?

bugs and low priority stuff:
- Insert image needs error handling.
- Clean up render() in ShaderObject.
- dataUrl is never up to date for some reason, i think..
- Disabling resize causes large images to clip out of the window because they are centered.
- Better way to manage bitmaps, and support user input.
- Add onWindowResize handler.
- re-evalute RenderDescriptor.
- config is duplicative in ObjectBase (config objects are independently declared from config objects declared in children constructors, hence a double declaration)
- ASCII size configuration

other wonderful ideas:
- Mouse-interactive fluid simulation texture
- whole ass UI overhaul


ASCII optimization ideas:
- asciiDownscale output texture can be 8x smaller; Could in theory reduce processing bandwidth costs from textureStore() in asciiDownscale, as well as from using the texture in memory in asciiConvert?
- asciiConvert would probably benefit from conditional sampling based on edge draws.
