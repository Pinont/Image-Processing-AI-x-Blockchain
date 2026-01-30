import React, { useEffect, useState } from 'react';
import './CursorEffect.css';

const CursorEffect: React.FC = () => {
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            setCursorPosition({ x: event.clientX, y: event.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <div className="cursor-effect" style={{ left: cursorPosition.x, top: cursorPosition.y }} />
    );
};

export default CursorEffect;