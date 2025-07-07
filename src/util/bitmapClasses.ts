import * as BM from '../assets/bitmaps/bitmaps';
import {gaussianBlur, generateGaussianKernel} from './gaussianWeight'

interface Size {
    width: number;
    height: number;
}

export interface Bitmap {
    size: Size;
    data: Uint8Array;
}

interface BitmapData {
    data: string,
    brightness: number,
}

const O = [255,255,255,255]; // white
const _ = [0,0,0,255]; // black

/**
 * Used to dynamically retrieve a character for bitmap assembly
 */
export class BitmapAssembler {
    cBackspace = BM.cBackspace;
    cDot = BM.cDot;
    cComma = BM.cComma;
    cMinus = BM.cMinus;
    cPlus = BM.cPlus;
    cColon = BM.cColon;
    cSemicolon = BM.cSemicolon;
    cBlock = BM.cBlock;
    cAt = BM.cAt;
    cQuestion = BM.cQuestion;
    cFSlash = BM.cFSlash;
    cBSlash = BM.cBSlash;
    cDash = BM.cDash;
    cBar = BM.cBar;
    ca = BM.ca;
    cA = BM.cA;
    cb = BM.cb;
    cB = BM.cB;
    cc = BM.cc;
    cC = BM.cC;
    cd = BM.cd;
    cD = BM.cD;
    ce = BM.ce;
    cE = BM.cE;
    cf = BM.cf;
    cF = BM.cF;
    cg = BM.cg;
    ch = BM.ch;
    cH = BM.cH;
    ci = BM.ci;
    cI = BM.cI;
    ck = BM.ck;
    cK = BM.cK;
    cn = BM.cn;
    cN = BM.cN;
    cr = BM.cr;
    cR = BM.cR;

    c1 = BM.c1;
    c2 = BM.c2;
    c3 = BM.c3;
    c4 = BM.c4;
    c5 = BM.c5;
    c6 = BM.c6;
    c7 = BM.c7;
    c8 = BM.c8;
    c9 = BM.c9;
    c0 = BM.c0;

    cSection = BM.cSection;
    cCloseBracket = BM.cCloseBracket;
    cOpenBracket = BM.cOpenBracket;

    // return character bitmap string from BM namespace
    public getChar(suffix: string): string {

        // sanitize special characters
        // todo system for dither?
        switch(suffix) {
            case " ":
                suffix = "Backspace";
                break;
            case ".":
                suffix = "Dot";
                break;
            case ",":
                suffix = "Comma";
                break;
            case ":":
                suffix = "Colon";
                break;
            case ";":
                suffix = "Semicolon";
                break;
            case "+":
                suffix = "Plus";
                break;
            case "-":
                suffix = "Minus";
                break;
            case "*":
                suffix = "Block";
                break;
            case "@":
                suffix = "At";
                break;
            case "?":
                suffix = "Question";
                break;
            case "/":
                suffix = "FSlash";
                break;
            case "\\":
                suffix = "BSlash";
                break;
            case "_":
                suffix = "Dash";
                break;
            case "|":
                suffix = "Bar";
                break;
            case "§":
                suffix = "Section";
                break;
            case "(":
                suffix = "OpenBracket";
                break;
            case ")":
                suffix = "CloseBracket";
                break;
        }
        const char = this["c" + suffix];
        return char;
    }

    /**
     * Processes a string into a cohesive `Bitmap` based on bitmap characters defined in namespace `BM`.
     * @param string String of characters to be used in bitmap
     * @param isEdge Whether or not the bitmap is used for ASCII edges. Only changes whether or not characters are sorted
     * @returns 
     */
    public createBitmap(string: string, isEdge?: boolean): Bitmap {
        const chars = [];
        const invalid = [];

        if(isEdge == undefined) {
            isEdge = false;
        }

        // add bitmap characters corresponding to input to chars[]
        for(let i = 0; i < string.length; i++) {
            const currCharFromString = string[i];
            const char = this.getChar(currCharFromString);

            if(char == undefined) {
                invalid.push(string[i]);
                continue;
            }

            chars.push(char);
        }

        // alert user and list invalid letters if any
        if(invalid.length > 0) {
            let errorStr = '';

            for(let i = 0; i < invalid.length; i++) {
                errorStr += invalid[i] + ' ';
            }

            let plural = '';
            let is = 'is';
            if(invalid.length > 1) {
                plural = 's';
                is = 'are';
            }

            alert('Character'+plural+' '+errorStr+is+' invalid')
        }

        const width = 8*chars.length;
        
        // creates a bitmap with a dynamic width
        const bitmap: Bitmap = {
            size: {width, height: 8},
            data: this.dataToArray(this.assembleChars(chars, isEdge), 8*width*4),
        };
        return bitmap;
    }

