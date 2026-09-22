/**
 * CashFlowShield AI - Three.js 3D Holographic Shield & Particle Matrix
 * Complete WebGL 3D scene featuring central holographic cash shield,
 * particle cash flow & leak deflection streams, and orbiting clickable 3D risk satellites.
 */

import { SoundFxManager } from './soundFx.js';

export class ThreeShieldScene {
  /**
   * @param {HTMLElement} container - DOM container to attach canvas
   * @param {Object} options - callbacks and configs
   */
  constructor(container, options = {}) {
    this.container = container;
    this.onNodeClick = options.onNodeClick || (() => {});
    this.soundFx = new SoundFxManager();

    // Scene & Three Objects
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // Interactive 3D Components
    this.shieldGroup = null;
    this.shieldCore = null;
    this.shieldOuter = null;
    this.shieldWire = null;
    this.energyRings = [];

    // Particle Systems
    this.inflowParticles = null;
    this.inflowGeo = null;
    this.leakParticles = null;
    this.leakGeo = null;
    this.deflectionWave = null;
    this.isDeflecting = false;
    this.deflectionProgress = 0;

    // Satellites
    this.satellites = [];
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-999, -999);
    this.hoveredSatellite = null;

    // Camera Animation State
    this.defaultCamPos = new THREE.Vector3(0, 1.8, 11);
    this.targetCamPos = this.defaultCamPos.clone();
    this.camLookTarget = new THREE.Vector3(0, 0, 0);
    this.activeLookTarget = new THREE.Vector3(0, 0, 0);
    this.mouseParallax = { x: 0, y: 0 };
    this.isAutoRotating = true;

    // Shield Financial Status State
    this.state = {
      isProtected: true,
      shortfallGap: 0,
      rtoLoss: 25000,
      trappedCash: 80000,
      currentCash: 420000,
      protectedTarget: 185000
    };

