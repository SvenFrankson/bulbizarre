class TerrainMap {
    public static MAX_FRAME_TIME_MS: number = 15;
    public static MAP_SIZE: number = 1024;
    public detailedMaps: Map<number, Map<number, Uint8ClampedArray>>;

    constructor(public seededMap: SeededMap, public period: number) {
        let floor = Nabu.Pow2(Nabu.FloorPow2Exponent(this.period));
        let ceil = Nabu.Pow2(Nabu.CeilPow2Exponent(this.period));
        if (Math.abs(floor - this.period) <= Math.abs(ceil - this.period)) {
            this.period = floor;
        } else {
            this.period = ceil;
        }
        this.detailedMaps = new Map<number, Map<number, Uint8ClampedArray>>();
    }

    public async getMap(IMap: number, JMap: number): Promise<Uint8ClampedArray> {
        let line = this.detailedMaps.get(IMap);
        if (!line) {
            line = new Map<number, Uint8ClampedArray>();
            this.detailedMaps.set(IMap, line);
        }
        let map = line.get(JMap);
        if (!map) {
            map = await this.generateMap(IMap, JMap);
            line.set(JMap, map);
        }
        return map;
    }

    public async generateMap(IMap: number, JMap: number): Promise<Uint8ClampedArray> {
        return new Promise<Uint8ClampedArray>(async (resolve) => {
            let map = new Uint8ClampedArray(TerrainMap.MAP_SIZE * TerrainMap.MAP_SIZE);
            map.fill(0);

            // Bicubic version
            let supperpoCount = 7;
            let f = 0.5;
            let l = this.period;
            for (let c = 0; c < supperpoCount; c++) {
                if (l > TerrainMap.MAP_SIZE) {
                    let count = l / TerrainMap.MAP_SIZE;
                    let I0 = Math.floor(IMap / count);
                    let J0 = Math.floor(JMap / count);

                    let v00 = this.seededMap.getValue(I0 - 1, J0 - 1, c);
                    let v10 = this.seededMap.getValue(I0 + 0, J0 - 1, c);
                    let v20 = this.seededMap.getValue(I0 + 1, J0 - 1, c);
                    let v30 = this.seededMap.getValue(I0 + 2, J0 - 1, c);
                    let v01 = this.seededMap.getValue(I0 - 1, J0 + 0, c);
                    let v11 = this.seededMap.getValue(I0 + 0, J0 + 0, c);
                    let v21 = this.seededMap.getValue(I0 + 1, J0 + 0, c);
                    let v31 = this.seededMap.getValue(I0 + 2, J0 + 0, c);
                    let v02 = this.seededMap.getValue(I0 - 1, J0 + 1, c);
                    let v12 = this.seededMap.getValue(I0 + 0, J0 + 1, c);
                    let v22 = this.seededMap.getValue(I0 + 1, J0 + 1, c);
                    let v32 = this.seededMap.getValue(I0 + 2, J0 + 1, c);
                    let v03 = this.seededMap.getValue(I0 - 1, J0 + 2, c);
                    let v13 = this.seededMap.getValue(I0 + 0, J0 + 2, c);
                    let v23 = this.seededMap.getValue(I0 + 1, J0 + 2, c);
                    let v33 = this.seededMap.getValue(I0 + 2, J0 + 2, c);

                    let diMin = (IMap % count) / count;
                    let diMax = diMin + 1 / count;
                    let djMin = (JMap % count) / count;
                    let djMax = djMin + 1 / count;

                    let doStep = (jj: number) => {
                        for (let ii = 0; ii < TerrainMap.MAP_SIZE; ii++) {
                            let di = ii / TerrainMap.MAP_SIZE;
                            di = diMin * (1 - di) + diMax * di;
                            let dj = jj / TerrainMap.MAP_SIZE;
                            dj = djMin * (1 - dj) + djMax * dj;
                            map[ii + jj * TerrainMap.MAP_SIZE] += Nabu.BicubicInterpolate(di, dj, v00, v10, v20, v30, v01, v11, v21, v31, v02, v12, v22, v32, v03, v13, v23, v33) * f;
                        }
                    };

                    let t0 = performance.now();
                    for (let jj = 0; jj < TerrainMap.MAP_SIZE; jj++) {
                        let t1 = performance.now();
                        if (t1 - t0 < TerrainMap.MAX_FRAME_TIME_MS) {
                            doStep(jj);
                        } else {
                            //console.log("break 1 at " + (t1 - t0).toFixed(3) + " ms");
                            await Nabu.NextFrame();
                            t0 = performance.now();
                            doStep(jj);
                        }
                    }
                } else {
                    let n = TerrainMap.MAP_SIZE / l;

                    let iOffset = IMap * n;
                    let jOffset = JMap * n;

                    let doStep = (j: number) => {
                        let v00 = this.seededMap.getValue(iOffset - 1, jOffset + j - 1, c);
                        let v10 = this.seededMap.getValue(iOffset + 0, jOffset + j - 1, c);
                        let v20 = this.seededMap.getValue(iOffset + 1, jOffset + j - 1, c);
                        let v30 = this.seededMap.getValue(iOffset + 2, jOffset + j - 1, c);
                        let v01 = this.seededMap.getValue(iOffset - 1, jOffset + j + 0, c);
                        let v11 = this.seededMap.getValue(iOffset + 0, jOffset + j + 0, c);
                        let v21 = this.seededMap.getValue(iOffset + 1, jOffset + j + 0, c);
                        let v31 = this.seededMap.getValue(iOffset + 2, jOffset + j + 0, c);
                        let v02 = this.seededMap.getValue(iOffset - 1, jOffset + j + 1, c);
                        let v12 = this.seededMap.getValue(iOffset + 0, jOffset + j + 1, c);
                        let v22 = this.seededMap.getValue(iOffset + 1, jOffset + j + 1, c);
                        let v32 = this.seededMap.getValue(iOffset + 2, jOffset + j + 1, c);
                        let v03 = this.seededMap.getValue(iOffset - 1, jOffset + j + 2, c);
                        let v13 = this.seededMap.getValue(iOffset + 0, jOffset + j + 2, c);
                        let v23 = this.seededMap.getValue(iOffset + 1, jOffset + j + 2, c);
                        let v33 = this.seededMap.getValue(iOffset + 2, jOffset + j + 2, c);

                        for (let i = 0; i < n; i++) {
                            for (let ii = 0; ii < l; ii++) {
                                for (let jj = 0; jj < l; jj++) {
                                    let di = ii / l;
                                    let dj = jj / l;
                                    map[i * l + ii + (j * l + jj) * TerrainMap.MAP_SIZE] += Nabu.BicubicInterpolate(di, dj, v00, v10, v20, v30, v01, v11, v21, v31, v02, v12, v22, v32, v03, v13, v23, v33) * f;
                                }
                            }
                            if (i < n - 1) {
                                v00 = v10;
                                v10 = v20;
                                v20 = v30;
                                v30 = this.seededMap.getValue(iOffset + i + 1 + 2, jOffset + j - 1, c);
                                v01 = v11;
                                v11 = v21;
                                v21 = v31;
                                v31 = this.seededMap.getValue(iOffset + i + 1 + 2, jOffset + j + 0, c);
                                v02 = v12;
                                v12 = v22;
                                v22 = v32;
                                v32 = this.seededMap.getValue(iOffset + i + 1 + 2, jOffset + j + 1, c);
                                v03 = v13;
                                v13 = v23;
                                v23 = v33;
                                v33 = this.seededMap.getValue(iOffset + i + 1 + 2, jOffset + j + 2, c);
                            }
                        }
                    };
                    
                    let t0 = performance.now();
                    for (let j = 0; j < n; j++) {
                        let t1 = performance.now();
                        if (t1 - t0 < TerrainMap.MAX_FRAME_TIME_MS) {
                            doStep(j);
                        } else {
                            //console.log("break 2 at " + (t1 - t0).toFixed(3) + " ms");
                            await Nabu.NextFrame();
                            t0 = performance.now();
                            doStep(j);
                        }
                    }
                }

                l = l / 2;
                f = f / 2;
                await Nabu.NextFrame();
            }

            resolve(map);
        });
    }

    public async downloadAsPNG(IMap: number, JMap: number, size: number = 1): Promise<void> {
        let canvas = document.createElement("canvas");
        canvas.width = TerrainMap.MAP_SIZE * size;
        canvas.height = TerrainMap.MAP_SIZE * size;
        let context = canvas.getContext("2d");

        for (let J = 0; J < size; J++) {
            for (let I = 0; I < size; I++) {
                let data = await this.getMap(IMap + I, JMap + J);
                let pixels = new Uint8ClampedArray(data.length * 4);
                for (let i = 0; i < data.length; i++) {
                    let v = data[i];
                    pixels[4 * i] = v;
                    pixels[4 * i + 1] = v;
                    pixels[4 * i + 2] = v;
                    pixels[4 * i + 3] = 255;
                }
                context.putImageData(new ImageData(pixels, TerrainMap.MAP_SIZE, TerrainMap.MAP_SIZE), I * TerrainMap.MAP_SIZE, J * TerrainMap.MAP_SIZE);
            }
        }

        var a = document.createElement("a");
        a.setAttribute("href", canvas.toDataURL());
        a.setAttribute("download", "terrainMap_" + IMap + "_" + JMap + ".png");

        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}
