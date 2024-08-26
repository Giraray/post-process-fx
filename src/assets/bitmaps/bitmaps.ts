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
        const pixel = cleanData[i] === 'O' ? O : _;

        array[i * 4] = pixel[0];      // r
        array[i * 4 + 1] = pixel[1];  // g
        array[i * 4 + 2] = pixel[2];  // b
        array[i * 4 + 3] = pixel[3];  // a
    }

    return array;
}

const bitmapVer3_Resolution = 80*8*4; // w * h * rgba
const bitmapVer3_String = `
    ________________________________________________________________________________
    ____________________________O_____________OOOO____OOOO___OO___O____OO_____OOOO__
    ___________________________O_______OO________O____O______OO__O____O__O___O____O_
    ___________________________O______O__O______O_____OOO_______O_____O_OO___O_OOOO_
    __________________OOO______O______O_________O________O_____O______OO_O___O__OO__
    ___________________________O______O__O_____O_________O____O__OO___O__O____O_____
    ___________O________________O______OO______O______OOO____O___OO____OO______OO___
    ________________________________________________________________________________
`
export const bitmapVer3_Data: Bitmap = {
    size: {width: 80, height: 8},
    data: dataToArray(bitmapVer3_String, bitmapVer3_Resolution)
}

const bitmapVer4_Resolution = 80*8*4;
const bitmapVer4_String = `
________________________________________________________________________________
__________________________________________OOO______OO______OO_____OOOO__OOOOOOO_
___________________________OO______OO_____O__O____O__O____O__OO__O____O_OOOOOOO_
___________________O______O__O____O__O____O__O____O__O______OOO__O_OOOO_OOOOOOO_
__________________________O_______O__O____OOO_____O__O_____O_____O__OO__OOOOOOO_
___________________O______O__O____O__O____O_______O__O____________O_____OOOOOOO_
___________O_______O_______OO______OO_____O________OO______O_______OO___OOOOOOO_
________________________________________________________________________________
`;

export const bitmapVer4_Data: Bitmap = {
    size: {width: 80, height: 8},
    data: dataToArray(bitmapVer4_String, bitmapVer4_Resolution),
}

const bitmapVer5_Resolution = 80*8*4;
const bitmapVer5_String = `
________________________________________________________________________________
___________________________________________________OO______OO_____OOOO__OOOOOOO_
___________________________________OO_____O_______O__O____O__OO__O____O_OOOOOOO_
___________________O_______O______O__O____O_______O_________OOO__O_OOOO_OOOOOOO_
__________________________OOO_____O_______OOO_____O________O_____O__OO__OOOOOOO_
___________________________O______O__O____O__O____O__O____________O_____OOOOOOO_
___________O_______O_______________OO_____O__O_____OO______O_______OO___OOOOOOO_
________________________________________________________________________________
`;

export const bitmapVer5_Data: Bitmap = {
    size: {width: 80, height: 8},
    data: dataToArray(bitmapVer5_String, bitmapVer5_Resolution),
}




const bitmapEdgeVer1_Resolution = 32*8*4;
const bitmapEdgeVer1_String = `
    _____O___O______________________
    ____O_____O________________O____
    ____O_____O________________O____
    ___O_______O_______________O____
    ___O_______O_______________O____
    __O_________O______________O____
    __O_________O______________O____
    _O___________O___OOOOOO_________
`

export const bitmapEdgeVer1_Data: Bitmap = {
    size: {width: 32, height: 8},
    data: dataToArray(bitmapEdgeVer1_String, bitmapEdgeVer1_Resolution),
}

function assembleChars(arr: string[]): string {
    const chars = arr.length;
    // if(chars != 8) {
    //     console.error('Not enough characters specified (no more or less than 8)') // todo return error to be handled in ascii config
    //     return;
    // }

    let bitmapString = '';
    for(let i = 1; i < 10; i++) {
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