    this.init();
  }

  init() {
    if (!this.container || typeof THREE === 'undefined') return;

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 500;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x070B14, 0.035);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 1000);
    this.camera.position.copy(this.defaultCamPos);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    // Clean container and attach
    const oldCanvas = this.container.querySelector('canvas');
    if (oldCanvas) oldCanvas.remove();
    this.container.appendChild(this.renderer.domElement);

    // 4. Lights
    this.setupLighting();

    // 5. 3D Elements
    this.createHolographicShield();
    this.createOrbitingSatellites();
    this.createCashFlowParticles();
    this.createDeflectionShockwave();
    this.createBackgroundStarfield();

    // 6. Events
    this.bindEvents();

    // 7. Start Animation Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.8);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x60a5fa, 2.2);
    dirLight1.position.set(5, 10, 7);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x10b981, 1.5);
    dirLight2.position.set(-8, -4, -5);
    this.scene.add(dirLight2);

    // Central Point Light for Shield Glow
    this.shieldPointLight = new THREE.PointLight(0x10b981, 3.5, 15);
    this.shieldPointLight.position.set(0, 0, 0);
    this.scene.add(this.shieldPointLight);
  }

  /**
   * Creates the signature central Holographic 3D Cash Shield.
   */
  createHolographicShield() {
    this.shieldGroup = new THREE.Group();

    // Custom Shield Geometry using Extrusion of a Shield Silhouette
    const shape = new THREE.Shape();
    shape.moveTo(0, 1.8);
    shape.quadraticCurveTo(1.4, 1.6, 1.5, 0.4);
    shape.quadraticCurveTo(1.4, -0.9, 0, -2.1);
    shape.quadraticCurveTo(-1.4, -0.9, -1.5, 0.4);
    shape.quadraticCurveTo(-1.4, 1.6, 0, 1.8);

    const extrudeSettings = {
      depth: 0.35,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 2,
      bevelSize: 0.12,
      bevelThickness: 0.12
    };

    const shieldGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    shieldGeo.center();

    // Outer Glass Surface
    const shieldMat = new THREE.MeshPhysicalMaterial({
      color: 0x059669,
      emissive: 0x047857,
      emissiveIntensity: 0.45,
      roughness: 0.15,
      metalness: 0.85,
      transmission: 0.6,
      transparent: true,
      opacity: 0.88,
      reflectivity: 0.9
    });

    this.shieldOuter = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldGroup.add(this.shieldOuter);

    // Holographic Cybernetic Wireframe
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      wireframe: true,
      transparent: true,
      opacity: 0.55
    });
    this.shieldWire = new THREE.Mesh(shieldGeo, wireMat);
    this.shieldWire.scale.set(1.02, 1.02, 1.02);
    this.shieldGroup.add(this.shieldWire);

    // Inner Glowing Energy Core
    const coreGeo = new THREE.IcosahedronGeometry(0.75, 2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x34d399,
      emissiveIntensity: 1.8,
      roughness: 0.3,
      metalness: 0.5,
      wireframe: false
    });
    this.shieldCore = new THREE.Mesh(coreGeo, coreMat);
    this.shieldGroup.add(this.shieldCore);

    // Orbiting Gyroscopic Energy Rings
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.4
    });
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });

    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.03, 8, 48), ringMat1);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.025, 8, 48), ringMat2);
    ring2.rotation.x = Math.PI / 3;

    this.energyRings.push(ring1, ring2);
    this.shieldGroup.add(ring1);
    this.shieldGroup.add(ring2);

    this.scene.add(this.shieldGroup);
  }

  /**
   * Creates orbiting clickable 3D risk satellites.
   */
  createOrbitingSatellites() {
    const satelliteConfigs = [
      {
        id: "sat_rto",
        name: "D2C RTO Risk",
        color: 0xf43f5e,
        emissive: 0xe11d48,
        geo: new THREE.DodecahedronGeometry(0.38),
        orbitRadius: 4.8,
        orbitSpeed: 0.45,
        orbitTilt: 0.25,
        angle: 0.5,
        dataTag: "High RTO Leakage"
      },
      {
        id: "sat_rec",
        name: "B2B Receivables",
        color: 0xf59e0b,
        emissive: 0xd97706,
        geo: new THREE.OctahedronGeometry(0.42),
        orbitRadius: 5.5,
        orbitSpeed: 0.32,
        orbitTilt: -0.3,
        angle: 2.1,
        dataTag: "Trapped Working Capital"
      },
      {
        id: "sat_deb",
        name: "Bank Debits",
        color: 0x6366f1,
        emissive: 0x4f46e5,
        geo: new THREE.BoxGeometry(0.6, 0.6, 0.6),
        orbitRadius: 6.2,
        orbitSpeed: 0.25,
        orbitTilt: 0.4,
        angle: 3.8,
        dataTag: "7-Day Outflows"
      },
      {
        id: "sat_prot",
        name: "Protected Balance",
        color: 0x10b981,
        emissive: 0x059669,
        geo: new THREE.TorusGeometry(0.4, 0.12, 12, 24),
        orbitRadius: 4.2,
        orbitSpeed: 0.55,
        orbitTilt: -0.15,
        angle: 5.2,
        dataTag: "AI Safety Target"
      }
    ];

    satelliteConfigs.forEach(cfg => {
      const group = new THREE.Group();

      const mat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        emissive: cfg.emissive,
        emissiveIntensity: 1.2,
        roughness: 0.25,
        metalness: 0.75
      });

      const mesh = new THREE.Mesh(cfg.geo, mat);
      mesh.userData = { id: cfg.id, config: cfg, isSatellite: true };
      group.add(mesh);

      // Outer wireframe halo ring
      const haloGeo = new THREE.RingGeometry(0.55, 0.6, 24);
      const haloMat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = Math.PI / 2;
      group.add(halo);

      // Orbit Path Guide Ring
      const pathGeo = new THREE.BufferGeometry();
      const pathPoints = [];
      for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * Math.PI * 2;
        pathPoints.push(
          new THREE.Vector3(
            Math.cos(theta) * cfg.orbitRadius,
            Math.sin(theta * 2) * cfg.orbitTilt * 0.8,
            Math.sin(theta) * cfg.orbitRadius
          )
        );
      }
      pathGeo.setFromPoints(pathPoints);
      const pathMat = new THREE.LineBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: 0.12
      });
      const pathLine = new THREE.Line(pathGeo, pathMat);
      this.scene.add(pathLine);

      this.scene.add(group);

      this.satellites.push({
        group,
        mesh,
        halo,
        config: cfg,
        angle: cfg.angle
      });
    });
  }

  /**
   * Creates real-time dynamic particle streams for Inflows and Outflow Cash Leaks.
   */
  createCashFlowParticles() {
    // 1. Inflow Particles (Cyan / Green Stream moving toward shield)
    const inCount = 280;
    this.inflowGeo = new THREE.BufferGeometry();
    const inPos = new Float32Array(inCount * 3);
    const inVel = [];

    for (let i = 0; i < inCount; i++) {
      const radius = 6 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      inPos[i * 3] = radius * Math.cos(phi) * Math.cos(theta);
      inPos[i * 3 + 1] = radius * Math.sin(phi);
      inPos[i * 3 + 2] = radius * Math.cos(phi) * Math.sin(theta);

      inVel.push({
        origRadius: radius,
        speed: 0.04 + Math.random() * 0.05,
        theta,
        phi
      });
    }

    this.inflowGeo.setAttribute('position', new THREE.BufferAttribute(inPos, 3));
    this.inflowVelocities = inVel;

    const inMat = new THREE.PointsMaterial({
      color: 0x34d399,
      size: 0.14,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    this.inflowParticles = new THREE.Points(this.inflowGeo, inMat);
    this.scene.add(this.inflowParticles);

    // 2. Outflow / Leak Particles (Crimson / Red Stream leaking outwards)
    const leakCount = 220;
    this.leakGeo = new THREE.BufferGeometry();
    const leakPos = new Float32Array(leakCount * 3);
    const leakVel = [];

    for (let i = 0; i < leakCount; i++) {
      const r = 0.5 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const y = -0.5 - Math.random() * 1.2;

      leakPos[i * 3] = Math.cos(theta) * r;
      leakPos[i * 3 + 1] = y;
      leakPos[i * 3 + 2] = Math.sin(theta) * r;

      leakVel.push({
        x: (Math.random() - 0.5) * 0.04,
        y: -(0.03 + Math.random() * 0.05),
        z: (Math.random() - 0.5) * 0.04,
        life: Math.random()
      });
    }

    this.leakGeo.setAttribute('position', new THREE.BufferAttribute(leakPos, 3));
    this.leakVelocities = leakVel;

    const leakMat = new THREE.PointsMaterial({
      color: 0xf43f5e,
      size: 0.16,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    this.leakParticles = new THREE.Points(this.leakGeo, leakMat);
    this.scene.add(this.leakParticles);
  }

  /**
   * Creates the dynamic Deflection Forcefield Shockwave.
   */
  createDeflectionShockwave() {
    const shockGeo = new THREE.SphereGeometry(1, 32, 32);
    const shockMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      wireframe: true,
      transparent: true,
      opacity: 0
    });
    this.deflectionWave = new THREE.Mesh(shockGeo, shockMat);
    this.scene.add(this.deflectionWave);
  }

  /**
   * Distant subtle stars/particles for cybernetic depth.
   */
  createBackgroundStarfield() {
    const starCount = 350;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 60;
      starPos[i + 1] = (Math.random() - 0.5) * 60;
      starPos[i + 2] = -15 - Math.random() * 30;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x475569,
      size: 0.1,
      transparent: true,
      opacity: 0.4
    });
    const stars = new THREE.Points(starGeo, starMat);
    this.scene.add(stars);
  }

  /**
   * Triggers the interactive Deflection Wave: repels leak particles and plays sci-fi audio.
   */
  triggerDeflection() {
    this.isDeflecting = true;
    this.deflectionProgress = 0;
    this.soundFx.playDeflectionPulse();

    // Flash shield light
    if (this.shieldPointLight) {
      this.shieldPointLight.intensity = 8.0;
      setTimeout(() => {
        if (this.shieldPointLight) this.shieldPointLight.intensity = 3.5;
      }, 400);
    }
  }

  /**
   * Updates 3D shield state based on intelligence engine recomputations.
   * @param {Object} state
   */
  updateState(state = {}) {
    this.state = { ...this.state, ...state };

    const isSafe = this.state.isProtected;

    // Transition Shield Material colors
    if (this.shieldOuter && this.shieldCore && this.shieldWire) {
      const targetColor = isSafe ? 0x059669 : 0xe11d48;
      const targetEmissive = isSafe ? 0x10b981 : 0xf43f5e;
      const targetWire = isSafe ? 0x34d399 : 0xfda4af;

      this.shieldOuter.material.color.setHex(targetColor);
      this.shieldOuter.material.emissive.setHex(targetEmissive);
      this.shieldWire.material.color.setHex(targetWire);
      this.shieldCore.material.color.setHex(targetEmissive);
      this.shieldCore.material.emissive.setHex(targetWire);

      if (this.shieldPointLight) {
        this.shieldPointLight.color.setHex(targetEmissive);
      }
    }
  }

  /**
   * Sets camera to focus on a specific 3D satellite node.
   * @param {String} satId - "sat_rto" | "sat_rec" | "sat_deb" | "sat_prot"
   */
  focusOnSatellite(satId) {
    const sat = this.satellites.find(s => s.config.id === satId);
    if (!sat) {
      this.resetCamera();
      return;
    }

    this.soundFx.playNodeFocus();
    this.isAutoRotating = false;

    // Position camera slightly offset from satellite in world coordinates
    const worldPos = new THREE.Vector3();
    sat.mesh.getWorldPosition(worldPos);

    this.targetCamPos.copy(worldPos).add(new THREE.Vector3(0, 0.6, 2.8));
    this.camLookTarget.copy(worldPos);

    if (typeof this.onNodeClick === 'function') {
      this.onNodeClick(sat.config);
    }
  }

  /**
   * Resets camera back to default overview panoramic perspective.
   */
  resetCamera() {
    this.isAutoRotating = true;
    this.targetCamPos.copy(this.defaultCamPos);
    this.camLookTarget.set(0, 0, 0);
  }

  bindEvents() {
    window.addEventListener('resize', () => this.onResize());

    // Mouse movement for 3D parallax & raycasting
    this.container.addEventListener('mousemove', (e) => {
      const rect = this.container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.mouse.x = x;
      this.mouse.y = y;

      this.mouseParallax.x = x * 0.85;
      this.mouseParallax.y = y * 0.45;

      this.checkRaycast();
    });

    this.container.addEventListener('mouseleave', () => {
      this.mouse.x = -999;
      this.mouse.y = -999;
      this.mouseParallax.x = 0;
      this.mouseParallax.y = 0;
      if (this.hoveredSatellite) {
        this.hoveredSatellite.mesh.scale.set(1, 1, 1);
        this.hoveredSatellite = null;
        this.container.style.cursor = 'default';
      }
    });

    // Raycaster Click Handler
    this.container.addEventListener('click', () => {
      if (this.hoveredSatellite) {
        this.focusOnSatellite(this.hoveredSatellite.config.id);
      }
    });
  }

  checkRaycast() {
    if (!this.camera) return;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const interactiveMeshes = this.satellites.map(s => s.mesh);
    const intersects = this.raycaster.intersectObjects(interactiveMeshes);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const sat = this.satellites.find(s => s.mesh === hitMesh);

      if (sat && this.hoveredSatellite !== sat) {
        if (this.hoveredSatellite) this.hoveredSatellite.mesh.scale.set(1, 1, 1);
        this.hoveredSatellite = sat;
        sat.mesh.scale.set(1.3, 1.3, 1.3);
        this.container.style.cursor = 'pointer';
      }
    } else {
      if (this.hoveredSatellite) {
        this.hoveredSatellite.mesh.scale.set(1, 1, 1);
        this.hoveredSatellite = null;
        this.container.style.cursor = 'default';
      }
    }
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Main Render and Physics Animation Loop.
   */
  animate() {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    // 1. Animate Central Holographic Shield
    if (this.shieldGroup) {
      if (this.isAutoRotating) {
        this.shieldGroup.rotation.y = Math.sin(time * 0.4) * 0.25;
        this.shieldGroup.rotation.x = Math.cos(time * 0.3) * 0.12;
      }

      // Parallax mouse tilt
      this.shieldGroup.position.x += (this.mouseParallax.x * 0.3 - this.shieldGroup.position.x) * 0.05;
      this.shieldGroup.position.y += (this.mouseParallax.y * 0.3 - this.shieldGroup.position.y) * 0.05;

      // Energy Core Pulsing Scale
      if (this.shieldCore) {
        const pulse = 1 + Math.sin(time * 3.5) * 0.08;
        this.shieldCore.scale.set(pulse, pulse, pulse);
        this.shieldCore.rotation.y += 0.015;
      }

      // Gyroscope Rings Rotation
      if (this.energyRings.length >= 2) {
        this.energyRings[0].rotation.z += 0.012;
        this.energyRings[0].rotation.y += 0.008;
        this.energyRings[1].rotation.x += 0.009;
        this.energyRings[1].rotation.z -= 0.015;
      }
    }

    // 2. Animate Orbiting Satellites
    this.satellites.forEach(sat => {
      sat.angle += sat.config.orbitSpeed * delta * 0.6;
      const r = sat.config.orbitRadius;
      const x = Math.cos(sat.angle) * r;
      const z = Math.sin(sat.angle) * r;
      const y = Math.sin(sat.angle * 2) * sat.config.orbitTilt * 1.2;

      sat.group.position.set(x, y, z);
      sat.mesh.rotation.y += 0.02;
      sat.mesh.rotation.x += 0.015;
      sat.halo.rotation.z += 0.03;
    });

    // 3. Animate Inflow Cash Particles (Moving toward shield)
    if (this.inflowParticles && this.inflowGeo) {
      const pos = this.inflowGeo.attributes.position.array;
      for (let i = 0; i < this.inflowVelocities.length; i++) {
        const v = this.inflowVelocities[i];
        let curX = pos[i * 3];
        let curY = pos[i * 3 + 1];
        let curZ = pos[i * 3 + 2];

        // Vector towards center (0, 0, 0)
        const dist = Math.sqrt(curX * curX + curY * curY + curZ * curZ);

        if (dist <= 0.8) {
          // Reset back to outer radius
          const newRadius = v.origRadius;
          pos[i * 3] = newRadius * Math.cos(v.phi) * Math.cos(v.theta);
          pos[i * 3 + 1] = newRadius * Math.sin(v.phi);
          pos[i * 3 + 2] = newRadius * Math.cos(v.phi) * Math.sin(v.theta);
        } else {
          pos[i * 3] -= (curX / dist) * v.speed;
          pos[i * 3 + 1] -= (curY / dist) * v.speed;
          pos[i * 3 + 2] -= (curZ / dist) * v.speed;
        }
      }
      this.inflowGeo.attributes.position.needsUpdate = true;
    }

    // 4. Animate Outflow Leak Particles (Leaking downwards/outwards)
    if (this.leakParticles && this.leakGeo) {
      const pos = this.leakGeo.attributes.position.array;
      for (let i = 0; i < this.leakVelocities.length; i++) {
        const v = this.leakVelocities[i];

        if (this.isDeflecting) {
          // Push particles outwards and upward when deflection wave hits
          pos[i * 3] += v.x * 4;
          pos[i * 3 + 1] += 0.06;
          pos[i * 3 + 2] += v.z * 4;
        } else {
          pos[i * 3] += v.x;
          pos[i * 3 + 1] += v.y;
          pos[i * 3 + 2] += v.z;
        }

        // Reset if leaked too far
        if (pos[i * 3 + 1] < -5.5 || Math.abs(pos[i * 3]) > 6) {
          const r = 0.4 + Math.random() * 1.2;
          const theta = Math.random() * Math.PI * 2;
          pos[i * 3] = Math.cos(theta) * r;
          pos[i * 3 + 1] = -0.4 - Math.random() * 0.8;
          pos[i * 3 + 2] = Math.sin(theta) * r;
        }
      }
      this.leakGeo.attributes.position.needsUpdate = true;
    }

    // 5. Animate Deflection Forcefield Shockwave
    if (this.isDeflecting && this.deflectionWave) {
      this.deflectionProgress += delta * 2.2;
      const scale = 1 + this.deflectionProgress * 5.5;
      this.deflectionWave.scale.set(scale, scale, scale);
      this.deflectionWave.material.opacity = Math.max(0, 0.85 - this.deflectionProgress);

      if (this.deflectionProgress >= 1) {
        this.isDeflecting = false;
        this.deflectionWave.material.opacity = 0;
      }
    }

    // 6. Smooth Camera Lerping (Position & Look Target)
    const lerpSpeed = 0.05;
    this.camera.position.lerp(this.targetCamPos, lerpSpeed);
    this.activeLookTarget.lerp(this.camLookTarget, lerpSpeed);
    this.camera.lookAt(this.activeLookTarget);

    // 7. Render
    this.renderer.render(this.scene, this.camera);
  }
}
