interface BrickProp {
    pos?: Nabu.IVector3XYZValue;
    dir?: number;

}

class BrickMesh extends BABYLON.Mesh {

    constructor(public brick: Brick) {
        super("brick");
    }
}

class Brick extends BABYLON.TransformNode {

    public static depthColors = [
        new BABYLON.Color4(1, 1, 1, 1),
        new BABYLON.Color4(1, 0, 0, 1),
        new BABYLON.Color4(0, 1, 0, 1),
        new BABYLON.Color4(0, 0, 1, 1),
        new BABYLON.Color4(1, 1, 0, 1),
        new BABYLON.Color4(0, 1, 1, 1),
        new BABYLON.Color4(1, 0, 1, 1),
        new BABYLON.Color4(1, 0.5, 0, 1),
        new BABYLON.Color4(0, 1, 0.5, 1),
        new BABYLON.Color4(0.5, 0, 1, 1),
        new BABYLON.Color4(1, 1, 0.5, 1),
        new BABYLON.Color4(0.5, 1, 1, 1),
        new BABYLON.Color4(1, 0.5, 1, 1),
        new BABYLON.Color4(0.2, 0.2, 0.2, 1)
    ]

    public get isRoot(): boolean {
        return !(this.parent instanceof Brick);
    }

    public anchored: boolean = false;
    public mesh: BrickMesh;
    public chunck: Kulla.Chunck;
    public get root(): Brick {
        if (this.parent instanceof Brick) {
            return this.parent.root;
        }
        return this;
    }
    public index: number;
    public get brickName(): string {
        return BRICK_LIST[this.index];
    }

    public static BrickIdToIndex(brickID: number | string): number {
        if (typeof(brickID) === "number") {
            return brickID;
        }
        else {
            return BRICK_LIST.indexOf(brickID);
        }
    }

    public static BrickIdToName(brickID: number | string): string {
        if (typeof(brickID) === "string") {
            return brickID;
        }
        else {
            return BRICK_LIST[brickID];
        }
    }

    public setParent(node: BABYLON.Node, preserveScalingSign?: boolean, updatePivot?: boolean): BABYLON.TransformNode {
        if (node instanceof Brick) {
            this.anchored = false;
            this.brickManager.unregisterBrick(this);
        }
        else {
            this.brickManager.registerBrick(this);
        }
        return super.setParent(node, preserveScalingSign, updatePivot);
    }

    constructor(brickManager: BrickManager, index: number, colorIndex: number, parent?: Brick);
    constructor(brickManager: BrickManager, brickName: string, colorIndex: number, parent?: Brick);
    constructor(brickManager: BrickManager, brickId: number | string, colorIndex: number, parent?: Brick);
    constructor(public brickManager: BrickManager, arg1: any, public colorIndex: number, parent?: Brick) {
        super("brick");
        this.rotationQuaternion = BABYLON.Quaternion.Identity();
        this.index = Brick.BrickIdToIndex(arg1);
        if (parent) {
            this.parent = parent;
        }
        else {
            this.brickManager.registerBrick(this);
        }
    }

    public dispose(): void {
        if (this.isRoot) {
            this.brickManager.unregisterBrick(this);
            if (this.mesh) {
                this.mesh.dispose();
            }
            this.brickManager.saveToLocalStorage();
        }
        else {
            let root = this.root;
            this.setParent(undefined);
            root.updateMesh();
        }
    }

    public posWorldToLocal(pos: BABYLON.Vector3): BABYLON.Vector3 {
        let matrix = this.getWorldMatrix().invert();
        return BABYLON.Vector3.TransformCoordinates(pos, matrix);
    }

    public async updateMesh(): Promise<void> {
        if (this != this.root) {
            if (this.mesh) {
                this.mesh.dispose();
                this.mesh = undefined;
            }
            this.subMeshInfos = undefined;
            this.root.updateMesh();
            return;
        }
        this.computeWorldMatrix(true);
        let vDatas: BABYLON.VertexData[] = []
        this.subMeshInfos = [];
        await this.generateMeshVertexData(vDatas, this.subMeshInfos);
        let data = Brick.MergeVertexDatas(this.subMeshInfos, ...vDatas);
        Mummu.TranslateVertexDataInPlace(data, this.absolutePosition.scale(-1));
        Mummu.RotateVertexDataInPlace(data, this.absoluteRotationQuaternion.invert());
        if (!this.mesh) {
            this.mesh = new BrickMesh(this);
            this.mesh.position = this.position;
            this.mesh.rotationQuaternion = this.rotationQuaternion;

            let brickMaterial = new BABYLON.StandardMaterial("brick-material");
            brickMaterial.specularColor.copyFromFloats(0, 0, 0);
            brickMaterial.diffuseTexture = new BABYLON.Texture("./datas/textures/test-dirt.png");

            this.mesh.material = brickMaterial;
        }

        data.applyToMesh(this.mesh);
    }

    
    public highlight(): void {
        if (this.mesh) {
            this.mesh.renderOutline = true;
            this.mesh.outlineColor = new BABYLON.Color3(0, 1, 1);
            this.mesh.outlineWidth = 0.01;
        }
    }

