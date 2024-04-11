var ACTIVE_DEBUG_PLAYER_ACTION = true;

var ADD_BRICK_ANIMATION_DURATION = 1000;

class PlayerActionTemplate {

    public static CreateMushroomAction(player: Player): PlayerAction {
        let action = new PlayerAction("mushroom", player);
        action.backgroundColor = "#00FFFF";
        let previewMesh: BABYLON.Mesh;
        let previewBox: BABYLON.Mesh;
        action.iconUrl = undefined;

        let lastSize: number;
        let lastI: number;
        let lastJ: number;
        let lastK: number;

        let size = 1;

        action.onUpdate = () => {
            let terrain = player.game.terrain;
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
                    let n =  hit.getNormal(true).scaleInPlace(0.2);
                    let chunckIJK = player.game.terrain.getChunckAndIJKAtPos(hit.pickedPoint.add(n), 0, size % 2 === 0);
                    if (chunckIJK) {
                        // Redraw block preview
                        if (!previewMesh) {
                            previewMesh = Mummu.CreateLineBox("preview", { width: size * terrain.blockSizeIJ_m, height: size * terrain.blockSizeK_m, depth: size * terrain.blockSizeIJ_m, color: new BABYLON.Color4(0, 1, 0, 1) });
                        }
                        
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
                        
                        let offset = (size % 2) * 0.5;
                        previewMesh.position.copyFromFloats((chunckIJK.ijk.i + offset) * terrain.blockSizeIJ_m, (chunckIJK.ijk.k + offset) * terrain.blockSizeK_m, (chunckIJK.ijk.j + offset) * terrain.blockSizeIJ_m);
                        previewMesh.parent = chunckIJK.chunck.mesh;

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
                    let n =  hit.getNormal(true).scaleInPlace(0.2);
                    let chunckIJK = player.game.terrain.getChunckAndIJKAtPos(hit.pickedPoint.add(n), 0, size % 2 === 0);
                    if (chunckIJK) {
                        let mushroom = new Mushroom(player.game);
                        mushroom.chunck = chunckIJK.chunck;
                        mushroom.ijk = chunckIJK.ijk;
                        mushroom.instantiate();
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

    /*
    public static CreateBlockAction(player: Player, blockType: Kulla.BlockType): PlayerAction {
        let action = new PlayerAction("block_" + Kulla.BlockTypeNames[blockType], player);
        action.backgroundColor = Kulla.BlockTypeColors[blockType].toHexString();
        let previewMesh: BABYLON.Mesh;
        let previewBox: BABYLON.Mesh;
        action.iconUrl = undefined;

        let lastSize: number;
        let lastI: number;
        let lastJ: number;
        let lastK: number;

        let size = 1;

        action.onUpdate = () => {
            let terrain = player.game.terrain;
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
                        // Redraw block preview
                        if (!previewMesh) {
                            if (blockType === Kulla.BlockType.None) {
                                previewMesh = Mummu.CreateLineBox("preview", { width: size * terrain.blockSizeIJ_m, height: size * terrain.blockSizeK_m, depth: size * terrain.blockSizeIJ_m, color: new BABYLON.Color4(1, 0, 0, 1) });
                            }
                            else {
                                previewMesh = Mummu.CreateLineBox("preview", { width: size * terrain.blockSizeIJ_m, height: size * terrain.blockSizeK_m, depth: size * terrain.blockSizeIJ_m, color: new BABYLON.Color4(0, 1, 0, 1) });
                            }
                        }
                        
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
                        
                        let offset = (size % 2) * 0.5;
                        previewMesh.position.copyFromFloats((chunckIJK.ijk.i + offset) * terrain.blockSizeIJ_m, (chunckIJK.ijk.k + offset) * terrain.blockSizeK_m, (chunckIJK.ijk.j + offset) * terrain.blockSizeIJ_m);
                        previewMesh.parent = chunckIJK.chunck.mesh;

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
                        player.game.terrainEditor.doAction(chunckIJK.chunck, chunckIJK.ijk, {
                            brushSize: size,
                            brushBlock: blockType,
                            saveToLocalStorage: true
                        });
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
    */

    public static CreateBrickAction(player: Player, brickId: number | string, colorIndex?: number): PlayerAction {
        let brickIndex = Brick.BrickIdToIndex(brickId);
        let brickAction = new PlayerAction(Brick.BrickIdToName(brickId), player);
        brickAction.backgroundColor = "#000000";
        let previewMesh: BABYLON.Mesh;
        brickAction.iconUrl = "/datas/icons/bricks/" + Brick.BrickIdToName(brickId) + ".png";

        let rotationQuaternion = BABYLON.Quaternion.Identity();

        brickAction.onUpdate = () => {
            let terrain = player.game.terrain;
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
                        return player.currentChuncks.find(chunck => { return chunck && chunck.mesh === mesh; }) != undefined || mesh instanceof BrickMesh;
                    }
                )
                if (hit && hit.pickedPoint) {
                    let n =  hit.getNormal(true).scaleInPlace(0.05);
                    if (hit.pickedMesh instanceof BrickMesh) {
                        let root = hit.pickedMesh.brick.root;
                        if (root.mesh) {
                            let dp = hit.pickedPoint.add(n).subtract(root.position);
                            dp.x = terrain.blockSizeIJ_m * Math.round(dp.x / terrain.blockSizeIJ_m);
                            dp.y = (terrain.blockSizeK_m / 3) * Math.floor(dp.y / (terrain.blockSizeK_m / 3));
                            dp.z = terrain.blockSizeIJ_m * Math.round(dp.z / terrain.blockSizeIJ_m);
                            previewMesh.position.copyFrom(dp).addInPlace(root.position);
                            previewMesh.parent = undefined;
                            previewMesh.isVisible = true;
                            return;
                        }
                    }
                    else {
                        let chunckIJK = player.game.terrain.getChunckAndIJKAtPos(hit.pickedPoint.add(n), 0);
                        if (chunckIJK) {
                            previewMesh.position.copyFromFloats((chunckIJK.ijk.i + 0.5) * terrain.blockSizeIJ_m, (chunckIJK.ijk.k + 0.5 / 3) * terrain.blockSizeK_m, (chunckIJK.ijk.j + 0.5) * terrain.blockSizeIJ_m);
                            previewMesh.parent = chunckIJK.chunck.mesh;
                            previewMesh.isVisible = true;
                            return;
                        }
                    }
                }
            }
            
            if (previewMesh) {
                previewMesh.isVisible = false;
            }
        }

        brickAction.onPointerDown = () => {
            let terrain = player.game.terrain;
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
                        return player.currentChuncks.find(chunck => { return chunck && chunck.mesh === mesh; }) != undefined || mesh instanceof BrickMesh;
                    }
                )
                if (hit && hit.pickedPoint) {
                    let n =  hit.getNormal(true).scaleInPlace(0.05);
                    if (hit.pickedMesh instanceof BrickMesh) {
                        let root = hit.pickedMesh.brick.root;
                        let aimedBrick = root.getBrickForFaceId(hit.faceId);
                        let rootPosition = root.position;
                        let dp = hit.pickedPoint.add(n).subtract(rootPosition);
                        dp.x = terrain.blockSizeIJ_m * Math.round(dp.x / terrain.blockSizeIJ_m);
                        dp.y = (terrain.blockSizeK_m / 3) * Math.floor(dp.y / (terrain.blockSizeK_m / 3));
                        dp.z = terrain.blockSizeIJ_m * Math.round(dp.z / terrain.blockSizeIJ_m);
                        let brick = new Brick(player.game.brickManager, brickIndex, isFinite(colorIndex) ? colorIndex : player.controler.lastUsedPaintIndex);
                        brick.position.copyFrom(dp).addInPlace(rootPosition);
                        brick.rotationQuaternion = rotationQuaternion.clone();
                        brick.computeWorldMatrix(true);
                        brick.setParent(aimedBrick);
                        brick.updateMesh();

                        brick.brickManager.saveToLocalStorage();
                    }
                    else {
                        let chunckIJK = player.game.terrain.getChunckAndIJKAtPos(hit.pickedPoint.add(n), 0);
                        if (chunckIJK) {
                            let brick = new Brick(player.game.brickManager, brickIndex, isFinite(colorIndex) ? colorIndex : player.controler.lastUsedPaintIndex);
                            brick.position.copyFromFloats((chunckIJK.ijk.i + 0.5) * terrain.blockSizeIJ_m, (chunckIJK.ijk.k) * terrain.blockSizeK_m, (chunckIJK.ijk.j + 0.5) * terrain.blockSizeIJ_m).addInPlace(chunckIJK.chunck.position);
                            brick.rotationQuaternion = rotationQuaternion.clone();
                            brick.updateMesh();
                            brick.chunck = chunckIJK.chunck;
                            
                            brick.brickManager.saveToLocalStorage();
                        }
                    }
                }
            }
        }

        let rotateBrick = () => {
            let quat = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, Math.PI / 2);
            quat.multiplyToRef(rotationQuaternion, rotationQuaternion);
        }

        brickAction.onEquip = () => {
            brickIndex = Brick.BrickIdToIndex(brickId);
            if (!previewMesh || previewMesh.isDisposed()) {
                previewMesh = new BABYLON.Mesh("brick-preview-mesh");
            }
            let previewMat = new BABYLON.StandardMaterial("brick-preview-material");
            previewMat.alpha = 0.5;
            previewMat.specularColor.copyFromFloats(1, 1, 1);
            previewMesh.material = previewMat;
            previewMesh.rotationQuaternion = rotationQuaternion;
            BrickTemplateManager.Instance.getTemplate(brickIndex).then(template => {
                template.vertexData.applyToMesh(previewMesh);
            });

            player.game.inputManager.addMappedKeyDownListener(KeyInput.ROTATE_SELECTED, rotateBrick);
        }

        brickAction.onUnequip = () => {
            if (previewMesh) {
                previewMesh.dispose();
            }
            
            player.game.inputManager.removeMappedKeyDownListener(KeyInput.ROTATE_SELECTED, rotateBrick);
        }

        brickAction.onWheel = (e: WheelEvent) => {
            if (e.deltaY > 0) {
                brickIndex = (brickIndex + BRICK_LIST.length - 1) % BRICK_LIST.length;
                BrickTemplateManager.Instance.getTemplate(brickIndex).then(template => {
                    if (previewMesh && !previewMesh.isDisposed()) {
                        template.vertexData.applyToMesh(previewMesh);
                    }
                });
            }
            else if (e.deltaY < 0) {
                brickIndex = (brickIndex + 1) % BRICK_LIST.length;
                BrickTemplateManager.Instance.getTemplate(brickIndex).then(template => {
                    if (previewMesh && !previewMesh.isDisposed()) {
                        template.vertexData.applyToMesh(previewMesh);
                    }
                });
            }
        }
        
        return brickAction;
    }

    public static CreatePaintAction(player: Player, paintIndex: number): PlayerAction {
        let paintAction = new PlayerAction("paint_" + BRICK_COLORS[paintIndex].name, player);
        paintAction.backgroundColor = BRICK_COLORS[paintIndex].hex;
        paintAction.iconUrl = "/datas/icons/paintbrush.svg";

        let brush: BABYLON.Mesh;
        let tip: BABYLON.Mesh;

        paintAction.onUpdate = () => {
            
        }

        paintAction.onPointerDown = () => {
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
                        return player.currentChuncks.find(chunck => { return chunck && chunck.mesh === mesh; }) != undefined || mesh instanceof BrickMesh;
                    }
                )
                if (hit && hit.pickedPoint) {
                    if (hit.pickedMesh instanceof BrickMesh) {
                        let root = hit.pickedMesh.brick.root;
                        let aimedBrick = root.getBrickForFaceId(hit.faceId);
                        aimedBrick.colorIndex = paintIndex;
                        player.controler.lastUsedPaintIndex = paintIndex;
                        aimedBrick.updateMesh();
                        aimedBrick.brickManager.saveToLocalStorage();
                    }
                }
            }
        }

        paintAction.onEquip = async () => {
            brush = new BABYLON.Mesh("brush");
            brush.parent = player;
            brush.position.z = 0.8;
            brush.position.x = 0.1;
            brush.position.y = - 0.2;
            tip = new BABYLON.Mesh("tip");
            tip.parent = brush;
            let tipMaterial = new BABYLON.StandardMaterial("tip-material");
            tipMaterial.diffuseColor = BABYLON.Color3.FromHexString(BRICK_COLORS[paintIndex].hex);
            tip.material = tipMaterial;
            let vDatas = await player.game.vertexDataLoader.get("./datas/meshes/paintbrush.babylon");
            if (brush && !brush.isDisposed()) {
                vDatas[0].applyToMesh(brush);
                vDatas[1].applyToMesh(tip);
            }
        }

        paintAction.onUnequip = () => {
            if (brush) {
                brush.dispose();
            }
        }

        paintAction.onWheel = (e: WheelEvent) => {
            if (e.deltaY > 0) {
                paintIndex = (paintIndex + BRICK_COLORS.length - 1) % BRICK_COLORS.length;
                if (tip && !tip.isDisposed() && tip.material instanceof BABYLON.StandardMaterial) {
                    tip.material.diffuseColor = BABYLON.Color3.FromHexString(BRICK_COLORS[paintIndex].hex);
                }
            }
            else if (e.deltaY < 0) {
                paintIndex = (paintIndex + 1) % BRICK_COLORS.length;
                if (tip && !tip.isDisposed() && tip.material instanceof BABYLON.StandardMaterial) {
                    tip.material.diffuseColor = BABYLON.Color3.FromHexString(BRICK_COLORS[paintIndex].hex);
                }
            }
        }
        
        return paintAction;
    }
}