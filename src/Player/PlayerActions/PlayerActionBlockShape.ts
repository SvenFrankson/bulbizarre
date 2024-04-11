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
        let previewGrid: BABYLON.Mesh;

        let size = 3;
        let dir = 0;
        let targetIJK: Nabu.IJK = { i: 0, j: 0, k: 0 };
        let targetChunck: Kulla.Chunck;

        action.iconUrl = "/datas/icons/shapes/" + shapeName + "_" + size.toFixed(0) + ".png";

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
                        if (mesh === previewGrid) {
                            return true;
                        }
                        return player.currentChuncks.find(chunck => { return chunck && chunck.mesh === mesh; }) != undefined;
                    }
                )
                if (hit && hit.pickedPoint) {
                    let n =  hit.getNormal(true).scaleInPlace(blockType === Kulla.BlockType.None ? - 0.2 : 0.2);
                    let chunckIJK = player.game.terrain.getChunckAndIJKAtPos(hit.pickedPoint.add(n), 0);
                    if (chunckIJK) {
                        if (!previewMesh) {
                            if (blockType === Kulla.BlockType.None) {
                                previewMesh = Mummu.CreateLineBox("preview", { width: previewW, height: previewH, depth: previewD, color: new BABYLON.Color4(1, 0, 0, 1), offset: previewOffset, grid: player.game.terrain.blockSizeIJ_m });
                            }
                            else {
                                previewMesh = Mummu.CreateLineBox("preview", { width: previewW, height: previewH, depth: previewD, color: new BABYLON.Color4(0, 1, 0, 1), offset: previewOffset, grid: player.game.terrain.blockSizeIJ_m });
                            }
                        }

                        if (!previewGrid) {
                            previewGrid = new BABYLON.Mesh("grid");
                            let gridMat = new ChunckGridMaterial("grid-mat", player._scene);
                            previewGrid.material = gridMat;
                        }
                        
                        previewMesh.position.copyFromFloats((chunckIJK.ijk.i + 0.5) * player.game.terrain.blockSizeIJ_m, (chunckIJK.ijk.k + 0.5) * player.game.terrain.blockSizeK_m, (chunckIJK.ijk.j + 0.5) * player.game.terrain.blockSizeIJ_m);
                        previewMesh.rotationQuaternion = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, dir * Math.PI / 2);
                        previewMesh.parent = chunckIJK.chunck.mesh;

                        if (chunckIJK.chunck != targetChunck || chunckIJK.ijk.i != targetIJK.i || chunckIJK.ijk.j != targetIJK.j || chunckIJK.ijk.k != targetIJK.k) {
                            targetChunck = chunckIJK.chunck;
                            targetIJK.i = chunckIJK.ijk.i;
                            targetIJK.j = chunckIJK.ijk.j;
                            targetIJK.k = chunckIJK.ijk.k;
                            let data = player.game.terrain.chunckBuilder.BuildGridMesh(chunckIJK.chunck, chunckIJK.ijk, 7, new BABYLON.Color3(0, 1, 1));
                            if (data) {
                                data.applyToMesh(previewGrid);
                            }
                        }
                        previewGrid.parent = chunckIJK.chunck.mesh;

                        return;
                    }
                }
            }

            targetChunck = undefined;
            
            if (previewMesh) {
                previewMesh.dispose();
                previewMesh = undefined;
            }
            
            if (previewGrid) {
                previewGrid.dispose();
                previewGrid = undefined;
            }
        }

        action.onPointerDown = () => {
            if (player.controler.playMode === PlayMode.Playing) {
                if (targetChunck) {
                    shape.draw(targetChunck, targetIJK, dir, blockType, Kulla.TerrainEditionMode.AddIfEmpty, true);
                }
            }
        }

        let rotateBrick = () => {
            dir = (dir + 1) % 4;
            let quat = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, dir * Math.PI / 2);
            if (previewMesh) {
                previewMesh.rotationQuaternion = quat;
            }
        }

        let nextShape = () => {
            if (shapeName === "pole") {
                shapeName = "tile";
            }
            else if (shapeName === "tile") {
                shapeName = "wall";
            }
            else if (shapeName === "wall") {
                shapeName = "pole";
            }
            onShapeUpdate();
        }


        let onShapeUpdate = () => {
            let terrain = player.game.terrain;
            let l = (size / 2 - 0.5) * player.game.terrain.blockSizeIJ_m;
            if (shapeName === "pole") {
                previewW = terrain.blockSizeIJ_m;
                previewH = size * terrain.blockSizeK_m;
                previewD = terrain.blockSizeIJ_m;
                previewOffset.copyFromFloats(0, l, 0);
                shape = new Kulla.Box(player.game.terrain, { width: 1, height: size, length: 1 });
            }
            else if (shapeName === "tile") {
                previewW = size * terrain.blockSizeIJ_m;
                previewH = 1 * terrain.blockSizeK_m;
                previewD = size * terrain.blockSizeIJ_m;
                previewOffset.copyFromFloats(l, 0, l);
                shape = new Kulla.Box(player.game.terrain, { width: size, height: 1, length: size });
            }
            else if (shapeName === "wall") {
                previewW = 1 * terrain.blockSizeIJ_m;
                previewH = size * terrain.blockSizeK_m;
                previewD = size * terrain.blockSizeIJ_m;
                previewOffset.copyFromFloats(0, l, l);
                shape = new Kulla.Box(player.game.terrain, { width: 1, height: size, length: size });
            }

            action.iconUrl = "/datas/icons/shapes/" + shapeName + "_" + size.toFixed(0) + ".png";
            if (previewMesh) {
                previewMesh.dispose();
                previewMesh = undefined;
            }
        }

        action.onEquip = () => {
            onShapeUpdate();
            dir = 0;
            player.game.inputManager.addMappedKeyDownListener(KeyInput.ROTATE_SELECTED, rotateBrick);
            player.game.inputManager.addMappedKeyDownListener(KeyInput.NEXT_SHAPE, nextShape);
        }

        action.onUnequip = () => {
            if (previewMesh) {
                previewMesh.dispose();
                previewMesh = undefined;
            }
            if (previewGrid) {
                previewGrid.dispose();
                previewGrid = undefined;
            }
            targetChunck = undefined;
            player.game.inputManager.removeMappedKeyDownListener(KeyInput.ROTATE_SELECTED, rotateBrick);
            player.game.inputManager.removeMappedKeyDownListener(KeyInput.NEXT_SHAPE, nextShape);
        }

        action.onWheel = (e: WheelEvent) => {
            if (e.deltaY > 0) {
                size = Nabu.MinMax(size - 1, 1, 10);
                onShapeUpdate();
            }
            else if (e.deltaY < 0) {
                size = Nabu.MinMax(size + 1, 1, 10);
                onShapeUpdate();
            }
        }
        
        return action;
    }
}