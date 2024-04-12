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
                    "lightTexture",
                    "debugColor",
                    "blockSize_m",
                    "blockHeight_m"
                ]
            }
        );

        let w = 2;
        let h = 2;
        let d = 2;
        let data: Uint8ClampedArray = new Uint8ClampedArray(w * h * d);
        data.fill(255);
        let myTestRaw3DTexture = new BABYLON.RawTexture3D(data, w, h, d, BABYLON.Constants.TEXTUREFORMAT_R, this.getScene(), false, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE, BABYLON.Engine.TEXTURETYPE_UNSIGNED_BYTE);
        myTestRaw3DTexture.wrapU = 1;
        myTestRaw3DTexture.wrapV = 1;
        myTestRaw3DTexture.wrapR = 1;
        this.setTexture("lightTexture", myTestRaw3DTexture);

        this.setLightInvDir(BABYLON.Vector3.One().normalize());
        
        this.setFloat("blockSize_m", 0.4);
        this.setFloat("blockHeight_m", 0.4);
        
        this.setColor3Array("terrainColors", Kulla.BlockTypeColors);

        this.updateDebugColor();
    }

    public getLightInvDir(): BABYLON.Vector3 {
        return this._lightInvDirW;
    }

    public setLightInvDir(p: BABYLON.Vector3): void {
        this._lightInvDirW.copyFrom(p);
        this.setVector3("lightInvDirW", this._lightInvDirW);
    }

    private _debugColor: BABYLON.Color3 = BABYLON.Color3.White();
    public get debugColor(): BABYLON.Color3 {
        return this._debugColor;
    }
    public setDebugColor(c: BABYLON.Color3) {
        this._debugColor = c;
        this.updateDebugColor();
    }
    public updateDebugColor(): void {
        this.setColor3("debugColor", this._debugColor);
    }

    public getLevel(): number {
        return this._level;
    }

    public setLevel(v: number): void {
        this._level = v;
        this.setInt("level", this._level);
    }
}