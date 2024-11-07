import sharpResponsive from 'gulp-sharp-responsive';
import debug from 'gulp-debug';
import gulp from 'gulp';
const { src, dest, parallel } = gulp;

const IMAGE_SIZES = {
  carousel: [
    300, 880, 1210, 1470, 1680, 1880, 2050, 2210, 2360, 2500, 2640, 2765,
  ],
  gallery: [507, 800, 1014],
  about: [465, 690, 930, 1110],
};

const generateFormats = (sizes) => {
  const formats = sizes.map((width) => ({
    width,
    rename: { suffix: `-${width}px` },
    format: 'webp',
  }));
  formats.push({ format: 'webp' });
  return formats;
};

const createImageTask = (source, sizes) => {
  return () =>
    src(source)
      .pipe(sharpResponsive({ formats: generateFormats(sizes) }))
      .on('error', console.error.bind(console))
      .pipe(dest('public/optimised/img'));
};

const carouselImage = createImageTask(
  'public/img/carousel-1.png',
  IMAGE_SIZES.carousel
);
const galleryImages = createImageTask(
  'public/img/gallery-*.jpg',
  IMAGE_SIZES.gallery
);
const aboutImages = createImageTask(
  'public/img/about-*.jpg',
  IMAGE_SIZES.about
);
const galleryBackgroundImage = createImageTask(
  'public/img/gallery.jpg',
  IMAGE_SIZES.carousel
);

export default parallel(
  carouselImage,
  galleryImages,
  aboutImages,
  galleryBackgroundImage
);
