class TerrainMap {

    public maps: Map<number, Map<number, Uint8ClampedArray>>;

    constructor(public seededMap: SeededMap, public size: number) {
        this.maps = new Map<number, Map<number, Uint8ClampedArray>>();
    }

    public getMap(IMap: number, JMap: number): Uint8ClampedArray {
        let line = this.maps.get(IMap);
        if (!line) {
            line = new Map<number, Uint8ClampedArray>();
            this.maps.set(IMap, line);
        }
        let map = line.get(JMap);
        if (!map) {
            map = this.generateMap(IMap, JMap);
            line.set(JMap, map);
        }
        return map;
    }

    public generateMap(IMap: number, JMap: number): Uint8ClampedArray {
        let map = new Uint8ClampedArray(this.size * this.size);
        map.fill(0);

        /*
        // Linear version
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                let v00 = this.seededMap.getValue(iOffset + i, jOffset + j, 0);
                let v10 = this.seededMap.getValue(iOffset + i + 1, jOffset + j, 0);
                let v11 = this.seededMap.getValue(iOffset + i + 1, jOffset + j + 1, 0);
                let v01 = this.seededMap.getValue(iOffset + i, jOffset + j + 1, 0);
                for (let ii = 0; ii < l; ii++) {
                    for (let jj = 0; jj < l; jj++) {
                        let di = ii / l;
                        let dj = jj / l;
                        let vA = (1 - di) * v00 + di * v10;
                        let vB = (1 - di) * v01 + di * v11;
                        let v = (1 - dj) * vA + dj * vB;
                        map[(i * l + ii) + (j * l + jj) * this.size] = v;
                    }
                }
            }
        }
        */
       
        // Bicubic version
        let supperpoCount = 6;
        let l = 128;
        for (let c = 0; c < supperpoCount; c++) {
            let n = this.size / l;
    
            let iOffset = IMap * n;
            let jOffset = JMap * n;
    
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    let v00 = this.seededMap.getValue(iOffset + i - 1, jOffset + j - 1, c);
                    let v10 = this.seededMap.getValue(iOffset + i + 0, jOffset + j - 1, c);
                    let v20 = this.seededMap.getValue(iOffset + i + 1, jOffset + j - 1, c);
                    let v30 = this.seededMap.getValue(iOffset + i + 2, jOffset + j - 1, c);
                    let v01 = this.seededMap.getValue(iOffset + i - 1, jOffset + j + 0, c);
                    let v11 = this.seededMap.getValue(iOffset + i + 0, jOffset + j + 0, c);
                    let v21 = this.seededMap.getValue(iOffset + i + 1, jOffset + j + 0, c);
                    let v31 = this.seededMap.getValue(iOffset + i + 2, jOffset + j + 0, c);
                    let v02 = this.seededMap.getValue(iOffset + i - 1, jOffset + j + 1, c);
                    let v12 = this.seededMap.getValue(iOffset + i + 0, jOffset + j + 1, c);
                    let v22 = this.seededMap.getValue(iOffset + i + 1, jOffset + j + 1, c);
                    let v32 = this.seededMap.getValue(iOffset + i + 2, jOffset + j + 1, c);
                    let v03 = this.seededMap.getValue(iOffset + i - 1, jOffset + j + 2, c);
                    let v13 = this.seededMap.getValue(iOffset + i + 0, jOffset + j + 2, c);
                    let v23 = this.seededMap.getValue(iOffset + i + 1, jOffset + j + 2, c);
                    let v33 = this.seededMap.getValue(iOffset + i + 2, jOffset + j + 2, c);
                    for (let ii = 0; ii < l; ii++) {
                        for (let jj = 0; jj < l; jj++) {
                            let di = ii / l;
                            let dj = jj / l;
                            map[(i * l + ii) + (j * l + jj) * this.size] += Nabu.BicubicInterpolate(di, dj, v00, v10, v20, v30, v01, v11, v21, v31, v02, v12, v22, v32, v03, v13, v23, v33) / 255 * l;
                        }
                    }
                }
            }

            l = l / 2;
        }

        return map;
    }

    public downloadAsPNG(IMap: number, JMap: number): void {
        let canvas = document.createElement("canvas");
        canvas.width = this.size;
        canvas.height = this.size;

        let data = this.getMap(IMap, JMap);

        let context = canvas.getContext("2d");
        let pixels = new Uint8ClampedArray(data.length * 4);
        for (let i = 0; i < data.length; i++) {
            let v = data[i];
            pixels[4 * i] = v;
            pixels[4 * i + 1] = v;
            pixels[4 * i + 2] = v;
            pixels[4 * i + 3] = 255;
        }
        context.putImageData(new ImageData(pixels, this.size, this.size), 0, 0);

        var a = document.createElement('a');
        a.setAttribute('href', canvas.toDataURL());
        a.setAttribute('download', "terrainMap_" + IMap + "_" + JMap + ".png");
      
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}