    // converts a string of bitmap characters into a data array, which is then used to generate bitmap texture
    dataToArray(data: string, resolution: number): Uint8Array {

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

    // processes an array of bitmap characters into one cohesive string
    assembleChars(arr: string[], isEdge: boolean): string {

        // dont sort if its an edge bitmap
        if(!isEdge) {arr = this.sortByBrightness(arr);}

        let bitmapString = '';
        for(let i = 1; i < 10; i++) {
            for(let j = 0; j < arr.length; j++) {
                const line = arr[j].split('\n')[i];
                bitmapString = bitmapString.concat(line);
            }
        }
        return bitmapString;
    }

    // bubble sort based on brightness
    sortByBrightness(arr: string[]): string[] {
        for(let pass = 0; pass < arr.length; pass++) {
            for(let i = 0; i < arr.length - 1; i++) {
                if(this.getCharBrightness(arr[i]) > this.getCharBrightness(arr[i + 1])) {
                    const nextChar = arr[i+1];
                    arr[i+1] = arr[i];
                    arr[i] = nextChar;
                }
            }
        }

        return arr;
    }

    // counts the pixels in a character
    getCharBrightness(char: string): Number {
        let x = 0;
        for(let i = 0; i < char.length; i++) {
            if(char[i] === '0') {
                x += 1;
            }
        }
        return x;
    }

    // Only for testing  vvv
    public logAllBrightness(string: string): void {
        const invalid = [];
        for(let i = 0; i < string.length; i++) {
            const currCharFromString = string[i];
            const char = this.getChar(currCharFromString);

            if(char == undefined) {
                invalid.push(string[i]);
                continue;
            }

            const brightness = this.getCharBrightness(char);
            console.log(currCharFromString, brightness);
        }
        console.log('Omitted letters:',invalid);
    }
}

const assembler = new BitmapAssembler();
assembler.logAllBrightness(' ,17360§*(');

// -------------------------------------------------
// vvv  UNUSED CLASS. I WANT TO KEEP IT THOUGH  vvv
// -------------------------------------------------


/**
 * A BitmapAssembler that uses gaussian blur to assess perceived brightness. 
 * Results are worse on this one though, but im keeping it in case ever get a revelation 
 * on how perceived brightness actually works.
 */
export class BitmapAssemblerOld {
    
    private gaussianKernel: Array<Array<number>> = generateGaussianKernel(7,4)

    // todo: this should be cached in local storage
    private cBackspace: BitmapData = {data: BM.cBackspace, brightness: gaussianBlur(this.gaussianKernel, BM.cBackspace)};
    private cDot:       BitmapData = {data: BM.cDot, brightness: gaussianBlur(this.gaussianKernel, BM.cDot)};
    private cMinus:     BitmapData = {data: BM.cMinus, brightness: gaussianBlur(this.gaussianKernel, BM.cMinus)};
    private cPlus:      BitmapData = {data: BM.cPlus, brightness: gaussianBlur(this.gaussianKernel, BM.cPlus)};
    private cColon:     BitmapData = {data: BM.cColon, brightness: gaussianBlur(this.gaussianKernel, BM.cColon)};
    private cSemicolon: BitmapData = {data: BM.cSemicolon, brightness: gaussianBlur(this.gaussianKernel, BM.cSemicolon)};
    private cBlock:     BitmapData = {data: BM.cBlock, brightness: gaussianBlur(this.gaussianKernel, BM.cBlock)};
    private cAt:        BitmapData = {data: BM.cAt, brightness: gaussianBlur(this.gaussianKernel, BM.cAt)};
    private cQuestion:  BitmapData = {data: BM.cQuestion, brightness: gaussianBlur(this.gaussianKernel, BM.cQuestion)};
    
