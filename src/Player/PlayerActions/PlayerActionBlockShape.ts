class PlayerActionBlockShape {

    public static Create(player: Player, shapeName: string, blockType: Kulla.BlockType): PlayerAction {
        let shape: Kulla.Shape;
        let previewW: number = 1;
        let previewH: number = 1;
        let previewD: number = 1;
        let previewOffset: BABYLON.Vector3 = BABYLON.Vector3.Zero();

        let action = new PlayerAction(shapeName + "_" + Kulla.BlockTypeNames[blockType], player);
        action.backgroundColor = Kulla.BlockTypeColors[blockType].toHexString();
        let previewMesh: BABYLON.Mesh;
        action.iconUrl = undefined;

        let size = 1;

        action.onUpdate = () => {
            if (player.controler.playMode === PlayMode.Playing) {
                let x: number;
                let y: number;
                if (player.controler.gamepadInControl || player.game.inputManager.isPointerLocked) {
                    x = player.game.canvas.clientWidth * 0.5;
                    y = player.game.canvas.clientHeight * 0.5;
                }
                else {
                    x = player._scene.pointerX;
                    y = player._scene.pointerY;
                }
                let hit = player.game.scene.pick(
                    x,
                    y,
                    (mesh) => {
                        return player.currentChuncks.find(chunck => { return chunck && chunck.mesh === mesh; }) != undefined;
                    }
                )
                if (hit && hit.pickedPoint) {
                    let n =  hit.getNormal(true).scaleInPlace(blockType === Kulla.BlockType.None ? - 0.2 : 0.2);
                    let chunckIJK = player.game.terrain.getChunckAndIJKAtPos(hit.pickedPoint.add(n), 0, size % 2 === 0);
                    if (chunckIJK) {
                        if (!previewMesh) {
                            if (blockType === Kulla.BlockType.None) {
                                previewMesh = Mummu.CreateLineBox("preview", { width: previewW, height: previewH, depth: previewD, color: new BABYLON.Color4(1, 0, 0, 1) });
                            }
                            else {
                                previewMesh = Mummu.CreateLineBox("preview", { width: previewW, height: previewH, depth: previewD, color: new BABYLON.Color4(0, 1, 0, 1) });
                            }
                        }
                        
                        previewMesh.position.copyFromFloats((chunckIJK.ijk.i) * player.game.terrain.blockSizeIJ_m, (chunckIJK.ijk.k) * player.game.terrain.blockSizeK_m, (chunckIJK.ijk.j) * player.game.terrain.blockSizeIJ_m).addInPlace(previewOffset);
                        previewMesh.parent = chunckIJK.chunck.mesh;

                        return;
                    }
                }
            }
            
            if (previewMesh) {
                previewMesh.dispose();
                previewMesh = undefined;
            }
        }

        action.onPointerDown = () => {
            if (player.controler.playMode === PlayMode.Playing) {
                let x: number;
                let y: number;
                if (player.controler.gamepadInControl || player.game.inputManager.isPointerLocked) {
                    x = player.game.canvas.clientWidth * 0.5;
                    y = player.game.canvas.clientHeight * 0.5;
                }
                else {
                    x = player._scene.pointerX;
                    y = player._scene.pointerY;
                }
                let hit = player.game.scene.pick(
                    x,
                    y,
                    (mesh) => {
                        return player.currentChuncks.find(chunck => { return chunck && chunck.mesh === mesh; }) != undefined;
                    }
                )
                if (hit && hit.pickedPoint) {
                    let n =  hit.getNormal(true).scaleInPlace(blockType === Kulla.BlockType.None ? - 0.2 : 0.2);
                    let chunckIJK = player.game.terrain.getChunckAndIJKAtPos(hit.pickedPoint.add(n), 0, size % 2 === 0);
                    if (chunckIJK) {
                        shape.draw(chunckIJK.chunck, chunckIJK.ijk, Kulla.BlockType.Rock, Kulla.TerrainEditionMode.AddIfEmpty, true);
                    }
                }
            }
        }

        action.onEquip = () => {
            let terrain = player.game.terrain;
            if (shapeName === "pole") {
                previewW = terrain.blockSizeIJ_m;
                previewH = 5 * terrain.blockSizeK_m;
                previewD = terrain.blockSizeIJ_m;
                previewOffset.copyFromFloats(0.5 * terrain.blockSizeIJ_m, 2.5 * terrain.blockSizeK_m, 0.5 * terrain.blockSizeIJ_m);
                shape = new Kulla.Box(player.game.terrain, { width: 1, height: 5, length: 1 });
            }
            if (shapeName === "tile") {
                previewW = 5 * terrain.blockSizeIJ_m;
                previewH = 1 * terrain.blockSizeK_m;
                previewD = 5 * terrain.blockSizeIJ_m;
                previewOffset.copyFromFloats(2.5 * terrain.blockSizeIJ_m, 0.5 * terrain.blockSizeK_m, 2.5 * terrain.blockSizeIJ_m);
                shape = new Kulla.Box(player.game.terrain, { width: 5, height: 1, length: 5 });
            }
        }

        action.onUnequip = () => {
            if (previewMesh) {
                previewMesh.dispose();
                previewMesh = undefined;
            }
        }
        
        return action;
    }
}