class BrickTemplateManager {

    private static _Instance: BrickTemplateManager;
    public static get Instance(): BrickTemplateManager {
        if (!BrickTemplateManager._Instance) {
            BrickTemplateManager._Instance = new BrickTemplateManager(Game.Instance.vertexDataLoader);
        }
        return BrickTemplateManager._Instance;
    }

    private _templates: BrickTemplate[] = [];
    
    public async getTemplate(index: number): Promise<BrickTemplate> {
        if (!this._templates[index]) {
            this._templates[index] = await this.createTemplate(index);
        }
        return this._templates[index];
    }

    public async createTemplate(index: number): Promise<BrickTemplate> {
        let template = new BrickTemplate(index, this);
        await template.load();
        return template;
    }

    constructor(public vertexDataLoader: Mummu.VertexDataLoader) {

    }
}

class BrickTemplate {
    public vertexData: BABYLON.VertexData;

    constructor(public index: number, public brickTemplateManager: BrickTemplateManager) {
        let w = 0.78;
        let h = 0.32;
        let s = 2;
        this.vertexData = Mummu.CreateBeveledBoxVertexData({ width: (s * w / h), height: s, depth: (s * w / h), flat: true });
        Mummu.TranslateVertexDataInPlace(this.vertexData, new BABYLON.Vector3(0, s * 0.5, 0));
        Mummu.ScaleVertexDataInPlace(this.vertexData, h / s);
    }

    public async load(): Promise<void> {
        //this.vertexData = (await this.brickTemplateManager.vertexDataLoader.get("./datas/meshes/plate_1x1.babylon"))[0];
        this.vertexData = BrickVertexDataGenerator.GetStuddedBoxVertexData(4, 3, 1);
    }
}