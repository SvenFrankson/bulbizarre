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

    public static CreateBlockAction(player: Player, blockType: Kulla.BlockType): PlayerAction {
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
            if (player.game.router.inPlayMode) {
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
                    let chunckIJK = player.game.terrain.getChunckAndIJKAtPos(hit.pickedPoint.add(n), 0, true);
                    if (chunckIJK) {
                        // Redraw block preview
                        if (!previewMesh) {
                            if (blockType === Kulla.BlockType.None) {
                                previewMesh = Mummu.CreateLineBox("preview", { width: 2 * terrain.blockSizeIJ_m, height: 2 * terrain.blockSizeK_m, depth: 2 * terrain.blockSizeIJ_m, color: new BABYLON.Color4(1, 0, 0, 1) });
                            }
                            else {
                                previewMesh = Mummu.CreateLineBox("preview", { width: 2 * terrain.blockSizeIJ_m, height: 2 * terrain.blockSizeK_m, depth: 2 * terrain.blockSizeIJ_m, color: new BABYLON.Color4(0, 1, 0, 1) });
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
                        
                        previewMesh.position.copyFromFloats((chunckIJK.ijk.i) * terrain.blockSizeIJ_m, (chunckIJK.ijk.k) * terrain.blockSizeK_m, (chunckIJK.ijk.j) * terrain.blockSizeIJ_m);
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
            if (player.game.router.inPlayMode) {
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
                    let chunckIJK = player.game.terrain.getChunckAndIJKAtPos(hit.pickedPoint.add(n), 0, true);
                    if (chunckIJK) {
                        player.game.terrainEditor.doAction(chunckIJK.chunck, chunckIJK.ijk, {
                            brushSize: 2,
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

    public static CreateBrickAction(brickId: number | string, player: Player): PlayerAction {
        let brickAction = new PlayerAction("brick", player);
        brickAction.backgroundColor = "#000000";
        let previewMesh: BABYLON.Mesh;
        brickAction.iconUrl = "/datas/images/brick-icon.png";

        let rotationQuaternion = BABYLON.Quaternion.Identity();

        brickAction.onUpdate = () => {
            let terrain = player.game.terrain;
            if (player.game.router.inPlayMode) {
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
            if (player.game.router.inPlayMode) {
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
                        let brick = new Brick(brickId, 0);
                        brick.position.copyFrom(dp).addInPlace(rootPosition);
                        brick.rotationQuaternion = rotationQuaternion.clone();
                        brick.computeWorldMatrix(true);
                        brick.setParent(aimedBrick);
                        brick.updateMesh();
                    }
                    else {
                        let chunckIJK = player.game.terrain.getChunckAndIJKAtPos(hit.pickedPoint.add(n), 0);
                        if (chunckIJK) {
                            let brick = new Brick(brickId, 0);
                            brick.position.copyFromFloats((chunckIJK.ijk.i + 0.5) * terrain.blockSizeIJ_m, (chunckIJK.ijk.k) * terrain.blockSizeK_m, (chunckIJK.ijk.j + 0.5) * terrain.blockSizeIJ_m).addInPlace(chunckIJK.chunck.position);
                            brick.rotationQuaternion = rotationQuaternion.clone();
                            brick.updateMesh();
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
            previewMesh = new BABYLON.Mesh("brick-preview-mesh");
            let previewMat = new BABYLON.StandardMaterial("brick-preview-material");
            previewMat.alpha = 0.5;
            previewMat.specularColor.copyFromFloats(1, 1, 1);
            previewMesh.material = previewMat;
            previewMesh.rotationQuaternion = rotationQuaternion;
            BrickTemplateManager.Instance.getTemplate(Brick.BrickIdToIndex(brickId)).then(template => {
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
        
        return brickAction;
    }
}