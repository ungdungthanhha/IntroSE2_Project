declare module 'react-native-sound' {
    type SoundCallback = (error: Error | null, sound?: Sound) => void;

    class Sound {
        static setCategory(category: string, mixWithOthers?: boolean): void;
        static setMode(mode: string): void;
        static setActive(value: boolean): void;

        constructor(filename: string, basePath?: string, onError?: SoundCallback);

        isLoaded(): boolean;
        play(onEnd?: (success: boolean) => void): this;
        pause(callback?: () => void): this;
        stop(callback?: () => void): this;
        reset(): this;
        release(): this;
        setVolume(value: number): this;
        getVolume(): number;
        setSystemVolume(value: number): void;
        getSystemVolume(callback: (volume: number) => void): void;
        setPan(value: number): this;
        setNumberOfLoops(value: number): this;
        setSpeed(value: number): this;
        getCurrentTime(callback: (seconds: number, isPlaying: boolean) => void): void;
        setCurrentTime(value: number): this;
        getDuration(): number;
        getSpeakerphoneOn(callback: (value: boolean) => void): void;
        setSpeakerphoneOn(value: boolean): void;
        isPlaying(): boolean;
    }

    export default Sound;
}
