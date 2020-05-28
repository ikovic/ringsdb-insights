module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ js: 'js' });

  return {
    dir: {
      input: 'pages',
      output: 'static',
    },
  };
};
