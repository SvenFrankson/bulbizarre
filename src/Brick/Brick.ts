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
    public absolutePosition: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    public updatePosition(): void {
        if (this.isRoot) {
            this.absolutePosition.copyFromFloats(0, 0, 0);
        }
        else {
            this.absolutePosition.copyFrom(this.position);
        }
        if (this.parent) {
            this.absolutePosition.addInPlace(this.parent.absolutePosition);
        }
        if (this.children) {
            this.children.forEach(child => {
                child.updatePosition();
            })
        }
    }
    public direction: number;

    private _parent: Brick;
    public get parent(): Brick {
        return this._parent;
    }
    public setParent(b: Brick): void {
        if (this._parent != b) {
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
    private _rotationQuaternion: BABYLON.Quaternion;
    public get root(): Brick {
        if (this._parent) {
            return this._parent.root;
        }
        return this;
    }

    constructor(public templateIndex: number, public colorIndex: number, parent?: Brick) {
        if (parent) {
            this._parent = parent;
            if (!parent.children) {
                parent.children = [];
            }
            parent.children.push(this);
        }
        else {
            this._rotationQuaternion = BABYLON.Quaternion.Identity();
        }
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
        this.updatePosition();
        let vDatas: BABYLON.VertexData[] = []
        this.subMeshInfos = [];
        await this.generateMeshVertexData(vDatas, this.subMeshInfos);
        let data = Brick.MergeVertexDatas(this.subMeshInfos, ...vDatas);
        if (!this.mesh) {
            this.mesh = new BrickMesh(this);
            this.mesh.position = this.position;
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

    private async generateMeshVertexData(vDatas?: BABYLON.VertexData[], subMeshInfos?: { faceId: number, brick: Brick }[], depth: number = 0): Promise<void> {
        if (!vDatas) {
            vDatas = [];
        }
        if (!subMeshInfos) {
            subMeshInfos = [];
        }
        let template = await BrickTemplateManager.Instance.getTemplate(this.templateIndex);
        let vData = Mummu.CloneVertexData(template.vertexData);
        let colors = [];
        let color = Brick.depthColors[depth];
        for (let i = 0; i < vData.positions.length / 3; i++) {
            colors.push(color.r, color.g, color.b, color.a);
        }
        vData.colors = colors;
        if (this != this.root) {
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
            if (this.subMeshInfos[i].faceId >= faceId) {
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