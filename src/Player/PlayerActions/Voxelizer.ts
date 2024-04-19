class Voxelizer extends BABYLON.Mesh {

    public meshInner: BABYLON.Mesh;
    public meshOuter: BABYLON.Mesh;

    constructor(public url: string, public game: Game) {
        super("voxelizer");
        BABYLON.CreateSphereVertexData({ diameter: 0.8 }).applyToMesh(this);
        this.meshInner = new BABYLON.Mesh("voxelizer-inner");
        this.meshInner.scaling.copyFromFloats(40, 40, 40);
        this.meshInner.parent = this;
        this.meshOuter = new BABYLON.Mesh("voxelizer-shell");
        this.meshOuter.parent = this.meshInner;

        let material = new BABYLON.StandardMaterial("voxelizer-material");
        material.specularColor.copyFromFloats(0, 0, 0);
        this.meshInner.material = material;
        this.meshOuter.material = material;
    }
    
    public highlight(): void {
        this.renderOutline = true;
        this.outlineColor = new BABYLON.Color3(0, 1, 1);
        this.outlineWidth = 0.01;
    }

    public unlight(): void {
        this.renderOutline = false;
    }

    public async initialize(): Promise<void> {
        let datas = await this.game.vertexDataLoader.get(this.url);
        if (datas) {
            let data = datas[0];
            if (data) {
                let innerData = Mummu.CloneVertexData(data);
                Mummu.TriFlipVertexDataInPlace(innerData);
                innerData.applyToMesh(this.meshInner);
                
                let outerData = Mummu.CloneVertexData(data);
                Mummu.ShrinkVertexDataInPlace(outerData, 0.001);
                outerData.applyToMesh(this.meshOuter);
            }
        }
    }

    public plouf(): void {
        this.meshOuter.computeWorldMatrix(true);
        this.meshOuter.refreshBoundingInfo();
        let min = this.meshOuter.getBoundingInfo().boundingBox.minimumWorld;
        let max = this.meshOuter.getBoundingInfo().boundingBox.maximumWorld;
        let center = min.add(max).scale(0.5);
        let DI = (max.x - min.x) / this.game.terrain.blockSizeIJ_m;
        let DJ = (max.z - min.z) / this.game.terrain.blockSizeIJ_m;
        let DK = (max.y - min.y) / this.game.terrain.blockSizeK_m;

        let affectedChuncks = new Nabu.UniqueList<Kulla.Chunck>();
        let localIJK = this.game.terrain.getChunckAndIJKAtPos(min, 0);
        if (localIJK) {
            let ijk = localIJK.ijk;
            let chunck = localIJK.chunck;
            if (chunck) {
                min = chunck.getPosAtIJK(ijk);
                
                let p = BABYLON.Vector3.Zero();
                let dir = BABYLON.Vector3.Zero();
                for (let i = 0; i < DI; i++) {
                    for (let j = 0; j < DJ; j++) {
                        for (let k = 0; k < DK; k++) {
                            p.copyFromFloats(min.x + i * this.game.terrain.blockSizeIJ_m, min.y + k * this.game.terrain.blockSizeK_m, min.z + j * this.game.terrain.blockSizeIJ_m);
                            dir.copyFrom(p).subtractInPlace(center).normalize();
                            let ray = new BABYLON.Ray(p, dir);
                            let intersection = this.game.scene.pickWithRay(ray, (mesh) => {
                                return mesh === this.meshInner || mesh === this.meshOuter;
                            });
                            if (intersection && intersection.pickedMesh === this.meshInner) {
                                let chuncks = chunck.setData(Kulla.BlockType.Rock, ijk.i + i, ijk.j + j, ijk.k + k);
                                chuncks.forEach(chunck => {
                                    affectedChuncks.push(chunck);
                                })
                            }
                        }
                    }
                }

                for (let i = 0; i < affectedChuncks.length; i++) {
                    let chunck = affectedChuncks.get(i);
                    for (let k = ijk.k; k <= ijk.k + DK; k++) {
                        chunck.updateIsEmptyIsFull(k);
                    }
                    chunck.redrawMesh(true);
                    chunck.saveToLocalStorage();
                }
            }
        }

        this.meshInner.dispose();
        this.meshOuter.dispose();
    }
}