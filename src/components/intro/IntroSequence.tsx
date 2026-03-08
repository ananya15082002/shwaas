import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { motion, AnimatePresence } from "framer-motion";
import type { IntroStage } from "@/hooks/useIntroSequence";

interface IntroSequenceProps {
  stage: IntroStage;
  onSkip: () => void;
}

// Correct lat/lon → 3D point on sphere for Three.js coordinate system
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Calculate earth Y-rotation to face a given longitude toward camera (+Z)
function lonToEarthRotationY(lon: number): number {
  return -Math.PI * (lon / 180) + Math.PI * 0.5;
}

const INDIA_LAT = 20.5936;
const INDIA_LON = 78.9629;
const DELHI_LAT = 28.6139;
const DELHI_LON = 77.209;

export function IntroSequence({ stage, onSkip }: IntroSequenceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    earth: THREE.Mesh;
    atmosphere: THREE.Mesh;
    glow: THREE.Mesh;
    stars: THREE.Points;
    indiaMarker: THREE.Group;
    delhiMarker: THREE.Group;
    animationId: number;
  } | null>(null);
  const [showSkip, setShowSkip] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [sensorText, setSensorText] = useState("");
  const [locatingText, setLocatingText] = useState("");
  const [delhiText, setDelhiText] = useState("");
  const [systemText, setSystemText] = useState("");
  const [showGlitch, setShowGlitch] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowSkip(true), 2000);
    return () => clearTimeout(t);
  }, []);

  // Stage 1: typed text + loading bar
  useEffect(() => {
    if (stage !== 1) return;
    const fullTitle = "PLANET EARTH";
    const sensorFull = "INITIALIZING ATMOSPHERIC SENSORS...";
    let i = 0, j = 0;
    const typingInterval = setInterval(() => {
      if (i <= fullTitle.length) { setTypedText(fullTitle.slice(0, i)); i++; }
      else clearInterval(typingInterval);
    }, 100);
    const sensorInterval = setInterval(() => {
      if (j <= sensorFull.length) { setSensorText(sensorFull.slice(0, j)); j++; }
      else clearInterval(sensorInterval);
    }, 50);
    const startTime = Date.now();
    const loadInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setLoadingProgress(Math.min(elapsed / 2500, 1));
      if (elapsed >= 2500) clearInterval(loadInterval);
    }, 16);
    return () => { clearInterval(typingInterval); clearInterval(sensorInterval); clearInterval(loadInterval); };
  }, [stage]);

  // Stage 3: locating text
  useEffect(() => {
    if (stage !== 3) return;
    setLocatingText("");
    const full = "LOCATING: INDIA — 20.5°N 78.9°E";
    let i = 0;
    const t = setInterval(() => {
      if (i <= full.length) { setLocatingText(full.slice(0, i)); i++; } else clearInterval(t);
    }, 60);
    return () => clearInterval(t);
  }, [stage]);

  // Stage 4: delhi text + glitch
  useEffect(() => {
    if (stage !== 4) return;
    setDelhiText("");
    const full = "DEEP DIVE: NEW DELHI — 28.6°N 77.2°E";
    let i = 0;
    const t = setInterval(() => {
      if (i <= full.length) { setDelhiText(full.slice(0, i)); i++; } else clearInterval(t);
    }, 50);
    const g = setTimeout(() => {
      setShowGlitch(true);
      setTimeout(() => setShowGlitch(false), 300);
    }, 1500);
    return () => { clearInterval(t); clearTimeout(g); };
  }, [stage]);

  // Stage 5: system text
  useEffect(() => {
    if (stage !== 5) return;
    setSystemText("");
    const full = "SYSTEM ONLINE — 8 STATIONS ACTIVE";
    let i = 0;
    const t = setInterval(() => {
      if (i <= full.length) { setSystemText(full.slice(0, i)); i++; } else clearInterval(t);
    }, 50);
    return () => clearInterval(t);
  }, [stage]);

  // Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000);
    containerRef.current.appendChild(renderer.domElement);

    // Stars
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
      starPositions[i] = (Math.random() - 0.5) * 400;
    }
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.3, transparent: true, opacity: 0.8 });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Earth
    const earthGeometry = new THREE.SphereGeometry(2.5, 64, 64);
    const textureLoader = new THREE.TextureLoader();

    // Start with fallback material
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a6b3a,
      emissive: 0x0a2a15,
      specular: new THREE.Color(0x2255aa),
      shininess: 20,
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.rotation.x = 0.23; // Earth's axial tilt
    earth.position.y = -10; // Start below screen
    scene.add(earth);

    // Try loading textures: local first, CDN fallback
    const tryTextures = [
      "/images/earth-texture.jpg",
      "https://unpkg.com/three@0.128.0/examples/textures/planets/earth_atmos_2048.jpg",
    ];

    let textureLoaded = false;
    for (const url of tryTextures) {
      if (textureLoaded) break;
      textureLoader.load(
        url,
        (texture) => {
          if (textureLoaded) return;
          textureLoaded = true;
          texture.colorSpace = THREE.SRGBColorSpace;
          earth.material = new THREE.MeshPhongMaterial({
            map: texture,
            specular: new THREE.Color(0x333333),
            shininess: 15,
          });
        },
        undefined,
        () => {} // silently fail, try next
      );
    }

    // Atmosphere glow (shader-based)
    const atmGeo = new THREE.SphereGeometry(2.65, 64, 64);
    const atmMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.55 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          gl_FragColor = vec4(0.15, 0.55, 1.0, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      transparent: true,
    });
    const atmosphere = new THREE.Mesh(atmGeo, atmMat);
    atmosphere.position.copy(earth.position);
    scene.add(atmosphere);

    // Back-glow
    const glowGeo = new THREE.SphereGeometry(2.7, 64, 64);
    const glowMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          gl_FragColor = vec4(0.15, 0.5, 1.0, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.copy(earth.position);
    scene.add(glow);

    // Create marker helper
    function createMarker(lat: number, lon: number, color: number, size: number): THREE.Group {
      const group = new THREE.Group();
      const pos = latLonToVector3(lat, lon, 2.52);
      
      // Center dot
      const dotGeo = new THREE.SphereGeometry(size, 16, 16);
      const dotMat = new THREE.MeshBasicMaterial({ color });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      group.add(dot);

      // Sonar rings
      for (let i = 0; i < 3; i++) {
        const ringGeo = new THREE.RingGeometry(size * 1.5 + i * size, size * 2 + i * size, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.5 - i * 0.15,
          side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.userData = { sonarIndex: i };
        group.add(ring);
      }

      group.position.copy(pos);
      group.lookAt(new THREE.Vector3(0, 0, 0));
      group.rotateY(Math.PI);
      group.visible = false;
      return group;
    }

    // India marker (gold)
    const indiaMarker = createMarker(INDIA_LAT, INDIA_LON, 0xFFD700, 0.07);
    earth.add(indiaMarker);

    // Delhi marker (red)
    const delhiMarker = createMarker(DELHI_LAT, DELHI_LON, 0xff3333, 0.05);
    earth.add(delhiMarker);

    // Lights
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.8);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);
    const ambientLight = new THREE.AmbientLight(0x334466, 0.6);
    scene.add(ambientLight);

    const clock = new THREE.Clock();
    let animationId = 0;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Keep atmosphere/glow synced
      atmosphere.position.copy(earth.position);
      glow.position.copy(earth.position);

      // Gentle star twinkle
      starMaterial.opacity = 0.6 + Math.sin(elapsed * 2) * 0.2;

      // Pulse sonar rings on visible markers
      [indiaMarker, delhiMarker].forEach((marker) => {
        if (!marker.visible) return;
        marker.children.forEach((child) => {
          if (child.userData.sonarIndex !== undefined) {
            const i = child.userData.sonarIndex;
            const scale = 1 + Math.sin(elapsed * 3 + i) * 0.5;
            child.scale.set(scale, scale, 1);
          }
        });
      });

      renderer.render(scene, camera);
    };
    animate();

    sceneRef.current = { scene, camera, renderer, earth, atmosphere, glow, stars, indiaMarker, delhiMarker, animationId };

    const handleResize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
      sceneRef.current = null;
    };
  }, []);

  // Stage 2: Earth rises + slow rotation
  useEffect(() => {
    if (stage !== 2 || !sceneRef.current) return;
    const { earth, atmosphere, glow } = sceneRef.current;
    gsap.to(earth.position, {
      y: 0, duration: 2, ease: "power3.out",
      onUpdate: () => { atmosphere.position.copy(earth.position); glow.position.copy(earth.position); },
    });
    // Gentle rotation during rise
    gsap.to(earth.rotation, { y: earth.rotation.y + 0.5, duration: 4, ease: "none" });
  }, [stage]);

  // Stage 3: Rotate globe so India faces camera + zoom in
  useEffect(() => {
    if (stage !== 3 || !sceneRef.current) return;
    const { camera, earth, stars, indiaMarker } = sceneRef.current;
    indiaMarker.visible = true;

    const indiaTargetY = lonToEarthRotationY(INDIA_LON);
    gsap.to(earth.rotation, { y: indiaTargetY, duration: 2.5, ease: "power2.inOut" });
    gsap.to(camera.position, { z: 4.5, duration: 2.5, ease: "power2.inOut" });
    gsap.to(stars.material as THREE.PointsMaterial, { opacity: 0.3, duration: 2 });
  }, [stage]);

  // Stage 4: Deep zoom to Delhi
  useEffect(() => {
    if (stage !== 4 || !sceneRef.current) return;
    const { camera, earth, indiaMarker, delhiMarker, stars } = sceneRef.current;

    // Swap markers
    indiaMarker.visible = false;
    delhiMarker.visible = true;

    const delhiTargetY = lonToEarthRotationY(DELHI_LON);
    gsap.to(earth.rotation, { y: delhiTargetY, duration: 2, ease: "power2.inOut" });
    gsap.to(camera.position, { z: 2.2, y: 0.3, duration: 2.5, ease: "power3.inOut" });
    gsap.to(stars.material as THREE.PointsMaterial, { opacity: 0, duration: 1.5 });
  }, [stage]);

  // Stage 5: Fade out
  useEffect(() => {
    if (stage !== 5 || !containerRef.current) return;
    gsap.to(containerRef.current, { opacity: 0, scale: 0.5, duration: 2, ease: "power2.in" });
  }, [stage]);

  if (stage === "done") return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-black">
      {/* Three.js Canvas */}
      <div ref={containerRef} className="absolute inset-0" style={{ transformOrigin: "center center" }} />

      {/* Glitch overlay */}
      {showGlitch && (
        <div className="absolute inset-0 z-30 pointer-events-none">
          <div className="absolute inset-0 opacity-30" style={{
            background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,229,255,0.1) 2px, rgba(0,229,255,0.1) 4px)"
          }} />
          <div className="absolute inset-0" style={{
            background: "linear-gradient(90deg, rgba(255,0,0,0.1) 33%, rgba(0,255,0,0.1) 33% 66%, rgba(0,0,255,0.1) 66%)",
            mixBlendMode: "screen",
          }} />
        </div>
      )}

      {/* Scanline overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none scanline opacity-30" />

      {/* Stage 1: Loading */}
      <AnimatePresence>
        {stage === 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center"
          >
            <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-[0.3em] text-foreground mb-8">
              {typedText}
              <span className="animate-pulse-live">_</span>
            </h1>
            <div className="relative w-[300px] h-[3px] rounded-full overflow-hidden mb-4" style={{ background: "hsl(var(--muted))" }}>
              <motion.div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${loadingProgress * 100}%`,
                  boxShadow: "0 0 20px hsl(var(--primary) / 0.5), 0 0 40px hsl(var(--primary) / 0.3)",
                }}
              />
            </div>
            <p className="font-mono text-xs tracking-widest text-primary">
              {sensorText}<span className="animate-pulse-live">_</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage 3: Locating India */}
      <AnimatePresence>
        {stage === 3 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-8 left-8 z-20"
          >
            <p className="font-mono text-sm tracking-[0.2em] text-primary text-glow-primary">
              🌏 {locatingText}<span className="animate-pulse-live">_</span>
            </p>
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground mt-1">
              SOUTH ASIA · REPUBLIC OF INDIA
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage 4: Delhi deep dive */}
      <AnimatePresence>
        {stage === 4 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 text-center"
          >
            <p className="font-mono text-sm tracking-[0.15em] text-destructive mb-1" style={{
              textShadow: "0 0 10px hsl(var(--destructive) / 0.6)"
            }}>
              ● {delhiText}
            </p>
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground">
              AIR QUALITY MONITORING NODE
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage 5: System Online */}
      <AnimatePresence>
        {stage === 5 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center"
          >
            <p className="font-display text-lg sm:text-2xl tracking-[0.2em] text-primary text-glow-primary mb-2">
              {systemText}
            </p>
            <p className="font-mono text-xs tracking-widest text-muted-foreground">
              REAL-TIME AIR QUALITY MONITORING: DELHI NCR
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vignette */}
      {(stage === 3 || stage === 4) && (
        <div className="absolute inset-0 z-[5] pointer-events-none" style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)",
        }} />
      )}

      {/* Skip button */}
      {showSkip && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onSkip}
          className="fixed bottom-6 right-6 z-50 text-xs text-foreground/40 hover:text-foreground/80 transition-all font-mono tracking-widest border border-border px-4 py-2 rounded-full hover:border-foreground/30 backdrop-blur-sm"
        >
          SKIP INTRO ⟶
        </motion.button>
      )}
    </div>
  );
}
