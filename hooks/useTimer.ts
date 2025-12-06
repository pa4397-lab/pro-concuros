import { useState, useEffect, useRef, useCallback } from 'react';

export const useTimer = (initialMinutes: number, onComplete: () => void) => {
    const [seconds, setSeconds] = useState(initialMinutes * 60);
    const [isActive, setIsActive] = useState(false);
    // FIX: Changed NodeJS.Timeout to number, as it's the correct type for setInterval in a browser environment.
    const intervalRef = useRef<number | null>(null);

    const start = useCallback(() => {
        setIsActive(true);
    }, []);

    const pause = useCallback(() => {
        setIsActive(false);
    }, []);

    const reset = useCallback(() => {
        setIsActive(false);
        setSeconds(initialMinutes * 60);
    }, [initialMinutes]);

    useEffect(() => {
        if (isActive) {
            // Use window.setInterval to ensure a number return type in browser environment
            intervalRef.current = window.setInterval(() => {
                setSeconds(prevSeconds => {
                    if (prevSeconds <= 1) {
                        if (intervalRef.current !== null) {
                            window.clearInterval(intervalRef.current);
                        }
                        setIsActive(false);
                        onComplete();
                        return 0;
                    }
                    return prevSeconds - 1;
                });
            }, 1000);
        } else if (intervalRef.current !== null) {
            window.clearInterval(intervalRef.current);
        }

        return () => {
            if (intervalRef.current !== null) {
                window.clearInterval(intervalRef.current);
            }
        };
    }, [isActive, onComplete]);
    
    useEffect(() => {
      setSeconds(initialMinutes * 60);
    }, [initialMinutes]);

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return {
        minutes,
        seconds: remainingSeconds,
        start,
        pause,
        reset,
        isActive,
    };
};