"use client";

import { ShaderGradient, ShaderGradientCanvas } from "shadergradient";

export default function LoginGradient({ opacity, ...props }: any) {
    return (
        <ShaderGradientCanvas
            style={{
                position: "absolute",
                top: 0,
                opacity: opacity || 0.85,
                pointerEvents: "none",
                // backdropFilter: 'blur(1em)'
            }}
        >
            <ShaderGradient
                control="props"
                animate="on"
                color1="#606080"
                color2="#a78bfa"
                color3="#212121"
                grain="on"
                brightness={1}
                cAzimuthAngle={100}
                cDistance={4.5}
                cPolarAngle={80}
                cameraZoom={9}
                envPreset="city"
                // frameRate={1}
                grainBlending={0.2}
                lightType="3d"
                positionX={-1}
                positionY={2.8}
                positionZ={0}
                rotationX={-75}
                rotationY={0}
                rotationZ={-60}
                type="waterPlane"
                uAmplitude={3}
                uFrequency={3}
                uSpeed={0.02}
                uStrength={1.1}
                uTime={0}
                // enableTransition={false}
                {...props}
            />
        </ShaderGradientCanvas>
    );
}
