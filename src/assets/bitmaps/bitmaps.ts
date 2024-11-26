const O = [255,255,255,255]; // white
const _ = [0,0,0,255]; // black

interface Size {
    width: number;
    height: number;
}

export interface Bitmap {
    size: Size;
    data: Uint8Array;
}

function dataToArray(data: string, resolution: number): Uint8Array {

    const array = new Uint8Array(resolution);
    const cleanData = data.replace(/\s/g, '');

    for(let i = 0; i < cleanData.length; i++) {
        const pixel = cleanData[i] === '0' ? O : _;

        array[i * 4] = pixel[0];      // r
        array[i * 4 + 1] = pixel[1];  // g
        array[i * 4 + 2] = pixel[2];  // b
        array[i * 4 + 3] = pixel[3];  // a
    }

    return array;
}

const bitmapVer3_Resolution = 80*8*4; // w * h * rgba
const bitmapVer3_String = `
    --------------------------------------------------------------------------------
    ----------------------------0-------------0000----0000---00---0----00-----0000--
    ---------------------------0-------00--------0----0------00--0----0--0---0----0-
    ---------------------------0------0--0------0-----000-------0-----0-00---0-0000-
    ------------------000------0------0---------0--------0-----0------00-0---0--00--
    ---------------------------0------0--0-----0---------0----0--00---0--0----0-----
    -----------0----------------0------00------0------000----0---00----00------00---
    --------------------------------------------------------------------------------
`
export const bitmapVer3_Data: Bitmap = {
    size: {width: 80, height: 8},
    data: dataToArray(bitmapVer3_String, bitmapVer3_Resolution)
}

const bitmapVer4_Resolution = 80*8*4;
const bitmapVer4_String = `
--------------------------------------------------------------------------------
------------------------------------------000------00------00-----0000--0000000-
---------------------------00------00-----0--0----0--0----0--00--0----0-0000000-
-------------------0------0--0----0--0----0--0----0--0------000--0-0000-0000000-
--------------------------0-------0--0----000-----0--0-----0-----0--00--0000000-
-------------------0------0--0----0--0----0-------0--0------------0-----0000000-
---------0---------0-------00------00-----0--------00------0-------00---0000000-
--------------------------------------------------------------------------------
`;

export const bitmapVer4_Data: Bitmap = {
    size: {width: 80, height: 8},
    data: dataToArray(bitmapVer4_String, bitmapVer4_Resolution),
}

const bitmapVer5_Resolution = 80*8*4;
const bitmapVer5_String = `
--------------------------------------------------------------------------------
---------------------------------------------------00------00-----0000--0000000-
-----------------------------------00-----0-------0--0----0--00--0----0-0000000-
-------------------0-------0------0--0----0-------0---------000--0-0000-0000000-
--------------------------000-----0-------000-----0--------0-----0--00--0000000-
---------------------------0------0--0----0--0----0--0------------0-----0000000-
-----------0-------0---------------00-----0--0-----00------0-------00---0000000-
--------------------------------------------------------------------------------
`;

export const bitmapVer5_Data: Bitmap = {
    size: {width: 80, height: 8},
    data: dataToArray(bitmapVer5_String, bitmapVer5_Resolution),
}




const bitmapEdgeVer1_Resolution = 32*8*4;
const bitmapEdgeVer1_String = `
    -----0---0----------------------
    ----0-----0----------------0----
    ----0-----0----------------0----
    ---0-------0---------------0----
    ---0-------0-----000000----0----
    --0---------0--------------0----
    --0---------0--------------0----
    -0-----------0------------------
`

export const bitmapEdgeVer1_Data: Bitmap = {
    size: {width: 32, height: 8},
    data: dataToArray(bitmapEdgeVer1_String, bitmapEdgeVer1_Resolution),
}

