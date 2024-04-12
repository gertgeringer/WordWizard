import React, { useState, useEffect } from 'react';

interface TimerProps {
    onTimerComplete: () => void,
    durationInSec: number
}

const Timer: React.FC<TimerProps> = ({onTimerComplete, durationInSec}) => {

    const [timeLeft, setTimeLeft] = useState(durationInSec);

    useEffect(() => {
        if (timeLeft < 0) {
            onTimerComplete();
            return;
        };
        const intervalId = setInterval(() => {
            setTimeLeft(timeLeft => timeLeft - 1);
        }, 1000);
        return () => clearInterval(intervalId);
    }, [timeLeft]);

    return (
        <div>
            <>{timeLeft} sec</>
        </div>
    );
}

export default Timer;