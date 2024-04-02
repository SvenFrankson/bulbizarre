class PlayerActionMoveBrick {

    public static Create(player: Player, brick: Brick): PlayerAction {
        let brickAction = new PlayerAction("move-brick-action", player);
        brickAction.backgroundColor = "#FF00FF";
        brickAction.iconUrl = "";

        let initPos = brick.root.position.clone();

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
                        return player.currentChuncks.find(chunck => { return chunck && chunck.mesh === mesh; }) != undefined || (mesh instanceof BrickMesh && mesh.brick != brick);
                    }
                )
                if (hit && hit.pickedPoint) {
                    let n =  hit.getNormal(true).scaleInPlace(0.05);
                    if (hit.pickedMesh instanceof BrickMesh) {
                        let root = hit.pickedMesh.brick.root;
                        let rootPosition = root.position;
                        let dp = hit.pickedPoint.add(n).subtract(rootPosition);
                        dp.x = terrain.blockSizeIJ_m * Math.round(dp.x / terrain.blockSizeIJ_m);
                        dp.y = (terrain.blockSizeK_m / 3) * Math.floor(dp.y / (terrain.blockSizeK_m / 3));
                        dp.z = terrain.blockSizeIJ_m * Math.round(dp.z / terrain.blockSizeIJ_m);
                        brick.root.position.copyFrom(dp);
                        brick.root.position.addInPlace(rootPosition);
                        return;
                    }
                    else {
                        let chunckIJK = player.game.terrain.getChunckAndIJKAtPos(hit.pickedPoint.add(n), 0);
                        if (chunckIJK) {
                            brick.root.position.copyFromFloats((chunckIJK.ijk.i + 0.5) * terrain.blockSizeIJ_m, (chunckIJK.ijk.k) * terrain.blockSizeK_m, (chunckIJK.ijk.j + 0.5) * terrain.blockSizeIJ_m).addInPlace(chunckIJK.chunck.position);
                            return;
                        }
                    }
                }
            }
        }

        brickAction.onPointerUp = (duration: number) => {
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
                        return player.currentChuncks.find(chunck => { return chunck && chunck.mesh === mesh; }) != undefined || (mesh instanceof BrickMesh && mesh.brick != brick);
                    }
                )
                if (hit && hit.pickedPoint) {
                    let n =  hit.getNormal(true).scaleInPlace(0.05);
                    if (hit.pickedMesh instanceof BrickMesh) {
                        if (duration > 0.3) {
                            let root = hit.pickedMesh.brick.root;
                            let aimedBrick = root.getBrickForFaceId(hit.faceId);
                            brick.setParent(aimedBrick);
                            brick.updateMesh();
                            brick.chunck = undefined;
                            
                            brick.brickManager.saveToLocalStorage();
                        }
                        else {
                            let root = hit.pickedMesh.brick.root;
                            let rootPosition = root.position;
                            let dp = hit.pickedPoint.add(n).subtract(rootPosition);
                            dp.x = terrain.blockSizeIJ_m * Math.round(dp.x / terrain.blockSizeIJ_m);
                            dp.y = (terrain.blockSizeK_m / 3) * Math.floor(dp.y / (terrain.blockSizeK_m / 3));
                            dp.z = terrain.blockSizeIJ_m * Math.round(dp.z / terrain.blockSizeIJ_m);
                            brick.root.position.copyFrom(dp);
                            brick.root.position.addInPlace(rootPosition);
                            brick.chunck = root.chunck;
                            
                            brick.brickManager.saveToLocalStorage();
                        }
                    }
                    else {
                        let chunckIJK = player.game.terrain.getChunckAndIJKAtPos(hit.pickedPoint.add(n), 0);
                        if (chunckIJK) {
                            brick.root.position.copyFromFloats((chunckIJK.ijk.i + 0.5) * terrain.blockSizeIJ_m, (chunckIJK.ijk.k) * terrain.blockSizeK_m, (chunckIJK.ijk.j + 0.5) * terrain.blockSizeIJ_m).addInPlace(chunckIJK.chunck.position);
                            brick.root.chunck = chunckIJK.chunck;
                            
                            brick.brickManager.saveToLocalStorage();
                        }
                    }
                }
            }
            player.currentAction = undefined;
        }

        let rotateBrick = () => {
            if (brick) {
                let quat = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, Math.PI / 2);
                quat.multiplyToRef(brick.rotationQuaternion, brick.rotationQuaternion);
            }
        }

        let deleteBrick = () => {
            if (brick) {
                brick.dispose();
                player.currentAction = undefined;
            }
        }

        brickAction.onEquip = () => {
            player.game.inputManager.addMappedKeyDownListener(KeyInput.ROTATE_SELECTED, rotateBrick)
            player.game.inputManager.addMappedKeyDownListener(KeyInput.DELETE_SELECTED, deleteBrick)
        }

        brickAction.onUnequip = () => {
            player.game.inputManager.removeMappedKeyDownListener(KeyInput.ROTATE_SELECTED, rotateBrick)
            player.game.inputManager.removeMappedKeyDownListener(KeyInput.DELETE_SELECTED, deleteBrick)
        }

        brickAction.onWheel = (e: WheelEvent) => {
            if (brick.isRoot && brick.getChildTransformNodes().length === 0) {
                if (e.deltaY > 0) {
                    brick.index = (brick.index + BRICK_LIST.length - 1) % BRICK_LIST.length;
                    brick.updateMesh();
                }
                else if (e.deltaY < 0) {
                    brick.index = (brick.index + 1) % BRICK_LIST.length;
                    brick.updateMesh();
                }
            }
        }
        
        return brickAction;
    }
}