// bubble sort based on brightness
function sortByBrightness(arr: string[]): string[] {
    for(let pass = 0; pass < arr.length; pass++) {
        for(let i = 0; i < arr.length - 1; i++) {
            if(getCharBrightness(arr[i]) > getCharBrightness(arr[i + 1])) {
                const nextChar = arr[i+1];
                console.log('swapped: ' + (arr[i]) + ' with ' + (arr[i+1]))
                arr[i+1] = arr[i];
                arr[i] = nextChar;
            }
        }
    }

    return arr;
}

function getCharBrightness(char: string): Number {
    let x = 0;
    for(let i = 0; i < char.length; i++) {
        if(char[i] === '0') {
            x += 1;
        }
    }
    return x;
}

// todo validation
/**
 * Assembles bitmap characters into a single data string, sorting them by "brightness" 
 * in the process.
 * @param arr String of bitmap characters.
 * @returns Data string containing the assembled bitmap.
 */
function assembleChars(arr: string[]): string {
    const chars = arr.length;
    arr = sortByBrightness(arr);

    let bitmapString = '';
    for(let i = 1; i <= 10; i++) {
        for(let j = 0; j < chars; j++) {
            const line = arr[j].split('\n')[i];
            bitmapString = bitmapString.concat(line);
        }
    }
    return bitmapString;
}

const cBackspace = `
--------
--------
--------
--------
--------
--------
--------
--------
`

const cDot = `
--------
--------
--------
--------
--------
--------
---0----
--------
`

const cColon = `
--------
--------
--------
---0----
--------
--------
---0----
--------
`

const cSemicolon = `
--------
--------
--------
---0----
--------
---0----
---0----
--------
`

const cMinus = `
--------
--------
--------
--------
--000---
--------
--------
--------
`

const cPlus = `
--------
--------
--------
---0----
--000---
---0----
--------
--------
`

const ca = `
--------
--------
--------
--0000--
-0---0--
-0---0--
--0000--
--------
`;

const cA = `
--------
--000---
-0---0--
-0---0--
-0---0--
-00000--
-0---0--
-0---0--
`;

const cb = `
--------
-0------
-0------
-0000---
-0---0--
-0---0--
-0000---
--------
`;

const cB = `
--------
-00000--
-0----0-
-0----0-
-00000--
-0----0-
-0----0-
-00000--
`;

const cc = `
--------
--------
--000---
-0---0--
-0------
-0---0--
--000---
--------
`;

const cC = `
--------
--0000--
-0----0-
-0------
-0------
-0------
-0----0-
--0000--
`;

const cd = `
--------
-----0--
-----0--
--0000--
-0---0--
-0---0--
--0000--
--------
`;

const cD = `
--------
-00000--
-0----0-
-0----0-
-0----0-
-0----0-
-0----0-
-00000--
`;

const ce = `
--------
--------
--000---
-0---0--
-00000--
-0------
--000---
--------
`;

const cE = `
--------
-000000-
-0------
-0------
-00000--
-0------
-0------
-000000-
`;

const cf = `
--------
---00---
--0--0--
--0-----
-0000---
--0-----
--0-----
--------
`;

const cF = `
--------
-000000-
-0------
-0------
-00000--
-0------
-0------
-0------
`;

const cg = `
--------
--------
--000---
-0---0--
-0---0--
--0000--
-----0--
--000---
`;

const ch = `
--------
-0------
-0------
-0000---
-0---0--
-0---0--
-0---0--
--------
`;

const cH = `
--------
-0----0-
-0----0-
-0----0-
-000000-
-0----0-
-0----0-
-0----0-
`;

const cBlock = `
0000000-
0000000-
0000000-
0000000-
0000000-
0000000-
0000000-
--------
`

export const testBitmap: Bitmap = {
    size: {width: 80, height: 8},
    data: dataToArray(assembleChars([cBackspace, cDot, cColon, cPlus, cc, cg, cC, cH, cB, cBlock]), 8*8*10*4)
}