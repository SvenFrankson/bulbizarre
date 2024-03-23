class BrickTemplateManager {

    private static _Instance: BrickTemplateManager;
    public static get Instance(): BrickTemplateManager {
        if (!BrickTemplateManager._Instance) {
            BrickTemplateManager._Instance = new BrickTemplateManager();
        }
        return BrickTemplateManager._Instance;
    }

    private _templates: BrickTemplate[] = [];
    
    public getTemplate(index: number): BrickTemplate {
        if (!this._templates[index]) {
            this._templates[index] = this.createTemplate(index);
        }
        return this._templates[index];
    }

    public createTemplate(index: number): BrickTemplate {
        return new BrickTemplate(index);
    }
}

class BrickTemplate {
    public vertexData: BABYLON.VertexData;

    constructor(public index: number) {
        let w = 0.78;
        let h = 0.32;
        let s = 2;
        this.vertexData = Mummu.CreateBeveledBoxVertexData({ width: (s * w / h), height: s, depth: (s * w / h), flat: true });
        Mummu.TranslateVertexDataInPlace(this.vertexData, new BABYLON.Vector3(0, s * 0.5, 0));
        Mummu.ScaleVertexDataInPlace(this.vertexData, h / s);
    }
}