// Legacy!!!
// Calculates perceived brightness by blurring characters and then averaging values.
// These functions exist to address geometric-compositional components of perceived-
// brightness. After testing though, it turns out that those don't really exist, or at 
// least aren't that simple to determine. While they do maybe affect how we perceive 
// brightness, they don't actually make something brighter or darker, at least not in 
// the context of 8x8 characters.

// Keeping this because it's cool and also may be useful for something later

function hypotenuse(x1: number, y1: number, x2: number, y2: number): number {
  var xSquare = Math.pow(x1 - x2, 2);
  var ySquare = Math.pow(y1 - y2, 2);
  return Math.sqrt(xSquare + ySquare);
}

let sum = 0;
/*
 * Generates a kernel used for the gaussian blur effect.
 *
 * @param dimension is an odd integer
 * @param sigma is the standard deviation used for our gaussian function.
 *
 * @returns 
 */
export function generateGaussianKernel(dimension: number, sigma: number): Array<Array<number>> {
  if (!(dimension % 2) || Math.floor(dimension) !== dimension || dimension<3) {
    throw new Error(
      'The dimension must be an odd integer greater than or equal to 3'
    );
  }
  var kernel = [];

  var twoSigmaSquare = 2 * sigma * sigma;
  var centre = (dimension - 1) / 2;

  for (var i = 0; i < dimension; i++) {
    for (var j = 0; j < dimension; j++) {
      var distance = hypotenuse(i, j, centre, centre);

      // The following is an algorithm that came from the gaussian blur
      // wikipedia page [1].
      //
      // http://en.wikipedia.org/w/index.php?title=Gaussian_blur&oldid=608793634#Mechanics
      var gaussian = (1 / Math.sqrt(
        Math.PI * twoSigmaSquare
      )) * Math.exp((-1) * (Math.pow(distance, 2) / twoSigmaSquare));

      kernel.push(gaussian);
    }
  }

  // Returns the unit vector of the kernel array.
  sum = kernel.reduce(function (c, p) { return c + p; });
  kernel.map(function (e) { return e / sum; });
  
  const newArr = [];
  while(kernel.length) {
    newArr.push(kernel.splice(0,dimension));
  }
  return newArr;
}


/**
 * Turn a ASCII character bitmap string into a matrix for blurring
 * @param bitmapChar String with character data
 * @returns 
 */
function formatStringToMatrix(bitmapChar: string): Array<Array<number>> {
    const matrix = [];
    bitmapChar = bitmapChar.replace(/\s/g, '');
    const matrixDimensions = Math.sqrt(bitmapChar.length);
    
    if(matrixDimensions%1 != 0) {
        throw new Error("Error trying to find brightness of bitmapString: bitmapString is not square.")
    }

    for(let i = 0; i < matrixDimensions; i++) {
        const row = [];
        for(let j = 0; j < matrixDimensions; j++) {
            if(bitmapChar[j] == "0") { row.push(1); }
            else { row.push(0); }
        }
        matrix.push(row);
        bitmapChar = bitmapChar.slice(matrixDimensions);
    }

    // post-processing to mitigate "edge-nulling" bias (pixels near edges aren't blurred as much)


    return matrix;
}

/**
 * Blurs a character bitmap string and sums the values in order to determine 
 * perceived character brightness.
 * @param kernel The gaussian convolution matrix
 * @param charData The Bitmap datastring to be processed
 * @returns A weight determining the perceived brightness of a bitmap datastring after blurring
 */
export function gaussianBlur(kernel: Array<Array<number>>, charData: string) {
    const kernelSize = kernel.length;
    const matrix = formatStringToMatrix(charData);
    const middle = Math.floor(kernelSize/2);

    // yes, it needs to be a quadruple-nested for loop
    // loop over every pixel of character
    for(let i = 0; i < matrix.length; i++) {
      for(let j = 0; j < matrix[i].length; j++) {
        
        // loop over every cell in gaussian kernel
        let blur = 0;
        for(let k = 0; k < kernel.length; k++) {
          for(let l = 0; l < kernel[k].length; l++) {

            const targetMatrixRow    = (k - middle) + i;
            const targetMatrixColumn = (l - middle) + j;

            if(targetMatrixRow < 0 || targetMatrixRow > matrix.length - 1) {continue}
            if(targetMatrixColumn < 0 || targetMatrixColumn > matrix.length - 1) {continue}

            blur += matrix[targetMatrixRow][targetMatrixColumn] * kernel[k][l];

          }
        }
        matrix[i][j] = blur / (sum*sum);
      }
    }

    // sum all values to get blurred brightness
    const weightArray = [];
    for(let i = 0; i < matrix.length; i++) {
        weightArray.push(matrix[i].reduce(function(c,p) {return c+p}));
    }

    let weight = 0;
    for(let i = 0; i < weightArray.length; i++) {
        weight += weightArray[i];
    }

    return weight;
}