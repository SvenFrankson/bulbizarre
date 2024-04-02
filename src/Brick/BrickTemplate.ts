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

    public async load(lod: number = 0): Promise<void> {
        //this.vertexData = (await this.brickTemplateManager.vertexDataLoader.get("./datas/meshes/plate_1x1.babylon"))[0];
        if (this.name.startsWith("brick_")) {
            let l = parseInt(this.name.split("_")[1].split("x")[0]);
            let w = parseInt(this.name.split("_")[1].split("x")[1]);
            this.vertexData = BrickVertexDataGenerator.GetBoxVertexData(l, 3, w, lod);
        }
        else if (this.name.startsWith("plate-corner-cut_")) {
            let l = parseInt(this.name.split("_")[1].split("x")[0]);
            let w = parseInt(this.name.split("_")[1].split("x")[1]);
            let cut = 1;
            if (l >= 4) {
                cut = 2;
            }
            this.vertexData = await BrickVertexDataGenerator.GetStuddedCutBoxVertexData(cut, l, 1, w, lod);
        }
        else if (this.name.startsWith("wall_")) {
            let l = parseInt(this.name.split("_")[1].split("x")[0]);
            let w = parseInt(this.name.split("_")[1].split("x")[1]);
            this.vertexData = BrickVertexDataGenerator.GetBoxVertexData(l, 12, w, lod);
        }
        else if (this.name.startsWith("plate_")) {
            let l = parseInt(this.name.split("_")[1].split("x")[0]);
            let w = parseInt(this.name.split("_")[1].split("x")[1]);
            this.vertexData = BrickVertexDataGenerator.GetBoxVertexData(l, 1, w, lod);
        }
        else if (this.name.startsWith("tile_")) {
            let l = parseInt(this.name.split("_")[1].split("x")[0]);
            let w = parseInt(this.name.split("_")[1].split("x")[1]);
            this.vertexData = BrickVertexDataGenerator.GetBoxVertexData(l, 1, w, lod);
        }
        else if (this.name.startsWith("window-frame_")) {
            let l = parseInt(this.name.split("_")[1].split("x")[0]);
            let h = parseInt(this.name.split("_")[1].split("x")[1]);
            this.vertexData = await BrickVertexDataGenerator.GetWindowFrameVertexData(l, h, lod);
        }
        else if (this.name.startsWith("window-frame-corner-curved_")) {
            let l = parseInt(this.name.split("_")[1].split("x")[0]);
            let h = parseInt(this.name.split("_")[1].split("x")[1]);
            this.vertexData = await BrickVertexDataGenerator.GetWindowFrameCornerCurvedVertexData(l, h, lod);
        }
        else if (this.name.startsWith("tile-corner-curved_")) {
            let l = parseInt(this.name.split("_")[1].split("x")[0]);
            let w = parseInt(this.name.split("_")[1].split("x")[1]);
            this.vertexData = await BrickVertexDataGenerator.GetBoxCornerCurvedVertexData(l, 1, w, lod);
        }
        else if (this.name.startsWith("brick-corner-curved_")) {
            let l = parseInt(this.name.split("_")[1].split("x")[0]);
            let w = parseInt(this.name.split("_")[1].split("x")[1]);
            this.vertexData = await BrickVertexDataGenerator.GetBoxCornerCurvedVertexData(l, 3, w, lod);
        }
        else if (this.name.startsWith("plate-quarter_")) {
            let l = parseInt(this.name.split("_")[1].split("x")[0]);
            this.vertexData = await BrickVertexDataGenerator.GetBoxQuarterVertexData(l, 1, lod);
        }
        else if (this.name.startsWith("brick-quarter_")) {
            let l = parseInt(this.name.split("_")[1].split("x")[0]);
            this.vertexData = await BrickVertexDataGenerator.GetBoxQuarterVertexData(l, 3, lod);
        }
        else if (this.name.startsWith("brick-round_")) {
            let l = parseInt(this.name.split("_")[1].split("x")[0]);
            this.vertexData = await BrickVertexDataGenerator.GetBrickRoundVertexData(l, lod);
        }
        else if (this.name.startsWith("brick-corner-round_1x1")) {
            this.vertexData = (await BrickTemplateManager.Instance.vertexDataLoader.get("./datas/meshes/brick-corner-round_1x1.babylon"))[0];
            BrickVertexDataGenerator.AddMarginInPlace(this.vertexData);
        }
        else if (this.name === "tile-round-quarter_1x1") {
            this.vertexData = (await BrickTemplateManager.Instance.vertexDataLoader.get("./datas/meshes/tile-round-quarter_1x1.babylon"))[0];
            BrickVertexDataGenerator.AddMarginInPlace(this.vertexData);
        }
        else if (this.name === "tile-triangle_2x2") {
            this.vertexData = (await BrickTemplateManager.Instance.vertexDataLoader.get("./datas/meshes/tile-triangle_2x2.babylon"))[0];
            BrickVertexDataGenerator.AddMarginInPlace(this.vertexData);
        }
        else {
            this.vertexData = BrickVertexDataGenerator.GetBoxVertexData(1, 1, 1);
        }
    }
}