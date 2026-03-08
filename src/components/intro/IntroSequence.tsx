import { useEffect, useRef, useMemo, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { motion, AnimatePresence } from "framer-motion";
import type { IntroStage } from "@/hooks/useIntroSequence";

interface IntroSequenceProps {
  stage: IntroStage;
  onSkip: () => void;
}

// Convert lat/lon to 3D position on sphere
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

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
    delhiMarker: THREE.Group;
    animationId: number;
  } | null>(null);
  const stageRef = useRef<IntroStage>(stage);
  const [showSkip, setShowSkip] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [sensorText, setSensorText] = useState("");
  const [locatingText, setLocatingText] = useState("");
  const [delhiText, setDelhiText] = useState("");
  const [systemText, setSystemText] = useState("");
  const [showGlitch, setShowGlitch] = useState(false);

  stageRef.current = stage;

  // Show skip after 2s
  useEffect(() => {
    const t = setTimeout(() => setShowSkip(true), 2000);
    return () => clearTimeout(t);
  }, []);

  // Stage 1: typed text + loading bar
  useEffect(() => {
    if (stage !== 1) return;
    const fullTitle = "PLANET EARTH";
    const sensorFull = "INITIALIZING ATMOSPHERIC SENSORS...";
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i <= fullTitle.length) {
        setTypedText(fullTitle.slice(0, i));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, 100);

    let j = 0;
    const sensorInterval = setInterval(() => {
      if (j <= sensorFull.length) {
        setSensorText(sensorFull.slice(0, j));
        j++;
      } else {
        clearInterval(sensorInterval);
      }
    }, 50);

    // Loading bar
    const startTime = Date.now();
    const loadInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setLoadingProgress(Math.min(elapsed / 2500, 1));
      if (elapsed >= 2500) clearInterval(loadInterval);
    }, 16);

    return () => {
      clearInterval(typingInterval);
      clearInterval(sensorInterval);
      clearInterval(loadInterval);
    };
  }, [stage]);

  // Stage 3: locating text
  useEffect(() => {
    if (stage !== 3) return;
    setLocatingText("");
    const full = "LOCATING: INDIA";
    let i = 0;
    const t = setInterval(() => {
      if (i <= full.length) { setLocatingText(full.slice(0, i)); i++; } else clearInterval(t);
    }, 80);
    return () => clearInterval(t);
  }, [stage]);

  // Stage 4: delhi text + glitch
  useEffect(() => {
    if (stage !== 4) return;
    setDelhiText("");
    const full = "NEW DELHI — 28.6°N 77.2°E";
    let i = 0;
    const t = setInterval(() => {
      if (i <= full.length) { setDelhiText(full.slice(0, i)); i++; } else clearInterval(t);
    }, 60);
    // Glitch at 1.5s
    const g = setTimeout(() => {
      setShowGlitch(true);
      setTimeout(() => setShowGlitch(false), 300);
    }, 1500);
    return () => { clearInterval(t); clearTimeout(g); };
  }, [stage]);

  // Stage 5: system online text
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

  // Three.js scene setup
  useEffect(() => {
    if (!containerRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000);
    containerRef.current.appendChild(renderer.domElement);

    // Stars
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(600);
    const starOpacities = new Float32Array(200);
    for (let i = 0; i < 200; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 100;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 100;
      starOpacities[i] = Math.random();
    }
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.15,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Earth
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load(
      "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg"
    );
    const bumpMap = textureLoader.load(
      "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg"
    );
    const specularMap = textureLoader.load(
      "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg"
    );

    const earthGeometry = new THREE.SphereGeometry(2.5, 64, 64);
    const earthMaterial = new THREE.MeshPhongMaterial({
      map: earthTexture,
      bumpMap: bumpMap,
      bumpScale: 0.05,
      specularMap: specularMap,
      specular: new THREE.Color(0x333333),
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.rotation.x = 0.2;
    earth.position.y = -8; // Start below screen
    scene.add(earth);

    // Atmosphere
    const atmosphereGeometry = new THREE.SphereGeometry(2.6, 64, 64);
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x0077ff,
      transparent: true,
      opacity: 0.15,
      side: THREE.FrontSide,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    atmosphere.position.copy(earth.position);
    scene.add(atmosphere);

    // Glow
    const glowGeometry = new THREE.SphereGeometry(2.7, 64, 64);
    const glowMaterial = new THREE.ShaderMaterial({
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
          float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          gl_FragColor = vec4(0.1, 0.5, 1.0, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.copy(earth.position);
    scene.add(glow);

    // Delhi marker group
    const delhiMarker = new THREE.Group();
    const ringGeometry = new THREE.RingGeometry(0.03, 0.05, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xff3333,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    delhiMarker.add(ring);

    // Sonar rings
    for (let i = 0; i < 3; i++) {
      const sonarGeo = new THREE.RingGeometry(0.05 + i * 0.04, 0.06 + i * 0.04, 32);
      const sonarMat = new THREE.MeshBasicMaterial({
        color: 0xff3333,
        transparent: true,
        opacity: 0.4 - i * 0.1,
        side: THREE.DoubleSide,
      });
      const sonar = new THREE.Mesh(sonarGeo, sonarMat);
      sonar.userData = { sonarIndex: i };
      delhiMarker.add(sonar);
    }

    const delhiPos = latLonToVector3(28.6139, 77.209, 2.55);
    delhiMarker.position.copy(delhiPos);
    delhiMarker.lookAt(new THREE.Vector3(0, 0, 0));
    delhiMarker.rotateY(Math.PI);
    delhiMarker.visible = false;
    earth.add(delhiMarker);

    // Lights
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);
    const ambientLight = new THREE.AmbientLight(0x111133, 0.5);
    scene.add(ambientLight);

    let animationId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Rotate earth slowly
      earth.rotation.y += 0.002;

      // Sync atmosphere/glow position
      atmosphere.position.copy(earth.position);
      glow.position.copy(earth.position);

      // Star twinkle
      starMaterial.opacity = 0.6 + Math.sin(elapsed * 2) * 0.2;

      // Sonar pulse animation
      delhiMarker.children.forEach((child) => {
        if (child.userData.sonarIndex !== undefined) {
          const i = child.userData.sonarIndex;
          const scale = 1 + Math.sin(elapsed * 3 + i) * 0.5;
          child.scale.set(scale, scale, 1);
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    sceneRef.current = { scene, camera, renderer, earth, atmosphere, glow, stars, delhiMarker, animationId };

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
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

  // Stage 2: Earth rises
  useEffect(() => {
    if (stage !== 2 || !sceneRef.current) return;
    const { earth, atmosphere, glow } = sceneRef.current;

    gsap.to(earth.position, {
      y: 0,
      duration: 1.5,
      ease: "power3.out",
      onUpdate: () => {
        atmosphere.position.copy(earth.position);
        glow.position.copy(earth.position);
      },
    });
  }, [stage]);

  // Stage 3: Zoom to India
  useEffect(() => {
    if (stage !== 3 || !sceneRef.current) return;
    const { camera, earth, stars } = sceneRef.current;

    // Rotate earth to face India
    // India at ~78.9°E — we need to rotate earth so India faces camera
    gsap.to(earth.rotation, {
      y: -1.4, // Approximate rotation to face India
      duration: 2.5,
      ease: "power2.inOut",
    });

    gsap.to(camera.position, {
      z: 3.5,
      duration: 2.5,
      ease: "power2.inOut",
    });

    // Fade stars
    gsap.to((stars.material as THREE.PointsMaterial), {
      opacity: 0,
      duration: 2,
    });
  }, [stage]);

  // Stage 4: Deep zoom to Delhi
  useEffect(() => {
    if (stage !== 4 || !sceneRef.current) return;
    const { camera, earth, delhiMarker } = sceneRef.current;

    delhiMarker.visible = true;

    // Rotate earth to center Delhi
    gsap.to(earth.rotation, {
      y: -1.35,
      duration: 2,
      ease: "power2.inOut",
    });

    gsap.to(camera.position, {
      z: 2.0,
      y: 0.4,
      duration: 2.5,
      ease: "power3.in",
    });
  }, [stage]);

  // Stage 5: Shrink and fade
  useEffect(() => {
    if (stage !== 5 || !containerRef.current) return;
    const el = containerRef.current;
    gsap.to(el, {
      opacity: 0,
      scale: 0.5,
      duration: 2,
      ease: "power2.in",
    });
  }, [stage]);

  if (stage === "done") return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-black">
      {/* Three.js Canvas */}
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ transformOrigin: "center center" }}
      />

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
            <h1
              className="font-display text-3xl sm:text-5xl font-bold tracking-[0.3em] text-white mb-8"
              style={{ letterSpacing: "0.3em" }}
            >
              {typedText}
              <span className="animate-pulse-live">_</span>
            </h1>

            {/* Loading bar */}
            <div className="relative w-[300px] h-[3px] rounded-full overflow-hidden mb-4"
              style={{ background: "rgba(255,255,255,0.1)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{
                  width: `${loadingProgress * 100}%`,
                  background: "hsl(var(--primary))",
                  boxShadow: "0 0 20px hsl(var(--primary) / 0.5), 0 0 40px hsl(var(--primary) / 0.3)",
                }}
              />
            </div>

            <p className="font-mono text-xs tracking-widest text-primary">
              {sensorText}
              <span className="animate-pulse-live">_</span>
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
            className="absolute top-8 left-8 z-10"
          >
            <p className="font-mono text-sm tracking-[0.2em] text-primary text-glow-primary">
              {locatingText}
              <span className="animate-pulse-live">_</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage 4: Delhi marker text */}
      <AnimatePresence>
        {stage === 4 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 text-center"
          >
            <p className="font-mono text-sm tracking-[0.15em] text-destructive mb-1" style={{
              textShadow: "0 0 10px hsl(0 84% 60% / 0.6)"
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
            <div className="text-center">
              <p className="font-display text-lg sm:text-2xl tracking-[0.2em] text-primary text-glow-primary mb-2">
                {systemText}
              </p>
              <p className="font-mono text-xs tracking-widest text-muted-foreground">
                REAL-TIME AIR QUALITY MONITORING: DELHI NCR
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vignette */}
      {(stage === 3 || stage === 4) && (
        <div
          className="absolute inset-0 z-5 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)",
          }}
        />
      )}

      {/* Skip button */}
      {showSkip && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onSkip}
          className="fixed bottom-6 right-6 z-50 text-xs text-white/40
                     hover:text-white/80 transition-all font-mono tracking-widest
                     border border-white/10 px-4 py-2 rounded-full
                     hover:border-white/30 backdrop-blur-sm"
        >
          SKIP INTRO ⟶
        </motion.button>
      )}
    </div>
  );
}
