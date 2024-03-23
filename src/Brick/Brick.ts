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

    public position: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    public direction: number;

    private _parent: Brick;
    public setParent(b: Brick): void {
        this._parent = b;
        if (!b.children) {
            b.children = [];
        }
        b.children.push(this);
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

    public updateMesh(): void {
        if (this != this.root) {
            if (this.mesh) {
                this.mesh.dispose();
                this.mesh = undefined;
            }
            this.root.updateMesh();
            return;
        }
        let vDatas: BABYLON.VertexData[] = []
        let subMeshInfos: { faceId: number, brick: Brick }[] = [];
        this.generateMeshVertexData(vDatas, subMeshInfos);
        let data = Brick.MergeVertexDatas(subMeshInfos, ...vDatas);
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
            this.mesh.outlineWidth = 0.05;
        }
    }

    public unlight(): void {
        if (this.mesh) {
            this.mesh.renderOutline = false;
        }
    }

    private generateMeshVertexData(vDatas?: BABYLON.VertexData[], subMeshInfos?: { faceId: number, brick: Brick }[], parentGlobalPosition?: BABYLON.Vector3): void {
        if (!vDatas) {
            vDatas = [];
        }
        if (!subMeshInfos) {
            subMeshInfos = [];
        }
        let template = BrickTemplateManager.Instance.getTemplate(this.templateIndex);
        let vData = Mummu.CloneVertexData(template.vertexData);
        let globalPosition = parentGlobalPosition ? parentGlobalPosition.clone() : BABYLON.Vector3.Zero();
        if (this != this.root) {
            globalPosition.addInPlace(this.position);
            Mummu.TranslateVertexDataInPlace(vData, globalPosition);
        }
        vDatas.push(vData);
        subMeshInfos.push({ faceId: 0, brick: this });

        if (this.children) {
            for (let i = 0; i < this.children.length; i++) {
                this.children[i].generateMeshVertexData(vDatas, subMeshInfos, globalPosition);
            }
        }
    }

    public subMeshInfos: { faceId: number, brick: Brick }[];

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