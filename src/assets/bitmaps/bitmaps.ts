const O = [255,255,255,255]; // white
const _ = [0,0,0,255]; // black

interface Size {
    width: number;
    height: number;
}

interface Bitmap {
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




const bitmapVer3Resolution = 80*8*4; // w * h * rgba
const bitmapVer3String = `
    ________________________________________________________________________________
    ____________________________O_____________OOOO____OOOO___OO___O____OO_____OOOO__
    ___________________________O_______OO________O____O______OO__O____O__O___O____O_
    ___________________O_______O______O__O______O_____OOO_______O_____O_OO___O_OOOO_
    ___________O______OOO______O______O_________O________O_____O______OO_O___O__OO__
    ___________________O_______O______O__O_____O_________O____O__OO___O__O____O_____
    ____________________________O______OO______O______OOO____O___OO____OO______OO___
    ________________________________________________________________________________
`
export const bitmapVer3Data: Bitmap = {
    size: {width: 80, height: 8},
    data: dataToArray(bitmapVer3String, bitmapVer3Resolution)
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

export const bitmapEdgeVer1Data: Bitmap = {
    size: {width: 32, height: 8},
    data: dataToArray(bitmapEdgeVer1_String, bitmapEdgeVer1_Resolution),
}