    private ca: BitmapData = {data: BM.ca, brightness: gaussianBlur(this.gaussianKernel, BM.ca)};
    private cA: BitmapData = {data: BM.cA, brightness: gaussianBlur(this.gaussianKernel, BM.cA)};
    private cb: BitmapData = {data: BM.cb, brightness: gaussianBlur(this.gaussianKernel, BM.cb)};
    private cB: BitmapData = {data: BM.cB, brightness: gaussianBlur(this.gaussianKernel, BM.cB)};
    private cc: BitmapData = {data: BM.cc, brightness: gaussianBlur(this.gaussianKernel, BM.cc)};
    private cC: BitmapData = {data: BM.cC, brightness: gaussianBlur(this.gaussianKernel, BM.cC)};
    private cd: BitmapData = {data: BM.cd, brightness: gaussianBlur(this.gaussianKernel, BM.cd)};
    private cD: BitmapData = {data: BM.cD, brightness: gaussianBlur(this.gaussianKernel, BM.cD)};
    private ce: BitmapData = {data: BM.ce, brightness: gaussianBlur(this.gaussianKernel, BM.ce)};
    private cE: BitmapData = {data: BM.cE, brightness: gaussianBlur(this.gaussianKernel, BM.cE)};
    private cf: BitmapData = {data: BM.cf, brightness: gaussianBlur(this.gaussianKernel, BM.cf)};
    private cF: BitmapData = {data: BM.cF, brightness: gaussianBlur(this.gaussianKernel, BM.cF)};
    private cg: BitmapData = {data: BM.cg, brightness: gaussianBlur(this.gaussianKernel, BM.cg)};
    private ch: BitmapData = {data: BM.ch, brightness: gaussianBlur(this.gaussianKernel, BM.ch)};
    private cH: BitmapData = {data: BM.cH, brightness: gaussianBlur(this.gaussianKernel, BM.cH)};
    private ci: BitmapData = {data: BM.ci, brightness: gaussianBlur(this.gaussianKernel, BM.ci)};
    private cI: BitmapData = {data: BM.cI, brightness: gaussianBlur(this.gaussianKernel, BM.cI)};
    private ck: BitmapData = {data: BM.ck, brightness: gaussianBlur(this.gaussianKernel, BM.ck)};
    private cK: BitmapData = {data: BM.cK, brightness: gaussianBlur(this.gaussianKernel, BM.cK)};
    private cn: BitmapData = {data: BM.cn, brightness: gaussianBlur(this.gaussianKernel, BM.cn)};
    private cN: BitmapData = {data: BM.cN, brightness: gaussianBlur(this.gaussianKernel, BM.cN)};
    private cr: BitmapData = {data: BM.cr, brightness: gaussianBlur(this.gaussianKernel, BM.cr)};
    private cR: BitmapData = {data: BM.cR, brightness: gaussianBlur(this.gaussianKernel, BM.cR)};

    // test cases
    private cMiddle_1px: BitmapData = {data: BM.cMiddle_1px, brightness: gaussianBlur(this.gaussianKernel, BM.cMiddle_1px)};
    private cCorner_1px: BitmapData = {data: BM.cCorner_1px, brightness: gaussianBlur(this.gaussianKernel, BM.cCorner_1px)};

 
    constructor() {
        console.log('Done calculating gaussian weights')
        console.log("C:",this.cC.brightness,"a:", this.ca.brightness)
    }

    // return character bitmap string
    public getChar(suffix: string): BitmapData {

        // sanitize special characters
        switch(suffix) {
            case " ":
                suffix = "Backspace";
                break;
            case ".":
                suffix = "Dot";
                break;
            case ",":
                suffix = "Comma";
                break;
            case ":":
                suffix = "Colon";
                break;
            case ";":
                suffix = "Semicolon";
                break;
            case "+":
                suffix = "Plus";
                break;
            case "-":
                suffix = "Minus";
                break;
            case "*":
                suffix = "Block";
                break;
            case "@":
                suffix = "At";
                break;
            case "?":
                suffix = "Question";
                break;

        }
        const char = this["c" + suffix];
        return char;
    }

    public createBitmap(string: string): Bitmap {
        let chars: BitmapData[] = [];

        // add bitmap characters corresponding to input to chars[]
        for(let i = 0; i < string.length; i++) {
            const currCharFromString = string[i];
            chars.push(this.getChar(currCharFromString));
        }

        // sort chars
        chars = this.sortByBrightness(chars);
        const charsData = chars.map(char => char.data);

        const width = 8*string.length; // ???
        
        // creates a bitmap with a dynamic width
        const bitmap: Bitmap = {
            size: {width, height: 8},
            data: this.dataToArray(this.assembleChars(charsData), 8*8*width*4),
        };
        return bitmap;
    }

    dataToArray(data: string, resolution: number): Uint8Array {

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

    /**
     * Assembles bitmap characters into a single data string, sorting them by "brightness" 
     * in the process.
     * @param arr String of bitmap characters.
     * @returns Data string containing the assembled bitmap.
     */
    assembleChars(arr: string[]): string {
        const chars = arr.length;

        let bitmapString = '';
        for(let i = 1; i <= arr.length; i++) {
            for(let j = 0; j < chars; j++) {
                const line = arr[j].split('\n')[i];
                bitmapString = bitmapString.concat(line);
            }
        }
        return bitmapString;
    }

    // bubble sort brightness
    sortByBrightness(arr: BitmapData[]): BitmapData[] {
        for(let pass = 0; pass < arr.length; pass++) {
            for(let i = 0; i < arr.length - 1; i++) {
                if(arr[i].brightness > arr[i + 1].brightness) {
                    const nextChar = arr[i+1];
                    arr[i+1] = arr[i];
                    arr[i] = nextChar;
                }
            }
        }
        return arr;
    }
}