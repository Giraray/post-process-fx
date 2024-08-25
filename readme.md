A silly website to showcase silly shaders

todo (high priority stuff):
- Finish ASCII and CRT configs (implement range- and colorConfig objects)
- Learn SDF and raytracing to make extra cool 3D simulations as textures
- Halftone/comic book shader :))))
- gif/video support for ImgTexture?

bugs and low priority stuff:
- Insert image needs error handling.
- Clean up render() in ShaderObject.
- dataUrl is never up never up to date for some reason, i think..
- Disabling resize causes large images to clip out of the window because they are centered.
- Better way to manage bitmaps, and support user input.
- Add onWindowResize handler.
- re-evalute RenderDescriptor.
- config is duplicative in ObjectBase (config objects are independently declared from a native config object)

other wonderful ideas:
- Mouse-interactive fluid simulation textures
- whole ass UI overhaul