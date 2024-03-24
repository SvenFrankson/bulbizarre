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
    public get name(): string {
        return BRICK_LIST[this.index];
    }

    constructor(public index: number, public brickTemplateManager: BrickTemplateManager) {
        
    }

    public async load(): Promise<void> {
        //this.vertexData = (await this.brickTemplateManager.vertexDataLoader.get("./datas/meshes/plate_1x1.babylon"))[0];
        if (this.name.startsWith("brick_")) {
            let l = parseInt(this.name.split("_")[1].split("x")[0]);
            let w = parseInt(this.name.split("_")[1].split("x")[1]);
            this.vertexData = BrickVertexDataGenerator.GetStuddedBoxVertexData(l, 3, w);
        }
        else if (this.name.startsWith("plate_")) {
            let l = parseInt(this.name.split("_")[1].split("x")[0]);
            let w = parseInt(this.name.split("_")[1].split("x")[1]);
            this.vertexData = BrickVertexDataGenerator.GetStuddedBoxVertexData(l, 1, w);
        }
        else {
            this.vertexData = BrickVertexDataGenerator.GetBoxVertexData(1, 1, 1);
        }
    }
}