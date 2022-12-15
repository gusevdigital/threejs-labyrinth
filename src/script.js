import './style.css';
import * as THREE from 'three';
import { walls } from './inc/data';

/**
 * Loading Manager
 */

const loadingManager = new THREE.LoadingManager();
loadingManager.onProgress = (url, loaded, total) =>
    console.log(`Loaded ${url}. ${loaded}/${total}`);
loadingManager.onLoad = () => console.log('Everything is loaded!');
loadingManager.onError = url => console.log(`Error loading ${url}`);

/**
 * Textures
 */

const textureLoader = new THREE.TextureLoader(loadingManager);
const playerTexture = textureLoader.load('textures/matcaps/2.png');
const envTexture = textureLoader.load('textures/matcaps/1.png');
const finishTexture = textureLoader.load('textures/chess.jpg');

finishTexture.wrapS = THREE.RepeatWrapping;
finishTexture.wrapT = THREE.RepeatWrapping;
finishTexture.repeat.x = 6;
finishTexture.repeat.y = 2;
finishTexture.magFilter = THREE.NearestFilter;

/**
 * Canvas
 */
const canvas = document.querySelector('canvas.webgl');

/**
 * Scene
 */
const scene = new THREE.Scene();

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
};

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Plane
 */

const envMaterial = new THREE.MeshMatcapMaterial({
    matcap: envTexture,
});

const planeGeometry = new THREE.PlaneGeometry(50, 50);
const plane = new THREE.Mesh(planeGeometry, envMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -0.5;
scene.add(plane);

/**
 * Walls
 */
const wallGeometry = new THREE.BoxGeometry(1, 1, 1);
const mapSize = 29;

walls.forEach(wall => {
    wall.mesh = new THREE.Mesh(wallGeometry, envMaterial);
    wall.mesh.scale.set(wall.width, 1, wall.height);

    // I want to use standard x/y axis starting from 0 from bottom left on the map of size 29x29
    // Hehe
    wall.mesh.position.set(
        -(mapSize / 2) + wall.x + wall.width / 2,
        0,
        mapSize / 2 - wall.y - wall.height / 2
    );
    scene.add(wall.mesh);
});

/**
 * Player
 */

const player = new THREE.Group();
const playerMaterial = new THREE.MeshMatcapMaterial({
    matcap: playerTexture,
});

// head
const headGeometry = new THREE.BoxGeometry(1, 1, 1);
const head = new THREE.Mesh(headGeometry, playerMaterial);
player.add(head);
// Nose
const noseGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.6);
const nose = new THREE.Mesh(noseGeometry, playerMaterial);
nose.position.set(0, 0, 0.5);
player.add(nose);
// Eyes material and geometry
const eyeMaterial = new THREE.MeshBasicMaterial({ color: 'black' });
const eyeGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
// Left eye
const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
leftEye.position.set(-0.25, 0.25, 0.5);
player.add(leftEye);
// Right eye
const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
rightEye.position.set(0.25, 0.25, 0.5);
player.add(rightEye);

scene.add(player);

/**
 * Finish line
 */

const finishLine = new THREE.Mesh(
    new THREE.BoxGeometry(3, 0.01, 1),
    new THREE.MeshBasicMaterial({ map: finishTexture })
);
finishLine.position.set(0, -0.5, 14);
const finishLineBox = new THREE.Box3().setFromObject(finishLine);
scene.add(finishLine);

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(
    55,
    sizes.width / sizes.height,
    0.1,
    100
);
const cameraPosition = {
    x: 0,
    y: window.innerWidth < window.innerHeight ? 5.5 : 4,
    z: window.innerWidth < window.innerHeight ? 5.5 : 4,
};

camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
camera.lookAt(player.position);
scene.add(camera);

/**
 * Helpers
 */
// const axesHelper = new THREE.AxesHelper();
// scene.add(axesHelper);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.render(scene, camera);

/**
 * Controls
 */
// const controls = new OrbitControls(camera, canvas);
// controls.enableDamping = true;

/**
 * Animate
 */

const clock = new THREE.Clock();

const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    // Update controls
    // controls.update();

    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
};

tick();

/**
 * Game logic
 */
let isFinished = false;
const victoryScreen = document.querySelector('.victory');
const startAgainButton = document.querySelector('.victory button');

const finishGame = () => {
    isFinished = true;
    victoryScreen.classList.add('active');
};

startAgainButton.addEventListener('click', () => {
    player.position.set(0, 0, 0);
    camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
    camera;
    isFinished = false;
    victoryScreen.classList.remove('active');
});

const move = (rotation, axis, direction) => {
    player.rotation.y = rotation;

    const playerNextPosition = {
        x: axis === 'x' ? player.position.x + direction : player.position.x,
        z: axis === 'z' ? player.position.z + direction : player.position.z,
    };
    let isWallInFront = false;

    walls.forEach(wall => {
        const wallBox = new THREE.Box3().setFromObject(wall.mesh);
        if (
            playerNextPosition.x > wallBox.min.x &&
            playerNextPosition.x < wallBox.max.x &&
            playerNextPosition.z > wallBox.min.z &&
            playerNextPosition.z < wallBox.max.z
        )
            isWallInFront = true;
    });

    if (!isWallInFront) {
        player.position[axis] = player.position[axis] + direction;
        camera.position[axis] = camera.position[axis] + direction;
    }

    // Finish
    if (
        player.position.x > finishLineBox.min.x &&
        player.position.x < finishLineBox.max.x &&
        player.position.z > finishLineBox.min.z &&
        player.position.z < finishLineBox.max.z
    )
        finishGame();
};

const handleMovement = key => {
    if (!isFinished) {
        if (key === 'KeyW') move(-Math.PI, 'z', -1);
        if (key === 'KeyS') move(0, 'z', 1);
        if (key === 'KeyA') move(-Math.PI / 2, 'x', -1);
        if (key === 'KeyD') move(Math.PI / 2, 'x', 1);
    }
};

window.addEventListener(
    'keydown',
    e =>
        ['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code) &&
        handleMovement(e.code)
);

const handleControlBtnClick = e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const direction = btn.dataset.move;
    if (!direction) return;

    if (!isFinished) {
        if (direction === 'up') move(-Math.PI, 'z', -1);
        if (direction === 'down') move(0, 'z', 1);
        if (direction === 'left') move(-Math.PI / 2, 'x', -1);
        if (direction === 'right') move(Math.PI / 2, 'x', 1);
    }
};

document
    .querySelectorAll('.controls button')
    .forEach(btn => btn.addEventListener('click', handleControlBtnClick));
