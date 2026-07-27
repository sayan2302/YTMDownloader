import { useEffect, useRef } from 'react';

function lerp(start, end, amt) {
  return (1 - amt) * start + amt * end;
}

export default function AudioVisualizer({ audioRef, isPlaying }) {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);

  const smoothAmpsRef = useRef(new Array(36).fill(0));

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    const setupAudioContext = () => {
      if (!audioEl._audioContext) {
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          const ctx = new AudioContext();
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 128;
          analyser.smoothingTimeConstant = 0.70; // Punchy, responsive jumpiness

          const source = ctx.createMediaElementSource(audioEl);
          source.connect(analyser);
          analyser.connect(ctx.destination);

          audioEl._audioContext = ctx;
          audioEl._analyser = analyser;
          audioEl._sourceNode = source;
        } catch (e) {
          // Graceful fallback
        }
      }

      audioContextRef.current = audioEl._audioContext || null;
      analyserRef.current = audioEl._analyser || null;
      sourceRef.current = audioEl._sourceNode || null;

      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    };

    const handlePlay = () => {
      setupAudioContext();
    };

    audioEl.addEventListener('play', handlePlay);

    if (isPlaying && audioEl) {
      setupAudioContext();
    }

    return () => {
      audioEl.removeEventListener('play', handlePlay);
    };
  }, [audioRef, isPlaying]);

  // 60 FPS High-Vibrancy End-to-End Liquid Wave Loop at Player Bottom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const resizeCanvas = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth || 1920;
        canvas.height = canvas.parentElement.clientHeight || 75;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let phase1 = 0;
    let phase2 = Math.PI / 3;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const baseY = height - 2; // Baseline at bottom of player

      ctx.clearRect(0, 0, width, height);

      const analyser = analyserRef.current;
      const bufferLength = analyser ? analyser.frequencyBinCount : 64;
      const rawDataArray = new Uint8Array(bufferLength);

      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(rawDataArray);
      } else {
        rawDataArray.fill(2);
      }

      phase1 += 0.04;
      phase2 += 0.05;

      const numPoints = 40;
      const step = width / (numPoints - 1);
      const smoothAmps = smoothAmpsRef.current;

      const wave1Points = [];
      const wave2Points = [];

      for (let i = 0; i < numPoints; i++) {
        const edgeFactor = Math.sin((i / (numPoints - 1)) * Math.PI);
        const dataIdx = Math.floor((i / numPoints) * (bufferLength * 0.75));
        const targetVal = (rawDataArray[dataIdx] || 0) / 255;

        // Snappy, energetic lerp (0.38) for punchy jumpiness
        smoothAmps[i] = lerp(smoothAmps[i] || 0, targetVal, 0.38);
        const normVal = smoothAmps[i];

        const sine1 = Math.sin(phase1 + i * 0.28) * (isPlaying ? 4 : 1);
        const sine2 = Math.cos(phase2 + i * 0.35) * (isPlaying ? 3 : 0.8);

        // Exponential power curve for punchy bass hits
        const amp1 = Math.max(2, (Math.pow(normVal, 1.15) * (height * 0.88) + sine1) * edgeFactor);
        const amp2 = Math.max(2, (Math.pow(normVal, 1.15) * (height * 0.68) + sine2) * edgeFactor);

        wave1Points.push({ x: i * step, yUpper: baseY - amp1 });
        wave2Points.push({ x: i * step, yUpper: baseY - amp2 });
      }

      // 1. Translucent Liquid Wave Fill from Bottom
      const fillGrad = ctx.createLinearGradient(0, 0, 0, height);
      fillGrad.addColorStop(0, 'rgba(0, 242, 254, 0.25)');
      fillGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.12)');
      fillGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.moveTo(0, baseY);
      ctx.lineTo(wave1Points[0].x, wave1Points[0].yUpper);
      for (let i = 0; i < wave1Points.length - 1; i++) {
        const xc = (wave1Points[i].x + wave1Points[i + 1].x) / 2;
        const yc = (wave1Points[i].yUpper + wave1Points[i + 1].yUpper) / 2;
        ctx.quadraticCurveTo(wave1Points[i].x, wave1Points[i].yUpper, xc, yc);
      }
      ctx.lineTo(wave1Points[wave1Points.length - 1].x, wave1Points[wave1Points.length - 1].yUpper);
      ctx.lineTo(width, baseY);
      ctx.lineTo(0, baseY);
      ctx.closePath();
      ctx.fillStyle = fillGrad;
      ctx.fill();

      // 2. Secondary Wave Line (Electric Emerald & Cyan)
      const lineGrad2 = ctx.createLinearGradient(0, 0, width, 0);
      lineGrad2.addColorStop(0, 'rgba(0, 255, 170, 0.7)');
      lineGrad2.addColorStop(0.5, 'rgba(0, 242, 254, 0.75)');
      lineGrad2.addColorStop(1, 'rgba(168, 85, 247, 0.65)');

      ctx.beginPath();
      ctx.moveTo(0, baseY);
      ctx.lineTo(wave2Points[0].x, wave2Points[0].yUpper);
      for (let i = 0; i < wave2Points.length - 1; i++) {
        const xc = (wave2Points[i].x + wave2Points[i + 1].x) / 2;
        const yc = (wave2Points[i].yUpper + wave2Points[i + 1].yUpper) / 2;
        ctx.quadraticCurveTo(wave2Points[i].x, wave2Points[i].yUpper, xc, yc);
      }
      ctx.lineTo(wave2Points[wave2Points.length - 1].x, wave2Points[wave2Points.length - 1].yUpper);
      ctx.strokeStyle = lineGrad2;
      ctx.lineWidth = 1.6;
      ctx.shadowColor = '#00ffaa';
      ctx.shadowBlur = isPlaying ? 8 : 2;
      ctx.stroke();

      // 3. Primary Wave Line (Vibrant Cyberpunk Cyan -> Purple -> Hot Pink)
      const lineGrad1 = ctx.createLinearGradient(0, 0, width, 0);
      lineGrad1.addColorStop(0, '#00f2fe');
      lineGrad1.addColorStop(0.35, '#4facfe');
      lineGrad1.addColorStop(0.7, '#a855f7');
      lineGrad1.addColorStop(1, '#ff0844');

      ctx.beginPath();
      ctx.moveTo(0, baseY);
      ctx.lineTo(wave1Points[0].x, wave1Points[0].yUpper);
      for (let i = 0; i < wave1Points.length - 1; i++) {
        const xc = (wave1Points[i].x + wave1Points[i + 1].x) / 2;
        const yc = (wave1Points[i].yUpper + wave1Points[i + 1].yUpper) / 2;
        ctx.quadraticCurveTo(wave1Points[i].x, wave1Points[i].yUpper, xc, yc);
      }
      ctx.lineTo(wave1Points[wave1Points.length - 1].x, wave1Points[wave1Points.length - 1].yUpper);

      ctx.strokeStyle = lineGrad1;
      ctx.lineWidth = 2.6;
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = isPlaying ? 12 : 3;
      ctx.stroke();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isPlaying]);

  return (
    <div className="audio-visualizer-container">
      <canvas ref={canvasRef} className="audio-visualizer-canvas" />
    </div>
  );
}
