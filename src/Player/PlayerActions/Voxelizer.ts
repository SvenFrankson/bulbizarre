class Voxelizer extends BABYLON.Mesh {
    public meshInner: BABYLON.Mesh;
    public meshOuter: BABYLON.Mesh;

    constructor(public url: string, public game: Game) {
        super("voxelizer");
        BABYLON.CreateSphereVertexData({ diameter: 0.8 }).applyToMesh(this);
        this.meshInner = new BABYLON.Mesh("voxelizer-inner");
        this.meshInner.scaling.copyFromFloats(10, 10, 10);
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

    public async plouf(): Promise<void> {

        this.meshInner.isVisible = false;
        this.meshOuter.isVisible = false;
        this.meshOuter.computeWorldMatrix(true);
        this.meshOuter.refreshBoundingInfo();
        let min = this.meshOuter.getBoundingInfo().boundingBox.minimumWorld;
        let max = this.meshOuter.getBoundingInfo().boundingBox.maximumWorld;
        let center = min.add(max).scale(0.5);
        let DI = (max.x - min.x) / this.game.terrain.blockSizeIJ_m;
        let DJ = (max.z - min.z) / this.game.terrain.blockSizeIJ_m;
        let DK = (max.y - min.y) / this.game.terrain.blockSizeK_m;

        let k0 = 0;
        let k1 = 0;
        let affectedChuncks = new Nabu.UniqueList<Kulla.Chunck>();
        let rebuildAffectedChuncks = () => {
            for (let i = 0; i < affectedChuncks.length; i++) {
                let chunck = affectedChuncks.get(i);
                for (let k = k0; k <= k1; k++) {
                    chunck.updateIsEmptyIsFull(k);
                }
                chunck.redrawMesh(true);
                chunck.saveToLocalStorage();
            }
            affectedChuncks = new Nabu.UniqueList<Kulla.Chunck>();
        };
        let localIJK = this.game.terrain.getChunckAndIJKAtPos(min, 0);
        if (localIJK) {
            let ijk = localIJK.ijk;
            let chunck = localIJK.chunck;
            if (chunck) {
                k0 = ijk.k;
                k1 = ijk.k + DK;
                min = chunck.getPosAtIJK(ijk);

                let p = BABYLON.Vector3.Zero();
                let dir = BABYLON.Vector3.Zero();

                let breaks = 0;
                let doStep = (i: number, k: number) => {
                    for (let j = 0; j < DJ; j++) {
                        p.copyFromFloats(min.x + i * this.game.terrain.blockSizeIJ_m, min.y + k * this.game.terrain.blockSizeK_m, min.z + j * this.game.terrain.blockSizeIJ_m);
                        dir.copyFrom(p).subtractInPlace(center).normalize();
                        let ray = new BABYLON.Ray(p, dir);
                        let intersection = this.game.scene.pickWithRay(ray, (mesh) => {
                            return mesh === this.meshInner || mesh === this.meshOuter;
                        });
                        if (intersection && intersection.pickedMesh === this.meshInner) {
                            let chuncks = chunck.setData(Kulla.BlockType.Rock, ijk.i + i, ijk.j + j, ijk.k + k);
                            chuncks.forEach((chunck) => {
                                affectedChuncks.push(chunck);
                            });
                        }
                    }
                };

                let t0 = performance.now();
                for (let k = 0; k < DK; k++) {
                    for (let i = 0; i < DI; i++) {
                        let t1 = performance.now();
                        if (t1 - t0 < 5) {
                            doStep(i, k);
                        } else {
                            breaks++;
                            await Nabu.NextFrame();
                            t0 = performance.now();
                            doStep(i, k);
                            if (breaks > 60) {
                                breaks = 0;
                                rebuildAffectedChuncks();
                            }
                        }
                    }
                }
                rebuildAffectedChuncks();
            }
        }

        this.meshInner.dispose();
        this.meshOuter.dispose();
    }
    
    public async ploufEdges(): Promise<void> {

        this.meshInner.isVisible = false;
        this.meshOuter.isVisible = false;
        this.meshOuter.computeWorldMatrix(true);
        this.meshInner.bakeTransformIntoVertices(this.meshInner.getWorldMatrix());
        this.meshOuter.computeWorldMatrix(true);
        await Nabu.NextFrame();

        let k0 = 0;
        let k1 = 0;
        let affectedChuncks = new Nabu.UniqueList<Kulla.Chunck>();
        let rebuildAffectedChuncks = () => {
            for (let i = 0; i < affectedChuncks.length; i++) {
                let chunck = affectedChuncks.get(i);
                for (let k = k0; k <= k1; k++) {
                    chunck.updateIsEmptyIsFull(k);
                }
                chunck.redrawMesh(true);
                chunck.saveToLocalStorage();
            }
            affectedChuncks = new Nabu.UniqueList<Kulla.Chunck>();
        };

        let line = new Kulla.Line(this.game.terrain);
        let data = BABYLON.VertexData.ExtractFromMesh(this.meshInner);
        let positions = data.positions;
        let indices = data.indices;

        this.meshInner.dispose();
        this.meshOuter.dispose();

        let t0 = performance.now();
        let pos = BABYLON.Vector3.Zero();
        let breaks = 0;
        let doStep = (triIndex: number) => {
            let v1Index = indices[3 * triIndex];
            let v2Index = indices[3 * triIndex + 1];
            let v3Index = indices[3 * triIndex + 2];

            let x1 = positions[3 * v1Index];
            let y1 = positions[3 * v1Index + 1];
            let z1 = positions[3 * v1Index + 2];
            
            pos.copyFromFloats(x1, y1, z1);
            let localIJK1 = this.game.terrain.getChunckAndIJKAtPos(pos, 0);

            if (localIJK1 && localIJK1.chunck) {
                let x2 = positions[3 * v2Index];
                let y2 = positions[3 * v2Index + 1];
                let z2 = positions[3 * v2Index + 2];
    
                let IJK1ANext = {
                    i: localIJK1.ijk.i + Math.round((x2 - x1) / 0.4),
                    j: localIJK1.ijk.j + Math.round((z2 - z1) / 0.4),
                    k: localIJK1.ijk.k + Math.round((y2 - y1) / 0.4),
                }
                
                pos.copyFromFloats(x2, y2, z2);
                let localIJK2 = this.game.terrain.getChunckAndIJKAtPos(pos, 0);
    
                if (localIJK2 && localIJK2.chunck) {
                    let x3 = positions[3 * v3Index];
                    let y3 = positions[3 * v3Index + 1];
                    let z3 = positions[3 * v3Index + 2];
                    
                    let IJK1BNext = {
                        i: localIJK1.ijk.i + Math.round((x3 - x1) / 0.4),
                        j: localIJK1.ijk.j + Math.round((z3 - z1) / 0.4),
                        k: localIJK1.ijk.k + Math.round((y3 - y1) / 0.4),
                    }
        
                    let IJK2Next = {
                        i: localIJK2.ijk.i + Math.round((x3 - x2) / 0.4),
                        j: localIJK2.ijk.j + Math.round((z3 - z2) / 0.4),
                        k: localIJK2.ijk.k + Math.round((y3 - y2) / 0.4),
                    }

                    let chuncks = line.draw(localIJK1.chunck, localIJK1.ijk, IJK1ANext, Kulla.BlockType.Rock, Kulla.TerrainEditionMode.Add, false, true);
                    chuncks.forEach(chunck => {
                        affectedChuncks.push(chunck);
                    })
                    chuncks = line.draw(localIJK1.chunck, localIJK1.ijk, IJK1BNext, Kulla.BlockType.Rock, Kulla.TerrainEditionMode.Add, false, true);
                    chuncks.forEach(chunck => {
                        affectedChuncks.push(chunck);
                    })
                    chuncks = line.draw(localIJK2.chunck, localIJK2.ijk, IJK2Next, Kulla.BlockType.Rock, Kulla.TerrainEditionMode.Add, false, true);
                    chuncks.forEach(chunck => {
                        affectedChuncks.push(chunck);
                    })
                }
            }
        }

        for (let triIndex = 0; triIndex < indices.length / 3; triIndex++) {
            let t1 = performance.now();
            if (t1 - t0 < 5) {
                doStep(triIndex);
            } else {
                breaks++;
                await Nabu.NextFrame();
                t0 = performance.now();
                doStep(triIndex);
                if (breaks > 60) {
                    breaks = 0;
                    rebuildAffectedChuncks();
                }
            }
        }
        rebuildAffectedChuncks();
    }
    
    public async ploufRasterize(): Promise<void> {

        this.meshInner.isVisible = false;
        this.meshOuter.isVisible = false;
        this.meshOuter.computeWorldMatrix(true);
        this.meshInner.bakeTransformIntoVertices(this.meshInner.getWorldMatrix());
        this.meshOuter.computeWorldMatrix(true);
        await Nabu.NextFrame();

        let k0 = 0;
        let k1 = 0;
        let affectedChuncks = new Nabu.UniqueList<Kulla.Chunck>();
        let rebuildAffectedChuncks = () => {
            for (let i = 0; i < affectedChuncks.length; i++) {
                let chunck = affectedChuncks.get(i);
                for (let k = k0; k <= k1; k++) {
                    chunck.updateIsEmptyIsFull(k);
                }
                chunck.redrawMesh(true);
                chunck.saveToLocalStorage();
            }
            affectedChuncks = new Nabu.UniqueList<Kulla.Chunck>();
        };

        let triangle = new Kulla.Triangle(this.game.terrain);
        let data = BABYLON.VertexData.ExtractFromMesh(this.meshInner);
        let positions = data.positions;
        let indices = data.indices;

        this.meshInner.dispose();
        this.meshOuter.dispose();

        let t0 = performance.now();
        let pos = BABYLON.Vector3.Zero();
        let breaks = 0;
        let doStep = (triIndex: number) => {
            let v1Index = indices[3 * triIndex];
            let v2Index = indices[3 * triIndex + 1];
            let v3Index = indices[3 * triIndex + 2];

            let x1 = positions[3 * v1Index];
            let y1 = positions[3 * v1Index + 1];
            let z1 = positions[3 * v1Index + 2];
            
            pos.copyFromFloats(x1, y1, z1);
            let localIJK1 = this.game.terrain.getChunckAndIJKAtPos(pos, 0);

            if (localIJK1 && localIJK1.chunck) {
                let x2 = positions[3 * v2Index];
                let y2 = positions[3 * v2Index + 1];
                let z2 = positions[3 * v2Index + 2];
    
                let IJK1ANext = {
                    i: localIJK1.ijk.i + Math.floor((x2 - x1) / 0.4),
                    j: localIJK1.ijk.j + Math.floor((z2 - z1) / 0.4),
                    k: localIJK1.ijk.k + Math.floor((y2 - y1) / 0.4),
                }
                
                let x3 = positions[3 * v3Index];
                let y3 = positions[3 * v3Index + 1];
                let z3 = positions[3 * v3Index + 2];
                
                let IJK1BNext = {
                    i: localIJK1.ijk.i + Math.floor((x3 - x1) / 0.4),
                    j: localIJK1.ijk.j + Math.floor((z3 - z1) / 0.4),
                    k: localIJK1.ijk.k + Math.floor((y3 - y1) / 0.4),
                }
    
                let chuncks = triangle.draw(localIJK1.chunck, localIJK1.ijk, IJK1ANext, IJK1BNext, Kulla.BlockType.Rock, Kulla.TerrainEditionMode.Add, false, true);
                chuncks.forEach(chunck => {
                    affectedChuncks.push(chunck);
                })             
            }
        }

        for (let triIndex = 0; triIndex < indices.length / 3; triIndex++) {
            let t1 = performance.now();
            if (t1 - t0 < 5) {
                doStep(triIndex);
            } else {
                breaks++;
                await Nabu.NextFrame();
                t0 = performance.now();
                doStep(triIndex);
                if (breaks > 60) {
                    breaks = 0;
                    rebuildAffectedChuncks();
                }
            }
        }
        rebuildAffectedChuncks();
    }
}
