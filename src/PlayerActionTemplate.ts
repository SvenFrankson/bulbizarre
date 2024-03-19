var ACTIVE_DEBUG_PLAYER_ACTION = true;

var ADD_BRICK_ANIMATION_DURATION = 1000;

class PlayerActionTemplate {

    public static async AddTmpObjectAction(player: Player, tmpObjectName: string): Promise<PlayerAction> {
        return undefined;
        /*
        let action = new PlayerAction(tmpObjectName, player);
        action.iconUrl = "/datas/images/qmark.png";

        let previewTmpObject: TmpObject;

        action.onUpdate = () => {
            if (!player.inputManager.inventoryOpened) {
                let hit = player.inputManager.getPickInfo(player.meshes);
                if (hit && hit.pickedPoint) {
                    if (!previewTmpObject) {
                        previewTmpObject = new TmpObject(tmpObjectName, player.main);
                        previewTmpObject.planet = player.planet;
                        previewTmpObject.instantiate();
                    }
                    previewTmpObject.setPosition(hit.pickedPoint);
                    previewTmpObject.setTarget(player.position);
                    return;
                }
            }
            if (previewTmpObject) {
                previewTmpObject.dispose();
                previewTmpObject = undefined;
            }
        }

        action.onClick = () => {
            if (!player.inputManager.inventoryOpened) {
                let hit = player.inputManager.getPickInfo(player.meshes);
                if (hit && hit.pickedPoint) {
                    let tmpObject = new TmpObject(tmpObjectName, player.main);
                    tmpObject.planet = player.planet;
                    tmpObject.instantiate();
                    tmpObject.setPosition(hit.pickedPoint);
                    tmpObject.setTarget(player.position);
                }
            }
        }

        action.onUnequip = () => {
            if (previewTmpObject) {
                previewTmpObject.dispose();
                previewTmpObject = undefined;
            }
        }

        return action;
        */
    }

    public static async CreateBlockAction(player: Player, blockType: Kulla.BlockType): Promise<PlayerAction> {
        let action = new PlayerAction(Kulla.BlockTypeNames[blockType], player);
        action.backgroundColor = Kulla.BlockTypeColors[blockType].toHexString();
        let previewMesh: BABYLON.Mesh;
        let previewBox: BABYLON.Mesh;
        action.iconUrl = "/datas/images/block-icon-" + Kulla.BlockTypeNames[blockType] + "-miniature.png";

        let lastSize: number;
        let lastI: number;
        let lastJ: number;
        let lastK: number;


        action.onUpdate = () => {
            let terrain = player.game.terrain;
            if (/*!player.game.inventoryView.isOpened*/true) {
                let hit = player.game.scene.pick(
                    player._scene.pointerX,
                    player._scene.pointerY,
                    (mesh) => {
                        return player.currentChuncks.find(chunck => { return chunck && chunck.mesh === mesh; }) != undefined;
                    }
                )
                if (hit && hit.pickedPoint) {
                    let n =  hit.getNormal(true).scaleInPlace(blockType === Kulla.BlockType.None ? - 0.2 : 0.2);
                    let chunckIJK = player.game.terrain.getChunckAndIJKAtPos(hit.pickedPoint.add(n), 0);
                    if (chunckIJK) {
                        // Redraw block preview
                        if (!previewMesh && blockType != Kulla.BlockType.None) {
                            previewMesh = BABYLON.MeshBuilder.CreateBox("preview", { width: terrain.blockSizeIJ_m, height: terrain.blockSizeK_m, depth: terrain.blockSizeIJ_m });
                        }
                        /*
                        if (!previewBox) {
                            previewBox = new BABYLON.Mesh("preview-box");
                            if (blockType === Kulla.BlockType.None) {
                                previewBox.material = SharedMaterials.RedEmissiveMaterial();
                            }
                            else {
                                previewBox.material = SharedMaterials.WhiteEmissiveMaterial();
                            }
                            previewBox.layerMask = 0x1;
                        }
                        */
                        
                        let needRedrawMesh: boolean = false;
                        if (lastI != chunckIJK.ijk.i) {
                            lastI = chunckIJK.ijk.i;
                            needRedrawMesh = true;
                        }
                        if (lastJ != chunckIJK.ijk.j) {
                            lastJ = chunckIJK.ijk.j;
                            needRedrawMesh = true;
                        }
                        if (lastK != chunckIJK.ijk.k) {
                            lastK = chunckIJK.ijk.k;
                            needRedrawMesh = true;
                        }
                        if (needRedrawMesh) {
                            //if (previewMesh) {
                            //    PlanetTools.SkewVertexData(previewMeshData, localIJK.planetChunck.size, globalIJK.i, globalIJK.j, globalIJK.k, localIJK.planetChunck.side, blockType).applyToMesh(previewMesh);
                            //    previewMesh.parent = chunckIJK.chunck.mesh;
                            //}
                            //PlanetTools.SkewVertexData(previewBoxData, localIJK.planetChunck.size, globalIJK.i, globalIJK.j, globalIJK.k, localIJK.planetChunck.side).applyToMesh(previewBox);
                            previewMesh.position.copyFromFloats((chunckIJK.ijk.i + 0.5) * terrain.blockSizeIJ_m, (chunckIJK.ijk.k + 0.5) * terrain.blockSizeK_m, (chunckIJK.ijk.j + 0.5) * terrain.blockSizeIJ_m);
                            previewMesh.parent = chunckIJK.chunck.mesh;
                        }

                        return;
                    }
                }
            }
            
            if (previewMesh) {
                previewMesh.dispose();
                previewMesh = undefined;
            }
            if (previewBox) {
                previewBox.dispose();
                previewBox = undefined;
            }
        }

        action.onClick = () => {
            if (/*!player.inputManager.inventoryOpened*/true) {
                let hit = player.game.scene.pick(
                    player._scene.pointerX,
                    player._scene.pointerY,
                    (mesh) => {
                        return player.currentChuncks.find(chunck => { return chunck && chunck.mesh === mesh; }) != undefined;
                    }
                )
                if (hit && hit.pickedPoint) {
                    let n =  hit.getNormal(true).scaleInPlace(blockType === Kulla.BlockType.None ? - 0.2 : 0.2);
                    let chunckIJK = player.game.terrain.getChunckAndIJKAtPos(hit.pickedPoint.add(n), 0);
                    if (chunckIJK) {
                        let affectedChuncks = chunckIJK.chunck.setData(blockType, chunckIJK.ijk.i, chunckIJK.ijk.j, chunckIJK.ijk.k);
                        
                        for (let i = 0; i < affectedChuncks.length; i++) {
                            let chunck = affectedChuncks[i];
                            chunck.updateIsEmptyIsFull(chunckIJK.ijk.k);
                            chunck.redrawMesh(true);
                        }
                    }
                }
            }
        }

        action.onUnequip = () => {
            if (previewMesh) {
                previewMesh.dispose();
                previewMesh = undefined;
            }
            if (previewBox) {
                previewBox.dispose();
                previewBox = undefined;
            }
            lastSize = undefined;
            lastI = undefined;
            lastJ = undefined;
            lastK = undefined;
        }
        
        return action;
    }
}