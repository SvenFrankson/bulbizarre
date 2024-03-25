interface BrickProp {
    pos?: Nabu.IVector3XYZValue;
    dir?: number;

}

class BrickMesh extends BABYLON.Mesh {

    constructor(public brick: Brick) {
        super("brick");
    }
}

class Brick {

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
        return this._parent === undefined;
    }

    public position: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    public rotationQuaternion: BABYLON.Quaternion = BABYLON.Quaternion.Identity();

    public absolutePosition: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    public absoluteRotationQuaternion: BABYLON.Quaternion = BABYLON.Quaternion.Identity();

    public absoluteMatrix: BABYLON.Matrix = BABYLON.Matrix.Identity();

    public updatePositionRotation(): void {
        if (this.isRoot) {
            BABYLON.Matrix.IdentityToRef(this.absoluteMatrix);
        }
        else {
            BABYLON.Matrix.ComposeToRef(BABYLON.Vector3.One(), this.rotationQuaternion, this.position, this.absoluteMatrix);
        }

        if (this.parent) {
            this.parent.absoluteMatrix.multiplyToRef(this.absoluteMatrix, this.absoluteMatrix);
        }
        this.absoluteMatrix.decompose(BABYLON.Vector3.One(), this.absoluteRotationQuaternion, this.absolutePosition);

        if (this.children) {
            this.children.forEach(child => {
                child.updatePositionRotation();
            })
        }
    }
    public direction: number;

    private _parent: Brick;
    public get parent(): Brick {
        return this._parent;
    }
    public setParent(b: Brick, keepWorldPosRot?: boolean): void {
        if (this._parent != b) {
            this.updatePositionRotation();
            let worldPos: BABYLON.Vector3;
            let worldRot: BABYLON.Quaternion;
            if (keepWorldPosRot) {
                if (this.isRoot) {
                    console.log("isroot");
                    worldPos = this.position.clone();
                    worldRot = this.rotationQuaternion.clone();
                }
                else {
                    console.log("isnotroot");
                    let rootM = BABYLON.Matrix.Compose(BABYLON.Vector3.One(), this.root.rotationQuaternion, this.root.position);
                    worldPos = BABYLON.Vector3.TransformCoordinates(this.absolutePosition, rootM);
                    worldRot = this.root.rotationQuaternion.multiply(this.rotationQuaternion);
                }
                Mummu.DrawDebugPoint(worldPos, 60, BABYLON.Color3.Green(), 1);
                console.log("world pos " + worldPos.toString());
            }

            if (this._parent) {
                let index = this._parent.children.indexOf(this);
                if (index > - 1) {
                    this._parent.children.splice(index, 1);
                }
            }
            this._parent = b;
            if (this._parent) {
                if (!this._parent.children) {
                    this._parent.children = [];
                }
                this._parent.children.push(this);
            }
            
            if (keepWorldPosRot) {
                if (this.isRoot) {
                    this.position.copyFrom(worldPos);
                    this.rotationQuaternion.copyFrom(worldRot);
                }
                else {
                    let rootMInv = BABYLON.Matrix.Compose(BABYLON.Vector3.One(), this.root.rotationQuaternion, this.root.position).invert();
                    BABYLON.Vector3.TransformCoordinatesToRef(worldPos, rootMInv, this.position);
                    let rootInvRotationQuaternion = this.root.rotationQuaternion.invert();
                    rootInvRotationQuaternion.multiplyToRef(worldRot, this.rotationQuaternion);
                }
            }
        }
    }
    public children: Brick[];
    public get childrenCount(): number {
        if (this.children) {
            return this.children.length;
        }
        return 0;
    }

    public mesh: BrickMesh;
    public get root(): Brick {
        if (this._parent) {
            return this._parent.root;
        }
        return this;
    }
    public index: number;
    public get name(): string {
        return BRICK_LIST[this.index];
    }

    constructor(index: number, colorIndex: number, parent?: Brick);
    constructor(name: string, colorIndex: number, parent?: Brick);
    constructor(brickId: number | string, colorIndex: number, parent?: Brick);
    constructor(arg1: any, public colorIndex: number, parent?: Brick) {
        if (typeof(arg1) === "number") {
            this.index = arg1;
        }
        else {
            this.index = BRICK_LIST.indexOf(arg1);
        }
        if (parent) {
            this._parent = parent;
            if (!parent.children) {
                parent.children = [];
            }
            parent.children.push(this);
        }
    }

    public dispose(): void {
        if (this.isRoot) {
            if (this.mesh) {
                this.mesh.dispose();
            }
        }
        else {
            let root = this.root;
            this.setParent(undefined);
            root.updateMesh();
        }
    }

    public posWorldToLocal(pos: BABYLON.Vector3): BABYLON.Vector3 {
        this.updatePositionRotation();
        let rootM = BABYLON.Matrix.Compose(BABYLON.Vector3.One(), this.root.rotationQuaternion, this.root.position);
        let worldMInv = rootM.multiply(this.absoluteMatrix).invert();
        return BABYLON.Vector3.TransformCoordinates(pos, worldMInv);
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
        this.updatePositionRotation();
        let vDatas: BABYLON.VertexData[] = []
        this.subMeshInfos = [];
        await this.generateMeshVertexData(vDatas, this.subMeshInfos);
        let data = Brick.MergeVertexDatas(this.subMeshInfos, ...vDatas);
        if (!this.mesh) {
            this.mesh = new BrickMesh(this);
            this.mesh.position = this.position;
            this.mesh.rotationQuaternion = this.rotationQuaternion;
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
        let template = await BrickTemplateManager.Instance.getTemplate(this.index);
        let vData = Mummu.CloneVertexData(template.vertexData);
        let colors = [];
        let color = Brick.depthColors[depth];
        for (let i = 0; i < vData.positions.length / 3; i++) {
            colors.push(color.r, color.g, color.b, color.a);
        }
        vData.colors = colors;
        if (this != this.root) {
            Mummu.RotateVertexDataInPlace(vData, this.absoluteRotationQuaternion);
            Mummu.TranslateVertexDataInPlace(vData, this.absolutePosition);
        }
        vDatas.push(vData);
        subMeshInfos.push({ faceId: 0, brick: this });

        if (this.children) {
            for (let i = 0; i < this.children.length; i++) {
                await this.children[i].generateMeshVertexData(vDatas, subMeshInfos, depth + 1);
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
}