module.exports = {
  map: {
    inline: false,
    annotation: true,
    sourcesContent: true,
  },
  plugins: [
    require("autoprefixer")({
      overrideBrowserslist: ["> 1%", "last 2 versions", "not dead"],
    }),
  ],
};
