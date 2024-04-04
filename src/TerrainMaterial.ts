class TerrainMaterial extends BABYLON.ShaderMaterial {

    private _lightInvDirW: BABYLON.Vector3 = BABYLON.Vector3.Up();
    private _level: number = 0;

    constructor(name: string, scene: BABYLON.Scene) {
        super(
            name,
            scene,
            {
                vertex: "terrainToon",
                fragment: "terrainToon",
            },
            {
                attributes: ["position", "normal", "uv", "uv2", "color"],
                uniforms: [
                    "world", "worldView", "worldViewProjection", "view", "projection",
                    "lightInvDirW",
                    "level",
                    "noiseTexture",
                    "terrainColors",
                    "lightTexture"
                ]
            }
        );

        let w = 32;
        let h = 256;
        let d = 32;
        let data: Uint8ClampedArray = new Uint8ClampedArray(32 * 356 * 32);
        for (let i = 0; i < w; i++) {
            for (let j = 0; j < d; j++) {
                for (let k = 0; k < h; k++) {
                    data[(i + j * w + k * w * w)] = Math.floor(Math.random() * 256);
                }
            }
        }
        let myTestRaw3DTexture = new BABYLON.RawTexture3D(data, 32, 256, 32, BABYLON.Constants.TEXTUREFORMAT_R, this.getScene());
        myTestRaw3DTexture.wrapU = 1;
        myTestRaw3DTexture.wrapV = 1;
        myTestRaw3DTexture.wrapR = 1;

        this.setLightInvDir(BABYLON.Vector3.One().normalize());
        
        this.setFloat("blockSize_m", 0.45);
        this.setTexture("noiseTexture", new BABYLON.Texture("./datas/textures/test-noise.png"));
        this.setTexture("lightTexture", myTestRaw3DTexture);
        
        this.setColor3Array("terrainColors", Kulla.BlockTypeColors);
    }

    public getLightInvDir(): BABYLON.Vector3 {
        return this._lightInvDirW;
    }

    public setLightInvDir(p: BABYLON.Vector3): void {
        this._lightInvDirW.copyFrom(p);
        this.setVector3("lightInvDirW", this._lightInvDirW);
    }

    public getLevel(): number {
        return this._level;
    }

    public setLevel(v: number): void {
        this._level = v;
        this.setInt("level", this._level);
    }
}