    public unlight(): void {
        if (this.mesh) {
            this.mesh.renderOutline = false;
        }
    }

    private async generateMeshVertexData(vDatas: BABYLON.VertexData[], subMeshInfos: { faceId: number, brick: Brick }[], depth: number = 0): Promise<void> {
        this.computeWorldMatrix(true);
        let template = await BrickTemplateManager.Instance.getTemplate(this.index);
        let vData = Mummu.CloneVertexData(template.vertexData);
        let colors = [];
        let color = BABYLON.Color3.FromHexString(BRICK_COLORS[this.colorIndex].hex);
        for (let i = 0; i < vData.positions.length / 3; i++) {
            colors.push(color.r, color.g, color.b, 1);
        }
        vData.colors = colors;

        let a = 2 * Math.PI * Math.random();
        let cosa = Math.cos(a);
        let sina = Math.sin(a);
        let dU = Math.random();
        let dV = Math.random();
        let uvs = vData.uvs;
        for (let i = 0; i < uvs.length / 2; i++) {
            let u = uvs[2 * i];
            let v = uvs[2 * i + 1];
            uvs[2 * i] = cosa * u - sina * v + dU;
            uvs[2 * i + 1] = sina * u + cosa * v + dV;
        }
        vData.uvs = uvs;

        Mummu.RotateVertexDataInPlace(vData, this.absoluteRotationQuaternion);
        Mummu.TranslateVertexDataInPlace(vData, this.absolutePosition);
        vDatas.push(vData);
        subMeshInfos.push({ faceId: 0, brick: this });

        let children = this.getChildTransformNodes(true);
        for (let i = 0; i < children.length; i++) {
            let child = children[i];
            if (child instanceof Brick) {
                await child.generateMeshVertexData(vDatas, subMeshInfos, depth + 1);
            }
        }
    }

    public subMeshInfos: { faceId: number, brick: Brick }[];
    public getBrickForFaceId(faceId: number): Brick {
        for (let i = 0; i < this.subMeshInfos.length; i++) {
            if (this.subMeshInfos[i].faceId > faceId) {
                return this.subMeshInfos[i].brick;
            }
        }
    }

    public static MergeVertexDatas(subMeshInfos: { faceId: number, brick: Brick }[], ...datas: BABYLON.VertexData[]): BABYLON.VertexData {
        let mergedData = new BABYLON.VertexData();
        
        let positions = [];
        let indices = [];
        let normals = [];
        let uvs = [];
        let colors = [];

        for (let i = 0; i < datas.length; i++) {
            let offset = positions.length / 3;
            positions.push(...datas[i].positions);
            indices.push(...datas[i].indices.map(index => { return index + offset; }));
            normals.push(...datas[i].normals);
            if (datas[i].uvs) {
                uvs.push(...datas[i].uvs);
            }
            if (datas[i].colors) {
                colors.push(...datas[i].colors);
            }
            subMeshInfos[i].faceId = indices.length / 3;
        }

        mergedData.positions = positions;
        mergedData.indices = indices;
        mergedData.normals = normals;
        if (uvs.length > 0) {
            mergedData.uvs = uvs;
        }
        if (colors.length > 0) {
            mergedData.colors = colors;
        }

        return mergedData;
    }

    public serialize(): IBrickData {
        let data: IBrickData = {
            id: this.index,
            col: this.colorIndex,
            x: this.position.x,
            y: this.position.y,
            z: this.position.z,
            qx: this.rotationQuaternion.x,
            qy: this.rotationQuaternion.y,
            qz: this.rotationQuaternion.z,
            qw: this.rotationQuaternion.w,
        }

        if (this.anchored) {
            data.anc = this.anchored;
        }

        let children = this.getChildTransformNodes(true);
        if (children.length > 0) {
            data.c = [];
        }
        for (let i = 0; i < children.length; i++) {
            let child = children[i];
            if (child instanceof Brick) {
                data.c[i] = child.serialize();
            }
        }

        return data;
    }

    public deserialize(data: IBrickData): void {
        this.index = data.id;
        this.colorIndex = isFinite(data.col) ? data.col : 0;
        this.position.copyFromFloats(data.x, data.y, data.z);
        this.rotationQuaternion.copyFromFloats(data.qx, data.qy, data.qz, data.qw);
        if (data.anc) {
            this.anchored = true;
        }
        if (data.c) {
            for (let i = 0; i < data.c.length; i++) {
                let child = new Brick(this.brickManager, 0, 0, this);
                child.deserialize(data.c[i]);
            }
        }
    }
}

var ALLBRICKS: number[] = [];

interface IBrickData {
    id: number;
    col: number;
    anc?: boolean;
    x: number;
    y: number;
    z: number;
    qx: number;
    qy: number;
    qz: number;
    qw: number;
    c?: IBrickData[];
}