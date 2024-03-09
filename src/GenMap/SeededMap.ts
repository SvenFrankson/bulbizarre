class SeededMap {

    public seedMaps: SeedMap[][];
    public primes = [1, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];

    constructor(public N: number, public size: number) {
        this.seedMaps = [];
        for (let i = 0; i < this.N; i++) {
            this.seedMaps[i] = [];
            for (let j = 0; j < this.N; j++) {
                this.seedMaps[i][j] = new SeedMap("seedmap-" + i + "-" + j, this.size);
                this.seedMaps[i][j].randomFill();
            }
        }
    }

    public getValue(i: number, j: number, d: number): number {
        i = Math.max(i, 0);
        j = Math.max(j, 0);
        let di = this.primes[(Math.floor(i / (this.size * this.N)) + d) % this.primes.length];
        let dj = this.primes[(Math.floor(j / (this.size * this.N)) + d) % this.primes.length];
        if (!isFinite(di)) {
            di = 1;
        }
        if (!isFinite(dj)) {
            dj = 1;
        }
        let IMap = (i + Math.floor(i / this.size)) % this.N;
        let JMap = (j + Math.floor(j / this.size)) % this.N;
        return this.seedMaps[IMap][JMap].getData(i * di, j * dj);
    }

    public downloadAsPNG(size: number, d: number = 0): void {
        let canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;

        let data = new Uint8ClampedArray(size * size);
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                data[i + j * size] = this.getValue(i, j, d);
            }
        }

        let context = canvas.getContext("2d");
        let pixels = new Uint8ClampedArray(data.length * 4);
        for (let i = 0; i < data.length; i++) {
            let v = Math.floor(data[i] / 32) * 32;
            pixels[4 * i] = v;
            pixels[4 * i + 1] = v;
            pixels[4 * i + 2] = v;
            pixels[4 * i + 3] = 255;
        }
        context.putImageData(new ImageData(pixels, size, size), 0, 0);

        var a = document.createElement('a');
        a.setAttribute('href', canvas.toDataURL());
        a.setAttribute('download', "genMap.png");
      
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}